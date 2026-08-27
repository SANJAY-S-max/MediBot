"""
Knowledge Base Facility Ingestion Pipeline
Populates ChromaDB Vector Database and SQLite/PostgreSQL with realistic public healthcare infrastructure
data across rural and tribal districts (Gadchiroli Maharashtra, Tamil Nadu, Wayanad Kerala, Bastar Chhattisgarh).

Tier Hierarchy:
1. Sub-Centres (SCs): Basic triage, ANC checks, Oral Rehydration (ORS), Malaria RDT kits.
2. Primary Health Centres (PHCs): Basic labor room, essential drugs, 4-6 beds, cold chain storage.
3. Community Health Centres (CHCs): 30 beds, X-Ray, ECG, minor OT, basic lab, ambulance.
4. District Hospitals (DHs): 100-500 beds, ICU, ventilators, blood bank, CT scan, specialist surgeons.
"""

import os
import sys
import json
from datetime import datetime, timezone
from typing import List, Dict, Any

# Ensure project root is in sys.path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.append(BASE_DIR)

from langchain_core.documents import Document
from backend.database import SessionLocal, engine, Base
from backend.models import Facility, EquipmentInventory, FacilityTier
from vector_db.chroma_store import vector_db_manager

# Comprehensive National Rural/Tribal Public Healthcare Dataset
RURAL_TRIBAL_FACILITIES = [
    # -------------------------------------------------------------------------
    # DISTRICT 1: GADCHIROLI, MAHARASHTRA (High-Priority Tribal / Forest Belt)
    # -------------------------------------------------------------------------
    {
        "name": "Bhamragad Sub-Centre (Health & Wellness Centre)",
        "tier": FacilityTier.SUBCENTER,
        "district": "Gadchiroli",
        "state": "Maharashtra",
        "latitude": 19.4674,
        "longitude": 80.3541,
        "contact": "+91 71342 22001",
        "address": "Near Forest Rest House, Bhamragad Tribal Division",
        "inventory": {
            "available_instruments": [
                "Malaria RDT Kits",
                "Oral Rehydration Salts (ORS)",
                "ANC Checkup Kit",
                "Hemoglobin Meter",
                "BP Apparatus",
                "First Aid Dressing Kit"
            ],
            "bed_capacity": 2,
            "available_beds": 2,
            "oxygen_cylinders_available": 1
        },
        "description": (
            "Bhamragad Health Sub-Centre is a frontline tribal health post providing basic triage, "
            "antenatal care (ANC) screening, malaria rapid diagnostic testing (RDT), and oral rehydration therapy. "
            "Staffed by ANM and ASHA workers for rural tribal outreach."
        )
    },
    {
        "name": "Dhanora Primary Health Centre (PHC)",
        "tier": FacilityTier.PHC,
        "district": "Gadchiroli",
        "state": "Maharashtra",
        "latitude": 20.2105,
        "longitude": 80.1742,
        "contact": "+91 71342 22002",
        "address": "Gadchiroli-Dhanora Main Road, Dhanora Tehsil",
        "inventory": {
            "available_instruments": [
                "Oxygen Concentrator",
                "Malaria RDT Kits",
                "Basic Labor Delivery Bed",
                "Cold Chain Vaccine Storage (ILR & Deep Freezer)",
                "Essential NLEM Drugs",
                "Nebulizer",
                "Blood Glucose Monitor"
            ],
            "bed_capacity": 6,
            "available_beds": 4,
            "oxygen_cylinders_available": 4
        },
        "description": (
            "Dhanora 24x7 Primary Health Centre operates 6 inpatient beds, a clean delivery room, "
            "and government-certified cold chain equipment for routine immunization. Provides primary outpatient care, "
            "maternal delivery services, and initial oxygen stabilization."
        )
    },
    {
        "name": "Aheri Community Health Centre (CHC)",
        "tier": FacilityTier.CHC,
        "district": "Gadchiroli",
        "state": "Maharashtra",
        "latitude": 19.4182,
        "longitude": 79.9958,
        "contact": "+91 71342 22003",
        "address": "Allapalli-Aheri Road, Aheri Tribal Sub-Division",
        "inventory": {
            "available_instruments": [
                "Oxygen Concentrator",
                "Malaria RDT Kits",
                "X-Ray",
                "ECG Machine",
                "Minor Operating Theater (OT)",
                "Basic Pathology Lab",
                "Maternity Ward",
                "108 Emergency Ambulance Station"
            ],
            "bed_capacity": 30,
            "available_beds": 14,
            "oxygen_cylinders_available": 12
        },
        "description": (
            "Aheri Community Health Centre (CHC) is a 30-bed secondary referral hub equipped with static X-Ray, "
            "ECG diagnosis, minor surgical OT, newborn care corner, and a 108 emergency ambulance base station. "
            "Capable of treating moderate trauma, obstetric deliveries, and infectious disease admissions."
        )
    },
    {
        "name": "Gadchiroli District General Hospital",
        "tier": FacilityTier.DISTRICT_HOSPITAL,
        "district": "Gadchiroli",
        "state": "Maharashtra",
        "latitude": 20.1809,
        "longitude": 79.9942,
        "contact": "+91 71342 22004",
        "address": "Complex Area, Near Collector Office, Gadchiroli",
        "inventory": {
            "available_instruments": [
                "Oxygen Concentrator",
                "Malaria RDT Kits",
                "Ventilator",
                "ICU",
                "X-Ray",
                "CT Scanner",
                "Blood Bank",
                "Major Operating Theater",
                "Specialist Surgeons",
                "Maternity Ward",
                "Neonatal ICU (NICU)",
                "Dialysis Unit",
                "Defibrillator"
            ],
            "bed_capacity": 350,
            "available_beds": 72,
            "oxygen_cylinders_available": 80
        },
        "description": (
            "Gadchiroli District General Hospital is the tertiary referral center with 350 beds, multi-bed ICU, "
            "mechanical ventilators, 24x7 blood bank and component facility, 32-slice CT scanner, and major trauma OT. "
            "Staffed by specialist surgeons, anesthesiologists, obstetricians, and pediatric critical care physicians."
        )
    },

    # -------------------------------------------------------------------------
    # DISTRICT 2: WAYANAD, KERALA (Western Ghats Tribal & Hilly Corridor)
    # -------------------------------------------------------------------------
    {
        "name": "Thirunelly Tribal Sub-Centre",
        "tier": FacilityTier.SUBCENTER,
        "district": "Wayanad",
        "state": "Kerala",
        "latitude": 11.9056,
        "longitude": 75.9922,
        "contact": "+91 49352 41001",
        "address": "Thirunelly Forest Belt, Mananthavady Taluk",
        "inventory": {
            "available_instruments": [
                "Malaria RDT Kits",
                "Oral Rehydration Salts (ORS)",
                "ANC Checkup Kit",
                "Hemoglobin Meter",
                "First Aid Dressing Kit"
            ],
            "bed_capacity": 2,
            "available_beds": 1,
            "oxygen_cylinders_available": 1
        },
        "description": (
            "Thirunelly Tribal Sub-Centre offers grassroots maternal-child health screening, "
            "oral rehydration solutions, sickle-cell/malaria testing, and basic first-aid for hill tribes."
        )
    },
    {
        "name": "Meppadi 24x7 Primary Health Centre",
        "tier": FacilityTier.PHC,
        "district": "Wayanad",
        "state": "Kerala",
        "latitude": 11.5544,
        "longitude": 76.1264,
        "contact": "+91 49352 41002",
        "address": "Ooty Road, Meppadi Grama Panchayat",
        "inventory": {
            "available_instruments": [
                "Oxygen Concentrator",
                "Basic Labor Delivery Bed",
                "Cold Chain Vaccine Storage (ILR & Deep Freezer)",
                "Essential NLEM Drugs",
                "Nebulizer",
                "ECG Machine",
                "Malaria RDT Kits"
            ],
            "bed_capacity": 6,
            "available_beds": 3,
            "oxygen_cylinders_available": 5
        },
        "description": (
            "Meppadi 24x7 PHC is equipped with 6 inpatient beds, emergency oxygen concentrators, "
            "cold chain vaccine preservation, and a 24-hour labor room for institutional deliveries."
        )
    },
    {
        "name": "Sultan Bathery Community Health Centre",
        "tier": FacilityTier.CHC,
        "district": "Wayanad",
        "state": "Kerala",
        "latitude": 11.6625,
        "longitude": 76.2570,
        "contact": "+91 49352 41003",
        "address": "Kozhikode-Kollegal Highway, Sultan Bathery",
        "inventory": {
            "available_instruments": [
                "Oxygen Concentrator",
                "X-Ray",
                "ECG Machine",
                "Minor Operating Theater (OT)",
                "Basic Pathology Lab",
                "Maternity Ward",
                "108 Emergency Ambulance Station"
            ],
            "bed_capacity": 40,
            "available_beds": 15,
            "oxygen_cylinders_available": 15
        },
        "description": (
            "Sultan Bathery CHC features 40 beds, digital X-Ray, diagnostic laboratory, "
            "minor surgery theatre, and dedicated emergency ambulance transport."
        )
    },
    {
        "name": "Mananthavady Government District Hospital",
        "tier": FacilityTier.DISTRICT_HOSPITAL,
        "district": "Wayanad",
        "state": "Kerala",
        "latitude": 11.8028,
        "longitude": 76.0044,
        "contact": "+91 49352 41004",
        "address": "Hospital Road, Mananthavady",
        "inventory": {
            "available_instruments": [
                "Oxygen Concentrator",
                "Ventilator",
                "ICU",
                "X-Ray",
                "CT Scanner",
                "Blood Bank",
                "Major Operating Theater",
                "Specialist Surgeons",
                "Maternity Ward",
                "Dialysis Unit",
                "Defibrillator"
            ],
            "bed_capacity": 300,
            "available_beds": 65,
            "oxygen_cylinders_available": 70
        },
        "description": (
            "Mananthavady District Hospital delivers advanced tertiary medical care with 300 beds, "
            "comprehensive intensive care unit (ICU) ventilators, blood bank, CT scanning, and emergency surgical suites."
        )
    },

    # -------------------------------------------------------------------------
    # DISTRICT 3: BASTAR, CHHATTISGARH (Central Tribal Zone)
    # -------------------------------------------------------------------------
    {
        "name": "Tokapal Tribal Health Sub-Centre",
        "tier": FacilityTier.SUBCENTER,
        "district": "Bastar",
        "state": "Chhattisgarh",
        "latitude": 18.9870,
        "longitude": 81.8210,
        "contact": "+91 77822 31001",
        "address": "Tokapal Village Market Ground",
        "inventory": {
            "available_instruments": [
                "Malaria RDT Kits",
                "Oral Rehydration Salts (ORS)",
                "ANC Checkup Kit",
                "Hemoglobin Meter",
                "First Aid Dressing Kit"
            ],
            "bed_capacity": 2,
            "available_beds": 2,
            "oxygen_cylinders_available": 1
        },
        "description": (
            "Tokapal Sub-Centre supports rural tribal residents with vital first-aid, ORS distribution, "
            "malaria falciparum/vivax testing, and maternal health monitoring."
        )
    },
    {
        "name": "Bastanar Primary Health Centre (PHC)",
        "tier": FacilityTier.PHC,
        "district": "Bastar",
        "state": "Chhattisgarh",
        "latitude": 18.8890,
        "longitude": 81.7120,
        "contact": "+91 77822 31002",
        "address": "NH-30 Highway, Bastanar Block",
        "inventory": {
            "available_instruments": [
                "Oxygen Concentrator",
                "Malaria RDT Kits",
                "Basic Labor Delivery Bed",
                "Cold Chain Vaccine Storage (ILR & Deep Freezer)",
                "Essential NLEM Drugs",
                "Nebulizer"
            ],
            "bed_capacity": 6,
            "available_beds": 3,
            "oxygen_cylinders_available": 4
        },
        "description": (
            "Bastanar PHC provides 6 inpatient beds, continuous cold chain maintenance, "
            "antivenom stocking, and emergency maternal delivery facilities."
        )
    },
    {
        "name": "Jagdalpur Maharani Government District Hospital",
        "tier": FacilityTier.DISTRICT_HOSPITAL,
        "district": "Bastar",
        "state": "Chhattisgarh",
        "latitude": 19.0732,
        "longitude": 82.0298,
        "contact": "+91 77822 31003",
        "address": "Palace Road, Jagdalpur, Bastar",
        "inventory": {
            "available_instruments": [
                "Oxygen Concentrator",
                "Malaria RDT Kits",
                "Ventilator",
                "ICU",
                "X-Ray",
                "CT Scanner",
                "Blood Bank",
                "Major Operating Theater",
                "Specialist Surgeons",
                "Maternity Ward",
                "Dialysis Unit",
                "Defibrillator"
            ],
            "bed_capacity": 400,
            "available_beds": 90,
            "oxygen_cylinders_available": 110
        },
        "description": (
            "Jagdalpur Maharani District Hospital is the apex medical institution of the Bastar division, "
            "providing 400 beds, ICU ventilators, 24-hour blood banking, CT imaging, and trauma surgical teams."
        )
    }
]

