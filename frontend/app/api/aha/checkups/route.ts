import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { SeverityLevel, CheckupStatus } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    let ahaWorkerProfileId = user?.ahaProfile?.id;

    if (!ahaWorkerProfileId) {
      const firstAha = await prisma.aHAWorkerProfile.findFirst();
      ahaWorkerProfileId = firstAha?.id;
    }

    if (!ahaWorkerProfileId) {
      return NextResponse.json({ error: "AHA Worker profile required" }, { status: 403 });
    }

    const body = await req.json();
    const {
      patientProfileId,
      scheduleId,
      vitals = {},
      checklistResponses = {},
      medicationAdherence = true,
      symptomsReported = [],
      observations = "",
      isEscalatedToDoctor = false,
      escalationReason = "",
      escalationPriority = "LOW",
    } = body;

    if (!patientProfileId) {
      return NextResponse.json({ error: "patientProfileId is required" }, { status: 400 });
    }

    const checkup = await prisma.aHACheckup.create({
      data: {
        ahaWorkerProfileId,
        patientProfileId,
        scheduleId: scheduleId || undefined,
        spo2: vitals.spo2 ? parseFloat(String(vitals.spo2)) : null,
        heartRate: vitals.heartRate ? parseInt(String(vitals.heartRate)) : null,
        systolicBp: vitals.systolicBp ? parseInt(String(vitals.systolicBp)) : null,
        diastolicBp: vitals.diastolicBp ? parseInt(String(vitals.diastolicBp)) : null,
        bloodGlucoseMgDl: vitals.bloodGlucoseMgDl ? parseFloat(String(vitals.bloodGlucoseMgDl)) : null,
        temperature: vitals.temperature ? parseFloat(String(vitals.temperature)) : null,
        checklistResponses: checklistResponses || {},
        medicationAdherence: Boolean(medicationAdherence),
        symptomsReported: symptomsReported || [],
        observations,
        isEscalatedToDoctor: Boolean(isEscalatedToDoctor),
        escalationReason: isEscalatedToDoctor ? escalationReason : null,
        escalationPriority: (escalationPriority?.toUpperCase() as SeverityLevel) || SeverityLevel.LOW,
        status: "COMPLETED",
      },
      include: {
        patient: { include: { user: { select: { name: true } } } },
      },
    });

    // If scheduleId provided, update schedule status to COMPLETED
    if (scheduleId) {
      await prisma.checkupSchedule.update({
        where: { id: scheduleId },
        data: { status: CheckupStatus.COMPLETED },
      });
    }

    // If escalated to doctor, notify all available doctors
    if (isEscalatedToDoctor) {
      const doctors = await prisma.doctorProfile.findMany({
        include: { user: true },
      });

      for (const doc of doctors) {
        await prisma.notification.create({
          data: {
            userId: doc.userId,
            title: `🚨 AHA Field Escalation: ${checkup.patient.user.name}`,
            message: `Priority: ${escalationPriority}. Reason: ${escalationReason}. Vitals: SpO2 ${vitals.spo2 || "N/A"}%, BP ${vitals.systolicBp || "N/A"}/${vitals.diastolicBp || "N/A"}.`,
            type: "ESCALATION",
            link: "/doctor",
          },
        });
      }
    }

    // Audit log
    await logAudit({
      actorUserId: user?.id,
      action: "AHA_CHECKUP_SUBMITTED",
      entity: "AHACheckup",
      entityId: checkup.id,
      details: {
        patientProfileId,
        isEscalatedToDoctor,
        escalationPriority,
      },
    });

    return NextResponse.json({ success: true, checkup });
  } catch (err: any) {
    console.error("AHA Checkup submission error:", err);
    return NextResponse.json({ error: err.message || "Failed to submit checkup" }, { status: 500 });
  }
}
