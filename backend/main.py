from fastapi import FastAPI, Depends, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import uvicorn
from dotenv import load_dotenv
import sys
import os
from typing import List, Optional, Dict, Any

load_dotenv()

# Ensure the root project directory is in the path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.database import engine, get_db, Base
from backend.models import Facility, EquipmentInventory
from backend.schemas import (
    FacilityBase,
    FacilityCreate,
    FacilityResponse,
    EquipmentInventoryUpdate,
    EquipmentInventoryResponse,
    FacilityEscalationRequest,
    FacilityEscalationResponse,
    TriageRequest,
    TriageResponse
)
from backend.escalation import (
    evaluate_and_escalate_facility,
    calculate_triage_priority,
    calculate_haversine_distance,
    get_transit_safety_instructions,
    get_transit_checklist
)
from backend.seed_data import seed_facilities_if_empty
from pydantic import BaseModel

try:
    from agents.graph import run_medibot
except Exception as e:
    def run_medibot(query: str, thread_id: str = "default_user_1"):
        return {
            "final_answer": "MediBot AI assistant is initialized. (Agent workflow loaded in fallback mode)",
            "sources": []
        }

from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize and seed database on startup if empty
    db = next(get_db())
    try:
        seed_facilities_if_empty(db)
    finally:
        db.close()
    yield

app = FastAPI(
    title="MediBot AI - Healthcare Verification & Escalation Backend",
    description="FastAPI Backend for MediBot AI: Real-Time Indian Public Healthcare Facility Equipment Verification, Automated Triage, and Geodesic Escalation Engine.",
    version="2.0.0",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Core Root & Health Endpoints
# ---------------------------------------------------------------------------

@app.get("/")
def read_root():
    return {
        "status": "ok",
        "service": "MediBot AI Backend",
        "modules": [
            "Clinical Triage Engine",
            "Indian Public Healthcare Facility Equipment Verification",
            "Geodesic Haversine Escalation Engine",
            "LangGraph RAG QA Assistant"
        ]
    }

@app.get("/health")
def health_check():
    return {"status": "healthy"}

# ---------------------------------------------------------------------------
# Real-Time Facility Verification & Automatic Escalation API
# ---------------------------------------------------------------------------

@app.post("/api/facilities/escalate", response_model=FacilityEscalationResponse, status_code=status.HTTP_200_OK)
def escalate_facility_endpoint(
    request: FacilityEscalationRequest,
    db: Session = Depends(get_db)
):
    """
    Automated Facility Escalation Logic:
    1. Calculates triage priority (P1 Critical, P2 Moderate, P3 Routine) based on symptoms/vitals.
    2. Matches required medical equipment against nearest facility within radial distance using Geodesic formulas.
    3. If the nearest PHC/CHC lacks required equipment (e.g. ICU/Ventilator) or beds, automatically
       bypasses and escalates to the nearest verified capable Sub-District or District Hospital.
    4. Returns payload with verified facility, missing equipment list, ambulance dispatch flag, ETA, and safety instructions.
    """
    try:
        response = evaluate_and_escalate_facility(db=db, request=request)
        return response
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error evaluating facility escalation: {str(e)}"
        )

@app.post("/api/triage", response_model=TriageResponse)
def triage_endpoint(request: TriageRequest):
    """Calculates triage priority, vital warnings, and equipment requirements."""
    priority, reason, warnings, equipment = calculate_triage_priority(
        vital_signs=request.vital_signs,
        symptoms=request.symptoms,
        symptom_description=request.symptom_description
    )
    return TriageResponse(
        triage_priority=priority,
        triage_reason=reason,
        vital_warnings=warnings,
        recommended_equipment=equipment,
        ambulance_dispatch_recommended=(priority.value == "P1 Critical")
    )

# ---------------------------------------------------------------------------
# Facility Discovery & Management Endpoints
# ---------------------------------------------------------------------------

