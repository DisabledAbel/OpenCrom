export async function getEnabledJobs(env) {
  const { results } = await env.DB.prepare(
    "SELECT * FROM jobs WHERE enabled = 1"
  ).all();
  return results;
}

export async function logJob(env, jobId, status, responseCode) {
  await env.DB.prepare(
    `INSERT INTO job_logs (job_id, status, response_code)
     VALUES (?, ?, ?)`
  )
    .bind(jobId, status, responseCode)
    .run();
}
