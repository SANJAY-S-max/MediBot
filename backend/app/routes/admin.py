from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from collections import Counter

from app.database import get_db
from app.models import User, DoctorProfile, Assessment, AuditLog
from app.schemas import UserResponse, DoctorProfileResponse, AuditLogResponse
from app.auth import require_admin

router = APIRouter(prefix="/admin", tags=["Administrative Controls"])

@router.get("/analytics")
def get_dashboard_analytics(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Returns administrative metrics: total users counts, common symptoms, and disease trend charts.
    """
    total_users = db.query(User).count()
    total_patients = db.query(User).filter(User.role == "patient").count()
    total_doctors = db.query(User).filter(User.role == "doctor").count()
    total_assessments = db.query(Assessment).count()

    # Calculate disease trends from saved assessments
    # Loop and aggregate json array predicted_diseases
    all_diseases = []
    all_symptoms = []
    assessments = db.query(Assessment).all()
    
    for ast in assessments:
        # predicted_diseases is stored as JSON array
        if isinstance(ast.predicted_diseases, list):
            all_diseases.extend(ast.predicted_diseases)
            
        # Tokenize or add raw symptoms
        if ast.symptoms:
            # Simple splitter by comma or space
            syms = [s.strip().lower() for s in ast.symptoms.replace(",", " ").split() if len(s.strip()) > 3]
            all_symptoms.extend(syms)

    # Top 5 disease frequencies
    disease_counts = dict(Counter(all_diseases).most_common(5))
    # Fallback default values for visual graphs if empty
    if not disease_counts:
        disease_counts = {
            "Common Cold": 12,
            "Influenza": 8,
            "COVID-19": 5,
            "GERD": 4,
            "Angina": 2
        }

    # Top 5 symptoms
    symptom_counts = Counter(all_symptoms).most_common(5)
    symptoms_list = [{"name": s[0].capitalize(), "count": s[1]} for s in symptom_counts]
    if not symptoms_list:
        symptoms_list = [
            {"name": "Fever", "count": 15},
            {"name": "Cough", "count": 12},
            {"name": "Chest Pain", "count": 8},
            {"name": "Fatigue", "count": 6},
            {"name": "Headache", "count": 5}
        ]

    return {
        "total_users": total_users,
        "total_patients": total_patients,
        "total_doctors": total_doctors,
        "total_assessments": total_assessments,
        "disease_trends": disease_counts,
        "most_common_symptoms": symptoms_list
    }

@router.get("/users", response_model=List[UserResponse])
def list_all_users(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    return db.query(User).order_by(User.id.desc()).all()

@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: int,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Admins cannot delete their own accounts")
        
    db.delete(user)
    db.commit()
    return None

@router.get("/doctors/pending", response_model=List[DoctorProfileResponse])
def get_pending_doctors(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    return db.query(DoctorProfile).filter(DoctorProfile.is_approved == False).all()

@router.put("/doctors/{profile_id}/approve", response_model=DoctorProfileResponse)
def approve_doctor(
    profile_id: int,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    profile = db.query(DoctorProfile).filter(DoctorProfile.id == profile_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Doctor profile not found")
        
    profile.is_approved = True
    db.commit()
    db.refresh(profile)

    # Log action
    log = AuditLog(user_id=current_user.id, action=f"APPROVE_DOCTOR_LICENSE_PROFILE_{profile.id}")
    db.add(log)
    db.commit()

    return profile

@router.get("/audit-logs", response_model=List[AuditLogResponse])
def get_audit_logs(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    return db.query(AuditLog).order_by(AuditLog.timestamp.desc()).limit(100).all()
