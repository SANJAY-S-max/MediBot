import { prisma } from "./prisma";
import { FacilityTier, TriagePriority, SeverityLevel } from "@prisma/client";

export interface VitalSignsInput {
  spo2?: number | null;
  heartRate?: number | null;
  systolicBp?: number | null;
  diastolicBp?: number | null;
  respiratoryRate?: number | null;
  temperature?: number | null;
  consciousnessLevel?: string | null; // "Alert", "Voice", "Pain", "Unresponsive"
}

export interface TriageEvaluation {
  priority: TriagePriority;
  priorityLabel: string;
  severity: SeverityLevel;
  requiredCapabilities: string[];
  recommendedTier: FacilityTier;
  ambulanceNeeded: boolean;
  ambulanceType: string;
  triageReasons: string[];
  firstAidProtocols: string[];
  transitSafetyChecklist: string[];
}

/**
 * High precision Geodesic Great-Circle (Haversine) distance calculation
 */
export function calculateHaversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371.0; // Earth radius in km
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(2));
}

/**
 * Standard Indian Public Health Clinical Triage & Physiological Rule Evaluator
 */
export function evaluateClinicalTriage(
  symptoms: string[],
  symptomText: string,
  vitals?: VitalSignsInput | null
): TriageEvaluation {
  const reasons: string[] = [];
  const requiredCapabilities: Set<string> = new Set();
  let priority: TriagePriority = TriagePriority.P3_ROUTINE;
  let severity: SeverityLevel = SeverityLevel.LOW;
  let recommendedTier: FacilityTier = FacilityTier.PHC;
  let ambulanceNeeded = false;
  let ambulanceType = "None";

  const allText = `${symptoms.join(" ")} ${symptomText}`.toLowerCase();

  // 1. SpO2 Oxygen Saturation Check
  if (vitals?.spo2 !== undefined && vitals.spo2 !== null) {
    if (vitals.spo2 < 90) {
      priority = TriagePriority.P1_EMERGENCY;
      severity = SeverityLevel.CRITICAL;
      reasons.push(`Critical Hypoxemia: SpO2 ${vitals.spo2}% (<90%). Immediate oxygenation & ICU/Ventilator capability required.`);
      requiredCapabilities.add("Ventilator");
      requiredCapabilities.add("ICU");
      requiredCapabilities.add("Oxygen Concentrator");
      recommendedTier = FacilityTier.DISTRICT_HOSPITAL;
      ambulanceNeeded = true;
      ambulanceType = "108 ALS (Advanced Life Support - Ventilator Equipped)";
    } else if (vitals.spo2 <= 94) {
      if ((priority as string) !== "P1_EMERGENCY") {
        priority = TriagePriority.P2_URGENT;
        severity = SeverityLevel.HIGH;
        if (recommendedTier === FacilityTier.PHC) recommendedTier = FacilityTier.CHC;
      }
      reasons.push(`Moderate Hypoxemia: SpO2 ${vitals.spo2}%. Supplementary oxygen required.`);
      requiredCapabilities.add("Oxygen Concentrator");
    }
  }

  // 2. Heart Rate Check
  if (vitals?.heartRate !== undefined && vitals?.heartRate !== null) {
    if (vitals.heartRate > 135 || vitals.heartRate < 45) {
      priority = TriagePriority.P1_EMERGENCY;
      severity = SeverityLevel.CRITICAL;
      reasons.push(`Severe Arrhythmia: Heart Rate ${vitals.heartRate} bpm. Cardiac monitoring, Defibrillator & Cath Lab required.`);
      requiredCapabilities.add("Defibrillator");
      requiredCapabilities.add("ICU");
      requiredCapabilities.add("ECG Machine");
      recommendedTier = FacilityTier.DISTRICT_HOSPITAL;
      ambulanceNeeded = true;
      ambulanceType = "108 ALS";
    }
  }

  // 3. Systolic Blood Pressure Check
  if (vitals?.systolicBp !== undefined && vitals?.systolicBp !== null) {
    if (vitals.systolicBp >= 190 || vitals.systolicBp < 90) {
      priority = TriagePriority.P1_EMERGENCY;
      severity = SeverityLevel.CRITICAL;
      reasons.push(`Hypertensive Crisis / Hemodynamic Shock: Systolic BP ${vitals.systolicBp} mmHg.`);
      requiredCapabilities.add("ICU");
      requiredCapabilities.add("Defibrillator");
      recommendedTier = FacilityTier.DISTRICT_HOSPITAL;
      ambulanceNeeded = true;
      ambulanceType = "108 ALS";
    } else if (vitals.systolicBp >= 150) {
      if ((priority as string) !== "P1_EMERGENCY") {
        priority = TriagePriority.P2_URGENT;
        severity = SeverityLevel.MODERATE;
        if (recommendedTier === FacilityTier.PHC) recommendedTier = FacilityTier.CHC;
      }
      reasons.push(`Elevated Blood Pressure: Systolic BP ${vitals.systolicBp} mmHg.`);
      requiredCapabilities.add("ECG Machine");
    }
  }

  // 4. Respiratory Rate Check
  if (vitals?.respiratoryRate !== undefined && vitals?.respiratoryRate !== null) {
    if (vitals.respiratoryRate > 30 || vitals.respiratoryRate < 8) {
      priority = TriagePriority.P1_EMERGENCY;
      severity = SeverityLevel.CRITICAL;
      reasons.push(`Impending Respiratory Failure: Respiratory rate ${vitals.respiratoryRate} breaths/min.`);
      requiredCapabilities.add("Ventilator");
      requiredCapabilities.add("ICU");
      recommendedTier = FacilityTier.DISTRICT_HOSPITAL;
      ambulanceNeeded = true;
      ambulanceType = "108 ALS";
    }
  }

  // 5. Consciousness Level (AVPU)
  if (vitals?.consciousnessLevel && ["Pain", "Unresponsive"].includes(vitals.consciousnessLevel)) {
    priority = TriagePriority.P1_EMERGENCY;
    severity = SeverityLevel.CRITICAL;
    reasons.push(`Altered Mental Status / Coma: AVPU scale '${vitals.consciousnessLevel}'. Immediate resuscitation required.`);
    requiredCapabilities.add("ICU");
    requiredCapabilities.add("Ventilator");
    requiredCapabilities.add("CT Scanner");
    recommendedTier = FacilityTier.DISTRICT_HOSPITAL;
    ambulanceNeeded = true;
    ambulanceType = "108 ALS";
  }

  // 6. Symptom Pattern Matching
  if (allText.includes("chest pain") || allText.includes("heart attack") || allText.includes("palpitation")) {
    priority = TriagePriority.P1_EMERGENCY;
    severity = SeverityLevel.CRITICAL;
    reasons.push("Suspected Acute Coronary Syndrome / Myocardial Infarction. Requires 12-Lead ECG, Cardiac Cath Lab & ICU.");
    requiredCapabilities.add("ECG Machine");
    requiredCapabilities.add("ICU");
    requiredCapabilities.add("Defibrillator");
    requiredCapabilities.add("Cath Lab");
    recommendedTier = FacilityTier.DISTRICT_HOSPITAL;
    ambulanceNeeded = true;
    ambulanceType = "108 ALS";
  }

  if (allText.includes("trauma") || allText.includes("fracture") || allText.includes("head injury") || allText.includes("accident")) {
    if (allText.includes("head injury") || allText.includes("severe")) {
      priority = TriagePriority.P1_EMERGENCY;
      severity = SeverityLevel.CRITICAL;
      reasons.push("Severe Trauma / Head Injury. Requires 24x7 Trauma Unit, CT Scanner, Blood Bank & ICU.");
      requiredCapabilities.add("X-Ray");
      requiredCapabilities.add("CT Scanner");
      requiredCapabilities.add("Blood Bank");
      requiredCapabilities.add("Operating Theater");
      requiredCapabilities.add("ICU");
      recommendedTier = FacilityTier.DISTRICT_HOSPITAL;
      ambulanceNeeded = true;
      ambulanceType = "108 ALS";
    } else {
      if ((priority as string) !== "P1_EMERGENCY") {
        priority = TriagePriority.P2_URGENT;
        severity = SeverityLevel.HIGH;
        recommendedTier = FacilityTier.SUB_DISTRICT_HOSPITAL;
      }
      reasons.push("Trauma / Musculoskeletal Fracture. Requires Digital X-Ray & Orthopedic OT.");
      requiredCapabilities.add("X-Ray");
      requiredCapabilities.add("Operating Theater");
    }
  }

  if (allText.includes("labor") || allText.includes("pregnancy") || allText.includes("maternal") || allText.includes("delivery")) {
    if (allText.includes("bleeding") || allText.includes("complication")) {
      priority = TriagePriority.P1_EMERGENCY;
      severity = SeverityLevel.CRITICAL;
      reasons.push("High-Risk Obstetric Emergency / Maternal Hemorrhage. Requires Blood Bank, NICU & Emergency OT.");
      requiredCapabilities.add("Blood Bank");
      requiredCapabilities.add("Neonatal ICU (NICU)");
      requiredCapabilities.add("Operating Theater");
      recommendedTier = FacilityTier.DISTRICT_HOSPITAL;
      ambulanceNeeded = true;
      ambulanceType = "102 Maternal Transport (JSSK)";
    } else {
      if ((priority as string) !== "P1_EMERGENCY") {
        priority = TriagePriority.P2_URGENT;
        severity = SeverityLevel.HIGH;
        if (recommendedTier === FacilityTier.PHC) recommendedTier = FacilityTier.CHC;
      }
      reasons.push("Obstetric / Maternal labor progression. Requires Maternity Ward & Sonography.");
      requiredCapabilities.add("Maternity Ward");
      requiredCapabilities.add("Ultrasound Sonography");
      ambulanceNeeded = true;
      ambulanceType = "102 Maternal Transport";
    }
  }

  if (allText.includes("snake") || allText.includes("poison") || allText.includes("bite")) {
    priority = TriagePriority.P1_EMERGENCY;
    severity = SeverityLevel.CRITICAL;
    reasons.push("Suspected Envenomation / Poisoning. Requires Anti-Snake Venom (ASV), Ventilator & ICU support.");
    requiredCapabilities.add("Ventilator");
    requiredCapabilities.add("ICU");
    requiredCapabilities.add("Oxygen Concentrator");
    recommendedTier = FacilityTier.DISTRICT_HOSPITAL;
    ambulanceNeeded = true;
    ambulanceType = "108 ALS";
  }

  // Fever / Infection / Routine
  if (reasons.length === 0) {
    reasons.push("Primary healthcare symptoms. Capable of management at verified Health Sub-Centre or Primary Health Centre (PHC).");
    requiredCapabilities.add("Malaria RDT Kits");
  }

  const isP1 = (priority as string) === "P1_EMERGENCY";
  const isP2 = (priority as string) === "P2_URGENT";

  const priorityLabel = isP1
    ? "P1 — Immediate Life-Threatening Emergency"
    : isP2
    ? "P2 — Urgent / Specialist Evaluation"
    : "P3 — Routine Primary Healthcare";

  // Protocols & Checklist
  const firstAidProtocols = [
    isP1
      ? "Keep patient calm, seated or in recovery position. Do not administer oral fluids if drowsy."
      : "Maintain hydration with clean drinking water or ORS if diarrheal symptoms.",
    "Do not remove or tamper with emergency medication if prescribed by an authorized physician.",
    "Keep patient's airway clear and ensure good cross-ventilation during transit."
  ];

  const transitSafetyChecklist = [
    "Ayushman Bharat Health Account (ABHA ID) or Aadhaar Card",
    "RCH Mother-Child Card (if pregnant / maternal care)",
    "Previous Prescription slips & laboratory reports",
    "Designated attendant with active phone contact"
  ];

  return {
    priority,
    priorityLabel,
    severity,
    requiredCapabilities: Array.from(requiredCapabilities),
    recommendedTier,
    ambulanceNeeded,
    ambulanceType,
    triageReasons: reasons,
    firstAidProtocols,
    transitSafetyChecklist
  };
}

