const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const medicalSafety = require('../middleware/medicalSafety');
const { appendMedicalDisclaimer } = medicalSafety;

// Initialize Google Gemini using GOOGLE_API_KEY from .env
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

const SYSTEM_PROMPT = `You are MediBot, a compassionate and knowledgeable AI health assistant designed for health awareness in India. Your role is to:
1. Listen carefully to the user's symptoms and health concerns.
2. Ask ONE smart clarifying follow-up question at a time (about severity, duration, associated symptoms).
3. After sufficient information is gathered (usually 2-3 exchanges), provide a clear awareness summary including:
   - Possible conditions to be aware of (NOT a diagnosis)
   - Practical prevention or home-care tips
   - Clear guidance on when to urgently see a doctor
4. Always be warm, simple, and easy to understand — especially for rural or non-medical users.
5. Never provide a definitive medical diagnosis. Always remind users you are for awareness only.
6. Keep responses concise and conversational. Avoid long paragraphs.`;

router.post('/', medicalSafety, async (req, res) => {
  try {
    const { messages, profile } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required.' });
    }

    // Build profile context string
    let profileContext = '';
    if (profile) {
      profileContext = `User profile: Name: ${profile.name}, Age: ${profile.age}, Gender: ${profile.gender}, Location: ${profile.location}. Tailor your response to this user.\n\n`;
    }

    // Use Gemini 3.5 Flash
    const model = genAI.getGenerativeModel({
      model: 'gemini-3.5-flash',
      systemInstruction: SYSTEM_PROMPT + '\n\n' + profileContext,
    });

    // Convert message history to Gemini format
    // Gemini uses "user" and "model" roles (not "assistant")
    const history = [];
    const allMessages = [...messages];
    
    // Separate the last user message as the current input
    const lastMessage = allMessages[allMessages.length - 1];
    let historyMessages = allMessages.slice(0, -1);

    // Gemini requires the history to start with a 'user' message. 
    // The first message is often the bot's greeting, so we skip it.
    while (historyMessages.length > 0 && historyMessages[0].role === 'assistant') {
      historyMessages.shift();
    }

    for (const msg of historyMessages) {
      if (msg.role === 'user' || msg.role === 'assistant') {
        history.push({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }],
        });
      }
    }

    const chat = model.startChat({ history });
    const result = await chat.sendMessage(lastMessage.content);
    const rawReply = result.response.text();
    const reply = appendMedicalDisclaimer(rawReply);

    res.json({ reply });
  } catch (error) {
    console.error('Gemini API Error:', error.message);
    res.status(500).json({ error: 'Failed to get response from AI. Please check your GOOGLE_API_KEY.' });
  }
});

module.exports = router;
