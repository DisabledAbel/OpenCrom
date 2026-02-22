import express from "express";
import session from "express-session";

const app = express();

/* ---------- PARSERS ---------- */
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

/* ---------- SESSION ---------- */
app.use(
  session({
    secret: "super-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,        // Render uses HTTPS but this must stay false unless proxy configured
      httpOnly: true
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
    <h2>Login</h2>
    <form method="POST" action="/login">
      <input name="username" placeholder="username"/>
      <input name="password" type="password" placeholder="password"/>
      <button>Login</button>
    </form>
  `);
});

/* ---------- LOGIN ---------- */
app.post("/login", (req, res) => {
  const { username, password } = req.body;

  // change these later
  if (username === "admin" && password === "password") {
    req.session.user = username;
    return res.redirect("/dashboard");
  }

  res.send("Login failed");
});

/* ---------- DASHBOARD (PROTECTED) ---------- */
app.get("/dashboard", requireAuth, (req, res) => {
  res.send(`
    <h1>Cron Dashboard</h1>
    <p>Welcome ${req.session.user}</p>

    <ul>
      <li>Job: cleanup-temp-files</li>
      <li>Job: daily-report</li>
      <li>Job: backup-db</li>
    </ul>

    <a href="/logout">Logout</a>
  `);
});

/* ---------- API EXAMPLE (PROTECTED) ---------- */
app.get("/api/jobs", requireAuth, (req, res) => {
  res.json([
    { name: "cleanup-temp-files", schedule: "0 * * * *" },
    { name: "daily-report", schedule: "0 8 * * *" }
  ]);
});

/* ---------- LOGOUT ---------- */
app.get("/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/"));
});

/* ---------- START SERVER ---------- */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on", PORT));