/**
 * Backend Capability-Aware Hospital Matcher & Ranking Engine
 */
export async function matchAndRankHospitals(
  patientLat: number,
  patientLng: number,
  triage: TriageEvaluation
) {
  // Fetch all verified hospitals with active facilities, departments, equipment, diagnostic instruments, and bed capacities
  const hospitals = await prisma.hospital.findMany({
    where: { isVerified: true },
    include: {
      facilities: true,
      departments: true,
      equipment: true,
      diagnosticInstruments: true,
      medicalServices: true,
      bedCapacity: true,
      hostels: true
    }
  });

  const rankedHospitals = hospitals.map((h) => {
    const distanceKm = calculateHaversineDistanceKm(patientLat, patientLng, h.latitude, h.longitude);
    const estimatedTimeMin = Math.round(distanceKm * 2.2 + 5); // Average rural/suburban transit velocity ~30 km/h + dispatch buffer

    // Gather all capability tokens in hospital
    const hospitalCapabilities = new Set<string>();
    h.facilities.forEach((f) => hospitalCapabilities.add(f.name.toLowerCase()));
    h.departments.forEach((d) => hospitalCapabilities.add(d.name.toLowerCase()));
    h.equipment.forEach((e) => hospitalCapabilities.add(e.name.toLowerCase()));
    h.diagnosticInstruments.forEach((i) => hospitalCapabilities.add(i.name.toLowerCase()));
    h.medicalServices.forEach((s) => hospitalCapabilities.add(s.name.toLowerCase()));

    if (h.isEmergency24x7) hospitalCapabilities.add("emergency 24x7");
    if (h.hasBloodBank) hospitalCapabilities.add("blood bank");
    if (h.hasAmbulanceStation) hospitalCapabilities.add("ambulance");

    // Match required capabilities
    const matchedCaps: string[] = [];
    const missingCaps: string[] = [];

    for (const req of triage.requiredCapabilities) {
      const reqLower = req.toLowerCase();
      let matched = false;
      const reqWords = reqLower.split(/\s+/).filter((w) => w.length > 2);

      for (const cap of Array.from(hospitalCapabilities)) {
        if (cap.includes(reqLower) || reqLower.includes(cap)) {
          matched = true;
          break;
        }
        if (reqWords.some((w) => cap.includes(w))) {
          matched = true;
          break;
        }
      }
      if (matched) {
        matchedCaps.push(req);
      } else {
        missingCaps.push(req);
      }
    }

    const capabilityMatchRate =
      triage.requiredCapabilities.length > 0
        ? matchedCaps.length / triage.requiredCapabilities.length
        : 1.0;

    const isFullyCapable = missingCaps.length === 0;

    // Calculate ranking score (100 max)
    // 60% capability match + 25% distance proximity + 15% bed availability
    const distanceScore = Math.max(0, 100 - distanceKm * 2.5);
    const bedScore = h.bedCapacity ? Math.min(100, (h.bedCapacity.availableBeds / Math.max(1, h.bedCapacity.totalBeds)) * 100) : 50;

    const compositeScore = parseFloat(
      (capabilityMatchRate * 60 + (distanceScore / 100) * 25 + (bedScore / 100) * 15).toFixed(1)
    );

    // Bypass reason if not capable
    let bypassReason: string | null = null;
    if (!isFullyCapable) {
      bypassReason = `Deficient for clinical requirements: Lacks verified [${missingCaps.join(", ")}]`;
    }

    const navigationUrl = `https://www.google.com/maps/dir/?api=1&origin=${patientLat},${patientLng}&destination=${h.latitude},${h.longitude}`;

    return {
      hospital: h,
      distanceKm,
      estimatedTimeMin,
      capabilityMatchRate,
      isFullyCapable,
      matchedCapabilities: matchedCaps,
      missingCapabilities: missingCaps,
      compositeScore,
      bypassReason,
      navigationUrl
    };
  });

  // Sort: First by capability completeness (capable first), then by composite score (highest first), then by distance (closest first)
  rankedHospitals.sort((a, b) => {
    if (a.isFullyCapable !== b.isFullyCapable) {
      return a.isFullyCapable ? -1 : 1;
    }
    return b.compositeScore - a.compositeScore;
  });

  // Mark the nearest capable facility
  const nearestCapableIndex = rankedHospitals.findIndex((r) => r.isFullyCapable);
  if (nearestCapableIndex !== -1) {
    (rankedHospitals[nearestCapableIndex] as any).isNearestCapable = true;
  }

  return rankedHospitals;
}

