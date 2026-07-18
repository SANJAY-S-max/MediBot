require('dotenv').config({ path: '../.env' });
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function test() {
  console.log("API Key:", process.env.GOOGLE_API_KEY);
  try {
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-3.5-flash' });
    const result = await model.generateContent('hello');
    console.log("Gemini response:", result.response.text());
  } catch (err) {
    console.error("Gemini error:", err.message);
  }
}
test();
