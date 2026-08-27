from sqlalchemy.orm import Session
from backend.database import SessionLocal, engine, Base
from backend.models import Facility, EquipmentInventory, FacilityTier
import datetime

SAMPLE_FACILITIES = [
    # Cluster 1: Rural District (Chengalpattu / Kanchipuram Region)
    {
        "name": "Nemmeli Health Sub-Centre",
        "tier": FacilityTier.SUBCENTER,
        "district": "Chengalpattu",
        "state": "Tamil Nadu",
        "latitude": 12.6980,
        "longitude": 80.1740,
        "contact": "+91 94440 12001",
        "address": "East Coast Road, Nemmeli Village",
        "inventory": {
            "available_instruments": [
                "Malaria RDT Kits",
                "Blood Glucose Monitor",
                "BP Apparatus",
                "First Aid Dressing Kit"
            ],
            "bed_capacity": 2,
            "available_beds": 1,
            "oxygen_cylinders_available": 1
        }
    },
    {
        "name": "Thiruporur Primary Health Centre (PHC)",
        "tier": FacilityTier.PHC,
        "district": "Chengalpattu",
        "state": "Tamil Nadu",
        "latitude": 12.7236,
        "longitude": 80.1872,
        "contact": "+91 94440 12002",
        "address": "OMR Main Road, Thiruporur",
        "inventory": {
            "available_instruments": [
                "Oxygen Concentrator",
                "Malaria RDT Kits",
                "Dengue NS1 Antigen Kits",
                "ECG Machine",
                "Nebulizer",
                "Basic Labor Delivery Bed"
            ],
            "bed_capacity": 6,
            "available_beds": 3,
            "oxygen_cylinders_available": 3
        }
    },
    {
        "name": "Kelambakkam Community Health Centre (CHC)",
        "tier": FacilityTier.CHC,
        "district": "Chengalpattu",
        "state": "Tamil Nadu",
        "latitude": 12.7845,
        "longitude": 80.2201,
        "contact": "+91 94440 12003",
        "address": "Vandalur-Kelambakkam High Road",
        "inventory": {
            "available_instruments": [
                "Oxygen Concentrator",
                "Malaria RDT Kits",
                "X-Ray",
                "Maternity Ward",
                "Ultrasound Sonography",
                "Emergency Stabilization Bed",
                "ECG Machine"
            ],
            "bed_capacity": 30,
            "available_beds": 12,
            "oxygen_cylinders_available": 8
        }
    },
    {
        "name": "Tambaram Sub-District Government Hospital",
        "tier": FacilityTier.SUB_DISTRICT_HOSPITAL,
        "district": "Chengalpattu",
        "state": "Tamil Nadu",
        "latitude": 12.9249,
        "longitude": 80.1309,
        "contact": "+91 94440 12004",
        "address": "GST Road, Tambaram Sanatorium",
        "inventory": {
            "available_instruments": [
                "Oxygen Concentrator",
                "Malaria RDT Kits",
                "X-Ray",
                "Maternity Ward",
                "Blood Bank",
                "Defibrillator",
                "Dialysis Unit",
                "Operating Theater"
            ],
            "bed_capacity": 100,
            "available_beds": 28,
            "oxygen_cylinders_available": 25
        }
    },
    {
        "name": "Chengalpattu Government District Headquarters Hospital",
        "tier": FacilityTier.DISTRICT_HOSPITAL,
        "district": "Chengalpattu",
        "state": "Tamil Nadu",
        "latitude": 12.6923,
        "longitude": 79.9774,
        "contact": "+91 94440 12005",
        "address": "GST Road, Chengalpattu",
        "inventory": {
            "available_instruments": [
                "Oxygen Concentrator",
                "Malaria RDT Kits",
                "Ventilator",
                "ICU",
                "X-Ray",
                "Maternity Ward",
                "Blood Bank",
                "Defibrillator",
                "CT Scanner",
                "Operating Theater",
                "Neonatal ICU (NICU)",
                "Trauma Care Unit"
            ],
            "bed_capacity": 450,
            "available_beds": 85,
            "oxygen_cylinders_available": 90
        }
    },
    # Cluster 2: Western Rural District (Salem / Erode Region)
    {
        "name": "Panamarathupatti Primary Health Centre",
        "tier": FacilityTier.PHC,
        "district": "Salem",
        "state": "Tamil Nadu",
        "latitude": 11.5833,
        "longitude": 78.1833,
        "contact": "+91 94440 12006",
        "address": "Main Road, Panamarathupatti",
        "inventory": {
            "available_instruments": [
                "Oxygen Concentrator",
                "Malaria RDT Kits",
                "Blood Glucose Monitor",
                "Basic OPD Dressing"
            ],
            "bed_capacity": 6,
            "available_beds": 4,
            "oxygen_cylinders_available": 2
        }
    },
    {
        "name": "Attur Community Health Centre (CHC)",
        "tier": FacilityTier.CHC,
        "district": "Salem",
        "state": "Tamil Nadu",
        "latitude": 11.5977,
        "longitude": 78.5992,
        "contact": "+91 94440 12007",
        "address": "Cuddalore Main Road, Attur",
        "inventory": {
            "available_instruments": [
                "Oxygen Concentrator",
                "Malaria RDT Kits",
                "X-Ray",
                "Maternity Ward",
                "Basic OT",
                "ECG Machine"
            ],
            "bed_capacity": 40,
            "available_beds": 14,
            "oxygen_cylinders_available": 10
        }
    },
    {
        "name": "Salem Government Mohan Kumaramangalam Medical College Hospital",
        "tier": FacilityTier.DISTRICT_HOSPITAL,
        "district": "Salem",
        "state": "Tamil Nadu",
        "latitude": 11.6583,
        "longitude": 78.1460,
        "contact": "+91 94440 12008",
        "address": "Fort Main Road, Salem",
        "inventory": {
            "available_instruments": [
                "Oxygen Concentrator",
                "Malaria RDT Kits",
                "Ventilator",
                "ICU",
                "X-Ray",
                "Maternity Ward",
                "Blood Bank",
                "Defibrillator",
                "Cath Lab",
                "Trauma Care Unit",
                "Dialysis Unit"
            ],
            "bed_capacity": 600,
            "available_beds": 120,
            "oxygen_cylinders_available": 150
        }
    }
]

