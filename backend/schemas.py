from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
from enum import Enum
from datetime import datetime

class TriagePriority(str, Enum):
    P1_CRITICAL = "P1 Critical"
    P2_MODERATE = "P2 Moderate"
    P3_ROUTINE = "P3 Routine"

class FacilityTierEnum(str, Enum):
    SUBCENTER = "SubCenter"
    PHC = "PHC"
    CHC = "CHC"
    SUB_DISTRICT_HOSPITAL = "SubDistrictHospital"
    DISTRICT_HOSPITAL = "DistrictHospital"

class VitalSigns(BaseModel):
    spo2: Optional[float] = Field(None, description="Oxygen Saturation percentage (e.g., 95.0)")
    heart_rate: Optional[int] = Field(None, description="Pulse / Heart rate (bpm)")
    systolic_bp: Optional[int] = Field(None, description="Systolic Blood Pressure (mmHg)")
    diastolic_bp: Optional[int] = Field(None, description="Diastolic Blood Pressure (mmHg)")
    respiratory_rate: Optional[int] = Field(None, description="Breaths per minute")
    temperature: Optional[float] = Field(None, description="Body temperature in Fahrenheit")
    consciousness_level: Optional[str] = Field(None, description="'Alert', 'Verbal', 'Pain', 'Unresponsive' (AVPU)")

class EquipmentInventoryBase(BaseModel):
    available_instruments: List[str] = Field(
        default_factory=list,
        description="List of available instruments, e.g. ['Oxygen Concentrator', 'Malaria RDT Kits', 'Ventilator', 'X-Ray', 'Maternity Ward', 'Blood Bank']"
    )
    bed_capacity: int = Field(0, description="Total bed capacity")
    available_beds: int = Field(0, description="Currently available beds")
    oxygen_cylinders_available: int = Field(0, description="Available O2 cylinders")

class EquipmentInventoryCreate(EquipmentInventoryBase):
    pass

class EquipmentInventoryUpdate(BaseModel):
    available_instruments: Optional[List[str]] = None
    bed_capacity: Optional[int] = None
    available_beds: Optional[int] = None
    oxygen_cylinders_available: Optional[int] = None

class EquipmentInventoryResponse(EquipmentInventoryBase):
    id: int
    facility_id: int
    last_updated: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class FacilityBase(BaseModel):
    name: str
    tier: str = Field(..., description="'SubCenter', 'PHC', 'CHC', 'SubDistrictHospital', 'DistrictHospital'")
    district: str
    state: Optional[str] = "Tamil Nadu"
    latitude: float
    longitude: float
    contact: str
    address: Optional[str] = None
    is_active: bool = True

class FacilityCreate(FacilityBase):
    inventory: Optional[EquipmentInventoryCreate] = None

class FacilityResponse(FacilityBase):
    id: int
    created_at: Optional[datetime] = None
    inventory: Optional[EquipmentInventoryResponse] = None
    distance_km: Optional[float] = Field(None, description="Geodesic distance from patient in km")

    model_config = ConfigDict(from_attributes=True)

class TriageRequest(BaseModel):
    symptoms: Optional[List[str]] = None
    symptom_description: Optional[str] = None
    vital_signs: Optional[VitalSigns] = None

class TriageResponse(BaseModel):
    triage_priority: TriagePriority
    triage_reason: str
    vital_warnings: List[str] = []
    recommended_equipment: List[str] = []
    ambulance_dispatch_recommended: bool

class FacilityEscalationRequest(BaseModel):
    patient_latitude: float = Field(..., description="Patient GPS Latitude")
    patient_longitude: float = Field(..., description="Patient GPS Longitude")
    symptoms: Optional[List[str]] = Field(default_factory=list, description="List of patient symptoms")
    symptom_description: Optional[str] = Field(None, description="Free text description of symptoms")
    vital_signs: Optional[VitalSigns] = None
    severity: Optional[str] = Field(None, description="Optional manual override (P1 Critical, P2 Moderate, P3 Routine)")
    required_equipment: Optional[List[str]] = Field(None, description="Explicit list of required instruments; auto-inferred if omitted")
    district: Optional[str] = Field(None, description="Optional district filter")
    max_search_radius_km: float = Field(150.0, description="Max radial search distance in km")
    require_available_bed: bool = Field(True, description="Whether the facility must have at least 1 free bed")

class BypassedFacilityDetail(BaseModel):
    facility_id: int
    facility_name: str
    tier: str
    district: str
    distance_km: float
    missing_equipment: List[str]
    beds_available: int
    bypass_reason: str

class FacilityEscalationResponse(BaseModel):
    status: str = "success"
    triage_priority: str
    triage_reason: str
    required_equipment: List[str]
    ambulance_dispatch: bool
    ambulance_type: Optional[str] = None
    nearest_facility_overall: Optional[FacilityResponse] = None
    selected_facility: Optional[FacilityResponse] = None
    was_escalated: bool
    escalation_tier: Optional[str] = None
    bypassed_facilities: List[BypassedFacilityDetail] = []
    missing_equipment_at_nearest: List[str] = []
    estimated_travel_time_minutes: float
    transit_safety_instructions: List[str]
    transit_checklist: List[str]
