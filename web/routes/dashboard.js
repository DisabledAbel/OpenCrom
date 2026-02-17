import express from "express";
import Database from "better-sqlite3";

const router = express.Router();
const db = new Database("cronjobs.db"); // your SQLite database

// Ensure a table for cronjob logs exists
db.prepare(`
  CREATE TABLE IF NOT EXISTS cron_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_name TEXT,
    last_run TEXT,
    status TEXT
  )
`).run();

router.get("/", (req, res) => {
  const jobs = db.prepare("SELECT * FROM cron_log ORDER BY last_run DESC").all();
  let html = `
    <html>
      <head>
        <title>Cronjob Dashboard</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 2rem; background: #f0f0f0; }
          table { width: 100%; border-collapse: collapse; }
          th, td { padding: 0.5rem; border: 1px solid #ccc; text-align: left; }
          th { background: #333; color: white; }
          tr:nth-child(even) { background: #eee; }
        </style>
      </head>
      <body>
        <h1>Cronjob Dashboard</h1>
        <table>
          <tr>
            <th>ID</th>
            <th>Job Name</th>
            <th>Last Run</th>
            <th>Status</th>
          </tr>
  `;
  jobs.forEach(job => {
    html += `
      <tr>
        <td>${job.id}</td>
        <td>${job.job_name}</td>
        <td>${job.last_run}</td>
        <td>${job.status}</td>
      </tr>
    `;
  });
  html += `</table></body></html>`;
  res.send(html);
});

export default router;
