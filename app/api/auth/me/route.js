import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

export async function GET(request) {
  const token = request.cookies.get("medibot_token")?.value;
  if (!token) return NextResponse.json({ user: null }, { status: 401 });
  const payload = await verifyToken(token);
  if (!payload) return NextResponse.json({ user: null }, { status: 401 });
  return NextResponse.json({ user: payload });
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete("medibot_token");
  return response;
}
