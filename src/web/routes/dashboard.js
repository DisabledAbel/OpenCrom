import express from "express";

const router = express.Router();

// Dummy data for demonstration
const cronjobs = [
  { id: 1, name: "Job A", schedule: "*/5 * * * *", last_run: "2026-02-17 20:00", status: "success" },
  { id: 2, name: "Job B", schedule: "0 * * * *", last_run: "2026-02-17 19:00", status: "pending" },
];

router.get("/", (req, res) => {
  let rows = cronjobs.map(job => `
    <tr>
      <td>${job.id}</td>
      <td>${job.name}</td>
      <td>${job.schedule}</td>
      <td>${job.last_run}</td>
      <td>${job.status}</td>
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
        ${rows}
      </tbody>
    </table>
  `);
});

export default router;
