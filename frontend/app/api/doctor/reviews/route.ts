import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { DiagnosisType, SeverityLevel, PrescriptionStatus } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    let doctorProfileId = user?.doctorProfile?.id;

    if (!doctorProfileId) {
      const firstDoc = await prisma.doctorProfile.findFirst();
      doctorProfileId = firstDoc?.id;
    }

    if (!doctorProfileId) {
      return NextResponse.json({ error: "Doctor profile required" }, { status: 403 });
    }

    const body = await req.json();
    const {
      patientProfileId,
      assistanceRequestId,
      ahaCheckupId,
      clinicalNotes = "",
      diagnosisName,
      diagnosisType = "CONFIRMED",
      prescriptionName,
      prescriptionDosage,
      prescriptionFrequency,
      prescriptionDuration,
      status = "REVIEWED",
    } = body;

    if (!patientProfileId) {
      return NextResponse.json({ error: "patientProfileId is required" }, { status: 400 });
    }

    // 1. If diagnosis provided, create Diagnosis record
    if (diagnosisName) {
      await prisma.diagnosis.create({
        data: {
          patientProfileId,
          doctorId: doctorProfileId,
          conditionName: diagnosisName,
          diagnosisType: (diagnosisType?.toUpperCase() as DiagnosisType) || DiagnosisType.CONFIRMED,
          severity: SeverityLevel.MODERATE,
          clinicalNotes,
        },
      });
    }

    // 2. If prescription provided, create Prescription record
    if (prescriptionName) {
      await prisma.prescription.create({
        data: {
          patientProfileId,
          doctorId: doctorProfileId,
          medicationName: prescriptionName,
          dosage: prescriptionDosage || "1 tablet",
          frequency: prescriptionFrequency || "Once daily",
          duration: prescriptionDuration || "14 days",
          instructions: clinicalNotes,
          status: PrescriptionStatus.ACTIVE,
        },
      });
    }

    // 3. If AHA Checkup reviewed, update doctor review fields
    if (ahaCheckupId) {
      await prisma.aHACheckup.update({
        where: { id: ahaCheckupId },
        data: {
          reviewedByDoctorId: doctorProfileId,
          doctorReviewNotes: clinicalNotes,
          doctorReviewedAt: new Date(),
        },
      });
    }

    // 4. If assistance request completed, update status
    if (assistanceRequestId) {
      await prisma.patientAssistanceRequest.update({
        where: { id: assistanceRequestId },
        data: {
          status: "COMPLETED",
        },
      });
    }

    // Audit log
    await logAudit({
      actorUserId: user?.id,
      action: "DOCTOR_REVIEW_SUBMITTED",
      entity: "PatientProfile",
      entityId: patientProfileId,
      details: {
        diagnosisName,
        prescriptionName,
        ahaCheckupId,
      },
    });

    return NextResponse.json({ success: true, message: "Clinical review saved successfully" });
  } catch (err: any) {
    console.error("Doctor review error:", err);
    return NextResponse.json({ error: err.message || "Failed to submit review" }, { status: 500 });
  }
}
