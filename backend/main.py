from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from dotenv import load_dotenv
load_dotenv()

from pydantic import BaseModel
import sys
import os

# Ensure the root project directory is in the path so we can import agents
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from agents.graph import run_medibot

app = FastAPI(
    title="MediBot Backend API",
    description="FastAPI backend for the MediBot RAG Healthcare Platform",
    version="1.0.0"
)

# Allow CORS for the Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    query: str
    thread_id: str = "default_user_1"

@app.get("/")
def read_root():
    return {"status": "ok", "message": "MediBot API is running"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}

@app.post("/api/chat")
async def chat_endpoint(request: ChatRequest):
    try:
        # Run the LangGraph orchestration
        result = run_medibot(request.query, request.thread_id)
        
        # result is now a dictionary containing final_answer and sources
        if isinstance(result, dict):
            final_answer = result.get("final_answer", "")
            sources = result.get("sources", [])
        else:
            # Fallback if result is just a string (old behavior)
            final_answer = result
            sources = []
            
        return {
            "response": final_answer,
            "sources": sources,
            "status": "success"
        }
    except Exception as e:
        return {"response": f"An error occurred: {str(e)}", "status": "error"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
