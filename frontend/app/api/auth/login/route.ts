import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { signToken, COOKIE_NAME, sanitizeUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, role } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: {
        patientProfile: true,
        doctorProfile: { include: { hospital: true } },
        ahaProfile: true,
        adminProfile: true,
      },
    });

    if (!user || !user.isActive) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    // Verify password hash
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      // Fallback check for plain demo passwords if not yet hashed
      if (password !== user.passwordHash) {
        return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
      }
    }

    // Role check: If role was requested from frontend, check if user matches or if user's verified server role is used
    const actualRole = user.role;

    const token = await signToken({
      userId: user.id,
      email: user.email,
      role: actualRole,
      name: user.name,
      patientProfileId: user.patientProfile?.id,
      doctorProfileId: user.doctorProfile?.id,
      ahaProfileId: user.ahaProfile?.id,
      adminProfileId: user.adminProfile?.id,
    });

    await logAudit({
      actorUserId: user.id,
      action: "LOGIN",
      entity: "User",
      entityId: user.id,
      details: { role: actualRole, email: user.email },
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
      userAgent: req.headers.get("user-agent"),
    });

    const response = NextResponse.json({
      success: true,
      user: sanitizeUser(user),
      role: actualRole,
    });

    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });

    return response;
  } catch (err: any) {
    console.error("Login API error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
