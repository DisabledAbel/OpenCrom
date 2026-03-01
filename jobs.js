import { logJob } from "./db";

export async function executeJob(env, job) {
  try {
    const response = await fetch(job.url, {
      method: job.method || "GET"
    });

    await logJob(
      env,
      job.id,
      response.ok ? "success" : "failure",
      response.status
    );
  } catch (err) {
    await logJob(env, job.id, "failure", 0);
  }
}
