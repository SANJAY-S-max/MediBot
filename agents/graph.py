from langgraph.graph import StateGraph, END
from langgraph.checkpoint.sqlite import SqliteSaver
from agents.state import AgentState
from agents.nodes import triage_node, retrieval_node, qa_node
import sqlite3
import os

# Create Memory Database Path
DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "memory", "checkpoints.sqlite")

def route_triage(state: AgentState):
    """
    Routing logic after the Triage node.
    """
    if state["is_emergency"]:
        return "end"
    elif state["query_type"] == "general":
        return "qa_node"
    else:
        return "retrieval_node"

# 1. Initialize StateGraph
graph_builder = StateGraph(AgentState)

# 2. Add Nodes
graph_builder.add_node("triage_node", triage_node)
graph_builder.add_node("retrieval_node", retrieval_node)
graph_builder.add_node("qa_node", qa_node)

# 3. Define Edges
# The graph always starts at the Triage Agent
graph_builder.set_entry_point("triage_node")

# From Triage, route dynamically
graph_builder.add_conditional_edges(
    "triage_node",
    route_triage,
    {
        "end": END,
        "qa_node": "qa_node",
        "retrieval_node": "retrieval_node"
    }
)

# After Retrieval, always go to QA
graph_builder.add_edge("retrieval_node", "qa_node")

# After QA, end the flow
graph_builder.add_edge("qa_node", END)

# 4. Initialize Memory Saver (SQLite)
# This enables long-term conversation memory and human-in-the-loop capabilities
conn = sqlite3.connect(DB_PATH, check_same_thread=False)
memory_saver = SqliteSaver(conn)

# 5. Compile the Graph
medibot_graph = graph_builder.compile(checkpointer=memory_saver)

def run_medibot(query: str, thread_id: str = "default_user_1"):
    """
    Entry point to run the LangGraph workflow.
    """
    config = {"configurable": {"thread_id": thread_id}}
    
    # Run the graph
    result = medibot_graph.invoke({"query": query}, config=config)
    
    return {
        "final_answer": result.get("final_answer", ""),
        "sources": result.get("sources", [])
    }

if __name__ == "__main__":
    # Test the workflow
    print("\n--- Test 1: Medical Query ---")
    print(run_medibot("What happens when blood sugar goes up?"))
    
    print("\n--- Test 2: Emergency Query ---")
    print(run_medibot("I am having severe chest pain right now!"))
    
    print("\n--- Test 3: General Query ---")
    print(run_medibot("Hello, who are you?"))
