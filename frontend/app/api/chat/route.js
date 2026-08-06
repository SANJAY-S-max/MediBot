import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

export async function POST(request) {
  try {
    const token = request.cookies.get("medibot_token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = await verifyToken(token);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { message, history = [], language = "en" } = await request.json();
    if (!message?.trim()) return NextResponse.json({ error: "Message required" }, { status: 400 });

    // In production, you would use an environment variable for the backend URL
    const backendUrl = process.env.FASTAPI_BACKEND_URL || "http://localhost:8000";
    
    const fastapiResponse = await fetch(`${backendUrl}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: message,
        thread_id: user.id || "default_user_1",
      }),
    });
    
    if (!fastapiResponse.ok) {
      throw new Error(`FastAPI returned ${fastapiResponse.status}`);
    }
    
    const data = await fastapiResponse.json();
    return NextResponse.json({ 
      response: data.response,
      sources: data.sources || []
    });
  } catch (err) {
    console.error("Chat error:", err);
    return NextResponse.json({
      response: `DEBUG: ${err.message}`,
      sources: []
    }, { status: 500 });
  }
}
