import Database from "better-sqlite3";
import { createClient } from "@supabase/supabase-js";

// --- Supabase client ---
export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// --- SQLite database ---
export const db = new Database("cron_dashboard.sqlite");

// --- Initialize tables if not exist ---
db.prepare(
  `CREATE TABLE IF NOT EXISTS cron_jobs (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    cron_time TEXT NOT NULL,
    command TEXT NOT NULL,
    created_at TEXT NOT NULL
  )`
).run();

db.prepare(
  `CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    email TEXT UNIQUE NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  )`
).run();

// --- Helper functions ---
export function addJob(job) {
  const stmt = db.prepare(
    `INSERT INTO cron_jobs (id, user_id, cron_time, command, created_at)
     VALUES (@id, @user_id, @cron_time, @command, @created_at)`
  );
  return stmt.run(job);
}

export function getUserByEmail(email) {
  return db.prepare(`SELECT * FROM users WHERE email = ?`).get(email);
}

export function addUser(user) {
  const stmt = db.prepare(
    `INSERT INTO users (id, email, created_at) VALUES (@id, @email, @created_at)`
  );
  return stmt.run(user);
}

export function getJobsByUser(userId) {
  return db.prepare(`SELECT * FROM cron_jobs WHERE user_id = ?`).all(userId);
}
