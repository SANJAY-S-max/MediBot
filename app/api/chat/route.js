import { NextResponse } from "next/server";
import { chatWithBot } from "@/lib/gemini";
import { verifyToken } from "@/lib/auth";

export async function POST(request) {
  try {
    const token = request.cookies.get("medibot_token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = await verifyToken(token);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { message, history = [], language = "en" } = await request.json();
    if (!message?.trim()) return NextResponse.json({ error: "Message required" }, { status: 400 });

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({
        response: "⚠️ AI service is not configured. Please add GEMINI_API_KEY to your environment variables."
      });
    }

    const response = await chatWithBot(message, history, language);
    return NextResponse.json({ response });
  } catch (err) {
    console.error("Chat error:", err);
    return NextResponse.json({
      response: `DEBUG: ${err.message}`
    }, { status: 500 });
  }
}
