import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || "" });

export async function chatWithBot(message, history = [], language = "en", roleDescription = "helpful assistant") {
  const langMap = { en: "English", hi: "Hindi", ta: "Tamil" };
  const langName = langMap[language] || "English";

  const systemPrompt = `You are a ${roleDescription}. Your role is STRICTLY limited to this domain.
Always respond in ${langName}.
If a user asks a question that is irrelevant to your role as a ${roleDescription}, you MUST politely refuse to answer and state that the question is irrelevant to your expertise. Do NOT provide answers outside your designated role. Be professional and clear.`;

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
    model: "llama-3.3-70b-versatile",
    temperature: 0.7,
    max_tokens: 1024,
  });

  return completion.choices[0]?.message?.content || "Sorry, I could not generate a response.";
}
