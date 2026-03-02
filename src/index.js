import { getEnabledJobs } from "./db.js";
import { executeJob } from "./jobs.js";

export default {
  async scheduled(event, env, ctx) {
    const jobs = await getEnabledJobs(env);
    for (const job of jobs) {
      ctx.waitUntil(executeJob(env, job));
    }
  },
  async fetch(request, env) {
    if (new URL(request.url).pathname === "/health") {
      return new Response("OK");
    }
    return new Response("Not Found", { status: 404 });
  },
};
