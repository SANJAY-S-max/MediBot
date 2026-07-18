from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, DoctorProfile, Assessment, AuditLog
from app.schemas import AssessmentResponse, AssessmentUpdate
from app.auth import require_doctor, get_current_user

router = APIRouter(prefix="/doctors", tags=["Doctors & Clinical Feedback"])

@router.get("", response_model=List[dict])
def list_doctors(db: Session = Depends(get_db)):
    """
    Publicly lists all approved doctors along with their specializations.
    """
    profiles = db.query(DoctorProfile).filter(DoctorProfile.is_approved == True).all()
    results = []
    for p in profiles:
        user = db.query(User).filter(User.id == p.user_id).first()
        if user:
            results.append({
                "id": p.id,
                "name": user.name,
                "email": user.email,
                "phone": user.phone,
                "specialization": p.specialization,
                "consultation_fee": p.consultation_fee,
                "availability_slots": p.availability_slots
            })
    return results

@router.put("/feedback/{assessment_id}", response_model=AssessmentResponse)
def submit_clinical_feedback(
    assessment_id: int,
    payload: AssessmentUpdate,
    current_user: User = Depends(require_doctor),
    db: Session = Depends(get_db)
):
    """
    Doctor reviews a patient assessment, inserts doctor notes, and signs off.
    """
    assessment = db.query(Assessment).filter(Assessment.id == assessment_id).first()
    if not assessment:
        raise HTTPException(status_code=404, detail="Symptom assessment not found")

    if payload.doctor_notes is not None:
        assessment.doctor_notes = payload.doctor_notes
        
    if payload.is_approved_by_doctor is not None:
        assessment.is_approved_by_doctor = payload.is_approved_by_doctor

    db.commit()
    db.refresh(assessment)

    # Log action
    log = AuditLog(
        user_id=current_user.id,
        action=f"SUBMIT_FEEDBACK_ASSESSMENT_{assessment.id}_APPROVED_{assessment.is_approved_by_doctor}"
    )
    db.add(log)
    db.commit()

    return assessment
