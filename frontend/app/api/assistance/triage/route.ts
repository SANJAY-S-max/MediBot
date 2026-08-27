import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import {
  evaluateClinicalTriage,
  matchAndRankHospitals,
  generateReferralSlipSvg,
} from "@/lib/recommendationEngine";
import { logAudit } from "@/lib/audit";
import { AssistanceStatus, SeverityLevel } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      symptoms = [],
      symptomDescription = "",
      severity = "MODERATE",
      durationHours = 2,
      vitals = {},
      patientLatitude = 12.7236,
      patientLongitude = 80.1872,
      patientAddress = "Thiruporur Rural Block, Chengalpattu",
      hasPersonalTransport = false,
      mobilityAssistanceNeeded = false,
    } = body;

    const user = await getCurrentUser();
    let patientProfileId = user?.patientProfile?.id;

    if (!patientProfileId) {
      // Find default patient or fallback
      const defaultPatient = await prisma.patientProfile.findFirst();
      patientProfileId = defaultPatient?.id;
    }

    if (!patientProfileId) {
      return NextResponse.json({ error: "No patient profile found in database" }, { status: 400 });
    }

    // 1. Evaluate Clinical Triage and extract required capabilities
    const triage = evaluateClinicalTriage(symptoms, symptomDescription, vitals);

    // 2. Query Neon PostgreSQL and match & rank capable hospitals
    const rankedHospitals = await matchAndRankHospitals(
      patientLatitude,
      patientLongitude,
      triage
    );

    // Pick recommended hospital (nearest fully capable or highest score)
    const primaryRecommendation = rankedHospitals[0] || null;
    const recommendedHospital = primaryRecommendation?.hospital;

    // 3. Generate Referral Code & SVG QR Slip
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const randomHex = Math.floor(1000 + Math.random() * 9000);
    const referralCode = `REF-${dateStr}-${randomHex}`;

    const qrSvg = generateReferralSlipSvg(
      referralCode,
      user?.name || "Patient",
      triage.priorityLabel,
      recommendedHospital?.name || "District Hospital"
    );

    // 4. Save Assistance Request & Recommendations in Neon DB
    const assistanceRequest = await prisma.patientAssistanceRequest.create({
      data: {
        patientProfileId,
        symptoms,
        symptomDescription: symptomDescription || symptoms.join(", "),
        severity: (severity?.toUpperCase() as SeverityLevel) || triage.severity,
        durationHours: parseInt(String(durationHours)) || 2,
        spo2: vitals.spo2 ? parseFloat(String(vitals.spo2)) : null,
        heartRate: vitals.heartRate ? parseInt(String(vitals.heartRate)) : null,
        systolicBp: vitals.systolicBp ? parseInt(String(vitals.systolicBp)) : null,
        respiratoryRate: vitals.respiratoryRate ? parseInt(String(vitals.respiratoryRate)) : null,
        temperature: vitals.temperature ? parseFloat(String(vitals.temperature)) : null,
        consciousnessLevel: vitals.consciousnessLevel || "Alert",
        patientLatitude: parseFloat(String(patientLatitude)),
        patientLongitude: parseFloat(String(patientLongitude)),
        patientAddress,
        hasPersonalTransport: Boolean(hasPersonalTransport),
        mobilityAssistanceNeeded: Boolean(mobilityAssistanceNeeded),
        triagePriority: triage.priority,
        triageReason: triage.triageReasons.join(" | "),
        requiredCapabilities: triage.requiredCapabilities,
        recommendedTier: triage.recommendedTier,
        ambulanceNeeded: triage.ambulanceNeeded && !hasPersonalTransport,
        ambulanceType: triage.ambulanceType,
        referralCode,
        qrVerificationSvg: qrSvg,
        status:
          triage.ambulanceNeeded && !hasPersonalTransport
            ? AssistanceStatus.AMBULANCE_DISPATCHED
            : AssistanceStatus.MATCHED,
        recommendations: {
          create: rankedHospitals.slice(0, 4).map((r) => ({
            hospitalId: r.hospital.id,
            matchScore: r.compositeScore,
            distanceKm: r.distanceKm,
            estimatedTravelTimeMinutes: r.estimatedTimeMin,
            isNearestCapable: Boolean((r as any).isNearestCapable),
            bypassReason: r.bypassReason,
            matchedCapabilities: r.matchedCapabilities,
            navigationUrl: r.navigationUrl,
          })),
        },
      },
      include: {
        recommendations: {
          include: {
            hospital: {
              include: {
                facilities: true,
                departments: true,
                equipment: true,
                diagnosticInstruments: true,
                medicalServices: true,
                bedCapacity: true,
                hostels: true,
              },
            },
          },
        },
      },
    });

    // 5. Notify user
    if (user?.id) {
      await prisma.notification.create({
        data: {
          userId: user.id,
          title: `Triage Assessment: ${triage.priorityLabel}`,
          message: `Recommended: ${recommendedHospital?.name}. Distance: ${primaryRecommendation?.distanceKm} km.`,
          type: triage.priority === "P1_EMERGENCY" ? "EMERGENCY" : "INFO",
        },
      });
    }

    // 6. Audit log
    await logAudit({
      actorUserId: user?.id,
      action: "PATIENT_ASSISTANCE_REQUEST",
      entity: "PatientAssistanceRequest",
      entityId: assistanceRequest.id,
      details: {
        referralCode,
        priority: triage.priority,
        recommendedHospital: recommendedHospital?.name,
      },
    });

    return NextResponse.json({
      success: true,
      triage,
      assistanceRequest,
      recommendedHospital,
      rankedHospitals: rankedHospitals.slice(0, 5),
      referralCode,
      qrVerificationSvg: qrSvg,
      ambulanceDispatch: triage.ambulanceNeeded && !hasPersonalTransport ? {
        service: triage.ambulanceType,
        status: "DISPATCH_AUTHORIZED",
        etaMinutes: Math.max(8, Math.round((primaryRecommendation?.estimatedTimeMin || 15) * 0.8)),
        trackingHelpline: "108 Emergency Control Room",
      } : null,
      firstAidProtocols: triage.firstAidProtocols,
      transitSafetyChecklist: triage.transitSafetyChecklist,
    });
  } catch (err: any) {
    console.error("Triage API error:", err);
    return NextResponse.json({ error: err.message || "Failed to calculate triage" }, { status: 500 });
  }
}