def prepare_facility_documents(facilities_data: List[Dict[str, Any]]) -> List[Document]:
    """
    Transforms facility entries into rich LangChain Document objects with detailed metadata
    for vector search and semantic retrieval in LangGraph agents.
    """
    documents = []
    
    for fac in facilities_data:
        inv = fac.get("inventory", {})
        instruments = inv.get("available_instruments", [])
        inst_str = ", ".join(instruments)
        
        # Build comprehensive document context text
        content = (
            f"HEALTHCARE FACILITY INFRASTRUCTURE PROFILE:\n"
            f"Facility Name: {fac['name']}\n"
            f"Tier: {fac['tier']}\n"
            f"District: {fac['district']}, State: {fac['state']}\n"
            f"GPS Coordinates: Latitude {fac['latitude']}, Longitude {fac['longitude']}\n"
            f"Emergency Contact: {fac['contact']}\n"
            f"Address: {fac.get('address', 'N/A')}\n"
            f"Total Bed Capacity: {inv.get('bed_capacity', 0)} beds\n"
            f"Currently Available Inpatient Beds: {inv.get('available_beds', 0)} beds\n"
            f"Oxygen Cylinders Available: {inv.get('oxygen_cylinders_available', 0)}\n"
            f"Available Diagnostic & Medical Instruments: {inst_str}\n"
            f"Clinical Description & Scope of Services: {fac.get('description', '')}\n"
            f"Readiness Verification: "
            f"ICU={'Yes' if 'ICU' in instruments else 'No'}, "
            f"Ventilator={'Yes' if 'Ventilator' in instruments else 'No'}, "
            f"Blood Bank={'Yes' if 'Blood Bank' in instruments else 'No'}, "
            f"X-Ray={'Yes' if 'X-Ray' in instruments else 'No'}, "
            f"Maternity={'Yes' if 'Maternity Ward' in instruments or 'Basic Labor Delivery Bed' in instruments else 'No'}, "
            f"Malaria RDT={'Yes' if 'Malaria RDT Kits' in instruments else 'No'}."
        )
        
        # Extract explicit boolean flags for metadata filters
        inst_lower = [i.lower() for i in instruments]
        metadata = {
            "facility_name": fac["name"],
            "tier": str(fac["tier"]),
            "district": fac["district"],
            "state": fac["state"],
            "latitude": float(fac["latitude"]),
            "longitude": float(fac["longitude"]),
            "contact": fac["contact"],
            "bed_capacity": int(inv.get("bed_capacity", 0)),
            "available_beds": int(inv.get("available_beds", 0)),
            "oxygen_cylinders": int(inv.get("oxygen_cylinders_available", 0)),
            "instruments": inst_str,
            "has_icu": any("icu" in x for x in inst_lower),
            "has_ventilator": any("ventilator" in x for x in inst_lower),
            "has_blood_bank": any("blood" in x for x in inst_lower),
            "has_xray": any("x-ray" in x or "xray" in x for x in inst_lower),
            "has_maternity": any("maternity" in x or "labor" in x or "delivery" in x for x in inst_lower),
            "has_malaria_rdt": any("malaria" in x for x in inst_lower),
            "source": "National_Public_Healthcare_Registry",
            "category": "facility_readiness"
        }
        
        documents.append(Document(page_content=content, metadata=metadata))
        
    return documents

