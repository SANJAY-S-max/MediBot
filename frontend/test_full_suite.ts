import { prisma } from "./lib/prisma";
import { evaluateClinicalTriage, matchAndRankHospitals } from "./lib/recommendationEngine";
import { performSystemHealthCheck } from "./lib/health";
import { TriagePriority, FacilityTier } from "@prisma/client";

async function runTestSuite() {
  console.log("=================================================================");
  console.log("🧪 STARTING MEDIBOT AI FULL INTEGRATION & EDGE CASE TEST SUITE");
  console.log("=================================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName}`);
      failed++;
    }
  }

  // TEST 1: Neon Database Connection & Health Diagnostics
  console.log("--- 1. Testing Neon PostgreSQL Connection & Health Diagnostics ---");
  const health = await performSystemHealthCheck();
  assert(health.status === "HEALTHY", "System overall health status is HEALTHY");
  assert(health.checks.database.status === "HEALTHY", `Neon Database connection is active (latency: ${health.checks.database.latencyMs}ms)`);
  assert(health.metrics.totalUsers >= 4, `All 4 core roles seeded (found ${health.metrics.totalUsers} users)`);
  assert(health.metrics.totalHospitals >= 5, `Verified public hospitals seeded (found ${health.metrics.totalHospitals} hospitals)`);

  // TEST 2: Role-Based User Profiles
  console.log("\n--- 2. Testing Role-Based User Profiles & RBAC ---");
  const adminUser = await prisma.user.findUnique({ where: { email: "admin@medibot.com" }, include: { adminProfile: true } });
  assert(adminUser?.role === "ADMIN" && Boolean(adminUser?.adminProfile), "Admin user exists with AdminProfile");

  const doctorUser = await prisma.user.findUnique({ where: { email: "doctor@medibot.com" }, include: { doctorProfile: true } });
  assert(doctorUser?.role === "DOCTOR" && Boolean(doctorUser?.doctorProfile), "Doctor user exists with DoctorProfile");

  const ahaUser = await prisma.user.findUnique({ where: { email: "ahaworker@medibot.com" }, include: { ahaProfile: true } });
  assert(ahaUser?.role === "AHA_WORKER" && Boolean(ahaUser?.ahaProfile), "AHA Worker user exists with AHAWorkerProfile");

  const patientUser = await prisma.user.findUnique({ where: { email: "patient@medibot.com" }, include: { patientProfile: true } });
  assert(patientUser?.role === "PATIENT" && Boolean(patientUser?.patientProfile?.abhaId), "Patient user exists with PatientProfile & ABHA ID");

  // TEST 3: Clinical Triage Edge Cases
  console.log("\n--- 3. Testing Clinical Triage Decision Support & Edge Cases ---");
  
  // Edge Case A: Critical Hypoxemia (SpO2 86% < 90%)
  const triageA = evaluateClinicalTriage(["shortness_of_breath"], "Severe difficulty breathing", { spo2: 86, heartRate: 115 });
  assert(triageA.priority === TriagePriority.P1_EMERGENCY, "Edge Case A: SpO2 86% triggers P1_EMERGENCY");
  assert(triageA.requiredCapabilities.includes("Ventilator") && triageA.requiredCapabilities.includes("ICU"), "Edge Case A: Requires Ventilator & ICU capabilities");
  assert(triageA.ambulanceNeeded === true, "Edge Case A: Emergency 108 ALS ambulance dispatch required");

  // Edge Case B: Acute Retrosternal Chest Pain
  const triageB = evaluateClinicalTriage(["chest_pain"], "Severe squeezing chest pain radiating to left arm", { spo2: 97, heartRate: 110, systolicBp: 155 });
  assert(triageB.priority === TriagePriority.P1_EMERGENCY, "Edge Case B: Acute Chest Pain triggers P1_EMERGENCY");
  assert(triageB.requiredCapabilities.includes("Cath Lab") && triageB.requiredCapabilities.includes("ECG Machine"), "Edge Case B: Requires Cath Lab & 12-Lead ECG");

  // Edge Case C: Maternal Obstetric Bleeding
  const triageC = evaluateClinicalTriage(["pregnancy_labor"], "Active maternal labor with complications and bleeding", { spo2: 98 });
  assert(triageC.priority === TriagePriority.P1_EMERGENCY, "Edge Case C: High-risk maternal bleeding triggers P1_EMERGENCY");
  assert(triageC.requiredCapabilities.includes("Blood Bank") && triageC.requiredCapabilities.includes("Neonatal ICU (NICU)"), "Edge Case C: Requires Blood Bank & NICU");

  // Edge Case D: Routine Fever / Mild Cold
  const triageD = evaluateClinicalTriage(["fever_cold"], "Mild fever and runny nose for 2 days", { spo2: 99, heartRate: 72, systolicBp: 120, temperature: 99.1 });
  assert(triageD.priority === TriagePriority.P3_ROUTINE, "Edge Case D: Mild cold/fever triggers P3_ROUTINE");
  assert(triageD.ambulanceNeeded === false, "Edge Case D: No ambulance needed for routine primary care");

  // TEST 4: Capability-Aware Hospital Matcher & Geodesic Haversine Routing
  console.log("\n--- 4. Testing Capability-Aware Hospital Matching & Geodesic Ranking ---");
  const rankedForEmergency = await matchAndRankHospitals(12.7236, 80.1872, triageA);
  assert(rankedForEmergency.length > 0, "Hospital matcher returned ranked candidate facilities");
  
  const topCapable = rankedForEmergency.find((r) => r.isFullyCapable);
  assert(Boolean(topCapable), "Found fully capable hospital with Ventilator & ICU");
  assert(topCapable?.hospital.tier === FacilityTier.DISTRICT_HOSPITAL || topCapable?.hospital.tier === FacilityTier.MEDICAL_COLLEGE, "Escalates patient to District Headquarters Hospital (DH) or Medical College");
  assert(topCapable?.hospital.name.includes("Chengalpattu"), `Nearest capable facility correctly matched (${topCapable?.hospital.name})`);

  // TEST 5: AHA Worker Checkup Workflow & Doctor Escalation
  console.log("\n--- 5. Testing AHA Worker Checkup Execution & Escalation in Neon DB ---");
  const patientProfile = patientUser!.patientProfile!;
  const ahaProfile = ahaUser!.ahaProfile!;

  const newCheckup = await prisma.aHACheckup.create({
    data: {
      ahaWorkerProfileId: ahaProfile.id,
      patientProfileId: patientProfile.id,
      spo2: 91.0,
      heartRate: 104,
      systolicBp: 165,
      diastolicBp: 100,
      bloodGlucoseMgDl: 145,
      temperature: 99.2,
      checklistResponses: {
        step_1: { verified: true },
        step_2: { vitals: { spo2: 91, bp: "165/100" } },
        step_3: { medicationAdherence: false },
        step_4: { followUpDone: true },
        step_5: { symptomsReported: ["Morning headache", "Shortness of breath"] },
        step_6: { observations: "Patient missed 2 days of blood pressure pills." },
        step_7: { isEscalatedToDoctor: true, reason: "Elevated BP 165/100 and non-compliance" }
      },
      medicationAdherence: false,
      symptomsReported: ["Morning headache", "Shortness of breath"],
      observations: "Patient missed 2 days of blood pressure pills.",
      isEscalatedToDoctor: true,
      escalationReason: "Elevated BP 165/100 and non-compliance",
      escalationPriority: "HIGH",
      status: "COMPLETED"
    }
  });

  assert(Boolean(newCheckup.id), `AHA checkup record created in Neon DB (ID: ${newCheckup.id})`);
  assert(newCheckup.isEscalatedToDoctor === true, "AHA field checkup flagged doctor escalation");

  // TEST 6: Doctor Review & Prescription Issuance
  console.log("\n--- 6. Testing Doctor Clinical Review & Prescription in Neon DB ---");
  const docProfile = doctorUser!.doctorProfile!;
  
  const reviewedCheckup = await prisma.aHACheckup.update({
    where: { id: newCheckup.id },
    data: {
      reviewedByDoctorId: docProfile.id,
      doctorReviewNotes: "Reviewed AHA field checkup. Re-initiated Telmisartan-Amlodipine daily. Instructed patient on salt reduction.",
      doctorReviewedAt: new Date()
    }
  });
  assert(Boolean(reviewedCheckup.doctorReviewedAt), "Doctor review notes saved to checkup record");

  const newPrescription = await prisma.prescription.create({
    data: {
      patientProfileId: patientProfile.id,
      doctorId: docProfile.id,
      medicationName: "Telmisartan 40mg + Hydrochlorothiazide 12.5mg",
      dosage: "1 tablet",
      frequency: "Once daily morning after breakfast (1-0-0)",
      duration: "30 days",
      instructions: "Take with water every morning.",
      status: "ACTIVE"
    }
  });
  assert(Boolean(newPrescription.id), `Doctor prescription issued and saved to Neon DB (Med: ${newPrescription.medicationName})`);

  // TEST 7: Audit Log Trace
  console.log("\n--- 7. Testing Immutable Audit Log Trace ---");
  const auditLogs = await prisma.auditLog.findMany({ take: 5, orderBy: { timestamp: "desc" } });
  assert(auditLogs.length > 0, `Neon DB audit logs active (Found ${auditLogs.length} recent entries)`);

  console.log("\n=================================================================");
  console.log(`🎉 TEST SUITE COMPLETED: ${passed} Passed, ${failed} Failed`);
  console.log("=================================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runTestSuite()
  .catch((err) => {
    console.error("Test execution failed with error:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
