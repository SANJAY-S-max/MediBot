import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [
      totalUsers,
      totalPatients,
      totalDoctors,
      totalAha,
      totalHospitals,
      totalEquipment,
      totalAssistance,
      totalCheckups,
      totalAuditLogs,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.patientProfile.count(),
      prisma.doctorProfile.count(),
      prisma.aHAWorkerProfile.count(),
      prisma.hospital.count(),
      prisma.medicalEquipment.count(),
      prisma.patientAssistanceRequest.count(),
      prisma.aHACheckup.count(),
      prisma.auditLog.count(),
    ]);

    const recentAuditLogs = await prisma.auditLog.findMany({
      orderBy: { timestamp: "desc" },
      take: 10,
      include: { actorUser: { select: { name: true, email: true, role: true } } },
    });

    return NextResponse.json({
      metrics: {
        totalUsers,
        totalPatients,
        totalDoctors,
        totalAha,
        totalHospitals,
        totalEquipment,
        totalAssistance,
        totalCheckups,
        totalAuditLogs,
      },
      recentAuditLogs,
    });
  } catch (err: any) {
    console.error("Admin metrics error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
