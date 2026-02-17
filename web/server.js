import express from "express";
import session from "express-session";
import SQLiteStore from "connect-sqlite3";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";
import { scheduleJob } from "cron-schedule"; // replacement for cron-parser
import { nanoid } from "nanoid";

// --- CONFIG ---
const app = express();
const PORT = process.env.PORT || 3000;

// Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Middlewares
app.use(cors());
app.use(express.json());
app.use(
  session({
    store: new SQLiteStore({ db: "sessions.sqlite" }),
    secret: process.env.SESSION_SECRET || "supersecret",
    resave: false,
    saveUninitialized: true,
  })
);

// --- ROUTES ---

// Test route
app.get("/", (req, res) => {
  res.send("Cron Dashboard is running!");
});

// Schedule a job
app.post("/api/schedule", async (req, res) => {
  const { cronTime, command } = req.body;

  if (!req.session.userId) {
    return res.status(401).json({ error: "Not logged in" });
  }

  if (!cronTime || !command) {
    return res.status(400).json({ error: "Missing cronTime or command" });
  }

  try {
    // Schedule the job
    const jobId = nanoid();
    scheduleJob(cronTime, () => {
      console.log(`Executing job ${jobId}: ${command}`);
      // Here you can run your command, call API, etc.
    });

    // Store job in Supabase
    const { error } = await supabase.from("cron_jobs").insert([
      {
        id: jobId,
        user_id: req.session.userId,
        cron_time: cronTime,
        command,
        created_at: new Date().toISOString(),
      },
    ]);

    if (error) throw error;

    res.json({ success: true, jobId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to schedule job" });
  }
});

// --- LOGIN ROUTES (example) ---
app.post("/api/login", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email required" });

  // Lookup or create user in Supabase
  const { data, error } = await supabase
    .from("users")
    .upsert({ email }, { onConflict: ["email"] })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });

  req.session.userId = data.id;
  res.json({ success: true, user: data });
});

app.post("/api/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true });
  });
});

// --- START SERVER ---
app.listen(PORT, () => {
  console.log(`Cron Dashboard running on port ${PORT}`);
});
