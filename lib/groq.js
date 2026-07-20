import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || "" });

export async function chatWithBot(message, history = [], language = "en") {
  const langMap = { en: "English", hi: "Hindi", ta: "Tamil" };
  const langName = langMap[language] || "English";

  const systemPrompt = `You are MediBot, a compassionate AI healthcare assistant. 
You help patients understand their symptoms, provide health education, and guide them to appropriate care.
Always respond in ${langName}.
Always remind users that you provide preliminary guidance only, not medical diagnosis.
Be warm, empathetic, professional, and clear.`;

  // Format history for Groq (OpenAI format)
  const messages = [
    { role: "system", content: systemPrompt },
    ...history.map(h => ({
      role: h.role === "model" ? "assistant" : "user",
      content: h.content
    })),
    { role: "user", content: message }
  ];

  const completion = await groq.chat.completions.create({
    messages: messages,
    model: "llama3-8b-8192", // Fast and free Llama 3 model
    temperature: 0.7,
    max_tokens: 1024,
  });

  return completion.choices[0]?.message?.content || "Sorry, I could not generate a response.";
}
