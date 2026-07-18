import sys
import os
from datetime import datetime, timedelta

# Add parent directory to sys.path so we can import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import engine, Base, SessionLocal
from app.models import User, DoctorProfile, Assessment, Appointment, MedicationReminder, AuditLog
from app.auth import get_password_hash

def seed_db():
    print("Starting database seeding...")
    # Re-create tables
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    try:
        # 1. Create Admin
        admin = User(
            email="admin@medibot.com",
            name="System Administrator",
            hashed_password=get_password_hash("admin123"),
            role="admin",
            phone="+111222333",
            age=40,
            gender="Other",
            medical_history="None"
        )
        db.add(admin)
        print("Seeded Admin: admin@medibot.com / admin123")
        
        # 2. Create Patients
        patient1 = User(
            email="patient@medibot.com",
            name="Jane Doe",
            hashed_password=get_password_hash("patient123"),
            role="patient",
            phone="+919876543210",
            age=34,
            gender="Female",
            medical_history="Mild asthma, seasonal allergies"
        )
        patient2 = User(
            email="john@medibot.com",
            name="John Smith",
            hashed_password=get_password_hash("patient123"),
            role="patient",
            phone="+919876543211",
            age=52,
            gender="Male",
            medical_history="Type 2 Diabetes, Hypertension controlled with Metformin and Lisinopril"
        )
        db.add(patient1)
        db.add(patient2)
        print("Seeded Patients: patient@medibot.com & john@medibot.com / patient123")

        # 3. Create Doctors (Users + Profiles)
        doc1_user = User(
            email="doctor@medibot.com",
            name="Dr. Alice Carter",
            hashed_password=get_password_hash("doctor123"),
            role="doctor",
            phone="+919876543220",
            age=45,
            gender="Female",
            medical_history="None"
        )
        db.add(doc1_user)
        db.commit() # Commit to get ID
        
        doc1_profile = DoctorProfile(
            user_id=doc1_user.id,
            specialization="Cardiology",
            license_number="LIC-CARD-9912",
            consultation_fee=150.0,
            availability_slots=["09:00 AM", "11:00 AM", "02:00 PM", "04:00 PM"],
            is_approved=True
        )
        db.add(doc1_profile)
        
        doc2_user = User(
            email="bob@medibot.com",
            name="Dr. Bob Mehta",
            hashed_password=get_password_hash("doctor123"),
            role="doctor",
            phone="+919876543221",
            age=39,
            gender="Male",
            medical_history="None"
        )
        db.add(doc2_user)
        db.commit() # Commit to get ID
        
        doc2_profile = DoctorProfile(
            user_id=doc2_user.id,
            specialization="General Medicine",
            license_number="LIC-GEN-8831",
            consultation_fee=80.0,
            availability_slots=["10:00 AM", "12:00 PM", "03:00 PM", "05:00 PM"],
            is_approved=False # Pending admin approval
        )
        db.add(doc2_profile)
        print("Seeded Doctors: doctor@medibot.com (Approved Cardiology) & bob@medibot.com (Pending General)")

        # Commit Users and Profiles
        db.commit()

        # 4. Create Medication Reminders for Jane Doe
        rem1 = MedicationReminder(
            patient_id=patient1.id,
            medicine_name="Albuterol Inhaler",
            dosage="2 puffs",
            frequency="As needed / Max every 4 hours",
            email_reminder=False,
            sms_reminder=False,
            push_notification=True,
            is_active=True
        )
        rem2 = MedicationReminder(
            patient_id=patient1.id,
            medicine_name="Cetirizine 10mg",
            dosage="1 tablet",
            frequency="Once daily before bed",
            email_reminder=True,
            sms_reminder=True,
            push_notification=True,
            is_active=True
        )
        
        # Medication Reminders for John Smith
        rem3 = MedicationReminder(
            patient_id=patient2.id,
            medicine_name="Metformin 500mg",
            dosage="1 tablet",
            frequency="Twice daily with meals",
            email_reminder=True,
            sms_reminder=False,
            push_notification=True,
            is_active=True
        )
        db.add_all([rem1, rem2, rem3])
        print("Seeded Medication Reminders")

        # 5. Create Assessment Reports for Jane Doe
        ast1 = Assessment(
            patient_id=patient1.id,
            symptoms="Mild dry cough, runny nose, slight throat irritation, fatigue",
            conversation_history=[
                {"role": "user", "content": "I have a cough and runny nose."},
                {"role": "bot", "content": "How long have you had these symptoms, and do you have any fever?"},
                {"role": "user", "content": "About 3 days. No fever, just feeling very tired."}
            ],
            predicted_diseases=["Common Cold", "Seasonal Allergies", "Influenza", "Mild Bronchitis", "COVID-19"],
            confidence_scores={"Common Cold": 0.85, "Seasonal Allergies": 0.70, "Influenza": 0.35, "Mild Bronchitis": 0.25, "COVID-19": 0.15},
            severity_level="Low Risk",
            risk_score=22,
            recommendations="Increase fluid intake, rest, and use a saline nasal rinse. If cough becomes productive or fever develops, contact your doctor.",
            source="web",
            is_approved_by_doctor=False
        )
        
        # High Risk Assessment for John Smith
        ast2 = Assessment(
            patient_id=patient2.id,
            symptoms="Squeezing chest discomfort, radiating down the left arm, short of breath, cold sweat",
            conversation_history=[
                {"role": "user", "content": "I am experiencing severe crushing pressure in my chest."},
                {"role": "bot", "content": "Does this pressure spread anywhere, and are you having any breathing difficulty?"},
                {"role": "user", "content": "Yes, it spreads to my left shoulder and arm. I can barely catch my breath."}
            ],
            predicted_diseases=["Myocardial Infarction (Heart Attack)", "Angina", "Panic Attack", "GERD (Acid Reflux)", "Pneumothorax"],
            confidence_scores={"Myocardial Infarction (Heart Attack)": 0.90, "Angina": 0.75, "Panic Attack": 0.30, "GERD (Acid Reflux)": 0.20, "Pneumothorax": 0.15},
            severity_level="High Risk",
            risk_score=95,
            recommendations="EMERGENCY WARNING: Chest pain radiating to the left arm accompanied by dyspnea is a critical warning sign of a cardiac event. Call emergency services immediately. Rest in a sitting position, avoid exertion, and swallow a standard aspirin tablet if you are not allergic.",
            source="web",
            is_approved_by_doctor=True,
            doctor_notes="Reviewed emergency assessment. Contacted patient to verify ambulance dispatch. Prescribed immediate cardiac follow-up."
        )
        db.add_all([ast1, ast2])
        print("Seeded Assessments")
        db.commit() # Commit to get IDs

        # 6. Create Appointment
        appt1 = Appointment(
            patient_id=patient1.id,
            doctor_id=doc1_profile.id,
            appointment_time=datetime.utcnow() + timedelta(days=2, hours=3),
            status="requested"
        )
        appt2 = Appointment(
            patient_id=patient2.id,
            doctor_id=doc1_profile.id,
            appointment_time=datetime.utcnow() + timedelta(days=1, hours=2),
            status="accepted",
            meeting_link=f"https://meet.jit.si/MediBot_Consultation_{doc1_profile.id}_seed123"
        )
        db.add_all([appt1, appt2])
        print("Seeded Appointments")

        # 7. Create Audit Logs
        log1 = AuditLog(user_id=admin.id, action="SEED_SYSTEM_INITIALIZE")
        log2 = AuditLog(user_id=patient1.id, action="LOGIN")
        log3 = AuditLog(user_id=patient2.id, action="SAVE_ASSESSMENT")
        db.add_all([log1, log2, log3])
        print("Seeded System Audit Logs")

        db.commit()
        print("Database seeding completed successfully!")
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {str(e)}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_db()
