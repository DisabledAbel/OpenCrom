export async function getEnabledJobs(env) {
  let r = await env.DB.prepare("SELECT * FROM jobs WHERE enabled = 1").all();
  return r.results;
}
export async function logJob(env, jobId, status, code) {
  await env.DB.prepare(
    "INSERT INTO job_logs (job_id, status, response_code) VALUES (?, ?, ?)"
  )
    .bind(jobId, status, code)
    .run();
}
