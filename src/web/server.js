import express from "express";
import session from "express-session";
import SQLiteStore from "connect-sqlite3";
import dashboardRouter from "./routes/dashboard.js";
import "./cronjobs.js"; // Load and run cronjobs

const app = express();

// Sessions
app.use(session({
  store: new (SQLiteStore(session))({ db: "sessions.db" }),
  secret: "super-secret-key",
  resave: false,
  saveUninitialized: false
}));

// Root route
app.get("/", (req, res) => {
  res.send("<h1>Hello from Render!</h1><p>Database and sessions are ready.</p>");
});

// Dashboard
app.use("/dashboard", dashboardRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
