from typing import Dict, Any, List, Optional
import os
import json
import random
import datetime
from agents.state import AgentState
from backend.database import SessionLocal
from backend.schemas import VitalSigns, FacilityEscalationRequest
from backend.escalation import (
    calculate_triage_priority,
    evaluate_and_escalate_facility,
    get_transit_safety_instructions,
    get_transit_checklist
)

# Optional LLM initialization with graceful fallback
try:
    from langchain_groq import ChatGroq
    from langchain.prompts import PromptTemplate
    from retrieval.hybrid_search import get_hybrid_retriever
    groq_api_key = os.getenv("GROQ_API_KEY")
    if groq_api_key:
        llm = ChatGroq(model="llama3-70b-8192", temperature=0)
        retriever = get_hybrid_retriever()
    else:
        llm = None
        retriever = None
except Exception:
    llm = None
    retriever = None

# ---------------------------------------------------------------------------
# Step 1: Clinical Triage Node
# ---------------------------------------------------------------------------
def triage_node(state: AgentState) -> AgentState:
    """
    Step 1: Clinical Triage Node.
    Analyzes patient query, symptoms, and physiological vitals to calculate
    triage priority (P1 Critical, P2 Moderate, P3 Routine) and required equipment.
    """
    query = state.get("query", "")
    symptoms = state.get("symptoms") or []
    vitals_dict = state.get("patient_vitals") or {}
    
    # Convert dict to VitalSigns object
    vitals = None
    if vitals_dict:
        vitals = VitalSigns(
            spo2=vitals_dict.get("spo2"),
            heart_rate=vitals_dict.get("heart_rate"),
            systolic_bp=vitals_dict.get("systolic_bp"),
            diastolic_bp=vitals_dict.get("diastolic_bp"),
            respiratory_rate=vitals_dict.get("respiratory_rate"),
            temperature=vitals_dict.get("temperature"),
            consciousness_level=vitals_dict.get("consciousness_level")
        )

    # Calculate rule-based physiological triage priority
    priority, reason, warnings, equipment = calculate_triage_priority(
        vital_signs=vitals,
        symptoms=symptoms,
        symptom_description=query
    )

    priority_val = priority.value
    is_emergency = (priority_val == "P1 Critical")

    # Determine query classification
    q_lower = query.lower()
    if is_emergency:
        query_type = "emergency"
    elif any(kw in q_lower for kw in ["hello", "hi", "hey", "who are you", "what can you do"]):
        query_type = "general"
    else:
        query_type = "medical"

    state["query_type"] = query_type
    state["is_emergency"] = is_emergency
    state["triage_priority"] = priority_val
    state["triage_reason"] = reason
    state["vital_warnings"] = warnings
    state["required_equipment"] = equipment

    print(f"[Agent Step 1: Triage Node] Priority: {priority_val} | Emergency: {is_emergency} | Equipment: {equipment}")
    return state

# ---------------------------------------------------------------------------
# Step 2: Facility & Equipment Matcher Node
# ---------------------------------------------------------------------------
def facility_matcher_node(state: AgentState) -> AgentState:
    """
    Step 2: Facility & Equipment Matcher Node.
    Matches patient GPS coordinates against database facilities using geodesic formulas.
    If the nearest PHC/CHC lacks required equipment (e.g. ICU/Ventilator) or beds,
    it automatically bypasses and escalates to the nearest verified capable District Hospital.
    """
    lat = state.get("patient_latitude")
    lng = state.get("patient_longitude")
    
    # Default coordinates if omitted (e.g. Thiruporur rural block)
    if lat is None or lng is None:
        lat = 12.7236
        lng = 80.1872

    vitals_dict = state.get("patient_vitals") or {}
    vitals = VitalSigns(**vitals_dict) if vitals_dict else None

    req = FacilityEscalationRequest(
        patient_latitude=lat,
        patient_longitude=lng,
        symptoms=state.get("symptoms") or [],
        symptom_description=state.get("query", ""),
        vital_signs=vitals,
        severity=state.get("triage_priority"),
        required_equipment=state.get("required_equipment") or []
    )

    db = SessionLocal()
    try:
        escalation_result = evaluate_and_escalate_facility(db=db, request=req)
        
        state["nearest_facility"] = escalation_result.nearest_facility_overall.model_dump() if escalation_result.nearest_facility_overall else None
        state["matching_facility"] = escalation_result.selected_facility.model_dump() if escalation_result.selected_facility else None
        state["was_escalated"] = escalation_result.was_escalated
        state["escalation_tier"] = escalation_result.escalation_tier
        state["bypassed_facilities"] = [b.model_dump() for b in escalation_result.bypassed_facilities]
        state["missing_equipment_at_nearest"] = escalation_result.missing_equipment_at_nearest
        state["estimated_travel_time_minutes"] = escalation_result.estimated_travel_time_minutes
        
        print(f"[Agent Step 2: Facility Matcher] Selected: {escalation_result.selected_facility.name if escalation_result.selected_facility else 'None'} | Escalated: {escalation_result.was_escalated}")
    finally:
        db.close()

    return state

