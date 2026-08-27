import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { Role } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const roleFilter = searchParams.get("role");

    const whereClause: any = {};
    if (roleFilter && Object.values(Role).includes(roleFilter as Role)) {
      whereClause.role = roleFilter as Role;
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        patientProfile: {
          select: { id: true, abhaId: true, district: true, gender: true, bloodGroup: true },
        },
        doctorProfile: {
          select: { id: true, specialization: true, registrationNumber: true, isAvailable: true },
        },
        ahaProfile: {
          select: { id: true, workerCode: true, assignedDistrict: true, assignedVillage: true },
        },
        adminProfile: {
          select: { id: true, designation: true, accessLevel: true },
        },
      },
    });

    return NextResponse.json({ users });
  } catch (err: any) {
    console.error("Admin users GET error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { userId, role, isActive } = body;

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        role: role ? (role as Role) : undefined,
        isActive: typeof isActive === "boolean" ? isActive : undefined,
      },
    });

    await logAudit({
      actorUserId: user.id,
      action: "USER_UPDATED",
      entity: "User",
      entityId: userId,
      details: { role, isActive },
    });

    return NextResponse.json({ success: true, user: updated });
  } catch (err: any) {
    console.error("Admin user update error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
