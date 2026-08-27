import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Fetch live triage assistance requests
    const assistanceQueue = await prisma.patientAssistanceRequest.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        patient: {
          include: {
            user: { select: { name: true, phone: true } },
            medicalHistory: true,
          },
        },
        recommendations: {
          include: { hospital: { select: { name: true, tier: true } } },
        },
      },
    });

    // 2. Fetch AHA field escalations needing doctor review
    const ahaEscalations = await prisma.aHACheckup.findMany({
      where: { isEscalatedToDoctor: true },
      orderBy: { visitDate: "desc" },
      take: 20,
      include: {
        patient: {
          include: {
            user: { select: { name: true, phone: true } },
            medicalHistory: true,
          },
        },
        ahaWorker: {
          include: { user: { select: { name: true, phone: true } } },
        },
      },
    });

    // 3. Fetch all active hospital bed capacities for doctor reference
    const hospitalsWithBeds = await prisma.hospital.findMany({
      where: { isVerified: true },
      select: {
        id: true,
        name: true,
        tier: true,
        district: true,
        contactPhone: true,
        bedCapacity: true,
      },
    });

    return NextResponse.json({
      assistanceQueue,
      ahaEscalations,
      hospitalsWithBeds,
      counts: {
        totalPending: assistanceQueue.filter((q) => q.status !== "COMPLETED").length,
        highEmergency: assistanceQueue.filter((q) => q.triagePriority === "P1_EMERGENCY").length,
        ahaEscalated: ahaEscalations.filter((a) => !a.doctorReviewedAt).length,
      },
    });
  } catch (err: any) {
    console.error("Doctor queue error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
