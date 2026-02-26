import express from "express";
import cron from "node-cron";
import pkg from "pg";
import path from "path";
import { fileURLToPath } from "url";
import fetch from "node-fetch";

const { Pool } = pkg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const app = express();
app.use(express.json());
app.set("trust proxy", true);
app.use(express.static(path.join(__dirname, "public")));

// ---- DB INIT ----
async function initDB() {
  // Create jobs table if missing
  await pool.query(`
    CREATE TABLE IF NOT EXISTS jobs (
      id SERIAL PRIMARY KEY,
      schedule TEXT NOT NULL,
      url TEXT NOT NULL
    );
  `);

  // Check if 'enabled' column exists
  const { rows } = await pool.query(`
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name='jobs' AND column_name='enabled';
  `);

  if (rows.length === 0) {
    await pool.query(`ALTER TABLE jobs ADD COLUMN enabled BOOLEAN DEFAULT TRUE`);
  }

  // IP table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ips (
      id SERIAL PRIMARY KEY,
      ip TEXT NOT NULL UNIQUE
    );
  `);

  // Logs table
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
}

// ---- IP Detection ----
function getIP(req) {
  const xf = req.headers["x-forwarded-for"];
  if (xf) return xf.split(",")[0].trim();
  return req.socket.remoteAddress;
}

// ---- IP Protection ----
async function checkIP(req, res, next) {
  const { rows } = await pool.query("SELECT ip FROM ips");
  if (rows.length === 0 && (req.path === "/" || req.path.startsWith("/ips"))) return next();
  const ip = getIP(req);
  if (!rows.find(r => r.ip === ip)) return res.status(403).send("IP not allowed: " + ip);
  next();
}
app.use(checkIP);

// ---- Cron Jobs Loader ----
let tasks = [];

async function loadJobs() {
  tasks.forEach(t => t.stop());
  tasks = [];

  const { rows } = await pool.query("SELECT * FROM jobs WHERE enabled=TRUE");
  rows.forEach(job => {
    const t = cron.schedule(job.schedule, async () => {
      try {
        const r = await fetch(job.url);
        await pool.query(
          "INSERT INTO logs(job_id, success, status_code) VALUES($1,$2,$3)",
          [job.id, r.ok, r.status]
        );
      } catch (e) {
        await pool.query(
          "INSERT INTO logs(job_id, success, error) VALUES($1,$2,$3)",
          [job.id, false, e.message]
        );
      }
    });
    tasks.push(t);
  });
}

// ---- Routes ----
app.get("/jobs", async (req, res) => {
  const { rows } = await pool.query("SELECT * FROM jobs ORDER BY id");
  res.json(rows);
});

app.post("/jobs", async (req, res) => {
  const { schedule, url } = req.body;
  if (!schedule || !url) return res.status(400).json({ error: "Missing schedule or URL" });
  await pool.query(
    "INSERT INTO jobs(schedule,url,enabled) VALUES($1,$2,TRUE)",
    [schedule, url]
  );
  await loadJobs();
  res.json({ ok: true });
});

app.delete("/jobs/:id", async (req, res) => {
  await pool.query("DELETE FROM jobs WHERE id=$1", [req.params.id]);
  await loadJobs();
  res.json({ ok: true });
});

app.post("/jobs/:id/toggle", async (req, res) => {
  const { id } = req.params;
  const { rows } = await pool.query("SELECT enabled FROM jobs WHERE id=$1", [id]);
  if (!rows[0]) return res.status(404).json({ error: "Job not found" });
  const newStatus = !rows[0].enabled;
  await pool.query("UPDATE jobs SET enabled=$1 WHERE id=$2", [newStatus, id]);
  await loadJobs();
  res.json({ ok: true, enabled: newStatus });
});

app.get("/logs", async (req, res) => {
  const { rows } = await pool.query(`
    SELECT logs.*, jobs.url, jobs.schedule FROM logs
    LEFT JOIN jobs ON logs.job_id = jobs.id
    ORDER BY logs.timestamp DESC LIMIT 50
  `);
  res.json(rows);
});

// ---- IP Routes ----
app.get("/ips", async (req, res) => {
  const { rows } = await pool.query("SELECT ip FROM ips");
  res.json(rows);
});

app.post("/ips", async (req, res) => {
  await pool.query("INSERT INTO ips(ip) VALUES($1) ON CONFLICT DO NOTHING", [req.body.ip]);
  res.json({ ok: true });
});

app.post("/ips/auto", async (req, res) => {
  const ip = getIP(req);
  await pool.query("INSERT INTO ips(ip) VALUES($1) ON CONFLICT DO NOTHING", [ip]);
  res.json({ ok: true, added: ip });
});

// ---- Start Server ----
const port = process.env.PORT || 3000;
initDB()
  .then(() => loadJobs())
  .then(() => app.listen(port, () => console.log("OpenCrom running on port", port)))
  .catch(err => console.error("Failed to start server:", err));
