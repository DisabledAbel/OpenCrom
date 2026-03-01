import { getEnabledJobs } from "./db";
import { executeJob } from "./jobs";

export default {
  async scheduled(event, env, ctx) {
    const jobs = await getEnabledJobs(env);

    for (const job of jobs) {
      ctx.waitUntil(executeJob(env, job));
    }
  },

  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/health") {
      return new Response("OK");
    }

    if (url.pathname === "/jobs") {
      const { results } = await env.DB.prepare(
        "SELECT * FROM jobs"
      ).all();

      return Response.json(results);
    }

    return new Response("Not Found", { status: 404 });
  }
};
