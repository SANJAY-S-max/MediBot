from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

# --- Token Schemas ---
class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    name: str

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None

# --- User Schemas ---
class UserBase(BaseModel):
    email: EmailStr
    name: str
    phone: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    medical_history: Optional[str] = None
    role: Optional[str] = "patient"

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    medical_history: Optional[str] = None
    password: Optional[str] = None

class DoctorProfileBase(BaseModel):
    specialization: str
    license_number: str
    consultation_fee: float = 0.0
    availability_slots: Optional[List[str]] = []

class DoctorProfileCreate(DoctorProfileBase):
    pass

class DoctorProfileResponse(DoctorProfileBase):
    id: int
    user_id: int
    is_approved: bool

    class Config:
        from_attributes = True

class UserResponse(UserBase):
    id: int
    created_at: datetime
    doctor_profile: Optional[DoctorProfileResponse] = None

    class Config:
        from_attributes = True

class UserLogin(BaseModel):
    email: EmailStr
    password: str

# --- Assessment Schemas ---
class AssessmentCreate(BaseModel):
    symptoms: str
    conversation_history: Optional[List[Dict[str, str]]] = []
    source: Optional[str] = "web"
    language: Optional[str] = "en"  # en, hi, ta

class AssessmentUpdate(BaseModel):
    doctor_notes: Optional[str] = None
    is_approved_by_doctor: Optional[bool] = None

class AssessmentResponse(BaseModel):
    id: int
    patient_id: Optional[int] = None
    phone_number: Optional[str] = None
    symptoms: str
    conversation_history: Optional[List[Dict[str, Any]]] = None
    predicted_diseases: List[str]
    confidence_scores: Dict[str, float]
    severity_level: str
    risk_score: int
    recommendations: Optional[str] = None
    is_approved_by_doctor: bool
    doctor_notes: Optional[str] = None
    source: str
    created_at: datetime

    class Config:
        from_attributes = True

# --- Appointment Schemas ---
class AppointmentBase(BaseModel):
    doctor_id: int
    appointment_time: datetime

class AppointmentCreate(AppointmentBase):
    pass

class AppointmentUpdate(BaseModel):
    status: Optional[str] = None  # requested, accepted, rejected, rescheduled
    appointment_time: Optional[datetime] = None
    meeting_link: Optional[str] = None

class AppointmentResponse(BaseModel):
    id: int
    patient_id: int
    doctor_id: int
    appointment_time: datetime
    status: str
    meeting_link: Optional[str] = None
    created_at: datetime
    patient: Optional[UserBase] = None
    doctor: Optional[Any] = None  # We will resolve this in routes

    class Config:
        from_attributes = True

# --- Medication Reminder Schemas ---
class MedicationReminderBase(BaseModel):
    medicine_name: str
    dosage: str
    frequency: str
    email_reminder: bool = True
    sms_reminder: bool = False
    push_notification: bool = True
    is_active: bool = True

class MedicationReminderCreate(MedicationReminderBase):
    pass

class MedicationReminderResponse(MedicationReminderBase):
    id: int
    patient_id: int
    last_sent_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True

# --- Audit Log Schema ---
class AuditLogResponse(BaseModel):
    id: int
    user_id: Optional[int]
    action: str
    ip_address: Optional[str]
    timestamp: datetime

    class Config:
        from_attributes = True

# --- Dashboard Analytics Schemas ---
class AdminAnalytics(BaseModel):
    total_users: int
    total_patients: int
    total_doctors: int
    total_assessments: int
    disease_trends: Dict[str, int]
    most_common_symptoms: List[Dict[str, Any]]
