import express from "express";
import session from "express-session";
import bcrypt from "bcrypt";

const app = express();

/* ---------- CONFIG FROM ENV ---------- */
const ADMIN_USER = process.env.ADMIN_USER || "admin";

/*
Generate password hash locally with:
node -e "require('bcrypt').hash('yourpassword',10).then(console.log)"
*/
const ADMIN_HASH =
  process.env.ADMIN_HASH ||
  "$2b$10$4X9V5O8H7uA3Q8Xj0l9S2u6xVn1l8y8U5Zc9XgYF8E5OQp1d7Wz1C"; // replace later

/* ---------- PARSERS ---------- */
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

/* ---------- SESSION ---------- */
app.set("trust proxy", 1); // needed for Render HTTPS

app.use(
  session({
    secret: process.env.SESSION_SECRET || "change-this-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: true,
      httpOnly: true,
      sameSite: "lax"
    }
  })
);

/* ---------- AUTH MIDDLEWARE ---------- */
function requireAuth(req, res, next) {
  if (!req.session.user) {
    return res.redirect("/");
  }
  next();
}

/* ---------- LOGIN PAGE ---------- */
app.get("/", (req, res) => {
  if (req.session.user) return res.redirect("/dashboard");

  res.send(`
    <h2>Cron Login</h2>
    <form method="POST" action="/login">
      <input name="username" placeholder="username" required/>
      <input name="password" type="password" placeholder="password" required/>
      <button>Login</button>
    </form>
  `);
});

/* ---------- LOGIN ---------- */
app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  if (username !== ADMIN_USER) {
    return res.send("Login failed");
  }

  const ok = await bcrypt.compare(password, ADMIN_HASH);
  if (!ok) {
    return res.send("Login failed");
  }

  req.session.user = username;
  res.redirect("/dashboard");
});

/* ---------- DASHBOARD ---------- */
app.get("/dashboard", requireAuth, (req, res) => {
  res.send(`
    <h1>Cron Dashboard</h1>
    <p>Logged in as ${req.session.user}</p>

    <ul>
      <li>Job: cleanup-temp-files</li>
      <li>Job: backup-db</li>
      <li>Job: nightly-report</li>
    </ul>

    <a href="/logout">Logout</a>
  `);
});

/* ---------- PROTECTED API ---------- */
app.get("/api/jobs", requireAuth, (req, res) => {
  res.json([
    { name: "cleanup-temp-files", schedule: "0 * * * *" },
    { name: "backup-db", schedule: "0 2 * * *" }
  ]);
});

/* ---------- LOGOUT ---------- */
app.get("/logout", requireAuth, (req, res) => {
  req.session.destroy(() => res.redirect("/"));
});

/* ---------- SERVER ---------- */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on", PORT));
