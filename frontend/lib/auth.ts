import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { prisma } from "./prisma";
import { Role } from "@prisma/client";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "medibot-production-super-secret-jwt-key-2026-secure"
);

const COOKIE_NAME = "medibot_token";

export interface TokenPayload {
  userId: string;
  email: string;
  role: Role;
  name: string;
  patientProfileId?: string;
  doctorProfileId?: string;
  ahaProfileId?: string;
  adminProfileId?: string;
}

export async function signToken(payload: TokenPayload): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(SECRET);
}

export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as unknown as TokenPayload;
  } catch {
    return null;
  }
}

export async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;

    const payload = await verifyToken(token);
    if (!payload?.userId) return null;

    const user = await prisma.user.findUnique({
      where: { id: payload.userId, isActive: true },
      include: {
        patientProfile: true,
        doctorProfile: {
          include: { hospital: true }
        },
        ahaProfile: true,
        adminProfile: true
      }
    });

    if (!user) return null;

    const { passwordHash, ...safeUser } = user;
    return safeUser;
  } catch (err) {
    console.error("getCurrentUser error:", err);
    return null;
  }
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized: Please sign in");
  }
  return user;
}

export async function requireRole(allowedRoles: Role[]) {
  const user = await requireAuth();
  if (!allowedRoles.includes(user.role)) {
    throw new Error(`Forbidden: Access restricted to roles [${allowedRoles.join(", ")}]`);
  }
  return user;
}

export function sanitizeUser(user: any) {
  if (!user) return null;
  const { passwordHash, ...safe } = user;
  return safe;
}

export { COOKIE_NAME };
