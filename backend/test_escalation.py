import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
import sys
import os

# Add root directory to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.database import Base, get_db
from backend.main import app
from backend.models import Facility, EquipmentInventory, FacilityTier
from backend.schemas import (
    VitalSigns,
    FacilityEscalationRequest,
    TriagePriority
)
from backend.escalation import (
    calculate_haversine_distance,
    calculate_triage_priority,
    evaluate_and_escalate_facility,
    is_instrument_available
)
from backend.seed_data import SAMPLE_FACILITIES

# Create in-memory SQLite database for testing
SQLALCHEMY_TEST_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(scope="function", autouse=True)
def setup_test_db():
    """Create all tables and seed sample data before each test."""
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    
    for item in SAMPLE_FACILITIES:
        inv_data = item.get("inventory", {})
        facility = Facility(
            name=item["name"],
            tier=item["tier"],
            district=item["district"],
            state=item.get("state", "Tamil Nadu"),
            latitude=item["latitude"],
            longitude=item["longitude"],
            contact=item["contact"],
            address=item.get("address", ""),
            is_active=True
        )
        db.add(facility)
        db.flush()

        inventory = EquipmentInventory(
            facility_id=facility.id,
            available_instruments=inv_data.get("available_instruments", []),
            bed_capacity=inv_data.get("bed_capacity", 0),
            available_beds=inv_data.get("available_beds", 0),
            oxygen_cylinders_available=inv_data.get("oxygen_cylinders_available", 0)
        )
        db.add(inventory)
    
    db.commit()
    yield db
    db.close()
    Base.metadata.drop_all(bind=engine)

client = TestClient(app)

# ---------------------------------------------------------------------------
# Unit Tests: Geodesic Haversine Calculation
# ---------------------------------------------------------------------------

def test_haversine_distance():
    # Thiruporur (12.7236, 80.1872) to Kelambakkam (12.7845, 80.2201) ~ 7.5 - 8.0 km
    dist = calculate_haversine_distance(12.7236, 80.1872, 12.7845, 80.2201)
    assert 6.0 <= dist <= 9.0
    
    # Identical coordinates should be 0.0 km
    assert calculate_haversine_distance(12.7236, 80.1872, 12.7236, 80.1872) == 0.0

# ---------------------------------------------------------------------------
# Unit Tests: Triage Priority Calculation
# ---------------------------------------------------------------------------

def test_triage_p1_critical_hypoxemia():
    vitals = VitalSigns(spo2=82.0, heart_rate=120, systolic_bp=100)
    priority, reason, warnings, equipment = calculate_triage_priority(
        vital_signs=vitals,
        symptoms=["Severe breathlessness", "Cyanosis"]
    )
    assert priority == TriagePriority.P1_CRITICAL
    assert "Ventilator" in equipment
    assert "ICU" in equipment
    assert "Oxygen Concentrator" in equipment
    assert any("SpO2: 82.0%" in w for w in warnings)

def test_triage_p1_critical_symptoms():
    priority, reason, warnings, equipment = calculate_triage_priority(
        symptoms=["Severe chest pain radiating to left arm", "Cardiac arrest suspect"]
    )
    assert priority == TriagePriority.P1_CRITICAL
    assert "Defibrillator" in equipment or "ICU" in equipment

def test_triage_p2_moderate_pregnancy():
    priority, reason, warnings, equipment = calculate_triage_priority(
        symptoms=["Labor contractions 5 minutes apart", "Pregnancy"]
    )
    assert priority == TriagePriority.P2_MODERATE
    assert "Maternity Ward" in equipment

def test_triage_p3_routine():
    priority, reason, warnings, equipment = calculate_triage_priority(
        symptoms=["Mild fever since 1 day", "Common cold"]
    )
    assert priority == TriagePriority.P3_ROUTINE

# ---------------------------------------------------------------------------
# Unit Tests: Instrument Availability Matcher
# ---------------------------------------------------------------------------

def test_instrument_matching():
    inv = ["Oxygen Concentrator", "Malaria RDT Kits", "Ventilator", "X-Ray", "Maternity Ward", "Blood Bank"]
    assert is_instrument_available("Ventilator", inv) is True
    assert is_instrument_available("ventilator", inv) is True
    assert is_instrument_available("Oxygen", inv) is True
    assert is_instrument_available("Blood Bank", inv) is True
    assert is_instrument_available("Dialysis Unit", inv) is False

# ---------------------------------------------------------------------------
# Integration Tests: Escalation Engine (PHC -> CHC -> District Hospital)
# ---------------------------------------------------------------------------

