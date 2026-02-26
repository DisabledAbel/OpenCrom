import pkg from "pg";
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function init() {
  try {
    // Add 'enabled' column if it doesn't exist
    await pool.query(`
      ALTER TABLE jobs
      ADD COLUMN IF NOT EXISTS enabled BOOLEAN DEFAULT TRUE;
    `);

    // Create logs table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS logs (
        id SERIAL PRIMARY KEY,
        job_id INT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
        timestamp TIMESTAMP DEFAULT NOW(),
        success BOOLEAN,
        status_code INT,
        error TEXT
      );
    `);

    console.log("Database schema updated successfully!");
    process.exit(0);
  } catch (err) {
    console.error("Error updating database:", err);
    process.exit(1);
  }
}

init();
