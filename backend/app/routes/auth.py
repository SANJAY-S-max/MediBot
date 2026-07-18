from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, DoctorProfile, AuditLog
from app.schemas import UserCreate, UserResponse, UserLogin, Token, DoctorProfileCreate
from app.auth import get_password_hash, verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register_user(user_in: UserCreate, db: Session = Depends(get_db)):
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == user_in.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    # Hash the password
    hashed_password = get_password_hash(user_in.password)

    # Create new User object
    db_user = User(
        email=user_in.email,
        name=user_in.name,
        hashed_password=hashed_password,
        role=user_in.role,  # patient, doctor, admin
        phone=user_in.phone,
        age=user_in.age,
        gender=user_in.gender,
        medical_history=user_in.medical_history,
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    # Log action
    log = AuditLog(user_id=db_user.id, action=f"REGISTER_{db_user.role.upper()}")
    db.add(log)
    db.commit()

    return db_user

@router.post("/register/doctor", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register_doctor(user_in: UserCreate, doctor_profile: DoctorProfileCreate, db: Session = Depends(get_db)):
    # Verify unique email
    existing_user = db.query(User).filter(User.email == user_in.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    hashed_password = get_password_hash(user_in.password)

    # Create user with role='doctor'
    db_user = User(
        email=user_in.email,
        name=user_in.name,
        hashed_password=hashed_password,
        role="doctor",
        phone=user_in.phone,
        age=user_in.age,
        gender=user_in.gender,
        medical_history=user_in.medical_history,
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    # Create DoctorProfile (is_approved defaults to False)
    db_profile = DoctorProfile(
        user_id=db_user.id,
        specialization=doctor_profile.specialization,
        license_number=doctor_profile.license_number,
        consultation_fee=doctor_profile.consultation_fee,
        availability_slots=doctor_profile.availability_slots,
        is_approved=False,
    )
    db.add(db_profile)
    db.commit()

    # Log action
    log = AuditLog(user_id=db_user.id, action="REGISTER_DOCTOR_PENDING")
    db.add(log)
    db.commit()
    
    # Reload user to populate doctor profile relationship
    db.refresh(db_user)
    return db_user

@router.post("/login", response_model=Token)
def login(user_in: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == user_in.email).first()
    if not user or not verify_password(user_in.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )

    # Check doctor approval status
    if user.role == "doctor" and user.doctor_profile and not user.doctor_profile.is_approved:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Doctor profile is pending administrative approval.",
        )

    access_token = create_access_token(
        data={"sub": user.email, "role": user.role}
    )

    # Audit log
    log = AuditLog(user_id=user.id, action="LOGIN")
    db.add(log)
    db.commit()

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user.role,
        "name": user.name
    }

@router.get("/me", response_model=UserResponse)
def read_current_user(current_user: User = Depends(get_current_user)):
    return current_user