def ingest_facilities_to_relational_db(facilities_data: List[Dict[str, Any]]):
    """Populates SQLite / PostgreSQL relational database with facilities & equipment inventory."""
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    try:
        inserted_count = 0
        updated_count = 0
        
        for item in facilities_data:
            # Check if facility already exists by name
            existing = db.query(Facility).filter(Facility.name == item["name"]).first()
            inv_data = item.get("inventory", {})
            
            if existing:
                # Update existing facility
                existing.tier = item["tier"]
                existing.district = item["district"]
                existing.state = item.get("state", "India")
                existing.latitude = item["latitude"]
                existing.longitude = item["longitude"]
                existing.contact = item["contact"]
                existing.address = item.get("address", "")
                existing.is_active = True
                
                if existing.inventory:
                    existing.inventory.available_instruments = inv_data.get("available_instruments", [])
                    existing.inventory.bed_capacity = inv_data.get("bed_capacity", 0)
                    existing.inventory.available_beds = inv_data.get("available_beds", 0)
                    existing.inventory.oxygen_cylinders_available = inv_data.get("oxygen_cylinders_available", 0)
                    existing.inventory.last_updated = datetime.now(timezone.utc)
                else:
                    new_inv = EquipmentInventory(
                        facility_id=existing.id,
                        available_instruments=inv_data.get("available_instruments", []),
                        bed_capacity=inv_data.get("bed_capacity", 0),
                        available_beds=inv_data.get("available_beds", 0),
                        oxygen_cylinders_available=inv_data.get("oxygen_cylinders_available", 0),
                        last_updated=datetime.now(timezone.utc)
                    )
                    db.add(new_inv)
                updated_count += 1
            else:
                # Create new facility
                facility = Facility(
                    name=item["name"],
                    tier=item["tier"],
                    district=item["district"],
                    state=item.get("state", "India"),
                    latitude=item["latitude"],
                    longitude=item["longitude"],
                    contact=item["contact"],
                    address=item.get("address", ""),
                    is_active=True,
                    created_at=datetime.now(timezone.utc)
                )
                db.add(facility)
                db.flush()
                
                inventory = EquipmentInventory(
                    facility_id=facility.id,
                    available_instruments=inv_data.get("available_instruments", []),
                    bed_capacity=inv_data.get("bed_capacity", 0),
                    available_beds=inv_data.get("available_beds", 0),
                    oxygen_cylinders_available=inv_data.get("oxygen_cylinders_available", 0),
                    last_updated=datetime.now(timezone.utc)
                )
                db.add(inventory)
                inserted_count += 1
                
        db.commit()
        print(f"[SQL Database] Relational ingestion complete. Inserted: {inserted_count}, Updated: {updated_count}. Total in DB: {db.query(Facility).count()}")
    finally:
        db.close()

