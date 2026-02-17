import express from "express";
import Database from "better-sqlite3";

const router = express.Router();

// Open your SQLite DB
const db = new Database("cronjobs.db", { fileMustExist: true });

// GET /dashboard
router.get("/", (req, res) => {
  try {
    const jobs = db.prepare("SELECT id, name, schedule, last_run, status FROM cronjobs").all();

    let rows = jobs.map(job => `
      <tr>
        <td>${job.id}</td>
        <td>${job.name}</td>
        <td>${job.schedule}</td>
        <td>${job.last_run ?? "Never"}</td>
        <td>${job.status ?? "Pending"}</td>
      </tr>
    `).join("");

    res.send(`
      <h1>Cronjob Dashboard</h1>
      <table border="1" cellpadding="5" cellspacing="0">
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
          ${rows || "<tr><td colspan='5'>No cronjobs found</td></tr>"}
        </tbody>
      </table>
    `);

  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading cronjobs");
  }
});

export default router;
