import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";
import { signToken, COOKIE_NAME, sanitizeUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, name, phone, role = "PATIENT", abhaId, district, address } = body;

    if (!email || !password || !name) {
      return NextResponse.json({ error: "Name, email, and password are required" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const assignedRole = (role?.toUpperCase() as Role) || Role.PATIENT;

    // Create user and matching role profile
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase().trim(),
        passwordHash,
        name: name.trim(),
        phone: phone || null,
        role: assignedRole,
        patientProfile:
          assignedRole === Role.PATIENT
            ? {
                create: {
                  abhaId: abhaId || `91-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`,
                  district: district || "Chengalpattu",
                  address: address || "",
                  latitude: 12.7236,
                  longitude: 80.1872,
                },
              }
            : undefined,
        doctorProfile:
          assignedRole === Role.DOCTOR
            ? {
                create: {
                  specialization: "General Medicine",
                  department: "General OPD",
                },
              }
            : undefined,
        ahaProfile:
          assignedRole === Role.AHA_WORKER
            ? {
                create: {
                  workerCode: `TN-ASHA-${Math.floor(100 + Math.random() * 900)}`,
                  assignedDistrict: district || "Chengalpattu",
                },
              }
            : undefined,
        adminProfile:
          assignedRole === Role.ADMIN
            ? {
                create: {
                  designation: "Hospital Administrator",
                },
              }
            : undefined,
      },
      include: {
        patientProfile: true,
        doctorProfile: true,
        ahaProfile: true,
        adminProfile: true,
      },
    });

    const token = await signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      patientProfileId: user.patientProfile?.id,
      doctorProfileId: user.doctorProfile?.id,
      ahaProfileId: user.ahaProfile?.id,
      adminProfileId: user.adminProfile?.id,
    });

    await logAudit({
      actorUserId: user.id,
      action: "REGISTER",
      entity: "User",
      entityId: user.id,
      details: { email: user.email, role: user.role },
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
      userAgent: req.headers.get("user-agent"),
    });

    const response = NextResponse.json({
      success: true,
      user: sanitizeUser(user),
      role: user.role,
    });

    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (err: any) {
    console.error("Register error:", err);
    return NextResponse.json({ error: err.message || "Failed to register user" }, { status: 500 });
  }
}
