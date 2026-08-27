import math
from typing import List, Dict, Any, Optional, Tuple
from sqlalchemy.orm import Session
from backend.models import Facility, EquipmentInventory, FacilityTier
from backend.schemas import (
    TriagePriority,
    VitalSigns,
    FacilityEscalationRequest,
    FacilityEscalationResponse,
    FacilityResponse,
    EquipmentInventoryResponse,
    BypassedFacilityDetail,
    TriageResponse
)

EARTH_RADIUS_KM = 6371.0

# Hierarchy weights
TIER_HIERARCHY = {
    FacilityTier.SUBCENTER: 1,
    FacilityTier.PHC: 2,
    FacilityTier.CHC: 3,
    FacilityTier.SUB_DISTRICT_HOSPITAL: 4,
    FacilityTier.DISTRICT_HOSPITAL: 5
}

def calculate_haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate the geodesic Great-Circle distance between two points on the Earth in kilometers.
    Uses high-precision Haversine formula.
    """
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (math.sin(delta_phi / 2.0) ** 2 +
         math.cos(phi1) * math.cos(phi2) * (math.sin(delta_lambda / 2.0) ** 2))
    
    # Avoid domain error with precision issues
    a = min(1.0, max(0.0, a))
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    
    return round(EARTH_RADIUS_KM * c, 2)

def calculate_triage_priority(
    vital_signs: Optional[VitalSigns] = None,
    symptoms: Optional[List[str]] = None,
    symptom_description: Optional[str] = None
) -> Tuple[TriagePriority, str, List[str], List[str]]:
    """
    Calculates the triage priority (P1 Critical, P2 Moderate, P3 Routine),
    reasons, vital warnings, and recommended equipment.
    """
    vital_warnings = []
    recommended_equipment = set()
    is_p1 = False
    is_p2 = False
    reasons = []

    # Combined text for keyword matching
    all_symptoms_text = " ".join(symptoms or []).lower()
    if symptom_description:
        all_symptoms_text += " " + symptom_description.lower()

    # 1. Analyze Vital Signs
    if vital_signs:
        # SpO2
        if vital_signs.spo2 is not None:
            if vital_signs.spo2 < 90.0:
                is_p1 = True
                vital_warnings.append(f"Critical Hypoxemia (SpO2: {vital_signs.spo2}%)")
                recommended_equipment.update(["Oxygen Concentrator", "Ventilator", "ICU"])
            elif vital_signs.spo2 < 94.0:
                is_p2 = True
                vital_warnings.append(f"Moderate Hypoxemia (SpO2: {vital_signs.spo2}%)")
                recommended_equipment.update(["Oxygen Concentrator"])

        # Blood Pressure
        if vital_signs.systolic_bp is not None:
            if vital_signs.systolic_bp < 90 or vital_signs.systolic_bp >= 190:
                is_p1 = True
                vital_warnings.append(f"Hemodynamic Instability / Shock (Systolic BP: {vital_signs.systolic_bp} mmHg)")
                recommended_equipment.update(["ICU", "Oxygen Concentrator"])
            elif vital_signs.systolic_bp >= 140 or vital_signs.systolic_bp <= 100:
                is_p2 = True
                vital_warnings.append(f"Abnormal Blood Pressure (Systolic BP: {vital_signs.systolic_bp} mmHg)")

        # Heart Rate
        if vital_signs.heart_rate is not None:
            if vital_signs.heart_rate < 45:
                is_p1 = True
                vital_warnings.append(f"Critical Bradycardia ({vital_signs.heart_rate} bpm)")
                recommended_equipment.update(["Defibrillator", "ECG", "ICU"])
            elif vital_signs.heart_rate > 135:
                is_p1 = True
                vital_warnings.append(f"Critical Tachycardia ({vital_signs.heart_rate} bpm)")
                recommended_equipment.update(["Defibrillator", "ECG", "ICU"])
            elif vital_signs.heart_rate > 105 or vital_signs.heart_rate < 55:
                is_p2 = True
                vital_warnings.append(f"Abnormal Heart Rate ({vital_signs.heart_rate} bpm)")

        # Respiratory Rate
        if vital_signs.respiratory_rate is not None:
            if vital_signs.respiratory_rate < 8 or vital_signs.respiratory_rate > 30:
                is_p1 = True
                vital_warnings.append(f"Severe Respiratory Distress ({vital_signs.respiratory_rate} breaths/min)")
                recommended_equipment.update(["Ventilator", "Oxygen Concentrator", "ICU"])
            elif vital_signs.respiratory_rate > 22 or vital_signs.respiratory_rate < 10:
                is_p2 = True
                vital_warnings.append(f"Tachypnea/Bradypnea ({vital_signs.respiratory_rate} breaths/min)")
                recommended_equipment.update(["Oxygen Concentrator"])

        # Consciousness
        if vital_signs.consciousness_level:
            c_level = vital_signs.consciousness_level.lower()
            if "unresponsive" in c_level or "pain" in c_level or "unconscious" in c_level:
                is_p1 = True
                vital_warnings.append(f"Altered Sensorium / Unresponsive (AVPU: {vital_signs.consciousness_level})")
                recommended_equipment.update(["ICU", "Ventilator", "Oxygen Concentrator"])
            elif "verbal" in c_level or "lethargic" in c_level:
                is_p2 = True
                vital_warnings.append(f"Decreased Responsiveness (AVPU: {vital_signs.consciousness_level})")

        # Temperature
        if vital_signs.temperature is not None:
            if vital_signs.temperature >= 104.0:
                is_p1 = True
                vital_warnings.append(f"Hyperpyrexia (Temp: {vital_signs.temperature}°F)")
            elif vital_signs.temperature >= 101.0:
                is_p2 = True
                vital_warnings.append(f"High Fever (Temp: {vital_signs.temperature}°F)")

    # 2. Analyze Symptom Keywords
    p1_keywords = [
        "cardiac arrest", "chest pain", "heart attack", "myocardial", "stroke", "paralysis", 
        "unconscious", "not breathing", "severe breathlessness", "respiratory failure",
        "cyanosis", "massive bleeding", "hemorrhage", "anaphylaxis", "severe head trauma",
        "polytrauma", "snakebite", "snake bite", "poisoning", "status epilepticus", "convulsion"
    ]
    p2_keywords = [
        "fracture", "deep wound", "severe pain", "high fever", "malaria", "dengue",
        "dehydration", "labor pain", "contractions", "pregnancy bleeding", "maternity", "pregnancy",
        "acute abdomen", "appendix", "burn", "vomiting blood", "asthma attack", "chills"
    ]

    for kw in p1_keywords:
        if kw in all_symptoms_text:
            is_p1 = True
            reasons.append(f"Critical symptom detected: '{kw.title()}'")
            if any(term in kw for term in ["breath", "respiratory", "cyanosis"]):
                recommended_equipment.update(["Oxygen Concentrator", "Ventilator", "ICU"])
            elif any(term in kw for term in ["cardiac", "chest pain", "heart", "stroke"]):
                recommended_equipment.update(["Oxygen Concentrator", "Defibrillator", "ICU"])
            elif any(term in kw for term in ["trauma", "bleeding", "hemorrhage"]):
                recommended_equipment.update(["Blood Bank", "X-Ray", "Operating Theater", "ICU"])
            elif "snake" in kw or "poison" in kw:
                recommended_equipment.update(["ICU", "Oxygen Concentrator", "Ventilator"])

    for kw in p2_keywords:
        if kw in all_symptoms_text:
            is_p2 = True
            reasons.append(f"Urgent symptom detected: '{kw.title()}'")
            if any(term in kw for term in ["labor", "pregnancy", "maternity", "contractions"]):
                recommended_equipment.update(["Labor Room", "Maternity Ward", "Oxygen Concentrator", "Blood Bank"])
            elif any(term in kw for term in ["fracture", "deep wound", "burn"]):
                recommended_equipment.update(["X-Ray", "Oxygen Concentrator"])
            elif any(term in kw for term in ["malaria", "fever", "chills", "dengue"]):
                recommended_equipment.update(["Malaria RDT Kits", "Oxygen Concentrator"])

    # Determine final priority
    if is_p1:
        priority = TriagePriority.P1_CRITICAL
        final_reason = "CRITICAL EMERGENCY: Patient exhibits high-risk physiological instability or life-threatening symptoms requiring immediate advanced tertiary care."
    elif is_p2:
        priority = TriagePriority.P2_MODERATE
        final_reason = "MODERATE URGENCY: Patient has significant clinical symptoms or abnormal vitals requiring secondary facility intervention."
    else:
        priority = TriagePriority.P3_ROUTINE
        final_reason = "ROUTINE / STABLE: Mild symptoms suitable for Primary Health Centre (PHC) OPD or routine teleconsultation."
        if not recommended_equipment:
            recommended_equipment.add("Malaria RDT Kits")

    if vital_warnings:
        final_reason += " Warnings: " + "; ".join(vital_warnings)
    elif reasons:
        final_reason += " Indicators: " + "; ".join(reasons)

    return priority, final_reason, vital_warnings, sorted(list(recommended_equipment))

def is_instrument_available(instrument_name: str, available_list: List[str]) -> bool:
    """
    Checks if an instrument is available in the facility inventory,
    supporting case-insensitive substring matching.
    """
    inst_lower = instrument_name.strip().lower()
    for item in available_list:
        item_lower = item.strip().lower()
        if inst_lower in item_lower or item_lower in inst_lower:
            return True
        # Specific aliases
        if inst_lower in ["oxygen", "o2", "oxygen concentrator"] and any(x in item_lower for x in ["oxygen", "o2", "concentrator", "cylinder"]):
            return True
        if inst_lower in ["ventilator", "icu ventilator"] and "ventilator" in item_lower:
            return True
        if inst_lower in ["icu", "intensive care"] and "icu" in item_lower:
            return True
        if inst_lower in ["x-ray", "xray"] and ("x-ray" in item_lower or "xray" in item_lower):
            return True
        if inst_lower in ["blood bank", "blood transfusion"] and "blood" in item_lower:
            return True
        if inst_lower in ["maternity", "maternity ward", "labor room"] and any(x in item_lower for x in ["maternity", "labor", "delivery"]):
            return True
        if inst_lower in ["malaria rdt kits", "malaria test", "rdt kits"] and any(x in item_lower for x in ["malaria", "rdt", "diagnostic"]):
            return True
    return False

def get_transit_safety_instructions(
    priority: TriagePriority,
    required_equipment: List[str],
    symptoms: List[str],
    vital_signs: Optional[VitalSigns] = None
) -> List[str]:
    """Generates situation-specific transit first-aid and safety instructions."""
    instructions = []

    if priority == TriagePriority.P1_CRITICAL:
        instructions.append("🚨 AMBULANCE EMERGENCY: Call 108 immediately. Keep patient under continuous observation.")
        if any(eq in ["Ventilator", "Oxygen Concentrator", "ICU"] for eq in required_equipment):
            instructions.append("Airway Management: Clear oral airway, maintain high-flow oxygen via non-rebreather mask (10-15 L/min).")
            instructions.append("Positioning: Keep head elevated at 30-45 degrees if conscious; place in recovery position (left lateral) if semi-conscious to prevent aspiration.")
        if any("cardiac" in s.lower() or "chest pain" in s.lower() for s in symptoms):
            instructions.append("Cardiac Precaution: Restrict all physical exertion; administer Aspirin 300mg chewable + Sorbitrate 5mg sublingual if advised by medical responder.")
        if any("trauma" in s.lower() or "bleeding" in s.lower() for s in symptoms):
            instructions.append("Hemorrhage Control: Apply direct continuous pressure over bleeding sites with sterile gauze. Do not remove penetrating objects.")
            instructions.append("Immobilization: Maintain cervical spine in neutral alignment using collar/sandbags.")
        if any("snake" in s.lower() for s in symptoms):
            instructions.append("Snakebite Protocol: Immobilize affected limb below heart level. DO NOT apply tourniquets, incisions, or suction. Keep patient calm.")
    elif priority == TriagePriority.P2_MODERATE:
        instructions.append("Transport via 108/102 or private vehicle with a companion.")
        if "Maternity Ward" in required_equipment:
            instructions.append("Maternal Transit: Patient should travel in left lateral tilt position to optimize uteroplacental blood flow.")
            instructions.append("Obstetric Kit: Keep clean towels and delivery pack readily accessible.")
        if "X-Ray" in required_equipment:
            instructions.append("Orthopedic Care: Splint and immobilize suspected fracture above and below the injured joint.")
        if "Malaria RDT Kits" in required_equipment or (vital_signs and vital_signs.temperature and vital_signs.temperature > 101):
            instructions.append("Fever Care: Administer oral rehydration salts (ORS) and apply lukewarm sponge compresses.")
    else:
        instructions.append("Stable for transit via public or private transport to nearest Primary Health Centre (PHC).")
        instructions.append("Stay hydrated and carry previous medical prescriptions.")

    instructions.append("Keep emergency contact active and inform the receiving hospital in advance.")
    return instructions

def get_transit_checklist() -> List[str]:
    """Checklist of mandatory healthcare and identification documents during transit."""
    return [
        "Government ID Proof (Aadhaar Card / Voter ID)",
        "ABHA ID (Ayushman Bharat Health Account) / PM-JAY Card",
        "Mother and Child Protection (MCP / RCH) Card (for pregnant women/infants)",
        "Referral Slip / Doctor's Prescription / Discharge Summary",
        "Mobile Phone with Emergency Numbers (108 Ambulance, 104 Health Helpline)"
    ]

def evaluate_and_escalate_facility(
    db: Session,
    request: FacilityEscalationRequest
) -> FacilityEscalationResponse:
    """
    Core escalation engine:
    1. Determines Triage Priority (P1/P2/P3) and required equipment.
    2. Retrieves active facilities and calculates high-precision geodesic distances.
    3. Identifies the nearest facility overall.
    4. Evaluates nearest facilities against equipment inventory & bed availability.
    5. Automatically bypasses deficient facilities and escalates to the nearest capable facility.
    6. Formulates ETA, ambulance dispatch status, and safety instructions.
    """
    # 1. Triage Priority & Equipment Requirements
    priority, triage_reason, vital_warnings, auto_equipment = calculate_triage_priority(
        vital_signs=request.vital_signs,
        symptoms=request.symptoms,
        symptom_description=request.symptom_description
    )

    # Allow explicit override if provided in request
    if request.severity:
        for p in TriagePriority:
            if request.severity.lower() in p.value.lower():
                priority = p
                break

    required_equipment = request.required_equipment if request.required_equipment else auto_equipment

    # 2. Fetch facilities from database
    query = db.query(Facility).filter(Facility.is_active == True)
    if request.district:
        query = query.filter(Facility.district.ilike(f"%{request.district}%"))
    
    all_facilities = query.all()

    if not all_facilities:
        # Fallback to all facilities if district filter had zero matches
        all_facilities = db.query(Facility).filter(Facility.is_active == True).all()

    if not all_facilities:
        return FacilityEscalationResponse(
            status="error",
            triage_priority=priority.value,
            triage_reason=triage_reason,
            required_equipment=required_equipment,
            ambulance_dispatch=(priority == TriagePriority.P1_CRITICAL),
            estimated_travel_time_minutes=0,
            transit_safety_instructions=get_transit_safety_instructions(priority, required_equipment, request.symptoms or [], request.vital_signs),
            transit_checklist=get_transit_checklist(),
            was_escalated=False
        )

    # 3. Calculate Geodesic distances and sort
    facilities_with_dist = []
    for fac in all_facilities:
        dist = calculate_haversine_distance(
            request.patient_latitude,
            request.patient_longitude,
            fac.latitude,
            fac.longitude
        )
        if dist <= request.max_search_radius_km:
            facilities_with_dist.append((fac, dist))

    if not facilities_with_dist:
        # Relax radius to 300km if none found within default radius
        for fac in all_facilities:
            dist = calculate_haversine_distance(
                request.patient_latitude,
                request.patient_longitude,
                fac.latitude,
                fac.longitude
            )
            facilities_with_dist.append((fac, dist))

    # Sort ascending by geodesic distance
    facilities_with_dist.sort(key=lambda x: x[1])

    nearest_fac, nearest_dist = facilities_with_dist[0]

    # Helper to convert facility ORM to FacilityResponse
    def to_facility_response(f: Facility, d: float) -> FacilityResponse:
        inv_resp = None
        if f.inventory:
            inv_resp = EquipmentInventoryResponse(
                id=f.inventory.id,
                facility_id=f.inventory.facility_id,
                available_instruments=f.inventory.get_instruments_list(),
                bed_capacity=f.inventory.bed_capacity,
                available_beds=f.inventory.available_beds,
                oxygen_cylinders_available=f.inventory.oxygen_cylinders_available,
                last_updated=f.inventory.last_updated
            )
        return FacilityResponse(
            id=f.id,
            name=f.name,
            tier=f.tier,
            district=f.district,
            state=f.state,
            latitude=f.latitude,
            longitude=f.longitude,
            contact=f.contact,
            address=f.address,
            is_active=f.is_active,
            created_at=f.created_at,
            inventory=inv_resp,
            distance_km=d
        )

    nearest_facility_overall = to_facility_response(nearest_fac, nearest_dist)

    # 4. Search for the nearest VERIFIED CAPABLE facility
    selected_fac = None
    selected_dist = None
    bypassed_facilities: List[BypassedFacilityDetail] = []
    missing_equipment_at_nearest: List[str] = []

    for fac, dist in facilities_with_dist:
        inventory = fac.inventory
        available_inst = inventory.get_instruments_list() if inventory else []
        avail_beds = inventory.available_beds if inventory else 0

        # Check required equipment
        missing = [eq for eq in required_equipment if not is_instrument_available(eq, available_inst)]

        # Check bed capacity
        bed_deficient = request.require_available_bed and (avail_beds < 1) and (priority != TriagePriority.P3_ROUTINE)

        if fac.id == nearest_fac.id:
            missing_equipment_at_nearest = list(missing)
            if bed_deficient:
                missing_equipment_at_nearest.append("Available Inpatient Bed")

        if not missing and not bed_deficient:
            selected_fac = fac
            selected_dist = dist
            break
        else:
            reason_parts = []
            if missing:
                reason_parts.append(f"Missing required equipment: {', '.join(missing)}")
            if bed_deficient:
                reason_parts.append(f"Zero inpatient beds available (Beds: {avail_beds})")
            
            bypassed_facilities.append(BypassedFacilityDetail(
                facility_id=fac.id,
                facility_name=fac.name,
                tier=fac.tier,
                district=fac.district,
                distance_km=dist,
                missing_equipment=missing,
                beds_available=avail_beds,
                bypass_reason="; ".join(reason_parts)
            ))

    # If no facility met 100% requirements, fallback to the closest facility with the highest tier / beds
    was_escalated = False
    escalation_tier = None

    if selected_fac is None:
        # Fallback to the nearest District Hospital or largest facility
        district_hospitals = [
            (f, d) for f, d in facilities_with_dist 
            if f.tier in [FacilityTier.DISTRICT_HOSPITAL, FacilityTier.SUB_DISTRICT_HOSPITAL]
        ]
        if district_hospitals:
            selected_fac, selected_dist = district_hospitals[0]
        else:
            selected_fac, selected_dist = nearest_fac, nearest_dist

    selected_facility_response = to_facility_response(selected_fac, selected_dist)

    if selected_fac.id != nearest_fac.id:
        was_escalated = True
        escalation_tier = f"{nearest_fac.tier} -> {selected_fac.tier}"

    # 5. Travel Time Calculation (Road winding factor ~ 1.30)
    # Speed: P1 Ambulance ~ 55 km/h; Routine ~ 40 km/h
    avg_speed_kmh = 55.0 if priority == TriagePriority.P1_CRITICAL else 40.0
    effective_road_distance = selected_dist * 1.30
    estimated_travel_time_minutes = round(max(3.0, (effective_road_distance / avg_speed_kmh) * 60.0), 1)

    # 6. Ambulance Dispatch Flag & Type
    ambulance_dispatch = (priority == TriagePriority.P1_CRITICAL) or (was_escalated and priority == TriagePriority.P2_MODERATE)
    
    if priority == TriagePriority.P1_CRITICAL:
        if any(eq in ["Ventilator", "ICU", "Defibrillator"] for eq in required_equipment):
            ambulance_type = "108 ALS (Advanced Life Support - Ventilator & Defibrillator Equipped)"
        else:
            ambulance_type = "108 BLS (Basic Life Support - Oxygen Concentrator Equipped)"
    elif "Maternity Ward" in required_equipment:
        ambulance_type = "102 Janani Shishu Suraksha Vahan (Maternal & Infant Transport)"
    elif ambulance_dispatch:
        ambulance_type = "108 Emergency Ambulance"
    else:
        ambulance_type = None

    # 7. Transit instructions
    transit_safety_instructions = get_transit_safety_instructions(
        priority=priority,
        required_equipment=required_equipment,
        symptoms=request.symptoms or [],
        vital_signs=request.vital_signs
    )
    transit_checklist = get_transit_checklist()

    return FacilityEscalationResponse(
        status="success",
        triage_priority=priority.value,
        triage_reason=triage_reason,
        required_equipment=required_equipment,
        ambulance_dispatch=ambulance_dispatch,
        ambulance_type=ambulance_type,
        nearest_facility_overall=nearest_facility_overall,
        selected_facility=selected_facility_response,
        was_escalated=was_escalated,
        escalation_tier=escalation_tier,
        bypassed_facilities=bypassed_facilities,
        missing_equipment_at_nearest=missing_equipment_at_nearest,
        estimated_travel_time_minutes=estimated_travel_time_minutes,
        transit_safety_instructions=transit_safety_instructions,
        transit_checklist=transit_checklist
    )