@app.get("/api/facilities", response_model=List[FacilityResponse])
def list_facilities(
    district: Optional[str] = Query(None, description="Filter by district"),
    tier: Optional[str] = Query(None, description="Filter by tier ('SubCenter', 'PHC', 'CHC', 'DistrictHospital')"),
    latitude: Optional[float] = Query(None, description="Patient latitude for radial distance calculation"),
    longitude: Optional[float] = Query(None, description="Patient longitude for radial distance calculation"),
    max_radius_km: Optional[float] = Query(100.0, description="Max radius in km"),
    instrument: Optional[str] = Query(None, description="Filter by required available instrument"),
    db: Session = Depends(get_db)
):
    """Lists healthcare facilities with optional filtering by district, tier, equipment, and radial distance."""
    query = db.query(Facility).filter(Facility.is_active == True)

    if district:
        query = query.filter(Facility.district.ilike(f"%{district}%"))
    if tier:
        query = query.filter(Facility.tier.ilike(f"%{tier}%"))

    facilities = query.all()
    results = []

    for fac in facilities:
        dist = None
        if latitude is not None and longitude is not None:
            dist = calculate_haversine_distance(latitude, longitude, fac.latitude, fac.longitude)
            if dist > max_radius_km:
                continue

        # Check instrument filter
        if instrument and fac.inventory:
            inst_list = fac.inventory.get_instruments_list()
            if not any(instrument.lower() in x.lower() for x in inst_list):
                continue

        inv_resp = None
        if fac.inventory:
            inv_resp = EquipmentInventoryResponse(
                id=fac.inventory.id,
                facility_id=fac.inventory.facility_id,
                available_instruments=fac.inventory.get_instruments_list(),
                bed_capacity=fac.inventory.bed_capacity,
                available_beds=fac.inventory.available_beds,
                oxygen_cylinders_available=fac.inventory.oxygen_cylinders_available,
                last_updated=fac.inventory.last_updated
            )

        results.append(FacilityResponse(
            id=fac.id,
            name=fac.name,
            tier=fac.tier,
            district=fac.district,
            state=fac.state,
            latitude=fac.latitude,
            longitude=fac.longitude,
            contact=fac.contact,
            address=fac.address,
            is_active=fac.is_active,
            created_at=fac.created_at,
            inventory=inv_resp,
            distance_km=dist
        ))

    if latitude is not None and longitude is not None:
        results.sort(key=lambda x: (x.distance_km if x.distance_km is not None else float("inf")))

    return results

@app.get("/api/facilities/{facility_id}", response_model=FacilityResponse)
def get_facility_detail(facility_id: int, db: Session = Depends(get_db)):
    """Fetches details for a specific healthcare facility with live equipment inventory."""
    fac = db.query(Facility).filter(Facility.id == facility_id).first()
    if not fac:
        raise HTTPException(status_code=404, detail="Facility not found")

    inv_resp = None
    if fac.inventory:
        inv_resp = EquipmentInventoryResponse(
            id=fac.inventory.id,
            facility_id=fac.inventory.facility_id,
            available_instruments=fac.inventory.get_instruments_list(),
            bed_capacity=fac.inventory.bed_capacity,
            available_beds=fac.inventory.available_beds,
            oxygen_cylinders_available=fac.inventory.oxygen_cylinders_available,
            last_updated=fac.inventory.last_updated
        )

    return FacilityResponse(
        id=fac.id,
        name=fac.name,
        tier=fac.tier,
        district=fac.district,
        state=fac.state,
        latitude=fac.latitude,
        longitude=fac.longitude,
        contact=fac.contact,
        address=fac.address,
        is_active=fac.is_active,
        created_at=fac.created_at,
        inventory=inv_resp,
        distance_km=None
    )

@app.post("/api/facilities", response_model=FacilityResponse, status_code=status.HTTP_201_CREATED)
def create_facility(facility_data: FacilityCreate, db: Session = Depends(get_db)):
    """Registers a new healthcare facility along with its equipment inventory."""
    facility = Facility(
        name=facility_data.name,
        tier=facility_data.tier,
        district=facility_data.district,
        state=facility_data.state,
        latitude=facility_data.latitude,
        longitude=facility_data.longitude,
        contact=facility_data.contact,
        address=facility_data.address,
        is_active=facility_data.is_active
    )
    db.add(facility)
    db.flush()

    if facility_data.inventory:
        inventory = EquipmentInventory(
            facility_id=facility.id,
            available_instruments=facility_data.inventory.available_instruments,
            bed_capacity=facility_data.inventory.bed_capacity,
            available_beds=facility_data.inventory.available_beds,
            oxygen_cylinders_available=facility_data.inventory.oxygen_cylinders_available
        )
        db.add(inventory)

    db.commit()
    db.refresh(facility)

    inv_resp = None
    if facility.inventory:
        inv_resp = EquipmentInventoryResponse(
            id=facility.inventory.id,
            facility_id=facility.inventory.facility_id,
            available_instruments=facility.inventory.get_instruments_list(),
            bed_capacity=facility.inventory.bed_capacity,
            available_beds=facility.inventory.available_beds,
            oxygen_cylinders_available=facility.inventory.oxygen_cylinders_available,
            last_updated=facility.inventory.last_updated
        )

    return FacilityResponse(
        id=facility.id,
        name=facility.name,
        tier=facility.tier,
        district=facility.district,
        state=facility.state,
        latitude=facility.latitude,
        longitude=facility.longitude,
        contact=facility.contact,
        address=facility.address,
        is_active=facility.is_active,
        created_at=facility.created_at,
        inventory=inv_resp,
        distance_km=None
    )

