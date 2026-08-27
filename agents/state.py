from typing import TypedDict, List, Dict, Any, Optional

class AgentState(TypedDict, total=False):
    # User's input & clinical context
    query: str
    thread_id: Optional[str]
    patient_latitude: Optional[float]
    patient_longitude: Optional[float]
    patient_vitals: Optional[Dict[str, Any]]
    symptoms: Optional[List[str]]
    has_personal_transport: Optional[bool]
    
    # Step 1: Triage Node Outputs
    query_type: Optional[str]               # 'emergency', 'medical', 'general'
    is_emergency: bool
    triage_priority: Optional[str]         # 'P1 Critical', 'P2 Moderate', 'P3 Routine'
    triage_reason: Optional[str]
    vital_warnings: List[str]
    required_equipment: List[str]
    
    # Step 2: Facility & Equipment Matcher Node Outputs
    nearest_facility: Optional[Dict[str, Any]]
    matching_facility: Optional[Dict[str, Any]]
    was_escalated: bool
    escalation_tier: Optional[str]
    bypassed_facilities: List[Dict[str, Any]]
    missing_equipment_at_nearest: List[str]
    estimated_travel_time_minutes: float

    # Step 3: Vehicle Check & Ambulance Dispatch Outputs
    ambulance_dispatch_needed: bool
    ambulance_payload: Optional[Dict[str, Any]]

    # Step 4: Precautionary Travel Guidance Outputs
    transit_guidance: List[str]
    transit_checklist: List[str]

    # Step 5: Digital Scannable Referral QR Slip Outputs
    referral_slip: Optional[Dict[str, Any]]
    referral_qr_code: Optional[str]

    # Hybrid Retrieval & QA
    retrieved_docs: List[Dict[str, Any]]
    final_answer: Optional[str]
    sources: List[Dict[str, Any]]
