require('dotenv').config({ path: '../.env' });
const { GoogleGenAI } = require('@google/genai');

async function test() {
  console.log("Using API Key:", process.env.GOOGLE_API_KEY);
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: 'Hello, testing the new SDK!'
    });
    console.log("Success! Response:", response.text);
  } catch (err) {
    console.error("New SDK Error:", err.message);
  }
}
test();
