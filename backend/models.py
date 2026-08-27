from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, JSON, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import json
from backend.database import Base

class FacilityTier(str):
    SUBCENTER = "SubCenter"
    PHC = "PHC"
    CHC = "CHC"
    SUB_DISTRICT_HOSPITAL = "SubDistrictHospital"
    DISTRICT_HOSPITAL = "DistrictHospital"

class Facility(Base):
    __tablename__ = "facilities"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    tier = Column(String, nullable=False, index=True)  # 'SubCenter', 'PHC', 'CHC', 'SubDistrictHospital', 'DistrictHospital'
    district = Column(String, nullable=False, index=True)
    state = Column(String, default="Tamil Nadu")
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    contact = Column(String, nullable=False)
    address = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # 1-to-1 or 1-to-many relationship with EquipmentInventory
    inventory = relationship("EquipmentInventory", back_populates="facility", uselist=False, cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Facility(id={self.id}, name='{self.name}', tier='{self.tier}', district='{self.district}')>"

class EquipmentInventory(Base):
    __tablename__ = "equipment_inventory"

    id = Column(Integer, primary_key=True, index=True)
    facility_id = Column(Integer, ForeignKey("facilities.id", ondelete="CASCADE"), unique=True, nullable=False)
    
    # Store list of available medical instruments/equipment as JSON array or text
    available_instruments = Column(JSON, nullable=False, default=list)
    
    bed_capacity = Column(Integer, default=0)
    available_beds = Column(Integer, default=0)
    oxygen_cylinders_available = Column(Integer, default=0)
    last_updated = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    facility = relationship("Facility", back_populates="inventory")

    def get_instruments_list(self) -> list[str]:
        """Helper to return available instruments as a standardized list of strings."""
        if isinstance(self.available_instruments, list):
            return self.available_instruments
        elif isinstance(self.available_instruments, str):
            try:
                parsed = json.loads(self.available_instruments)
                if isinstance(parsed, list):
                    return parsed
            except Exception:
                return [x.strip() for x in self.available_instruments.split(",") if x.strip()]
        return []

    def __repr__(self):
        return f"<EquipmentInventory(facility_id={self.facility_id}, beds={self.available_beds}/{self.bed_capacity})>"
