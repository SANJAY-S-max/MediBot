import logging
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
import io

from app.database import get_db
from app.models import User, Assessment, AuditLog
from app.schemas import AssessmentCreate, AssessmentResponse, AssessmentUpdate
from app.auth import get_current_user
from app.ai.gemini_client import gemini_client
from app.ai.rag_service import rag_service
from app.utils.pdf_generator import generate_report_pdf
from app.utils.notifications import send_email_notification

router = APIRouter(prefix="/assessments", tags=["Assessments"])
logger = logging.getLogger("uvicorn.error")

@router.post("/chat")
def chatbot_step(
    payload: AssessmentCreate,
    current_user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Core AI Chatbot endpoint. Runs a dialogue step.
    Combines RAG context, patient background, and chat history.
    """
    # 1. Gather patient metadata if user is logged in
    patient_info = {}
    if current_user:
        patient_info = {
            "age": current_user.age,
            "gender": current_user.gender,
            "medical_history": current_user.medical_history
        }

    # 2. Retrieve context from RAG vector database using reported symptoms
    rag_context = ""
    try:
        rag_context = rag_service.retrieve(payload.symptoms, k=2)
    except Exception as e:
        logger.error(f"Failed to query RAG: {str(e)}")

    # 3. Analyze symptoms using Gemini (or fallback mock engine)
    analysis = gemini_client.analyze_symptoms(
        symptoms=payload.symptoms,
        history=payload.conversation_history,
        patient_info=patient_info,
        rag_context=rag_context,
        language=payload.language
    )

    return analysis

@router.post("/save", response_model=AssessmentResponse)
def save_assessment(
    assessment_data: dict,  # Freeform JSON matching saved values
    current_user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Saves a completed symptom assessment report.
    """
    patient_id = current_user.id if current_user else None
    
    # Calculate a simplified health risk score based on severity if not provided
    severity = assessment_data.get("severity_level", "Low Risk")
    default_risk = 20
    if "medium" in severity.lower():
        default_risk = 50
    elif "high" in severity.lower():
        default_risk = 85
        
    db_assessment = Assessment(
        patient_id=patient_id,
        phone_number=assessment_data.get("phone_number"),
        symptoms=assessment_data.get("symptoms", "No symptoms described"),
        conversation_history=assessment_data.get("conversation_history"),
        predicted_diseases=assessment_data.get("predicted_diseases", []),
        confidence_scores=assessment_data.get("confidence_scores", {}),
        severity_level=severity,
        risk_score=assessment_data.get("risk_score", default_risk),
        recommendations=assessment_data.get("recommendations", ""),
        source=assessment_data.get("source", "web"),
        is_approved_by_doctor=False,
    )
    
    db.add(db_assessment)
    db.commit()
    db.refresh(db_assessment)

    # Log action
    if patient_id:
        log = AuditLog(user_id=patient_id, action=f"SAVE_ASSESSMENT_#{db_assessment.id}")
        db.add(log)
        db.commit()

    return db_assessment

@router.get("", response_model=List[AssessmentResponse])
def get_assessments(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    List assessments. Patients see their own, doctors/admins see all.
    """
    if current_user.role == "patient":
        return db.query(Assessment).filter(Assessment.patient_id == current_user.id).order_by(Assessment.created_at.desc()).all()
    else:
        # Doctors & Admins see everything
        return db.query(Assessment).order_by(Assessment.created_at.desc()).all()

@router.get("/{assessment_id}", response_model=AssessmentResponse)
def get_assessment_detail(
    assessment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    assessment = db.query(Assessment).filter(Assessment.id == assessment_id).first()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")
        
    # Check permissions
    if current_user.role == "patient" and assessment.patient_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view this report")
        
    return assessment

@router.get("/{assessment_id}/pdf")
def get_assessment_pdf(
    assessment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Generates and downloads the clinical summary PDF report.
    """
    assessment = db.query(Assessment).filter(Assessment.id == assessment_id).first()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")
        
    # Check permissions
    if current_user.role == "patient" and assessment.patient_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view this report")
        
    # Gather patient profile info
    patient_name = "Guest User"
    patient_age = None
    patient_gender = None
    patient_history = ""
    
    if assessment.patient_id:
        patient = db.query(User).filter(User.id == assessment.patient_id).first()
        if patient:
            patient_name = patient.name
            patient_age = patient.age
            patient_gender = patient.gender
            patient_history = patient.medical_history

    # Generate PDF bytes
    pdf_bytes = generate_report_pdf(
        assessment=assessment,
        patient_name=patient_name,
        patient_age=patient_age,
        patient_gender=patient_gender,
        patient_history=patient_history
    )
    
    # Audit log
    log = AuditLog(user_id=current_user.id, action=f"DOWNLOAD_PDF_#{assessment.id}")
    db.add(log)
    db.commit()
    
    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=medibot_report_{assessment_id}.pdf"}
    )

@router.post("/{assessment_id}/email")
def email_assessment_pdf(
    assessment_id: int,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Generates PDF and sends it as an attachment to the user's registered email address.
    """
    assessment = db.query(Assessment).filter(Assessment.id == assessment_id).first()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")
        
    # Check permissions
    if current_user.role == "patient" and assessment.patient_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view this report")
        
    # Gather patient profile info
    patient_name = current_user.name
    patient_age = current_user.age
    patient_gender = current_user.gender
    patient_history = current_user.medical_history

    # Generate PDF bytes
    pdf_bytes = generate_report_pdf(
        assessment=assessment,
        patient_name=patient_name,
        patient_age=patient_age,
        patient_gender=patient_gender,
        patient_history=patient_history
    )

    email_body = f"""Hello {current_user.name},

Please find attached your clinical summary report generated by MediBot on {datetime.now().strftime('%Y-%m-%d')}.

Report Details:
- Primary Symptoms: {assessment.symptoms[:150]}...
- Risk Assessment: {assessment.severity_level} (Score: {assessment.risk_score}/100)
- Top Predicted Conditions: {', '.join(assessment.predicted_diseases[:3])}

IMPORTANT DISCLAIMER:
This system provides preliminary health guidance only and is NOT a substitute for professional medical diagnosis.

Stay healthy,
The MediBot Team
"""
    
    # Send email in background task to avoid blocking API thread
    background_tasks.add_task(
        send_email_notification,
        to_email=current_user.email,
        subject=f"MediBot Health Assessment Report [#{assessment_id}]",
        body=email_body,
        attachment=pdf_bytes,
        attachment_name=f"medibot_report_{assessment_id}.pdf"
    )

    # Audit log
    log = AuditLog(user_id=current_user.id, action=f"EMAIL_PDF_#{assessment.id}")
    db.add(log)
    db.commit()

    return {"message": "Email request queued successfully. The report will arrive shortly."}

from datetime import datetime
from typing import Any
