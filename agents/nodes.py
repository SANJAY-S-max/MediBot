from langchain_groq import ChatGroq
from langchain.prompts import PromptTemplate
from agents.state import AgentState
from retrieval.hybrid_search import get_hybrid_retriever
import os

# Initialize Groq LLM (requires GROQ_API_KEY environment variable)
# Using llama3-70b-8192 which is excellent for complex medical reasoning
llm = ChatGroq(model="llama3-70b-8192", temperature=0)
retriever = get_hybrid_retriever()

def triage_node(state: AgentState) -> AgentState:
    """
    Triage Agent: Analyzes the query to determine its nature (medical, emergency, or general).
    """
    query = state["query"]
    print(f"[Triage Agent] Analyzing query: '{query}'")
    
    triage_prompt = PromptTemplate.from_template(
        "You are a medical triage assistant. Analyze the user's query and categorize it into exactly ONE of these types:\n"
        "1. 'emergency' (if the query indicates a life-threatening situation, severe pain, or urgent need for a doctor/ambulance)\n"
        "2. 'medical' (if the query is asking for health information, symptoms, treatments, or medical knowledge)\n"
        "3. 'general' (if the query is a simple greeting, off-topic, or non-medical)\n\n"
        "Respond with only the single word category name in lowercase.\n\n"
        "Query: {query}"
    )
    
    chain = triage_prompt | llm
    response = chain.invoke({"query": query}).content.strip().lower()
    
    state["query_type"] = response
    state["is_emergency"] = response == "emergency"
    
    print(f"[Triage Agent] Classified as: {response}")
    
    # If it's an emergency, we don't need to retrieve documents, we handle it immediately
    if state["is_emergency"]:
        state["final_answer"] = "🚨 **MEDICAL EMERGENCY DETECTED** 🚨\nPlease call your local emergency services (like 911) immediately or go to the nearest emergency room. I am an AI and cannot provide emergency medical assistance."
        
    return state

def retrieval_node(state: AgentState) -> AgentState:
    """
    Retrieval Agent: Fetches relevant documents from the Hybrid Retriever.
    """
    query = state["query"]
    print("[Retrieval Agent] Fetching relevant medical context...")
    
    # Fetch top 3 documents using our hybrid search + reranking
    docs = retriever.retrieve_and_rerank(query, top_k=3)
    
    # Convert Document objects to dicts for the state
    formatted_docs = []
    for d in docs:
        formatted_docs.append({
            "content": d.page_content,
            "metadata": d.metadata
        })
        
    state["retrieved_docs"] = formatted_docs
    print(f"[Retrieval Agent] Retrieved {len(formatted_docs)} relevant chunks.")
    
    return state

def qa_node(state: AgentState) -> AgentState:
    """
    QA Agent: Generates a medically accurate response based ONLY on the retrieved documents.
    """
    query = state["query"]
    docs = state.get("retrieved_docs", [])
    
    if state.get("query_type") == "general":
        print("[QA Agent] Handling general query...")
        state["final_answer"] = "I am MediBot, an AI-powered healthcare assistant. How can I help you with medical information today?"
        return state
        
    print("[QA Agent] Generating medical response...")
    
    if not docs:
        state["final_answer"] = "I'm sorry, I couldn't find any relevant medical information in my knowledge base to answer your question. Please consult a healthcare professional."
        return state
        
    context_str = ""
    for idx, doc in enumerate(docs):
        score = doc['metadata'].get('relevance_score', 0)
        context_str += f"--- Source {idx+1} (Relevance: {score:.2f}) ---\n{doc['content']}\n\n"
        
    qa_prompt = PromptTemplate.from_template(
        "You are an expert medical AI assistant (MediBot). Your task is to answer the user's question based strictly on the provided medical context.\n\n"
        "Rules:\n"
        "1. Do not use outside knowledge. If the context does not contain the answer, say 'I do not have enough information to answer this.'\n"
        "2. Do not prescribe medication or provide definitive diagnoses.\n"
        "3. Always include a disclaimer at the end stating 'Disclaimer: This information is for educational purposes and is not a substitute for professional medical advice.'\n"
        "4. Be compassionate and professional.\n\n"
        "Context:\n{context}\n\n"
        "User Question: {query}\n\n"
        "Answer:"
    )
    
    chain = qa_prompt | llm
    response = chain.invoke({"context": context_str, "query": query}).content.strip()
    
    # Extract sources for Explainability
    sources_list = []
    sources_text = "\n\n**Sources used:**\n"
    for idx, doc in enumerate(docs):
        source_name = doc['metadata'].get('source', 'Unknown File').split('\\')[-1]
        score = doc['metadata'].get('relevance_score', 0)
        
        sources_list.append({
            "source": source_name,
            "relevance_score": score,
            "content": doc['content']
        })
        sources_text += f"- {source_name} (Confidence: {score:.2f})\n"
        
    state["final_answer"] = response + sources_text
    state["sources"] = sources_list
    
    return state