@app.put("/api/facilities/{facility_id}/inventory", response_model=EquipmentInventoryResponse)
def update_facility_inventory(
    facility_id: int,
    inv_update: EquipmentInventoryUpdate,
    db: Session = Depends(get_db)
):
    """Updates live equipment inventory and available bed counts for a facility."""
    fac = db.query(Facility).filter(Facility.id == facility_id).first()
    if not fac:
        raise HTTPException(status_code=404, detail="Facility not found")

    inventory = fac.inventory
    if not inventory:
        inventory = EquipmentInventory(facility_id=facility_id)
        db.add(inventory)

    if inv_update.available_instruments is not None:
        inventory.available_instruments = inv_update.available_instruments
    if inv_update.bed_capacity is not None:
        inventory.bed_capacity = inv_update.bed_capacity
    if inv_update.available_beds is not None:
        inventory.available_beds = inv_update.available_beds
    if inv_update.oxygen_cylinders_available is not None:
        inventory.oxygen_cylinders_available = inv_update.oxygen_cylinders_available

    db.commit()
    db.refresh(inventory)

    return EquipmentInventoryResponse(
        id=inventory.id,
        facility_id=inventory.facility_id,
        available_instruments=inventory.get_instruments_list(),
        bed_capacity=inventory.bed_capacity,
        available_beds=inventory.available_beds,
        oxygen_cylinders_available=inventory.oxygen_cylinders_available,
        last_updated=inventory.last_updated
    )

# ---------------------------------------------------------------------------
# MediBot Chat & Multi-Agent Public Healthcare AI Endpoint
# ---------------------------------------------------------------------------

class ChatRequest(BaseModel):
    query: Optional[str] = None
    message: Optional[str] = None  # Legacy field fallback
    thread_id: str = "default_user_1"
    patient_latitude: Optional[float] = None
    patient_longitude: Optional[float] = None
    patient_vitals: Optional[Dict[str, Any]] = None
    symptoms: Optional[List[str]] = None
    has_personal_transport: bool = True
    language: Optional[str] = "en"
    roleDescription: Optional[str] = None

@app.post("/api/chat")
async def chat_endpoint(request: ChatRequest):
    try:
        # Support both 'query' and legacy 'message'
        user_query = request.query or request.message or ""
        
        result = run_medibot(
            query=user_query,
            thread_id=request.thread_id,
            patient_latitude=request.patient_latitude,
            patient_longitude=request.patient_longitude,
            patient_vitals=request.patient_vitals,
            symptoms=request.symptoms,
            has_personal_transport=request.has_personal_transport
        )

        if isinstance(result, dict):
            final_answer = result.get("final_answer", "")
            sources = result.get("sources", [])
        else:
            final_answer = str(result)
            sources = []
            result = {}
            
        return {
            "status": "success",
            "response": final_answer,
            "triage_priority": result.get("triage_priority", "P3 Routine"),
            "triage_reason": result.get("triage_reason", ""),
            "matching_facility": result.get("matching_facility"),
            "nearest_facility": result.get("nearest_facility"),
            "was_escalated": result.get("was_escalated", False),
            "escalation_tier": result.get("escalation_tier"),
            "bypassed_facilities": result.get("bypassed_facilities", []),
            "missing_equipment_at_nearest": result.get("missing_equipment_at_nearest", []),
            "estimated_travel_time_minutes": result.get("estimated_travel_time_minutes", 0),
            "ambulance_dispatch_needed": result.get("ambulance_dispatch_needed", False),
            "ambulance_payload": result.get("ambulance_payload"),
            "transit_guidance": result.get("transit_guidance", []),
            "transit_checklist": result.get("transit_checklist", []),
            "referral_slip": result.get("referral_slip"),
            "referral_qr_code": result.get("referral_qr_code"),
            "sources": sources
        }
    except Exception as e:
        return {"response": f"An error occurred: {str(e)}", "status": "error"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
