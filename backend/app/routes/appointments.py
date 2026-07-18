import random
import string
from typing import List
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, Appointment, DoctorProfile, AuditLog
from app.schemas import AppointmentCreate, AppointmentResponse, AppointmentUpdate
from app.auth import get_current_user, require_patient, require_doctor

router = APIRouter(prefix="/appointments", tags=["Appointments"])

def generate_random_meeting_id(length: int = 12) -> str:
    letters = string.ascii_letters + string.digits
    return ''.join(random.choice(letters) for _ in range(length))

@router.post("", response_model=AppointmentResponse, status_code=status.HTTP_201_CREATED)
def request_appointment(
    payload: AppointmentCreate,
    current_user: User = Depends(require_patient),
    db: Session = Depends(get_db)
):
    """
    Patient schedules a new consultation with a doctor.
    """
    # Verify doctor profile exists
    doctor = db.query(DoctorProfile).filter(DoctorProfile.id == payload.doctor_id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor profile not found")
        
    if not doctor.is_approved:
        raise HTTPException(status_code=400, detail="Doctor is not active for consultations")

    db_appointment = Appointment(
        patient_id=current_user.id,
        doctor_id=payload.doctor_id,
        appointment_time=payload.appointment_time,
        status="requested",
    )
    
    db.add(db_appointment)
    db.commit()
    db.refresh(db_appointment)

    # Log action
    log = AuditLog(user_id=current_user.id, action=f"REQUEST_APPOINTMENT_#{db_appointment.id}")
    db.add(log)
    db.commit()

    return db_appointment

@router.get("", response_model=List[AppointmentResponse])
def list_appointments(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieves appointments based on roles.
    - Patients see their bookings.
    - Doctors see their consultations.
    - Admins see everything.
    """
    if current_user.role == "patient":
        appointments = db.query(Appointment).filter(Appointment.patient_id == current_user.id).order_by(Appointment.appointment_time.asc()).all()
    elif current_user.role == "doctor":
        # Get doctor profile
        profile = db.query(DoctorProfile).filter(DoctorProfile.user_id == current_user.id).first()
        if not profile:
            return []
        appointments = db.query(Appointment).filter(Appointment.doctor_id == profile.id).order_by(Appointment.appointment_time.asc()).all()
    else:  # Admin
        appointments = db.query(Appointment).order_by(Appointment.appointment_time.asc()).all()

    # Dynamic loading of users for clean responses
    results = []
    for appt in appointments:
        res = AppointmentResponse.from_attributes(appt)
        # Load patient user info
        pat = db.query(User).filter(User.id == appt.patient_id).first()
        if pat:
            res.patient = pat
            
        # Load doctor user info
        doc_profile = db.query(DoctorProfile).filter(DoctorProfile.id == appt.doctor_id).first()
        if doc_profile:
            doc_user = db.query(User).filter(User.id == doc_profile.user_id).first()
            if doc_user:
                res.doctor = {
                    "id": doc_profile.id,
                    "name": doc_user.name,
                    "specialization": doc_profile.specialization,
                    "consultation_fee": doc_profile.consultation_fee
                }
        results.append(res)
        
    return results

@router.put("/{appointment_id}", response_model=AppointmentResponse)
def update_appointment_status(
    appointment_id: int,
    payload: AppointmentUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Accepts, rejects, or updates scheduling details.
    When a doctor accepts, a functional Jitsi Meet web call link is spawned.
    """
    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")

    # Access control: only the assigned doctor or an admin can update it
    is_authorized = False
    if current_user.role == "admin":
        is_authorized = True
    elif current_user.role == "doctor":
        profile = db.query(DoctorProfile).filter(DoctorProfile.user_id == current_user.id).first()
        if profile and appointment.doctor_id == profile.id:
            is_authorized = True

    if not is_authorized:
        raise HTTPException(status_code=403, detail="Not authorized to edit this appointment")

    if payload.status:
        appointment.status = payload.status
        # Generate Jitsi Meet link upon acceptance
        if payload.status == "accepted" and not appointment.meeting_link:
            meeting_hash = generate_random_meeting_id()
            appointment.meeting_link = f"https://meet.jit.si/MediBot_Consultation_{appointment.id}_{meeting_hash}"
            
    if payload.appointment_time:
        appointment.appointment_time = payload.appointment_time
        
    if payload.meeting_link:
        appointment.meeting_link = payload.meeting_link

    db.commit()
    db.refresh(appointment)

    # Log action
    log = AuditLog(
        user_id=current_user.id,
        action=f"UPDATE_APPOINTMENT_{appointment.id}_STATUS_TO_{appointment.status.upper()}"
    )
    db.add(log)
    db.commit()

    return appointment
