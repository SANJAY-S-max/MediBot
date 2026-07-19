import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function analyzeSymptoms(symptoms, language = "en") {
  const langMap = { en: "English", hi: "Hindi", ta: "Tamil" };
  const langName = langMap[language] || "English";

  const prompt = `You are MediBot, a professional AI medical assistant. A patient reports the following symptoms: "${symptoms}".

Please respond in ${langName} with a structured analysis:

1. **Possible Conditions** (list 2-3 likely conditions based on symptoms)
2. **Severity Assessment** (Low / Moderate / High risk)
3. **Immediate Actions** (what the patient should do right now)
4. **When to See a Doctor** (urgency level)
5. **Home Remedies** (safe self-care tips if applicable)
6. **Warning Signs** (symptoms that require immediate emergency care)

IMPORTANT DISCLAIMER: Always end with: "⚠️ This is preliminary guidance only. Please consult a qualified healthcare professional for proper diagnosis and treatment."

Be empathetic, clear, and professional. Use simple language the patient can understand.`;

  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: prompt,
  });
  return response.text;
}

export async function chatWithBot(message, history = [], language = "en") {
  const langMap = { en: "English", hi: "Hindi", ta: "Tamil" };
  const langName = langMap[language] || "English";

  const systemPrompt = `You are MediBot, a compassionate AI healthcare assistant. 
You help patients understand their symptoms, provide health education, and guide them to appropriate care.
Always respond in ${langName}.
Always remind users that you provide preliminary guidance only, not medical diagnosis.
Be warm, empathetic, professional, and clear.`;

  // Build contents array with history
  const contents = [
    { role: "user", parts: [{ text: systemPrompt }] },
    { role: "model", parts: [{ text: "Understood! I'm MediBot, ready to help with health guidance." }] },
    ...history.map(h => ({
      role: h.role === "model" ? "model" : "user",
      parts: [{ text: h.content }]
    })),
    { role: "user", parts: [{ text: message }] }
  ];

  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: contents,
  });
  return response.text;
}