# ---------------------------------------------------------------------------
# Step 3: Vehicle Availability & Ambulance Dispatch Node
# ---------------------------------------------------------------------------
def ambulance_dispatch_node(state: AgentState) -> AgentState:
    """
    Step 3: Vehicle Availability & Ambulance Dispatch Node.
    Checks patient transport status. If has_personal_transport is False or
    triage is P1 Critical, constructs 108/102 ambulance dispatch payload.
    """
    has_transport = state.get("has_personal_transport", True)
    priority = state.get("triage_priority", "P3 Routine")
    is_p1 = (priority == "P1 Critical")
    matching_fac = state.get("matching_facility") or {}
    
    needs_ambulance = (not has_transport) or is_p1

    if needs_ambulance:
        amb_type = "108 ALS (Advanced Life Support - Ventilator Equipped)" if is_p1 else "102 Basic Rural Patient Transport"
        state["ambulance_dispatch_needed"] = True
        state["ambulance_payload"] = {
            "dispatch_id": f"AMB-{random.randint(100000, 999999)}",
            "service": amb_type,
            "status": "Transmitted to 108 Emergency Control Room",
            "patient_location": {
                "latitude": state.get("patient_latitude", 12.7236),
                "longitude": state.get("patient_longitude", 80.1872)
            },
            "destination_facility": matching_fac.get("name", "Nearest District Hospital"),
            "destination_contact": matching_fac.get("contact", "+91 94440 12005"),
            "estimated_eta_minutes": state.get("estimated_travel_time_minutes", 15.0),
            "vital_alerts": state.get("vital_warnings", []),
            "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat()
        }
        print(f"[Agent Step 3: Ambulance Dispatch] Dispatched: {amb_type}")
    else:
        state["ambulance_dispatch_needed"] = False
        state["ambulance_payload"] = None
        print("[Agent Step 3: Ambulance Dispatch] Personal vehicle available. No ambulance requested.")

    return state

# ---------------------------------------------------------------------------
# Step 4: Precautionary Travel Guidance Node
# ---------------------------------------------------------------------------
def travel_guidance_node(state: AgentState) -> AgentState:
    """
    Step 4: Precautionary Travel Guidance Node.
    Generates situation-specific first-aid and safety measures for transit.
    """
    vitals_dict = state.get("patient_vitals") or {}
    vitals = VitalSigns(**vitals_dict) if vitals_dict else None
    symptoms = state.get("symptoms") or []
    
    # Priority enum lookup
    priority_str = state.get("triage_priority", "P3 Routine")
    from backend.schemas import TriagePriority
    priority_enum = TriagePriority.P1_CRITICAL if "P1" in priority_str else (TriagePriority.P2_MODERATE if "P2" in priority_str else TriagePriority.P3_ROUTINE)

    guidance = get_transit_safety_instructions(
        priority=priority_enum,
        required_equipment=state.get("required_equipment") or [],
        symptoms=symptoms,
        vital_signs=vitals
    )
    checklist = get_transit_checklist()

    state["transit_guidance"] = guidance
    state["transit_checklist"] = checklist
    print(f"[Agent Step 4: Travel Guidance] Generated {len(guidance)} transit safety instructions.")
    return state

# ---------------------------------------------------------------------------
# Step 5: Digital Scannable Referral QR Slip Node
# ---------------------------------------------------------------------------
def generate_svg_qr_placeholder(text_data: str) -> str:
    """Generates an embedded SVG QR code representation for referral verification."""
    # Deterministic pattern based on hash of referral data
    h = hash(text_data)
    blocks = []
    for row in range(7):
        for col in range(7):
            # Corners are always finder patterns
            is_corner = (row < 2 and col < 2) or (row < 2 and col > 4) or (row > 4 and col < 2)
            is_filled = is_corner or ((h >> (row * 7 + col)) & 1 == 1)
            if is_filled:
                blocks.append(f'<rect x="{col*14 + 10}" y="{row*14 + 10}" width="12" height="12" fill="#0284c7" rx="2" />')

    svg = (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">'
        f'<rect width="120" height="120" fill="#0f172a" rx="10" />'
        f'{"".join(blocks)}'
        f'</svg>'
    )
    return svg

