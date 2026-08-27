"""
Comprehensive MediBot AI System & Integration Test Suite
Validates all backend endpoints, clinical triage logic, geodesic routing,
equipment-based auto-escalation, LangGraph multi-agent pipeline, and hybrid search.
"""

import pytest
import math
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from backend.main import app
from backend.database import Base, get_db
from backend.models import Facility, EquipmentInventory, FacilityTier
from backend.schemas import VitalSigns, FacilityEscalationRequest, TriagePriority
from backend.escalation import (
    calculate_haversine_distance,
    calculate_triage_priority,
    evaluate_and_escalate_facility,
    get_transit_safety_instructions,
    get_transit_checklist
)
from agents.graph import run_medibot
from retrieval.hybrid_search import get_hybrid_retriever

# In-memory test database with StaticPool
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="function")
def test_db():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    
    # 1. Frontline Sub-Centre (0.8 km)
    sc = Facility(
        name="Kelambakkam Tribal Sub-Centre",
        tier=FacilityTier.SUBCENTER,
        district="Chengalpattu",
        state="Tamil Nadu",
        latitude=12.7290,
        longitude=80.1910,
        contact="+91 94440 11001",
        address="Near Main Junction, Kelambakkam",
        is_active=True
    )
    db.add(sc)
    db.flush()
    sc_inv = EquipmentInventory(
        facility_id=sc.id,
        available_instruments="Oral Rehydration Salts (ORS), Malaria RDT Kits, BP Apparatus, Thermometer",
        bed_capacity=2,
        available_beds=2,
        oxygen_cylinders_available=0
    )
    db.add(sc_inv)

    # 2. 24x7 Primary Health Centre (3.5 km)
    phc = Facility(
        name="Thiruporur Model Primary Health Centre",
        tier=FacilityTier.PHC,
        district="Chengalpattu",
        state="Tamil Nadu",
        latitude=12.7500,
        longitude=80.1950,
        contact="+91 94440 11002",
        address="Illalur Road, Thiruporur",
        is_active=True
    )
    db.add(phc)
    db.flush()
    phc_inv = EquipmentInventory(
        facility_id=phc.id,
        available_instruments="Labor Room, Essential Drugs, Oxygen Cylinder, Cold Chain, BP Apparatus, Nebulizer",
        bed_capacity=6,
        available_beds=4,
        oxygen_cylinders_available=2
    )
    db.add(phc_inv)

    # 3. Community Health Centre (14.2 km)
    chc = Facility(
        name="Chengalpattu Community Health Centre",
        tier=FacilityTier.CHC,
        district="Chengalpattu",
        state="Tamil Nadu",
        latitude=12.7950,
        longitude=80.0500,
        contact="+91 94440 11003",
        address="GST Road, Chengalpattu",
        is_active=True
    )
    db.add(chc)
    db.flush()
    chc_inv = EquipmentInventory(
        facility_id=chc.id,
        available_instruments="30 Beds, Minor OT, X-Ray Unit, ECG Machine, Ambulance, Basic Lab, Oxygen Concentrator",
        bed_capacity=30,
        available_beds=12,
        oxygen_cylinders_available=6
    )
    db.add(chc_inv)

    # 4. District Headquarters Hospital (28.5 km)
    dh = Facility(
        name="Chengalpattu Government District Headquarters Hospital",
        tier=FacilityTier.DISTRICT_HOSPITAL,
        district="Chengalpattu",
        state="Tamil Nadu",
        latitude=12.6840,
        longitude=79.9830,
        contact="+91 94440 12005",
        address="Hospital Road, Chengalpattu",
        is_active=True
    )
    db.add(dh)
    db.flush()
    dh_inv = EquipmentInventory(
        facility_id=dh.id,
        available_instruments="ICU, Ventilator, CT Scan, Blood Bank, Major OT, Dialysis Unit, Oxygen Plant, Central Suction",
        bed_capacity=250,
        available_beds=45,
        oxygen_cylinders_available=40
    )
    db.add(dh_inv)

    db.commit()
    yield db
    db.close()
    Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def client(test_db):
    def override_get_db():
        try:
            yield test_db
        finally:
            pass
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()

