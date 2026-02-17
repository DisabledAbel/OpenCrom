import cron from "node-cron";
import Database from "better-sqlite3";

const db = new Database("cronjobs.db");

// Load all cronjobs from DB
const jobs = db.prepare("SELECT id, name, schedule FROM cronjobs").all();

jobs.forEach(job => {
  cron.schedule(job.schedule, () => {
    const now = new Date().toISOString();
    console.log(`Running job: ${job.name} at ${now}`);

    // Example: Your actual task here
    let status = "Success";

    // Update last_run and status in DB
    db.prepare("UPDATE cronjobs SET last_run = ?, status = ? WHERE id = ?")
      .run(now, status, job.id);
  });
});

export default db;