def test_escalation_routine_selects_nearest_phc(setup_test_db):
    """Routine patient near Thiruporur gets routed to Thiruporur PHC with no escalation."""
    db = setup_test_db
    req = FacilityEscalationRequest(
        patient_latitude=12.7230,
        patient_longitude=80.1870,
        symptoms=["Mild fever and shivering", "Suspected Malaria"],
        required_equipment=["Malaria RDT Kits"]
    )
    resp = evaluate_and_escalate_facility(db, req)
    
    assert resp.status == "success"
    assert resp.was_escalated is False
    assert resp.selected_facility is not None
    assert "Thiruporur" in resp.selected_facility.name
    assert resp.ambulance_dispatch is False
    assert len(resp.bypassed_facilities) == 0

def test_escalation_critical_bypasses_phc_to_district_hospital(setup_test_db):
    """
    Critical patient near Thiruporur (requires ICU + Ventilator):
    - Nearest PHC (Thiruporur) lacks Ventilator & ICU -> Bypassed.
    - Next CHC (Kelambakkam) lacks Ventilator & ICU -> Bypassed.
    - Escalates to Chengalpattu Government District Headquarters Hospital.
    """
    db = setup_test_db
    req = FacilityEscalationRequest(
        patient_latitude=12.7230,
        patient_longitude=80.1870,
        vital_signs=VitalSigns(spo2=78.0, respiratory_rate=36, consciousness_level="Unresponsive"),
        symptoms=["Acute respiratory failure", "Unconscious"]
    )
    resp = evaluate_and_escalate_facility(db, req)
    
    assert resp.status == "success"
    assert resp.triage_priority == "P1 Critical"
    assert resp.was_escalated is True
    assert "District" in resp.selected_facility.tier or "District" in resp.selected_facility.name
    assert resp.ambulance_dispatch is True
    assert "108" in resp.ambulance_type
    assert len(resp.bypassed_facilities) >= 1
    assert "Ventilator" in resp.missing_equipment_at_nearest or "ICU" in resp.missing_equipment_at_nearest
    assert len(resp.transit_safety_instructions) > 0

# ---------------------------------------------------------------------------
# API Integration Tests via TestClient
# ---------------------------------------------------------------------------

def test_api_escalate_endpoint():
    payload = {
        "patient_latitude": 12.7230,
        "patient_longitude": 80.1870,
        "symptoms": ["Severe chest pain", "Difficulty breathing"],
        "vital_signs": {
            "spo2": 84.0,
            "heart_rate": 138,
            "systolic_bp": 85
        }
    }
    response = client.post("/api/facilities/escalate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["triage_priority"] == "P1 Critical"
    assert data["ambulance_dispatch"] is True
    assert data["selected_facility"]["name"] is not None
    assert "estimated_travel_time_minutes" in data
    assert len(data["transit_safety_instructions"]) > 0

def test_api_list_facilities_with_radius():
    response = client.get("/api/facilities?latitude=12.7236&longitude=80.1872&max_radius_km=30")
    assert response.status_code == 200
    data = response.json()
    assert len(data) > 0
    # First item should be the closest
    assert data[0]["distance_km"] <= data[-1]["distance_km"]

def test_api_update_inventory():
    # Update inventory for facility 1
    update_payload = {
        "available_instruments": ["Oxygen Concentrator", "Ventilator", "Malaria RDT Kits", "ICU"],
        "available_beds": 15
    }
    response = client.put("/api/facilities/1/inventory", json=update_payload)
    assert response.status_code == 200
    data = response.json()
    assert "Ventilator" in data["available_instruments"]
    assert data["available_beds"] == 15

def test_api_triage_endpoint():
    payload = {
        "symptoms": ["High fever with chills", "Severe body pain"],
        "vital_signs": {"temperature": 103.5, "spo2": 95.0}
    }
    response = client.post("/api/triage", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["triage_priority"] in ["P1 Critical", "P2 Moderate"]
    assert len(data["recommended_equipment"]) > 0

def test_run_medibot_five_step_pipeline():
    """Verify complete 5-step LangGraph agent orchestration."""
    from agents.graph import run_medibot
    res = run_medibot(
        query="Acute severe chest pain and breathlessness",
        patient_latitude=12.7236,
        patient_longitude=80.1872,
        patient_vitals={"spo2": 81.0, "heart_rate": 135},
        symptoms=["Severe Shortness of Breath / Asthma", "Acute Chest Pain / Palpitations"],
        has_personal_transport=False
    )
    # Step 1: Triage
    assert res["triage_priority"] == "P1 Critical"
    # Step 2: Matching & Escalation
    assert res["matching_facility"] is not None
    assert res["was_escalated"] is True
    # Step 3: Vehicle & Ambulance
    assert res["ambulance_dispatch_needed"] is True
    assert res["ambulance_payload"] is not None
    # Step 4: Travel Guidance
    assert len(res["transit_guidance"]) > 0
    # Step 5: Digital Referral Slip
    assert res["referral_slip"] is not None
    assert "REF-" in res["referral_slip"]["referral_id"]
    assert res["referral_qr_code"] is not None
    assert "svg" in res["referral_qr_code"]