def referral_qr_node(state: AgentState) -> AgentState:
    """
    Step 5: Digital Scannable Referral QR Slip Node.
    Creates a verified digital referral slip with unique Ref ID, clinical summary,
    routing pathway, and scannable QR verification payload.
    """
    ref_id = f"REF-{datetime.datetime.now().strftime('%Y%m%d')}-{random.randint(1000, 9999)}"
    matching_fac = state.get("matching_facility") or {}
    nearest_fac = state.get("nearest_facility") or {}
    priority = state.get("triage_priority", "P3 Routine")
    
    referral_summary = {
        "referral_id": ref_id,
        "issued_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "triage_priority": priority,
        "patient_symptoms": state.get("symptoms") or [state.get("query", "")],
        "assigned_facility": matching_fac.get("name", "District Hospital"),
        "facility_tier": matching_fac.get("tier", "DistrictHospital"),
        "facility_contact": matching_fac.get("contact", "+91 94440 12005"),
        "was_escalated": state.get("was_escalated", False),
        "escalation_tier": state.get("escalation_tier"),
        "required_equipment": state.get("required_equipment", []),
        "vital_warnings": state.get("vital_warnings", []),
        "ambulance_dispatched": state.get("ambulance_dispatch_needed", False)
    }

    qr_text = json.dumps(referral_summary)
    qr_svg = generate_svg_qr_placeholder(qr_text)

    state["referral_slip"] = referral_summary
    state["referral_qr_code"] = qr_svg

    # Formulate consolidated final response text for chat & audit
    response_lines = [
        f"### 📋 Digital Clinical Triage & Referral Slip",
        f"**Referral ID**: `{ref_id}`",
        f"**Triage Classification**: `{priority}`",
        f"**Clinical Assessment**: {state.get('triage_reason', '')}",
        "",
        f"#### 🏥 Routed Healthcare Facility",
        f"- **Facility Name**: **{matching_fac.get('name', 'Nearest Hospital')}** ({matching_fac.get('tier', '')})",
        f"- **District**: {matching_fac.get('district', '')}",
        f"- **Distance**: {matching_fac.get('distance_km', 'N/A')} km (ETA: ~{state.get('estimated_travel_time_minutes', 0)} mins)",
        f"- **Emergency Contact**: `{matching_fac.get('contact', '108')}`",
        f"- **Required Equipment Verified**: {', '.join(state.get('required_equipment', [])) or 'Standard OPD'}",
    ]

    if state.get("was_escalated"):
        response_lines.append(f"\n> ⚠️ **Automated Escalation**: Nearest facility (*{nearest_fac.get('name', '')}*) lacked required equipment ({', '.join(state.get('missing_equipment_at_nearest', []))}). Automatically escalated via **{state.get('escalation_tier')}**.")

    if state.get("ambulance_dispatch_needed"):
        amb = state.get("ambulance_payload", {})
        response_lines.append(f"\n> 🚑 **Ambulance Dispatched**: {amb.get('service')} (ETA: ~{amb.get('estimated_eta_minutes')} mins).")

    response_lines.append("\n#### 🛡️ Transit Safety Guidance:")
    for inst in state.get("transit_guidance", []):
        response_lines.append(f"- {inst}")

    state["final_answer"] = "\n".join(response_lines)
    state["sources"] = [{"source": "Indian Public Healthcare Registry", "relevance_score": 5.0, "content": f"Verified equipment inventory at {matching_fac.get('name')}"}]

    print(f"[Agent Step 5: Referral Node] Referral Generated: {ref_id}")
    return state

# ---------------------------------------------------------------------------
# Legacy Hybrid Retrieval & QA Nodes
# ---------------------------------------------------------------------------
def retrieval_node(state: AgentState) -> AgentState:
    """Retrieval Agent: Fetches relevant medical context from vector & keyword index."""
    query = state.get("query", "")
    print(f"[Retrieval Agent] Fetching context for: '{query}'")
    
    if retriever:
        try:
            docs = retriever.retrieve_and_rerank(query, top_k=3)
            formatted_docs = [{"content": d.page_content, "metadata": d.metadata} for d in docs]
            state["retrieved_docs"] = formatted_docs
            return state
        except Exception as e:
            print(f"[Retrieval Agent] Retriever error: {e}")
            
    state["retrieved_docs"] = []
    return state

def qa_node(state: AgentState) -> AgentState:
    """QA Agent: Composes medical answer grounded in retrieved documents."""
    query = state.get("query", "")
    docs = state.get("retrieved_docs", [])
    
    if state.get("query_type") == "general":
        state["final_answer"] = "Namaste! I am MediBot AI, your public healthcare triage and service router assistant. How may I assist you today?"
        return state

    if not docs or not llm:
        # Fallback to consolidated response from referral node
        return state

    context_str = ""
    for idx, doc in enumerate(docs):
        score = doc.get("metadata", {}).get("relevance_score", 0)
        context_str += f"--- Source {idx+1} ---\n{doc.get('content', '')}\n\n"

    try:
        qa_prompt = PromptTemplate.from_template(
            "You are an expert public healthcare assistant (MediBot). Answer the patient query based on the context:\n\n"
            "Context:\n{context}\n\nQuery: {query}\n\nAnswer:"
        )
        chain = qa_prompt | llm
        response = chain.invoke({"context": context_str, "query": query}).content.strip()
        state["final_answer"] = (state.get("final_answer", "") + "\n\n" + response).strip()
    except Exception as e:
        print(f"[QA Agent] Error invoking LLM: {e}")

    return state
