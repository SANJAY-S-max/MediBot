// ==========================================
// CONFIGURATION INSTRUCTIONS
// ==========================================
// 1. Database (Neon DB PostgreSQL):
//    Ensure DATABASE_URL is set in your .env file.
//    Example: DATABASE_URL="postgresql://user:password@endpoint.neon.tech/dbname"
//
// 2. API Keys:
//    Ensure OPENAI_API_KEY or GOOGLE_API_KEY is set in your .env file
//    for the LLM interaction.
// ==========================================

require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');

const chatRoutes = require('./routes/chat');
const voiceRoutes = require('./routes/voice');
const visionRoutes = require('./routes/vision');
const reportRoutes = require('./routes/report');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/chat', chatRoutes);
app.use('/api/voice', voiceRoutes);
app.use('/api/vision', visionRoutes);
app.use('/api/report', reportRoutes); // PDF Generation

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`MediBot Server running on port ${PORT}`);
});