def ingest_facilities_to_chromadb(facilities_data: List[Dict[str, Any]]):
    """Encodes facility profiles and indexes them into ChromaDB vector store."""
    print(f"[ChromaDB] Preparing {len(facilities_data)} facility documents for semantic embedding...")
    docs = prepare_facility_documents(facilities_data)
    
    try:
        vector_db_manager.add_documents(docs)
        print(f"[ChromaDB] Successfully ingested {len(docs)} facility readiness documents to ChromaDB.")
    except Exception as e:
        print(f"[ChromaDB] Error ingesting to ChromaDB: {e}")

def run_facility_ingestion_pipeline():
    """Main execution pipeline."""
    print("=" * 70)
    print("INDIAN PUBLIC HEALTHCARE INFRASTRUCTURE INGESTION PIPELINE")
    print("=" * 70)
    
    # 1. Ingest to SQL Database (SQLite / PostgreSQL)
    ingest_facilities_to_relational_db(RURAL_TRIBAL_FACILITIES)
    
    # 2. Ingest to ChromaDB Vector Store
    ingest_facilities_to_chromadb(RURAL_TRIBAL_FACILITIES)
    
    print("=" * 70)
    print("VERIFICATION: Testing Vector Search on Healthcare Facility Readiness")
    print("=" * 70)
    
    try:
        query = "Which hospital in Gadchiroli has ICU and mechanical ventilator?"
        print(f"Test Query: '{query}'")
        search_results = vector_db_manager.similarity_search(query, k=2)
        for idx, res in enumerate(search_results):
            print(f"\n--- Result {idx+1} ({res.metadata.get('facility_name', 'Unknown')}) ---")
            print(f"Tier: {res.metadata.get('tier')}, District: {res.metadata.get('district')}")
            print(f"ICU: {res.metadata.get('has_icu')}, Ventilator: {res.metadata.get('has_ventilator')}, Beds: {res.metadata.get('available_beds')}")
            print(f"Snippet:\n{res.page_content[:250]}...")
    except Exception as e:
        print(f"Vector search test error: {e}")
        
    print("\nIngestion pipeline finished successfully.")

if __name__ == "__main__":
    run_facility_ingestion_pipeline()
