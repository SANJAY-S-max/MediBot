import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

export async function POST(request) {
  try {
    const token = request.cookies.get("medibot_token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = await verifyToken(token);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const message = body.message || body.query;
    if (!message?.trim()) return NextResponse.json({ error: "Message required" }, { status: 400 });

    const backendUrl = process.env.FASTAPI_BACKEND_URL || "http://localhost:8000";
    
    const fastapiResponse = await fetch(`${backendUrl}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: message,
        message: message,
        thread_id: user.id || "default_user_1",
        patient_latitude: body.patient_latitude,
        patient_longitude: body.patient_longitude,
        patient_vitals: body.patient_vitals,
        symptoms: body.symptoms,
        has_personal_transport: body.has_personal_transport !== undefined ? body.has_personal_transport : true,
        language: body.language || "en",
        roleDescription: body.roleDescription || "helpful assistant",
      }),
    });
    
    if (!fastapiResponse.ok) {
      throw new Error(`FastAPI returned ${fastapiResponse.status}`);
    }
    
    const data = await fastapiResponse.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error("Chat error:", err);
    return NextResponse.json({
      response: `DEBUG: ${err.message}`,
      sources: []
    }, { status: 500 });
  }
}
