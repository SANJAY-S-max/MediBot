import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

export async function proxy(request) {
  const { pathname } = request.nextUrl;

  // Protected routes
  const protectedPaths = ["/dashboard", "/doctor", "/admin", "/chat", "/reports", "/reminders", "/telemedicine"];
  const isProtected = protectedPaths.some((p) => pathname.startsWith(p));

  if (!isProtected) return NextResponse.next();

  const token = request.cookies.get("medibot_token")?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const payload = await verifyToken(token);
  if (!payload) {
    const res = NextResponse.redirect(new URL("/login", request.url));
    res.cookies.delete("medibot_token");
    return res;
  }

  // Role-based access
  if (pathname.startsWith("/admin") && payload.role !== "admin") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
  if (pathname.startsWith("/doctor") && payload.role !== "doctor") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/doctor/:path*", "/admin/:path*", "/chat/:path*", "/reports/:path*", "/reminders/:path*", "/telemedicine/:path*"],
};
