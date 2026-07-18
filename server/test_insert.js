require('dotenv').config({ path: '../.env' });
console.log("DB URL IS:", process.env.DATABASE_URL);
const { PrismaClient } = require('@prisma/client');
const { PrismaNeon } = require('@prisma/adapter-neon');
const { Pool } = require('@neondatabase/serverless');

async function test() {
  const dbUrl = process.env.DATABASE_URL;
  console.log("Creating pool with dbUrl:", dbUrl);
  const pool = new Pool({ connectionString: dbUrl });
  console.log("Pool connection string:", pool.options?.connectionString);
  const adapter = new PrismaNeon(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    const session = await prisma.sessionLog.create({
      data: {
        name: "TestUser",
        age: "25",
        gender: "Male",
        location: "TestCity",
      }
    });
    console.log("Successfully inserted session:", session);
  } catch (err) {
    console.error("Failed to insert:", err);
  } finally {
    await prisma.$disconnect();
  }
}
test();
