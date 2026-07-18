require('dotenv').config({ path: '../.env' });
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function test() {
  try {
    const session = await prisma.sessionLog.create({
      data: {
        name: "TestUser",
        age: "25",
        gender: "Male",
        location: "Chennai",
      }
    });
    console.log("SUCCESS! Inserted:", session);
  } catch (err) {
    console.error("FAILED:", err.message);
  } finally {
    await prisma.$disconnect();
  }
}
test();
