import { PrismaClient, Role, FacilityTier, TriagePriority, SeverityLevel, EquipmentStatus, AssistanceStatus, CheckupStatus, DiagnosisType, PrescriptionStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 [Seed] Starting MediBot AI comprehensive database seeding...");

  // 1. Password hashing
  const adminPasswordHash = await bcrypt.hash("Admin@123", 10);
  const doctorPasswordHash = await bcrypt.hash("Doctor@123", 10);
  const ahaPasswordHash = await bcrypt.hash("Aha@123", 10);
  const patientPasswordHash = await bcrypt.hash("Patient@123", 10);

  // -------------------------------------------------------------------------
  // 2. Seed Users & Profiles (Admin, Doctor, AHA Worker, Patient)
  // -------------------------------------------------------------------------
  console.log("👤 [Seed] Seeding core users and role profiles...");

  // Admin User
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@medibot.com" },
    update: {},
    create: {
      email: "admin@medibot.com",
      passwordHash: adminPasswordHash,
      name: "Dr. K. Ramanathan (Admin)",
      phone: "+91 94440 99001",
      role: Role.ADMIN,
      adminProfile: {
        create: {
          designation: "Chief Public Healthcare Informatics Officer",
          department: "National Health Mission & Systems Administration",
          accessLevel: "SUPER_ADMIN"
        }
      }
    }
  });

  // Doctor User 1
  const doctorUser1 = await prisma.user.upsert({
    where: { email: "doctor@medibot.com" },
    update: {},
    create: {
      email: "doctor@medibot.com",
      passwordHash: doctorPasswordHash,
      name: "Dr. Sarah Johnson, MD",
      phone: "+91 94440 99002",
      role: Role.DOCTOR,
      doctorProfile: {
        create: {
          registrationNumber: "TN-MCI-2015-88412",
          specialization: "General Medicine & Emergency Care",
          qualification: "MBBS, MD (General Medicine), Fellowship in Critical Care",
          department: "Emergency & General Medicine",
          isAvailable: true,
          consultationFee: 0
        }
      }
    }
  });

  // Doctor User 2 (Cardiologist)
  const doctorUser2 = await prisma.user.upsert({
    where: { email: "rajesh.cardio@medibot.com" },
    update: {},
    create: {
      email: "rajesh.cardio@medibot.com",
      passwordHash: doctorPasswordHash,
      name: "Dr. Rajesh Varma, MD, DM",
      phone: "+91 94440 99003",
      role: Role.DOCTOR,
      doctorProfile: {
        create: {
          registrationNumber: "TN-MCI-2010-44910",
          specialization: "Cardiology & Interventional Cardiology",
          qualification: "MBBS, MD, DM (Cardiology), FSCAI",
          department: "Cardiology & Cath Lab",
          isAvailable: true,
          consultationFee: 0
        }
      }
    }
  });

  // AHA Worker User
  const ahaUser = await prisma.user.upsert({
    where: { email: "ahaworker@medibot.com" },
    update: {},
    create: {
      email: "ahaworker@medibot.com",
      passwordHash: ahaPasswordHash,
      name: "Anitha Selvam (AHA/ASHA)",
      phone: "+91 94440 99004",
      role: Role.AHA_WORKER,
      ahaProfile: {
        create: {
          workerCode: "TN-ASHA-CHG-042",
          assignedSubCentre: "Nemmeli Health Sub-Centre",
          assignedVillage: "Thiruporur Rural Block",
          assignedDistrict: "Chengalpattu",
          contactNumber: "+91 94440 99004"
        }
      }
    }
  });

  // Patient User 1 (John Patient - Acute/Cardiac History)
  const patientUser1 = await prisma.user.upsert({
    where: { email: "patient@medibot.com" },
    update: {},
    create: {
      email: "patient@medibot.com",
      passwordHash: patientPasswordHash,
      name: "John Patient",
      phone: "+91 98840 11001",
      role: Role.PATIENT,
      patientProfile: {
        create: {
          abhaId: "91-4521-8832-1920",
          dateOfBirth: new Date("1979-05-14"),
          gender: "Male",
          bloodGroup: "O+",
          address: "12, Sannathi Street, Thiruporur",
          district: "Chengalpattu",
          state: "Tamil Nadu",
          latitude: 12.7236,
          longitude: 80.1872,
          emergencyContact: "+91 98840 11009",
          emergencyName: "Priya (Spouse)",
          preferredLanguage: "en"
        }
      }
    }
  });

  // Patient User 2 (Mary Smith - Maternal/Respiratory History)
  const patientUser2 = await prisma.user.upsert({
    where: { email: "mary.smith@medibot.com" },
    update: {},
    create: {
      email: "mary.smith@medibot.com",
      passwordHash: patientPasswordHash,
      name: "Mary Smith",
      phone: "+91 98840 11002",
      role: Role.PATIENT,
      patientProfile: {
        create: {
          abhaId: "91-7741-2098-4431",
          dateOfBirth: new Date("1992-08-20"),
          gender: "Female",
          bloodGroup: "B+",
          address: "45, East Coast Road, Nemmeli",
          district: "Chengalpattu",
          state: "Tamil Nadu",
          latitude: 12.6980,
          longitude: 80.1740,
          emergencyContact: "+91 98840 11008",
          emergencyName: "David (Brother)",
          preferredLanguage: "en"
        }
      }
    }
  });

  // Patient User 3 (Ahmed Ali - Routine Care)
  const patientUser3 = await prisma.user.upsert({
    where: { email: "ahmed.ali@medibot.com" },
    update: {},
    create: {
      email: "ahmed.ali@medibot.com",
      passwordHash: patientPasswordHash,
      name: "Ahmed Ali",
      phone: "+91 98840 11003",
      role: Role.PATIENT,
      patientProfile: {
        create: {
          abhaId: "91-3312-9981-5567",
          dateOfBirth: new Date("1996-03-10"),
          gender: "Male",
          bloodGroup: "A+",
          address: "8, High Road, Kelambakkam",
          district: "Chengalpattu",
          state: "Tamil Nadu",
          latitude: 12.7845,
          longitude: 80.2201,
          emergencyContact: "+91 98840 11007",
          emergencyName: "Fatima (Mother)",
          preferredLanguage: "en"
        }
      }
    }
  });

  // -------------------------------------------------------------------------
  // 3. Seed Verified Public Healthcare Hospitals & Infrastructure
  // -------------------------------------------------------------------------
  console.log("🏥 [Seed] Seeding verified Indian public healthcare hospitals and facility tiers...");

  // Hospital 1: Nemmeli Health Sub-Centre (Tier 1: Sub-Centre)
  const h1 = await prisma.hospital.upsert({
    where: { name: "Nemmeli Health Sub-Centre (HWC)" },
    update: {},
    create: {
      name: "Nemmeli Health Sub-Centre (HWC)",
      code: "HWC-TN-CHG-001",
      tier: FacilityTier.SUB_CENTRE,
      district: "Chengalpattu",
      state: "Tamil Nadu",
      pincode: "603104",
      address: "East Coast Road, Nemmeli Village",
      latitude: 12.6980,
      longitude: 80.1740,
      contactPhone: "+91 94440 12001",
      emergencyHelpline: "108",
      isEmergency24x7: false,
      hasBloodBank: false,
      hasAmbulanceStation: false,
      isGovernment: true,
      isVerified: true,
      operatingHours: "09:00 AM - 04:00 PM (Daily)",
      departments: {
        create: [
          { name: "Primary Health & Immunization", floorLocation: "Ground Floor", isOpen24x7: false }
        ]
      },
      facilities: {
        create: [
          { name: "Point-of-Care Diagnostic Booth", capacity: 1, availableUnits: 1 },
          { name: "First Aid & Dressing Room", capacity: 2, availableUnits: 2 }
        ]
      },
      equipment: {
        create: [
          { name: "Blood Glucose Monitor", category: "Monitoring", totalCount: 2, availableCount: 2, status: EquipmentStatus.OPERATIONAL },
          { name: "BP Apparatus Digital", category: "Monitoring", totalCount: 3, availableCount: 3, status: EquipmentStatus.OPERATIONAL },
          { name: "First Aid Dressing Kit", category: "Life Support", totalCount: 5, availableCount: 5, status: EquipmentStatus.OPERATIONAL }
        ]
      },
      diagnosticInstruments: {
        create: [
          { name: "Malaria RDT Kits", category: "Point of Care", totalCount: 50, availableCount: 45, status: EquipmentStatus.OPERATIONAL },
          { name: "Hemoglobinometer", category: "Point of Care", totalCount: 2, availableCount: 2, status: EquipmentStatus.OPERATIONAL }
        ]
      },
      medicalServices: {
        create: [
          { name: "Village Outpatient Consultation", category: "Primary Care", is24x7: false, isAvailable: true }
        ]
      },
      bedCapacity: {
        create: {
          totalBeds: 2,
          availableBeds: 1,
          icuBeds: 0,
          availableIcuBeds: 0,
          oxygenBeds: 1,
          availableOxygenBeds: 1,
          ventilatorBeds: 0,
          availableVentBeds: 0,
          maternityBeds: 0,
          availableMatBeds: 0
        }
      }
    }
  });

  // Hospital 2: Thiruporur 24x7 Primary Health Centre (Tier 2: PHC)
  const h2 = await prisma.hospital.upsert({
    where: { name: "Thiruporur 24x7 Primary Health Centre (PHC)" },
    update: {},
    create: {
      name: "Thiruporur 24x7 Primary Health Centre (PHC)",
      code: "PHC-TN-CHG-002",
      tier: FacilityTier.PHC,
      district: "Chengalpattu",
      state: "Tamil Nadu",
      pincode: "603110",
      address: "OMR Main Road, Thiruporur",
      latitude: 12.7236,
      longitude: 80.1872,
      contactPhone: "+91 94440 12002",
      emergencyHelpline: "108",
      isEmergency24x7: true,
      hasBloodBank: false,
      hasAmbulanceStation: true,
      isGovernment: true,
      isVerified: true,
      operatingHours: "24x7 Emergency & Normal Delivery",
      departments: {
        create: [
          { name: "General Medicine", floorLocation: "Ground Floor", isOpen24x7: true },
          { name: "Obstetrics & Maternity", floorLocation: "Ground Floor - Wing B", isOpen24x7: true },
          { name: "Emergency & Stabilization", floorLocation: "Ground Floor - Front", isOpen24x7: true }
        ]
      },
      facilities: {
        create: [
          { name: "24x7 Emergency Stabilization Room", capacity: 3, availableUnits: 2 },
          { name: "Labor Delivery Suite", capacity: 2, availableUnits: 1 },
          { name: "General Inpatient Ward", capacity: 6, availableUnits: 3 }
        ]
      },
      equipment: {
        create: [
          { name: "Oxygen Concentrator (10L)", category: "Respiratory", totalCount: 3, availableCount: 3, status: EquipmentStatus.OPERATIONAL },
          { name: "ECG Machine 12-Channel", category: "Monitoring", totalCount: 2, availableCount: 2, status: EquipmentStatus.OPERATIONAL },
          { name: "Nebulizer Compressor", category: "Respiratory", totalCount: 4, availableCount: 4, status: EquipmentStatus.OPERATIONAL },
          { name: "Multipara Vital Signs Monitor", category: "Monitoring", totalCount: 2, availableCount: 2, status: EquipmentStatus.OPERATIONAL }
        ]
      },
      diagnosticInstruments: {
        create: [
          { name: "Malaria RDT Kits", category: "Point of Care", totalCount: 100, availableCount: 92, status: EquipmentStatus.OPERATIONAL },
          { name: "Dengue NS1 Antigen Kits", category: "Point of Care", totalCount: 50, availableCount: 40, status: EquipmentStatus.OPERATIONAL },
          { name: "Automated Hematology Counter", category: "Pathology", totalCount: 1, availableCount: 1, status: EquipmentStatus.OPERATIONAL }
        ]
      },
      medicalServices: {
        create: [
          { name: "102 Janani Shishu Suraksha Vahan (JSSV)", category: "Maternal Transport", is24x7: true, isAvailable: true },
          { name: "24x7 Essential Drug Pharmacy", category: "Pharmacy", is24x7: true, isAvailable: true }
        ]
      },
      bedCapacity: {
        create: {
          totalBeds: 6,
          availableBeds: 3,
          icuBeds: 0,
          availableIcuBeds: 0,
          oxygenBeds: 3,
          availableOxygenBeds: 2,
          ventilatorBeds: 0,
          availableVentBeds: 0,
          maternityBeds: 2,
          availableMatBeds: 1
        }
      }
    }
  });

  // Hospital 3: Kelambakkam Community Health Centre (Tier 3: CHC)
  const h3 = await prisma.hospital.upsert({
    where: { name: "Kelambakkam Community Health Centre (CHC)" },
    update: {},
    create: {
      name: "Kelambakkam Community Health Centre (CHC)",
      code: "CHC-TN-CHG-003",
      tier: FacilityTier.CHC,
      district: "Chengalpattu",
      state: "Tamil Nadu",
      pincode: "603103",
      address: "Vandalur-Kelambakkam High Road, Kelambakkam",
      latitude: 12.7845,
      longitude: 80.2201,
      contactPhone: "+91 94440 12003",
      emergencyHelpline: "108",
      isEmergency24x7: true,
      hasBloodBank: false,
      hasAmbulanceStation: true,
      isGovernment: true,
      isVerified: true,
      operatingHours: "24x7 Full Inpatient & Emergency",
      departments: {
        create: [
          { name: "General Surgery & Minor OT", floorLocation: "1st Floor", isOpen24x7: true },
          { name: "Obstetrics & Gynecology", floorLocation: "1st Floor - Wing A", isOpen24x7: true },
          { name: "Pediatrics & Child Health", floorLocation: "Ground Floor", isOpen24x7: true },
          { name: "Diagnostic Radiology & Imaging", floorLocation: "Ground Floor", isOpen24x7: true }
        ]
      },
      facilities: {
        create: [
          { name: "Minor Operation Theatre", capacity: 1, availableUnits: 1 },
          { name: "Maternity & Labor Ward", capacity: 8, availableUnits: 4 },
          { name: "24x7 Emergency Resuscitation Bay", capacity: 4, availableUnits: 2 },
          { name: "Digital X-Ray Suite", capacity: 1, availableUnits: 1 }
        ]
      },
      equipment: {
        create: [
          { name: "Oxygen Concentrator Dual Output", category: "Respiratory", totalCount: 8, availableCount: 8, status: EquipmentStatus.OPERATIONAL },
          { name: "Biphasic Defibrillator", category: "Life Support", totalCount: 2, availableCount: 2, status: EquipmentStatus.OPERATIONAL },
          { name: "Infant Radiant Warmer", category: "Pediatric", totalCount: 3, availableCount: 2, status: EquipmentStatus.OPERATIONAL }
        ]
      },
      diagnosticInstruments: {
        create: [
          { name: "Digital X-Ray 300mA", category: "Imaging", totalCount: 1, availableCount: 1, status: EquipmentStatus.OPERATIONAL },
          { name: "Ultrasound Sonography (USG)", category: "Imaging", totalCount: 1, availableCount: 1, status: EquipmentStatus.OPERATIONAL },
          { name: "ECG Machine 12-Channel", category: "Cardiac", totalCount: 3, availableCount: 3, status: EquipmentStatus.OPERATIONAL }
        ]
      },
      medicalServices: {
        create: [
          { name: "108 Basic Life Support (BLS) Ambulance", category: "Emergency Ambulance", is24x7: true, isAvailable: true },
          { name: "24x7 Jan Aushadhi Pharmacy", category: "Pharmacy", is24x7: true, isAvailable: true }
        ]
      },
      hostels: {
        create: [
          {
            name: "Kelambakkam CHC Patient Attendant Rest House",
            type: "Government Dharmashala",
            totalRooms: 10,
            availableRooms: 4,
            bedCapacity: 20,
            availableBeds: 8,
            distanceFromHospitalMeters: 30,
            contactPerson: "M. Kumar (Caretaker)",
            contactPhone: "+91 94440 12013",
            dailyTariffInr: 0,
            facilitiesIncluded: "RO Drinking Water, Common Bathrooms, Charging Points, 24x7 Security"
          }
        ]
      },
      bedCapacity: {
        create: {
          totalBeds: 30,
          availableBeds: 12,
          icuBeds: 2,
          availableIcuBeds: 1,
          oxygenBeds: 8,
          availableOxygenBeds: 4,
          ventilatorBeds: 0,
          availableVentBeds: 0,
          maternityBeds: 6,
          availableMatBeds: 3
        }
      }
    }
  });

  // Hospital 4: Tambaram Sub-District Government Hospital (Tier 4: Sub-District Hospital)
  const h4 = await prisma.hospital.upsert({
    where: { name: "Tambaram Sub-District Government Hospital" },
    update: {},
    create: {
      name: "Tambaram Sub-District Government Hospital",
      code: "SDH-TN-CHG-004",
      tier: FacilityTier.SUB_DISTRICT_HOSPITAL,
      district: "Chengalpattu",
      state: "Tamil Nadu",
      pincode: "600047",
      address: "GST Road, Tambaram Sanatorium",
      latitude: 12.9249,
      longitude: 80.1309,
      contactPhone: "+91 94440 12004",
      emergencyHelpline: "108",
      isEmergency24x7: true,
      hasBloodBank: true,
      hasAmbulanceStation: true,
      isGovernment: true,
      isVerified: true,
      operatingHours: "24x7 Full Tertiary & Specialist Surgery",
      departments: {
        create: [
          { name: "General Surgery & Major OT", floorLocation: "2nd Floor", isOpen24x7: true },
          { name: "Orthopedics & Fracture Clinic", floorLocation: "1st Floor", isOpen24x7: true },
          { name: "Nephrology & Dialysis Unit", floorLocation: "3rd Floor", isOpen24x7: true },
          { name: "Blood Transfusion Services", floorLocation: "Ground Floor", isOpen24x7: true },
          { name: "Emergency & Trauma Resuscitation", floorLocation: "Ground Floor", isOpen24x7: true }
        ]
      },
      facilities: {
        create: [
          { name: "Major Operation Theatre", capacity: 2, availableUnits: 1 },
          { name: "Licensed Blood Storage Unit", capacity: 100, availableUnits: 65 },
          { name: "Dialysis Unit", capacity: 4, availableUnits: 2 },
          { name: "Intensive Care Unit (ICU)", capacity: 6, availableUnits: 2 }
        ]
      },
      equipment: {
        create: [
          { name: "Dialysis Machines", category: "Life Support", totalCount: 4, availableCount: 3, status: EquipmentStatus.OPERATIONAL },
          { name: "Biphasic Defibrillator with Pacing", category: "Life Support", totalCount: 4, availableCount: 4, status: EquipmentStatus.OPERATIONAL },
          { name: "Anesthesia Workstation", category: "Surgical", totalCount: 2, availableCount: 2, status: EquipmentStatus.OPERATIONAL }
        ]
      },
      diagnosticInstruments: {
        create: [
          { name: "Digital X-Ray 500mA", category: "Imaging", totalCount: 2, availableCount: 2, status: EquipmentStatus.OPERATIONAL },
          { name: "Fully Automated Biochemistry Analyzer", category: "Pathology", totalCount: 2, availableCount: 2, status: EquipmentStatus.OPERATIONAL }
        ]
      },
      medicalServices: {
        create: [
          { name: "108 Emergency Ambulance Unit", category: "Ambulance", is24x7: true, isAvailable: true },
          { name: "24x7 Blood Bank & Cross-Matching", category: "Blood Bank", is24x7: true, isAvailable: true }
        ]
      },
      hostels: {
        create: [
          {
            name: "Tambaram Government Patient Attendant Dormitory",
            type: "Attendant Rest House",
            totalRooms: 15,
            availableRooms: 6,
            bedCapacity: 30,
            availableBeds: 14,
            distanceFromHospitalMeters: 40,
            contactPerson: "R. Kannan",
            contactPhone: "+91 94440 12014",
            dailyTariffInr: 50,
            facilitiesIncluded: "Subsidized Food Canteen, Lockers, Hot Water, Wheelchair Accessible"
          }
        ]
      },
      bedCapacity: {
        create: {
          totalBeds: 100,
          availableBeds: 28,
          icuBeds: 6,
          availableIcuBeds: 2,
          oxygenBeds: 25,
          availableOxygenBeds: 10,
          ventilatorBeds: 2,
          availableVentBeds: 1,
          maternityBeds: 15,
          availableMatBeds: 6
        }
      }
    }
  });

  // Hospital 5: Chengalpattu Government District Headquarters Hospital & Medical College (Tier 5: District Hospital / Medical College)
  const h5 = await prisma.hospital.upsert({
    where: { name: "Chengalpattu Government District Headquarters Hospital" },
    update: {},
    create: {
      name: "Chengalpattu Government District Headquarters Hospital",
      code: "DH-TN-CHG-005",
      tier: FacilityTier.DISTRICT_HOSPITAL,
      district: "Chengalpattu",
      state: "Tamil Nadu",
      pincode: "603001",
      address: "GST Road, Chengalpattu",
      latitude: 12.6923,
      longitude: 79.9774,
      contactPhone: "+91 94440 12005",
      emergencyHelpline: "108",
      isEmergency24x7: true,
      hasBloodBank: true,
      hasAmbulanceStation: true,
      isGovernment: true,
      isVerified: true,
      operatingHours: "24x7 Full Tertiary Care, Polytrauma & Emergency",
      departments: {
        create: [
          { name: "Cardiology & Interventional Cath Lab", floorLocation: "Super Specialty Block - 1st Floor", isOpen24x7: true },
          { name: "Emergency & Polytrauma Level-1", floorLocation: "Trauma Block - Ground Floor", isOpen24x7: true },
          { name: "Neurology & Neurosurgery", floorLocation: "Super Specialty Block - 2nd Floor", isOpen24x7: true },
          { name: "Obstetrics & High-Risk Pregnancy", floorLocation: "Mother & Child Block", isOpen24x7: true },
          { name: "Pediatrics & Neonatal ICU (NICU)", floorLocation: "Mother & Child Block - 2nd Floor", isOpen24x7: true },
          { name: "Nephrology & 24x7 Dialysis", floorLocation: "Main Block - 2nd Floor", isOpen24x7: true },
          { name: "General Surgery & Modular OTs", floorLocation: "OT Complex - 3rd Floor", isOpen24x7: true }
        ]
      },
      facilities: {
        create: [
          { name: "Level-1 Polytrauma Care Centre", capacity: 20, availableUnits: 8 },
          { name: "Adult Intensive Care Unit (ICU)", capacity: 32, availableUnits: 8 },
          { name: "Neonatal Intensive Care Unit (NICU)", capacity: 24, availableUnits: 6 },
          { name: "Pediatric Intensive Care Unit (PICU)", capacity: 16, availableUnits: 4 },
          { name: "Modular Major Operation Theatres", capacity: 6, availableUnits: 3 },
          { name: "Model Blood Bank with Component Separation", capacity: 500, availableUnits: 320 },
          { name: "Interventional Cardiac Cath Lab", capacity: 2, availableUnits: 1 },
          { name: "24x7 Dialysis Centre", capacity: 12, availableUnits: 4 },
          { name: "Burn Care & Isolation Unit", capacity: 10, availableUnits: 3 }
        ]
      },
      equipment: {
        create: [
          { name: "Advanced Critical Care Ventilator", category: "Life Support", totalCount: 18, availableCount: 4, status: EquipmentStatus.OPERATIONAL },
          { name: "Central Liquid Medical Oxygen Plant (10,000L)", category: "Life Support", totalCount: 1, availableCount: 1, status: EquipmentStatus.OPERATIONAL },
          { name: "Cardiac Defibrillator with External Pacer", category: "Life Support", totalCount: 8, availableCount: 8, status: EquipmentStatus.OPERATIONAL },
          { name: "Infant Intensive Care Incubator", category: "Life Support", totalCount: 12, availableCount: 4, status: EquipmentStatus.OPERATIONAL },
          { name: "High-Flow Nasal Cannula (HFNC) & BiPAP", category: "Respiratory", totalCount: 15, availableCount: 6, status: EquipmentStatus.OPERATIONAL },
          { name: "Hemodialysis Machines", category: "Life Support", totalCount: 12, availableCount: 4, status: EquipmentStatus.OPERATIONAL }
        ]
      },
      diagnosticInstruments: {
        create: [
          { name: "128-Slice Multi-Detector CT Scanner", category: "Imaging", totalCount: 1, availableCount: 1, status: EquipmentStatus.OPERATIONAL },
          { name: "1.5T Superconducting MRI Machine", category: "Imaging", totalCount: 1, availableCount: 1, status: EquipmentStatus.OPERATIONAL },
          { name: "Echocardiography (Echo) Color Doppler", category: "Cardiac", totalCount: 3, availableCount: 3, status: EquipmentStatus.OPERATIONAL },
          { name: "Digital Subtraction Angiography (DSA)", category: "Cardiac", totalCount: 1, availableCount: 1, status: EquipmentStatus.OPERATIONAL },
          { name: "Automated Clinical Chemistry & Coagulation Analyzer", category: "Pathology", totalCount: 4, availableCount: 4, status: EquipmentStatus.OPERATIONAL }
        ]
      },
      medicalServices: {
        create: [
          { name: "108 Advanced Life Support (ALS) Ambulance Hub", category: "Emergency Ambulance", is24x7: true, isAvailable: true, contactDetails: "Call 108" },
          { name: "102 Janani Shishu Suraksha Karyakram (JSSK)", category: "Maternal Transport", is24x7: true, isAvailable: true },
          { name: "24x7 Model Blood Bank & Platelet Apherisis", category: "Blood Bank", is24x7: true, isAvailable: true },
          { name: "Telemedicine Tele-Consultation Hub", category: "Telemedicine", is24x7: true, isAvailable: true }
        ]
      },
      hostels: {
        create: [
          {
            name: "Chengalpattu GH Government Patient Attendant Dharmashala",
            type: "Government Free Rest House / Dharmashala",
            totalRooms: 60,
            availableRooms: 22,
            bedCapacity: 120,
            availableBeds: 45,
            distanceFromHospitalMeters: 60,
            contactPerson: "S. Murugan (Warden)",
            contactPhone: "+91 94440 12015",
            dailyTariffInr: 0,
            facilitiesIncluded: "Free Clean Bedding, RO Drinking Water, Free Subsidized Amma Canteen nearby, Lockers, 24x7 Security Guard, Wheelchair Ramps"
          }
        ]
      },
      bedCapacity: {
        create: {
          totalBeds: 450,
          availableBeds: 85,
          icuBeds: 32,
          availableIcuBeds: 8,
          oxygenBeds: 180,
          availableOxygenBeds: 45,
          ventilatorBeds: 18,
          availableVentBeds: 4,
          maternityBeds: 60,
          availableMatBeds: 18
        }
      }
    }
  });

  // Link Doctor to Chengalpattu GH
  await prisma.doctorProfile.update({
    where: { userId: doctorUser1.id },
    data: { hospitalId: h5.id }
  });
  await prisma.doctorProfile.update({
    where: { userId: doctorUser2.id },
    data: { hospitalId: h5.id }
  });

  // -------------------------------------------------------------------------
  // 4. Seed Patient Medical History, Visits, Diagnoses, Prescriptions
  // -------------------------------------------------------------------------
  console.log("📋 [Seed] Seeding patient clinical history, previous visits, diagnoses, prescriptions, and reports...");

  const pat1Profile = await prisma.patientProfile.findUnique({ where: { userId: patientUser1.id } });
  const pat2Profile = await prisma.patientProfile.findUnique({ where: { userId: patientUser2.id } });
  const pat3Profile = await prisma.patientProfile.findUnique({ where: { userId: patientUser3.id } });
  const doc1Profile = await prisma.doctorProfile.findUnique({ where: { userId: doctorUser1.id } });
  const aha1Profile = await prisma.aHAWorkerProfile.findUnique({ where: { userId: ahaUser.id } });

  if (pat1Profile && doc1Profile) {
    // Medical History for Patient 1
    await prisma.patientMedicalHistory.upsert({
      where: { patientProfileId: pat1Profile.id },
      update: {},
      create: {
        patientProfileId: pat1Profile.id,
        bloodGroup: "O+",
        allergies: ["Penicillin", "Sulfa drugs"],
        chronicConditions: ["Essential Hypertension", "Dyslipidemia", "Mild CAD history"],
        pastSurgeries: ["Appendectomy (2018)"],
        familyHistory: "Father had myocardial infarction at age 58; Mother has Type 2 Diabetes",
        immunizations: ["Tetanus Toxoid (2024)", "COVID-19 Booster (2023)", "Hepatitis B"],
        smokingStatus: "Former smoker (Quit 2 years ago)",
        alcoholConsumption: "Occasional",
        dietaryPreference: "Non-Vegetarian (Low Sodium)"
      }
    });

    // Patient 1 Previous Visit
    const visit1 = await prisma.patientVisit.create({
      data: {
        patientProfileId: pat1Profile.id,
        hospitalId: h5.id,
        doctorId: doc1Profile.id,
        visitDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
        chiefComplaint: "Exertional chest tightness, elevated BP (160/95 mmHg), mild shortness of breath",
        triagePriority: TriagePriority.P2_URGENT,
        systolicBp: 160,
        diastolicBp: 95,
        heartRate: 88,
        spo2: 96,
        respiratoryRate: 20,
        temperature: 98.6,
        clinicalSummary: "Patient presented with stage 2 hypertension and angina pectoris symptoms on exertion. ECG showed non-specific ST changes. Prescribed dual antihypertensives and statin therapy. Advised lifestyle modifications and scheduled 2-week AHA home checkup.",
        dischargeSummary: "Discharged in hemodynamically stable condition. Red-flag instructions given for acute retrosternal chest pain >15 mins.",
        followUpDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        status: "COMPLETED"
      }
    });

    // Diagnosis for Patient 1
    await prisma.diagnosis.create({
      data: {
        patientProfileId: pat1Profile.id,
        visitId: visit1.id,
        doctorId: doc1Profile.id,
        conditionName: "Essential Hypertension (Stage 2)",
        icdCode: "I10",
        diagnosisType: DiagnosisType.CONFIRMED,
        severity: SeverityLevel.MODERATE,
        clinicalNotes: "Blood pressure elevated above 160/95 mmHg. Requires regular monitoring and sodium reduction."
      }
    });

    await prisma.diagnosis.create({
      data: {
        patientProfileId: pat1Profile.id,
        visitId: visit1.id,
        doctorId: doc1Profile.id,
        conditionName: "Angina Pectoris / Stable CAD",
        icdCode: "I20.9",
        diagnosisType: DiagnosisType.PROVISIONAL,
        severity: SeverityLevel.MODERATE,
        clinicalNotes: "Exertional retrosternal discomfort relieved by rest."
      }
    });

    // Prescriptions for Patient 1
    await prisma.prescription.create({
      data: {
        patientProfileId: pat1Profile.id,
        visitId: visit1.id,
        doctorId: doc1Profile.id,
        medicationName: "Telmisartan 40mg + Amlodipine 5mg",
        dosage: "1 tablet",
        frequency: "Once daily morning after food (1-0-0)",
        duration: "30 days",
        instructions: "Do not miss doses. Monitor blood pressure weekly.",
        status: PrescriptionStatus.ACTIVE
      }
    });

    await prisma.prescription.create({
      data: {
        patientProfileId: pat1Profile.id,
        visitId: visit1.id,
        doctorId: doc1Profile.id,
        medicationName: "Atorvastatin 20mg",
        dosage: "1 tablet",
        frequency: "Once daily night before bed (0-0-1)",
        duration: "30 days",
        instructions: "Take at bedtime.",
        status: PrescriptionStatus.ACTIVE
      }
    });

    await prisma.prescription.create({
      data: {
        patientProfileId: pat1Profile.id,
        visitId: visit1.id,
        doctorId: doc1Profile.id,
        medicationName: "Sorbitrate (Isosorbide Dinitrate) 5mg",
        dosage: "1 tablet sublingual",
        frequency: "SOS as needed for acute chest pain",
        duration: "10 days",
        instructions: "Keep under tongue if severe chest pain occurs; call 108 immediately.",
        status: PrescriptionStatus.ACTIVE
      }
    });

    // Test Reports for Patient 1
    await prisma.testReport.create({
      data: {
        patientProfileId: pat1Profile.id,
        visitId: visit1.id,
        reviewedByDoctorId: doc1Profile.id,
        testName: "12-Lead Electrocardiogram (ECG)",
        category: "Cardiac",
        testDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        resultSummary: "Normal sinus rhythm at 88 bpm. PR interval 160ms. Mild T-wave flattening in V5-V6. No acute STEMI elevation.",
        referenceRange: "Normal Sinus Rhythm (60-100 bpm)",
        isAbnormal: false,
        status: "FINAL"
      }
    });

    await prisma.testReport.create({
      data: {
        patientProfileId: pat1Profile.id,
        visitId: visit1.id,
        reviewedByDoctorId: doc1Profile.id,
        testName: "Lipid Profile & Serum Electrolytes",
        category: "Laboratory",
        testDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        resultSummary: "Total Cholesterol: 228 mg/dL (High), LDL: 145 mg/dL (High), HDL: 42 mg/dL, Triglycerides: 185 mg/dL, Serum K+: 4.2 mEq/L, Creatinine: 0.9 mg/dL",
        referenceRange: "Total Cholesterol < 200 mg/dL, LDL < 100 mg/dL",
        isAbnormal: true,
        status: "FINAL"
      }
    });

    // Patient 1 Care Plan
    await prisma.patientCarePlan.create({
      data: {
        patientProfileId: pat1Profile.id,
        title: "Cardiovascular & Hypertension Management Care Plan",
        description: "Comprehensive home protocol to regulate blood pressure and prevent cardiac adverse events.",
        targetGoals: [
          "Target Blood Pressure < 130/80 mmHg",
          "Daily salt intake < 4 grams (Low Sodium Diet)",
          "Brisk walking 30 minutes 5 days a week",
          "100% medication compliance"
        ],
        dietaryGuidelines: "DASH Diet: High fiber, leafy vegetables, fruits, no added salt, avoid deep-fried foods.",
        activityGuidelines: "Moderate aerobic exercise (walking). Avoid sudden strenuous heavy lifting.",
        medicationPlan: "Telmisartan-Amlodipine in morning, Atorvastatin at night.",
        checkupFrequencyDays: 14,
        isActive: true
      }
    });
  }

  // -------------------------------------------------------------------------
  // 5. Seed AHA Worker Assignments, Configurable Checklists & Checkups
  // -------------------------------------------------------------------------
  console.log("👩‍⚕️ [Seed] Seeding AHA worker assignments, configurable checklist templates and checkup records...");

  if (aha1Profile && pat1Profile && pat2Profile && pat3Profile) {
    // Assign Patients to AHA Worker
    await prisma.aHAWorkerAssignment.upsert({
      where: {
        ahaWorkerProfileId_patientProfileId: {
          ahaWorkerProfileId: aha1Profile.id,
          patientProfileId: pat1Profile.id
        }
      },
      update: {},
      create: {
        ahaWorkerProfileId: aha1Profile.id,
        patientProfileId: pat1Profile.id,
        priority: SeverityLevel.HIGH,
        notes: "High priority: Hypertension & CAD history. Requires bi-weekly BP check and medication adherence verification."
      }
    });

    await prisma.aHAWorkerAssignment.upsert({
      where: {
        ahaWorkerProfileId_patientProfileId: {
          ahaWorkerProfileId: aha1Profile.id,
          patientProfileId: pat2Profile.id
        }
      },
      update: {},
      create: {
        ahaWorkerProfileId: aha1Profile.id,
        patientProfileId: pat2Profile.id,
        priority: SeverityLevel.MODERATE,
        notes: "Maternal & respiratory follow-up."
      }
    });

    await prisma.aHAWorkerAssignment.upsert({
      where: {
        ahaWorkerProfileId_patientProfileId: {
          ahaWorkerProfileId: aha1Profile.id,
          patientProfileId: pat3Profile.id
        }
      },
      update: {},
      create: {
        ahaWorkerProfileId: aha1Profile.id,
        patientProfileId: pat3Profile.id,
        priority: SeverityLevel.LOW,
        notes: "Routine quarterly wellness follow-up."
      }
    });

    // Checkup Schedules
    const schedule1 = await prisma.checkupSchedule.create({
      data: {
        patientProfileId: pat1Profile.id,
        title: "Bi-Weekly Blood Pressure & Vitals Verification",
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // Due in 2 days
        frequencyDays: 14,
        status: CheckupStatus.PENDING,
        notes: "Measure SpO2, Heart Rate, and Blood Pressure. Check if patient took morning Telmisartan."
      }
    });

    await prisma.checkupSchedule.create({
      data: {
        patientProfileId: pat2Profile.id,
        title: "Maternal Wellness & Antenatal Checkup",
        dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // Overdue by 1 day (MISSED)
        frequencyDays: 14,
        status: CheckupStatus.MISSED,
        notes: "Urgent follow-up needed: missed scheduled home visit yesterday."
      }
    });

    // Configurable Checklist Template
    await prisma.checklistTemplate.create({
      data: {
        title: "National Health Mission — Standard AHA/ASHA Rural Home Health Visit Checklist",
        category: "Home Checkup & Triage",
        version: 1,
        isActive: true,
        itemsJson: [
          {
            id: "step_1",
            step: 1,
            title: "Visit Patient & Verify Identity",
            description: "Confirm patient name, ABHA ID, and living environment safety.",
            required: true,
            type: "boolean"
          },
          {
            id: "step_2",
            step: 2,
            title: "Check General Condition & Clinical Vitals",
            description: "Record SpO2 (%), Pulse (bpm), Blood Pressure (mmHg), Temp (°F), and Random Blood Sugar (mg/dL).",
            required: true,
            type: "vitals_form"
          },
          {
            id: "step_3",
            step: 3,
            title: "Confirm Medication Adherence",
            description: "Inspect pill strips and verify patient is taking prescribed daily medicines on schedule.",
            required: true,
            type: "boolean"
          },
          {
            id: "step_4",
            step: 4,
            title: "Check Prescribed Follow-Up Requirements",
            description: "Verify if scheduled laboratory tests or hospital doctor visits were completed.",
            required: true,
            type: "boolean"
          },
          {
            id: "step_5",
            step: 5,
            title: "Inquire About New Symptoms",
            description: "Ask patient regarding chest discomfort, breathlessness, dizziness, fever, or swelling.",
            required: true,
            type: "symptom_multiselect"
          },
          {
            id: "step_6",
            step: 6,
            title: "Record Field Observations",
            description: "Note hydration, dietary intake, mobility, and family support observations.",
            required: false,
            type: "text"
          },
          {
            id: "step_7",
            step: 7,
            title: "Escalate Concerning Findings & Complete Visit Record",
            description: "If vitals abnormal or red flags identified, trigger instant notification to PHC Medical Officer.",
            required: true,
            type: "escalation_trigger"
          }
        ]
      }
    });

    // Sample Previous Completed Checkup for Patient 1
    await prisma.aHACheckup.create({
      data: {
        ahaWorkerProfileId: aha1Profile.id,
        patientProfileId: pat1Profile.id,
        visitDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        spo2: 97.0,
        heartRate: 82,
        systolicBp: 135,
        diastolicBp: 88,
        bloodGlucoseMgDl: 118,
        temperature: 98.4,
        checklistResponses: {
          step_1: { completed: true, notes: "Visited home in Thiruporur." },
          step_2: { completed: true, vitals: { spo2: 97, hr: 82, bp: "135/88", rbs: 118, temp: 98.4 } },
          step_3: { completed: true, adherent: true, notes: "Taking Telmisartan regularly." },
          step_4: { completed: true, followUpDone: true },
          step_5: { completed: true, newSymptoms: ["Mild evening fatigue"] },
          step_6: { completed: true, observations: "Patient in good spirits, following reduced salt diet." },
          step_7: { completed: true, escalated: false }
        },
        medicationAdherence: true,
        symptomsReported: ["Mild evening fatigue"],
        observations: "Blood pressure improved from 160/95 to 135/88 mmHg. Patient adhering to medication.",
        isEscalatedToDoctor: false,
        status: "COMPLETED"
      }
    });
  }

  // -------------------------------------------------------------------------
  // 6. Seed Notifications & Audit Logs
  // -------------------------------------------------------------------------
  console.log("🔔 [Seed] Seeding initial notifications and audit logs...");

  await prisma.notification.createMany({
    data: [
      {
        userId: patientUser1.id,
        title: "Upcoming AHA Health Checkup",
        message: "AHA Worker Anitha Selvam is scheduled to visit your home on Saturday for routine vitals check.",
        type: "CHECKUP_REMINDER"
      },
      {
        userId: ahaUser.id,
        title: "Missed Visit Alert",
        message: "Mary Smith's scheduled antenatal follow-up is overdue by 1 day. Please prioritize.",
        type: "WARNING"
      },
      {
        userId: doctorUser1.id,
        title: "Clinical Triage Queue Updated",
        message: "New patient referral assessments ready for clinical review.",
        type: "INFO"
      },
      {
        userId: adminUser.id,
        title: "System Initialization Complete",
        message: "Neon PostgreSQL database schema and verified hospital tiers seeded successfully.",
        type: "INFO"
      }
    ]
  });

  await prisma.auditLog.createMany({
    data: [
      {
        actorUserId: adminUser.id,
        action: "INITIALIZE_SYSTEM",
        entity: "Database",
        entityId: "Neon-PostgreSQL-MediBot1",
        details: { message: "Seeded 5 healthcare facilities, 4 user roles, and full clinical ontology." },
        ipAddress: "127.0.0.1"
      }
    ]
  });

  console.log("✅ [Seed] Database seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ [Seed Error]:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
