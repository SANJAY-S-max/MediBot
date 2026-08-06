import { NextResponse } from "next/server";
import { createUser, signToken, sanitizeUser } from "@/lib/auth";

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, email, password, role = "patient" } = body;

    if (!name || !email || !password) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    const result = createUser({ name, email, password, role });
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 409 });
    }

    const token = await signToken(sanitizeUser(result.user));
    const response = NextResponse.json({ user: sanitizeUser(result.user), token });
    response.cookies.set("medibot_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });
    return response;
  } catch (err) {
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
