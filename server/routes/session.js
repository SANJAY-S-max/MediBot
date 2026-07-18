const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');

// Use the standard pg adapter — works in Node.js (no WebSockets needed)
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// POST /api/session — Save user profile to NeonDB when chat starts
router.post('/', async (req, res) => {
  try {
    const { profile } = req.body;

    if (!profile || !profile.name || !profile.age || !profile.gender || !profile.location) {
      return res.status(400).json({ error: 'Incomplete profile data.' });
    }

    const session = await prisma.sessionLog.create({
      data: {
        name: profile.name,
        age: String(profile.age),
        gender: profile.gender,
        location: profile.location,
      }
    });

    console.log('Session saved to DB:', session);
    res.json({ success: true, sessionId: session.id });
  } catch (error) {
    console.error('Session save error:', error);
    res.status(500).json({ error: 'Failed to save session.' });
  }
});

module.exports = router;
