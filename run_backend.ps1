# This script starts the AI Backend
Write-Host "Starting MediBot AI Backend..." -ForegroundColor Cyan

cd backend

# Ensure required package is installed (since we just swapped to Groq)
Write-Host "Checking dependencies..."
.\venv\Scripts\activate
pip install langchain-groq -q

# Run the backend
Write-Host "Starting FastAPI Server on http://localhost:8000" -ForegroundColor Green
$env:PYTHONPATH = ".."
python main.py