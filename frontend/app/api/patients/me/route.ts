import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // If user is a patient, fetch their patient profile
    let patientProfileId = user.patientProfile?.id;

    if (!patientProfileId) {
      // If admin or doctor looking up self fallback or first patient
      const firstPatient = await prisma.patientProfile.findFirst();
      patientProfileId = firstPatient?.id;
    }

    if (!patientProfileId) {
      return NextResponse.json({ error: "Patient profile not found" }, { status: 404 });
    }

    const patient = await prisma.patientProfile.findUnique({
      where: { id: patientProfileId },
      include: {
        user: { select: { name: true, email: true, phone: true } },
        medicalHistory: true,
        visits: {
          orderBy: { visitDate: "desc" },
          include: {
            doctor: { include: { user: { select: { name: true } } } },
            hospital: { select: { name: true, tier: true } },
          },
        },
        diagnoses: {
          orderBy: { diagnosisDate: "desc" },
          include: { doctor: { include: { user: { select: { name: true } } } } },
        },
        prescriptions: {
          where: { status: "ACTIVE" },
          orderBy: { startDate: "desc" },
          include: { doctor: { include: { user: { select: { name: true } } } } },
        },
        testReports: {
          orderBy: { testDate: "desc" },
          include: { reviewedByDoctor: { include: { user: { select: { name: true } } } } },
        },
        carePlans: {
          where: { isActive: true },
          orderBy: { startDate: "desc" },
        },
        checkupSchedules: {
          orderBy: { dueDate: "asc" },
        },
        ahaCheckups: {
          orderBy: { visitDate: "desc" },
          include: {
            ahaWorker: { include: { user: { select: { name: true, phone: true } } } },
          },
        },
        ahaAssignments: {
          where: { isActive: true },
          include: {
            ahaWorker: {
              include: { user: { select: { name: true, phone: true } } },
            },
          },
        },
        assistanceRequests: {
          orderBy: { createdAt: "desc" },
          take: 5,
          include: {
            recommendations: {
              include: {
                hospital: {
                  include: {
                    hostels: true,
                    bedCapacity: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ patient });
  } catch (err: any) {
    console.error("Patient profile GET error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
