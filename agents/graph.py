import os
import sys
from typing import Dict, Any, Optional

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.append(BASE_DIR)

from langgraph.graph import StateGraph, END
from agents.state import AgentState
from agents.nodes import (
    triage_node,
    facility_matcher_node,
    ambulance_dispatch_node,
    travel_guidance_node,
    referral_qr_node,
    retrieval_node,
    qa_node
)

# ---------------------------------------------------------------------------
# Construct the StateGraph Pipeline
# ---------------------------------------------------------------------------
graph_builder = StateGraph(AgentState)

# 1. Add all 5 Public Healthcare & QA Nodes
graph_builder.add_node("triage_node", triage_node)                        # Step 1: Clinical Triage
graph_builder.add_node("facility_matcher_node", facility_matcher_node)    # Step 2: Facility & Equipment Matcher
graph_builder.add_node("ambulance_dispatch_node", ambulance_dispatch_node)# Step 3: Vehicle & Ambulance Check
graph_builder.add_node("travel_guidance_node", travel_guidance_node)      # Step 4: Precautionary Travel Guidance
graph_builder.add_node("referral_qr_node", referral_qr_node)              # Step 5: Scannable Digital Referral Slip
graph_builder.add_node("retrieval_node", retrieval_node)                  # RAG Hybrid Retrieval
graph_builder.add_node("qa_node", qa_node)                                # Grounded QA

# 2. Define Sequential Flow
graph_builder.set_entry_point("triage_node")

# Step 1 ➔ Step 2
graph_builder.add_edge("triage_node", "facility_matcher_node")

# Step 2 ➔ Step 3
graph_builder.add_edge("facility_matcher_node", "ambulance_dispatch_node")

# Step 3 ➔ Step 4
graph_builder.add_edge("ambulance_dispatch_node", "travel_guidance_node")

# Step 4 ➔ Step 5
graph_builder.add_edge("travel_guidance_node", "referral_qr_node")

# Routing after Referral Node
def route_after_referral(state: AgentState):
    """If medical inquiry with retrieved knowledge needed, proceed to RAG QA, otherwise END."""
    if state.get("query_type") == "medical" and not state.get("is_emergency"):
        return "retrieval_node"
    return "end"

graph_builder.add_conditional_edges(
    "referral_qr_node",
    route_after_referral,
    {
        "retrieval_node": "retrieval_node",
        "end": END
    }
)

graph_builder.add_edge("retrieval_node", "qa_node")
graph_builder.add_edge("qa_node", END)

# 3. Compile the Graph
medibot_graph = graph_builder.compile()

def run_medibot(
    query: str,
    thread_id: str = "default_user_1",
    patient_latitude: Optional[float] = None,
    patient_longitude: Optional[float] = None,
    patient_vitals: Optional[Dict[str, Any]] = None,
    symptoms: Optional[list] = None,
    has_personal_transport: bool = True
) -> Dict[str, Any]:
    """
    Unified Entrypoint for MediBot Multi-Agent Healthcare Orchestrator.
    Executes the full 5-step public healthcare workflow.
    """
    initial_state: AgentState = {
        "query": query,
        "thread_id": thread_id,
        "patient_latitude": patient_latitude,
        "patient_longitude": patient_longitude,
        "patient_vitals": patient_vitals or {},
        "symptoms": symptoms or [],
        "has_personal_transport": has_personal_transport,
        "query_type": None,
        "is_emergency": False,
        "triage_priority": None,
        "triage_reason": None,
        "vital_warnings": [],
        "required_equipment": [],
        "nearest_facility": None,
        "matching_facility": None,
        "was_escalated": False,
        "escalation_tier": None,
        "bypassed_facilities": [],
        "missing_equipment_at_nearest": [],
        "estimated_travel_time_minutes": 0.0,
        "ambulance_dispatch_needed": False,
        "ambulance_payload": None,
        "transit_guidance": [],
        "transit_checklist": [],
        "referral_slip": None,
        "referral_qr_code": None,
        "retrieved_docs": [],
        "final_answer": "",
        "sources": []
    }

    result = medibot_graph.invoke(initial_state)

    return {
        "final_answer": result.get("final_answer", ""),
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
        "sources": result.get("sources", [])
    }

if __name__ == "__main__":
    print("\n--- Test Multi-Agent Pipeline: Critical Respiratory Patient ---")
    resp = run_medibot(
        query="Severe breathing difficulty and cyanosis",
        patient_latitude=12.7236,
        patient_longitude=80.1872,
        patient_vitals={"spo2": 82.0, "respiratory_rate": 35},
        symptoms=["Severe Shortness of Breath / Asthma"],
        has_personal_transport=False
    )
    print("Priority:", resp["triage_priority"])
    print("Assigned Facility:", resp["matching_facility"]["name"] if resp["matching_facility"] else "None")
    print("Was Escalated:", resp["was_escalated"])
    print("Ambulance Dispatched:", resp["ambulance_dispatch_needed"])
    print("Referral ID:", resp["referral_slip"]["referral_id"] if resp["referral_slip"] else "None")
