import { NextResponse } from "next/server";
import { findUser, signToken, sanitizeUser } from "@/lib/auth";

export async function POST(request) {
  try {
    const { email, password } = await request.json();
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }

    const user = findUser(email);
    if (!user || user.password !== password) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const token = await signToken(sanitizeUser(user));
    const response = NextResponse.json({ user: sanitizeUser(user), token });
    response.cookies.set("medibot_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });
    return response;
  } catch (err) {
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
