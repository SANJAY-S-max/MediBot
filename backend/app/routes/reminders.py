from typing import List
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, MedicationReminder, AuditLog
from app.schemas import MedicationReminderCreate, MedicationReminderResponse
from app.auth import require_patient, get_current_user
from app.utils.notifications import send_email_notification, send_sms_notification

router = APIRouter(prefix="/reminders", tags=["Medication Reminders"])

@router.post("", response_model=MedicationReminderResponse, status_code=status.HTTP_201_CREATED)
def create_reminder(
    payload: MedicationReminderCreate,
    current_user: User = Depends(require_patient),
    db: Session = Depends(get_db)
):
    """
    Patient adds a new scheduled medication.
    """
    db_reminder = MedicationReminder(
        patient_id=current_user.id,
        medicine_name=payload.medicine_name,
        dosage=payload.dosage,
        frequency=payload.frequency,
        email_reminder=payload.email_reminder,
        sms_reminder=payload.sms_reminder,
        push_notification=payload.push_notification,
        is_active=True,
    )
    db.add(db_reminder)
    db.commit()
    db.refresh(db_reminder)

    # Log action
    log = AuditLog(user_id=current_user.id, action=f"CREATE_REMINDER_#{db_reminder.id}")
    db.add(log)
    db.commit()

    return db_reminder

@router.get("", response_model=List[MedicationReminderResponse])
def get_reminders(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    List reminders. Patients view their own, admins see all.
    """
    if current_user.role == "patient":
        return db.query(MedicationReminder).filter(MedicationReminder.patient_id == current_user.id).all()
    elif current_user.role == "admin":
        return db.query(MedicationReminder).all()
    else:
        # Doctors don't see medication reminders unless specified, return empty
        return []

@router.put("/{reminder_id}", response_model=MedicationReminderResponse)
def update_reminder(
    reminder_id: int,
    payload: MedicationReminderCreate,  # Reuse create schema for full updates
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    reminder = db.query(MedicationReminder).filter(MedicationReminder.id == reminder_id).first()
    if not reminder:
        raise HTTPException(status_code=404, detail="Medication reminder not found")
        
    if current_user.role != "admin" and reminder.patient_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to edit this reminder")
        
    reminder.medicine_name = payload.medicine_name
    reminder.dosage = payload.dosage
    reminder.frequency = payload.frequency
    reminder.email_reminder = payload.email_reminder
    reminder.sms_reminder = payload.sms_reminder
    reminder.push_notification = payload.push_notification
    reminder.is_active = payload.is_active
    
    db.commit()
    db.refresh(reminder)
    
    return reminder

@router.delete("/{reminder_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_reminder(
    reminder_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    reminder = db.query(MedicationReminder).filter(MedicationReminder.id == reminder_id).first()
    if not reminder:
        raise HTTPException(status_code=404, detail="Reminder not found")
        
    if current_user.role != "admin" and reminder.patient_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this reminder")
        
    db.delete(reminder)
    db.commit()
    return None

@router.post("/trigger-sim", status_code=status.HTTP_200_OK)
def trigger_reminders_simulation(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Simulation endpoint to manually fire active medication alerts.
    Dispatches mock emails and SMS notifications.
    """
    reminders = db.query(MedicationReminder).filter(
        MedicationReminder.patient_id == current_user.id,
        MedicationReminder.is_active == True
    ).all()
    
    triggered_count = 0
    for reminder in reminders:
        # Construct message body
        msg = f"MediBot Reminder: It is time to take your {reminder.medicine_name} ({reminder.dosage}). Schedule: {reminder.frequency}."
        
        # 1. Send Email if toggled
        if reminder.email_reminder and current_user.email:
            send_email_notification(
                to_email=current_user.email,
                subject=f"MediBot Medication Alert: {reminder.medicine_name}",
                body=f"Hi {current_user.name},\n\nThis is an automated reminder to take your medication.\n\nMedicine Details:\n- Name: {reminder.medicine_name}\n- Dosage: {reminder.dosage}\n- Schedule: {reminder.frequency}\n\nStay healthy,\nThe MediBot Team"
            )
            
        # 2. Send SMS if toggled
        if reminder.sms_reminder and current_user.phone:
            send_sms_notification(
                to_phone=current_user.phone,
                body=msg
            )
            
        reminder.last_sent_at = datetime.utcnow()
        triggered_count += 1
        
    db.commit()
    
    # Audit Log
    log = AuditLog(user_id=current_user.id, action=f"SIMULATED_MEDICATION_REMINDERS_COUNT_{triggered_count}")
    db.add(log)
    db.commit()
    
    return {"message": f"Successfully simulated alerts. Reminders triggered: {triggered_count}"}
