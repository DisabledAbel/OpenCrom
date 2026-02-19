import express from "express";
import session from "express-session";
import SQLiteStoreFactory from "connect-sqlite3";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* =========================
   Ensure persistent folders
========================= */
const dataDir = "/opt/render/project/src/data";
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

/* =========================
   Session store
========================= */
const SQLiteStore = SQLiteStoreFactory(session);

app.use(
  session({
    store: new SQLiteStore({
      db: "sessions.sqlite",
      dir: dataDir
    }),
    secret: "cron-secret",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
  })
);

/* =========================
   Static files (UI)
========================= */
app.use("/static", express.static(path.join(__dirname, "public")));

/* =========================
   Login (simple protection)
========================= */
const USER = "admin";
const PASS = "admin123";

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

app.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (username === USER && password === PASS) {
    req.session.user = username;
    return res.redirect("/dashboard");
  }

  res.send("Login failed");
});

/* =========================
   Auth middleware
========================= */
function requireAuth(req, res, next) {
  if (!req.session.user) {
    return res.redirect("/");
  }
  next();
}

/* =========================
   DASHBOARD ROUTE  ← THIS FIXES YOUR ERROR
========================= */
app.get("/dashboard", requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "dashboard.html"));
});

/* =========================
   Example cron job storage
========================= */
let jobs = [];

app.get("/api/jobs", requireAuth, (req, res) => {
  res.json(jobs);
});

app.post("/api/jobs", requireAuth, (req, res) => {
  const job = req.body;
  jobs.push(job);
  res.json({ success: true });
});

/* =========================
   Health check
========================= */
app.get("/health", (req, res) => {
  res.send("OK");
});

/* =========================
   Start server
========================= */
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
