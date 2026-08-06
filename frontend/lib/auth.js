import { SignJWT, jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "medibot-secret-key-2024-change-in-production"
);

// Default users (demo accounts - always available)
const DEFAULT_USERS = [
  {
    id: "admin-001",
    name: "Admin User",
    email: "admin@medibot.com",
    password: "Admin@123",
    role: "admin",
    avatar: "A",
  },
  {
    id: "doctor-001",
    name: "Dr. Sarah Johnson",
    email: "doctor@medibot.com",
    password: "Doctor@123",
    role: "doctor",
    specialization: "General Medicine",
    avatar: "D",
  },
  {
    id: "patient-001",
    name: "John Patient",
    email: "patient@medibot.com",
    password: "Patient@123",
    role: "patient",
    avatar: "P",
  },
];

// In-memory user store (resets on server restart - use a DB for production)
let userStore = [...DEFAULT_USERS];

export function findUser(email) {
  return userStore.find((u) => u.email.toLowerCase() === email.toLowerCase());
}

export function createUser(userData) {
  const existing = findUser(userData.email);
  if (existing) return { error: "Email already registered" };

  const newUser = {
    id: `user-${Date.now()}`,
    ...userData,
    avatar: userData.name?.charAt(0).toUpperCase() || "U",
  };
  userStore.push(newUser);
  return { user: newUser };
}

export async function signToken(payload) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(SECRET);
}

export async function verifyToken(token) {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload;
  } catch {
    return null;
  }
}

export function sanitizeUser(user) {
  const { password, ...safe } = user;
  return safe;
}
