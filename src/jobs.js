import { logJob } from "./db.js";

export async function executeJob(env, job) {
  try {
    const res = await fetch(job.url, { method: job.method || "GET" });
    await logJob(env, job.id, res.ok ? "success" : "failure", res.status);
  } catch (e) {
    await logJob(env, job.id, "failure", 0);
  }
}