# -----------------------------------------------------------------------------
# 1. Core Health & Distance Tests
# -----------------------------------------------------------------------------

def test_root_and_health_endpoints(client):
    res_root = client.get("/")
    assert res_root.status_code == 200
    assert res_root.json()["service"] == "MediBot AI Backend"

    res_health = client.get("/health")
    assert res_health.status_code == 200
    assert res_health.json()["status"] == "healthy"

def test_haversine_calculation():
    # Thiruporur to Chengalpattu DH approx 25-30 km
    dist = calculate_haversine_distance(12.7236, 80.1872, 12.6840, 79.9830)
    assert 20.0 <= dist <= 35.0

# -----------------------------------------------------------------------------
# 2. Clinical Triage Physiological Rule Tests
# -----------------------------------------------------------------------------

def test_triage_critical_spo2():
    vitals = VitalSigns(spo2=86.0, respiratory_rate=32)
    priority, reason, warnings, equipment = calculate_triage_priority(
        vital_signs=vitals,
        symptoms=["Shortness of breath"]
    )
    assert priority == TriagePriority.P1_CRITICAL
    assert "SpO2" in reason
    assert "Ventilator" in equipment or "ICU" in equipment

def test_triage_critical_bradycardia():
    vitals = VitalSigns(heart_rate=38)
    priority, reason, warnings, equipment = calculate_triage_priority(
        vital_signs=vitals,
        symptoms=["Dizziness"]
    )
    assert priority == TriagePriority.P1_CRITICAL
    assert "Critical Bradycardia" in str(warnings)

def test_triage_critical_unconscious():
    vitals = VitalSigns(consciousness_level="Unresponsive")
    priority, reason, warnings, equipment = calculate_triage_priority(
        vital_signs=vitals,
        symptoms=[]
    )
    assert priority == TriagePriority.P1_CRITICAL

def test_triage_moderate_maternal():
    priority, reason, warnings, equipment = calculate_triage_priority(
        symptoms=["Pregnancy / Labor Pain / Bleeding"]
    )
    assert priority == TriagePriority.P2_MODERATE
    assert "Labor Room" in equipment

def test_triage_routine():
    priority, reason, warnings, equipment = calculate_triage_priority(
        symptoms=["Cough, Cold & Mild Fever"],
        symptom_description="Mild seasonal cold for 2 days"
    )
    assert priority == TriagePriority.P3_ROUTINE
    assert len(warnings) == 0

# -----------------------------------------------------------------------------
# 3. Facility Matching & Automated Escalation Tests
# -----------------------------------------------------------------------------

def test_routine_case_selects_frontline_subcenter(test_db):
    req = FacilityEscalationRequest(
        patient_latitude=12.7236,
        patient_longitude=80.1872,
        symptoms=["Cough, Cold & Mild Fever"],
        symptom_description="Mild throat irritation",
        severity="P3 Routine",
        required_equipment=["Oral Rehydration Salts (ORS)"]
    )
    res = evaluate_and_escalate_facility(test_db, req)
    assert res.was_escalated is False
    assert res.selected_facility.tier == "SubCenter"
    assert "Kelambakkam" in res.selected_facility.name

def test_critical_patient_escalates_to_district_hospital(test_db):
    req = FacilityEscalationRequest(
        patient_latitude=12.7236,
        patient_longitude=80.1872,
        symptoms=["Acute Chest Pain / Palpitations", "Severe Shortness of Breath / Asthma"],
        symptom_description="Patient experiencing severe cyanosis and chest tightness",
        vital_signs=VitalSigns(spo2=84.0, heart_rate=125, respiratory_rate=34),
        severity="P1 Critical",
        required_equipment=["ICU", "Ventilator"]
    )
    res = evaluate_and_escalate_facility(test_db, req)
    assert res.was_escalated is True
    assert res.selected_facility.tier == "DistrictHospital"
    assert "Chengalpattu Government District Headquarters Hospital" in res.selected_facility.name
    assert len(res.bypassed_facilities) >= 2
    assert "ICU" in res.missing_equipment_at_nearest
    assert res.ambulance_dispatch is True

