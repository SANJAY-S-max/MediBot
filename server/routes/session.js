const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { PrismaNeon } = require('@prisma/adapter-neon');
const { Pool } = require('@neondatabase/serverless');

// Prisma v7 requires a driver adapter — use Neon's serverless adapter
function getPrisma() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) throw new Error('DATABASE_URL is not set in .env');
  const pool = new Pool({ connectionString: dbUrl });
  const adapter = new PrismaNeon(pool);
  return new PrismaClient({ adapter });
}


// POST /api/session — Save user profile to NeonDB when chat starts
router.post('/', async (req, res) => {
  const prisma = getPrisma();
  try {
    const { profile } = req.body;

    if (!profile || !profile.name || !profile.age || !profile.gender || !profile.location) {
      return res.status(400).json({ error: 'Incomplete profile data.' });
    }

    const session = await prisma.sessionLog.create({
      data: {
        name: profile.name,
        age: profile.age,
        gender: profile.gender,
        location: profile.location,
      }
    });

    res.json({ success: true, sessionId: session.id });
  } catch (error) {
    console.error('Session save error:', error.message);
    res.status(500).json({ error: 'Failed to save session.' });
  } finally {
    await prisma.$disconnect();
  }
});

module.exports = router;
