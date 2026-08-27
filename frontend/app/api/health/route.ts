import { NextResponse } from "next/server";
import { performSystemHealthCheck } from "@/lib/health";

export async function GET() {
  try {
    const health = await performSystemHealthCheck();
    const statusCode = health.status === "HEALTHY" ? 200 : 503;
    return NextResponse.json(health, { status: statusCode });
  } catch (err: any) {
    return NextResponse.json(
      {
        status: "DOWN",
        error: err.message || "Health check failed",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
