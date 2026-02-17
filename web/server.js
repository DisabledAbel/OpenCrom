import express from "express";
import cors from "cors";
import session from "express-session";
import SQLiteStore from "connect-sqlite3";
import { execFile } from "child_process";
import path from "path";

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Session with SQLite store
app.use(
  session({
    store: new (SQLiteStore(session))({ db: "sessions.sqlite", dir: "./db" }),
    secret: "supersecret",
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 86400000 } // 1 day
  })
);

// C++ executable route
app.get("/cpp", (req, res) => {
  const exePath = path.join(process.cwd(), "src", "cpp", "hello");
  execFile(exePath, (error, stdout, stderr) => {
    if (error) return res.status(500).send(`Error: ${error.message}`);
    if (stderr) return res.status(500).send(`Stderr: ${stderr}`);
    res.send(stdout);
  });
});

// Test route
app.get("/", (req, res) => {
  res.send("Node + SQLite + C++ on Render is working!");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