# -----------------------------------------------------------------------------
# 4. Transit Safety & Checklists
# -----------------------------------------------------------------------------

def test_transit_instructions_and_checklists():
    instructions = get_transit_safety_instructions(
        priority=TriagePriority.P1_CRITICAL,
        required_equipment=["ICU", "Ventilator"],
        symptoms=["Severe Shortness of Breath / Asthma"]
    )
    assert len(instructions) >= 2
    checklist = get_transit_checklist()
    assert any("ABHA" in item or "Ayushman" in item for item in checklist)
    assert any("Aadhaar" in item for item in checklist)

# -----------------------------------------------------------------------------
# 5. FastAPI Endpoints Integration Tests
# -----------------------------------------------------------------------------

def test_api_escalate_endpoint(client):
    payload = {
        "patient_latitude": 12.7236,
        "patient_longitude": 80.1872,
        "symptoms": ["Severe Shortness of Breath / Asthma"],
        "vital_signs": {"spo2": 85.0, "respiratory_rate": 30},
        "has_personal_transport": False
    }
    res = client.post("/api/facilities/escalate", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["triage_priority"] == "P1 Critical"
    assert data["was_escalated"] is True
    assert data["ambulance_dispatch"] is True

def test_api_facilities_list_and_inventory(client):
    res = client.get("/api/facilities?latitude=12.7236&longitude=80.1872&max_radius_km=50")
    assert res.status_code == 200
    facilities = res.json()
    assert len(facilities) == 4
    # Nearest should be first
    assert facilities[0]["distance_km"] <= facilities[1]["distance_km"]

    fac_id = facilities[0]["id"]
    update_res = client.put(f"/api/facilities/{fac_id}/inventory", json={
        "available_beds": 1,
        "oxygen_cylinders_available": 5
    })
    assert update_res.status_code == 200
    assert update_res.json()["available_beds"] == 1
    assert update_res.json()["oxygen_cylinders_available"] == 5

def test_api_chat_multi_agent_endpoint(client):
    res = client.post("/api/chat", json={
        "query": "Patient with acute respiratory arrest",
        "patient_latitude": 12.7236,
        "patient_longitude": 80.1872,
        "patient_vitals": {"spo2": 82.0, "respiratory_rate": 36},
        "symptoms": ["Severe Shortness of Breath / Asthma"],
        "has_personal_transport": False
    })
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert data["triage_priority"] == "P1 Critical"
    assert data["ambulance_dispatch_needed"] is True
    assert data["referral_slip"] is not None
    assert "REF-" in data["referral_slip"]["referral_id"]

# -----------------------------------------------------------------------------
# 6. LangGraph Multi-Agent Orchestrator Pipeline
# -----------------------------------------------------------------------------

def test_run_medibot_orchestrator():
    result = run_medibot(
        query="High fever with convulsions in 3-year-old child",
        patient_latitude=12.7236,
        patient_longitude=80.1872,
        symptoms=["High Fever (>102°F) / Convulsions"],
        patient_vitals={"temperature": 103.5},
        has_personal_transport=True
    )
    assert result["triage_priority"] in ["P1 Critical", "P2 Moderate"]
    assert result["matching_facility"] is not None
    assert result["referral_slip"] is not None
    assert len(result["transit_guidance"]) > 0

# -----------------------------------------------------------------------------
# 7. Hybrid Search / Retrieval Verification
# -----------------------------------------------------------------------------

def test_hybrid_retriever():
    retriever = get_hybrid_retriever()
    assert retriever is not None
    results = retriever.retrieve_and_rerank("hospital with ICU ventilator", top_k=2)
    assert isinstance(results, list)