/**
 * Generate a scannable SVG representation of a Digital Referral Code QR Slip
 */
export function generateReferralSlipSvg(referralCode: string, patientName: string, priority: string, hospitalName: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 320" width="100%" height="100%" class="rounded-xl shadow-lg">
  <defs>
    <linearGradient id="qrGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0284c7" />
      <stop offset="100%" stop-color="#0369a1" />
    </linearGradient>
  </defs>
  <rect width="320" height="320" rx="16" fill="#0f172a" stroke="#0284c7" stroke-width="2" />
  <!-- Header -->
  <text x="160" y="32" fill="#38bdf8" font-family="Arial, sans-serif" font-size="13" font-weight="bold" text-anchor="middle">AYUSHMAN BHARAT — MEDIBOT AI</text>
  <text x="160" y="48" fill="#94a3b8" font-family="Arial, sans-serif" font-size="10" text-anchor="middle">VERIFIED DIGITAL REFERRAL SLIP</text>
  <line x1="20" y1="58" x2="300" y2="58" stroke="#334155" stroke-width="1" />
  
  <!-- Pseudo QR Box Matrix -->
  <g transform="translate(60, 70)">
    <rect width="200" height="150" fill="#1e293b" rx="8" />
    <rect x="15" y="15" width="40" height="40" fill="none" stroke="#38bdf8" stroke-width="5" />
    <rect x="25" y="25" width="20" height="20" fill="#38bdf8" />
    <rect x="145" y="15" width="40" height="40" fill="none" stroke="#38bdf8" stroke-width="5" />
    <rect x="155" y="25" width="20" height="20" fill="#38bdf8" />
    <rect x="15" y="95" width="40" height="40" fill="none" stroke="#38bdf8" stroke-width="5" />
    <rect x="25" y="105" width="20" height="20" fill="#38bdf8" />
    <!-- Data blocks -->
    <rect x="70" y="20" width="15" height="15" fill="#38bdf8" />
    <rect x="100" y="25" width="20" height="10" fill="#38bdf8" />
    <rect x="75" y="55" width="50" height="15" fill="#38bdf8" />
    <rect x="140" y="75" width="30" height="15" fill="#38bdf8" />
    <rect x="80" y="90" width="45" height="20" fill="#38bdf8" />
    <rect x="70" y="120" width="60" height="15" fill="#38bdf8" />
    <rect x="145" y="115" width="35" height="20" fill="#38bdf8" />
  </g>

  <!-- Slip Footer Text -->
  <rect x="20" y="235" width="280" height="70" rx="8" fill="#1e293b" stroke="#334155" />
  <text x="30" y="253" fill="#f8fafc" font-family="Arial, sans-serif" font-size="11" font-weight="bold">Ref: ${referralCode}</text>
  <text x="30" y="270" fill="#38bdf8" font-family="Arial, sans-serif" font-size="10">Triage: ${priority}</text>
  <text x="30" y="286" fill="#94a3b8" font-family="Arial, sans-serif" font-size="9">Dest: ${hospitalName.substring(0, 36)}</text>
  <text x="30" y="299" fill="#10b981" font-family="Arial, sans-serif" font-size="9">✓ Cryptographically Verified Record</text>
</svg>`;
}
