import express from "express";
import db from "../cronjobs.js"; // your DB with cronjob info

const router = express.Router();

router.get("/", (req, res) => {
  // Fetch all cronjobs from database
  const rows = db.prepare("SELECT id, name, schedule, last_run, status FROM cronjobs").all();

  let tableRows = rows.map(r => `
    <tr>
      <td>${r.id}</td>
      <td>${r.name}</td>
      <td>${r.schedule}</td>
      <td>${r.last_run || "-"}</td>
      <td>${r.status || "-"}</td>
    </tr>
  `).join("");

  if (!tableRows) tableRows = "<tr><td colspan='5'>No cronjobs found</td></tr>";

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
        ${tableRows}
      </tbody>
    </table>
    <p>Page auto-refreshes every 10 seconds.</p>
    <script>
      setTimeout(() => { window.location.reload(); }, 10000);
    </script>
  `);
});

export default router;
