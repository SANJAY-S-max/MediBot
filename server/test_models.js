require('dotenv').config({ path: '../.env' });
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function test() {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
    // There is no listModels on standard GoogleGenerativeAI, we need to fetch via REST API
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GOOGLE_API_KEY}`);
    const data = await response.json();
    console.log("Available models:", data.models ? data.models.map(m => m.name) : data);
  } catch (err) {
    console.error("Error:", err.message);
  }
}
test();
