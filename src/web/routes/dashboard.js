import express from "express";
import sqlite3 from "sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Use Render persistent disk if available
const DB_PATH =
  process.env.DB_PATH ||
  path.join(__dirname, "../../data/database.sqlite");

// Open DB safely
const db = new sqlite3.Database(DB_PATH, err => {
  if (err) {
    console.error("Dashboard DB open error:", err.message);
  } else {
    console.log("Dashboard connected to SQLite");
  }
});

router.get("/", (req, res) => {
  db.all(
    `SELECT id, name, schedule, last_run, status FROM cronjobs ORDER BY id DESC`,
    [],
    (err, rows) => {
      if (err) {
        return res.send(`
          <h1>Dashboard Error</h1>
          <pre>${err.message}</pre>
        `);
      }

      const tableRows = rows
        .map(
          j => `
          <tr>
            <td>${j.id}</td>
            <td>${j.name}</td>
            <td>${j.schedule}</td>
            <td>${j.last_run || "-"}</td>
            <td>${j.status || "unknown"}</td>
          </tr>
        `
        )
        .join("");

      res.send(`
        <html>
        <head>
          <title>Cronjob Dashboard</title>
          <style>
            body { font-family: sans-serif; padding: 30px; background:#111; color:#eee }
            table { border-collapse: collapse; width:100%; background:#1a1a1a }
            th,td { border:1px solid #333; padding:8px }
            th { background:#222 }
            tr:nth-child(even){background:#161616}
            a { color:#4da3ff }
          </style>
        </head>
        <body>
          <h1>⏱ Cronjob Dashboard</h1>
          <p><a href="/">Home</a></p>

          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Schedule</th>
                <th>Last Run</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows || `<tr><td colspan="5">No cronjobs yet</td></tr>`}
            </tbody>
          </table>
        </body>
        </html>
      `);
    }
  );
});

export default router;
