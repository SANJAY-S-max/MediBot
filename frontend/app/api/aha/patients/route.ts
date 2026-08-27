import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let ahaWorkerProfileId = user.ahaProfile?.id;

    if (!ahaWorkerProfileId) {
      // Fallback for admin previewing or first AHA worker
      const firstAha = await prisma.aHAWorkerProfile.findFirst();
      ahaWorkerProfileId = firstAha?.id;
    }

    if (!ahaWorkerProfileId) {
      return NextResponse.json({ error: "AHA Worker profile not found" }, { status: 404 });
    }

    // Fetch assigned patients
    const assignments = await prisma.aHAWorkerAssignment.findMany({
      where: { ahaWorkerProfileId, isActive: true },
      include: {
        patient: {
          include: {
            user: { select: { name: true, email: true, phone: true } },
            medicalHistory: true,
            carePlans: { where: { isActive: true } },
            checkupSchedules: {
              orderBy: { dueDate: "asc" },
            },
            ahaCheckups: {
              orderBy: { visitDate: "desc" },
              take: 3,
            },
            prescriptions: {
              where: { status: "ACTIVE" },
            },
          },
        },
      },
      orderBy: { priority: "desc" },
    });

    // Fetch active checklist template
    const activeChecklistTemplate = await prisma.checklistTemplate.findFirst({
      where: { isActive: true },
      orderBy: { version: "desc" },
    });

    // Calculate metrics
    const totalAssigned = assignments.length;
    let dueTodayCount = 0;
    let missedCount = 0;
    let highPriorityCount = 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    assignments.forEach((a) => {
      if (a.priority === "HIGH" || a.priority === "CRITICAL") {
        highPriorityCount++;
      }
      a.patient.checkupSchedules.forEach((s) => {
        const d = new Date(s.dueDate);
        if (s.status === "MISSED" || (s.status === "PENDING" && d < today)) {
          missedCount++;
        } else if (s.status === "PENDING" && d >= today && d < tomorrow) {
          dueTodayCount++;
        }
      });
    });

    return NextResponse.json({
      assignments,
      activeChecklistTemplate,
      metrics: {
        totalAssigned,
        dueTodayCount,
        missedCount,
        highPriorityCount,
      },
    });
  } catch (err: any) {
    console.error("AHA Patients GET error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