def seed_facilities_if_empty(db: Session):
    """Populates database with realistic healthcare facilities and equipment inventories if table is empty."""
    Base.metadata.create_all(bind=engine)
    
    count = db.query(Facility).count()
    if count > 0:
        return  # Already seeded
    
    print(f"[Database Seeder] Seeding {len(SAMPLE_FACILITIES)} Indian Public Healthcare facilities...")
    
    for item in SAMPLE_FACILITIES:
        inv_data = item.get("inventory", {})
        facility = Facility(
            name=item["name"],
            tier=item["tier"],
            district=item["district"],
            state=item.get("state", "Tamil Nadu"),
            latitude=item["latitude"],
            longitude=item["longitude"],
            contact=item["contact"],
            address=item.get("address", ""),
            is_active=True,
            created_at=datetime.datetime.now(datetime.timezone.utc)
        )
        db.add(facility)
        db.flush()  # obtain facility.id

        inventory = EquipmentInventory(
            facility_id=facility.id,
            available_instruments=inv_data.get("available_instruments", []),
            bed_capacity=inv_data.get("bed_capacity", 0),
            available_beds=inv_data.get("available_beds", 0),
            oxygen_cylinders_available=inv_data.get("oxygen_cylinders_available", 0),
            last_updated=datetime.datetime.now(datetime.timezone.utc)
        )
        db.add(inventory)
    
    db.commit()
    print("[Database Seeder] Database seeded successfully!")

if __name__ == "__main__":
    db = SessionLocal()
    try:
        seed_facilities_if_empty(db)
    finally:
        db.close()
