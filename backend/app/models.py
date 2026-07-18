from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, Float, Text, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="patient", nullable=False)  # patient, doctor, admin
    phone = Column(String, nullable=True)
    age = Column(Integer, nullable=True)
    gender = Column(String, nullable=True)
    medical_history = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    doctor_profile = relationship("DoctorProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    assessments = relationship("Assessment", foreign_keys="Assessment.patient_id", back_populates="patient")
    appointments_as_patient = relationship("Appointment", foreign_keys="Appointment.patient_id", back_populates="patient")
    reminders = relationship("MedicationReminder", back_populates="patient", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="user")

class DoctorProfile(Base):
    __tablename__ = "doctor_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True)
    specialization = Column(String, nullable=False)
    license_number = Column(String, nullable=False)
    is_approved = Column(Boolean, default=False)
    consultation_fee = Column(Float, default=0.0)
    availability_slots = Column(JSON, nullable=True)  # Store slot timings list

    # Relationships
    user = relationship("User", back_populates="doctor_profile")
    appointments = relationship("Appointment", foreign_keys="Appointment.doctor_id", back_populates="doctor")

class Assessment(Base):
    __tablename__ = "assessments"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    phone_number = Column(String, nullable=True)  # For IVR callers who are not logged in
    symptoms = Column(Text, nullable=False)
    conversation_history = Column(JSON, nullable=True)  # List of chat messages
    predicted_diseases = Column(JSON, nullable=False)  # JSON array of diseases
    confidence_scores = Column(JSON, nullable=False)  # JSON array or dict of scores
    severity_level = Column(String, nullable=False)  # Low Risk, Medium Risk, High Risk
    risk_score = Column(Integer, default=0)  # Health risk score out of 100
    recommendations = Column(Text, nullable=True)
    is_approved_by_doctor = Column(Boolean, default=False)
    doctor_notes = Column(Text, nullable=True)
    source = Column(String, default="web")  # web, ivr
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    patient = relationship("User", foreign_keys=[patient_id], back_populates="assessments")

class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    doctor_id = Column(Integer, ForeignKey("doctor_profiles.id", ondelete="CASCADE"), nullable=False)
    appointment_time = Column(DateTime, nullable=False)
    status = Column(String, default="requested")  # requested, accepted, rejected, rescheduled
    meeting_link = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    patient = relationship("User", foreign_keys=[patient_id], back_populates="appointments_as_patient")
    doctor = relationship("DoctorProfile", foreign_keys=[doctor_id], back_populates="appointments")

class MedicationReminder(Base):
    __tablename__ = "medication_reminders"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    medicine_name = Column(String, nullable=False)
    dosage = Column(String, nullable=False)
    frequency = Column(String, nullable=False)  # e.g., "Once daily", "Twice daily"
    email_reminder = Column(Boolean, default=True)
    sms_reminder = Column(Boolean, default=False)
    push_notification = Column(Boolean, default=True)
    last_sent_at = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    patient = relationship("User", back_populates="reminders")

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    action = Column(String, nullable=False)  # e.g., "LOGIN", "VIEW_REPORT", "DELETE_USER"
    ip_address = Column(String, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="audit_logs")
