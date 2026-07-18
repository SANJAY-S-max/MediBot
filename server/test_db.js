require('dotenv').config({ path: '../.env' });
const { Pool } = require('@neondatabase/serverless');

async function test() {
  console.log("DB URL:", process.env.DATABASE_URL);
  try {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const res = await pool.query('SELECT NOW()');
    console.log("DB connection successful!", res.rows);
  } catch (err) {
    console.error("DB connection error:", err.message);
  }
}
test();
