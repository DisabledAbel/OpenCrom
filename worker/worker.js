import { createClient } from "@supabase/supabase-js";

async function getNext(cron, from) {
  const parser = await import("cron-parser");
  try {
    const it = parser.parseExpression(cron, { currentDate: new Date(from) });
    return it.next().getTime();
  } catch {
    return null;
  }
}

export default {
  async scheduled(event, env, ctx) {
    const supabase = createClient(
      env.SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data: jobs, error } = await supabase
      .from("jobs")
      .select("*");

    if (error) {
      console.error("Fetch jobs error:", error);
      return;
    }

    const now = Date.now();

    for (const job of jobs) {
      if (!job.next_run) {
        const next = await getNext(job.cron, now);
        await supabase
          .from("jobs")
          .update({ next_run: next })
          .eq("id", job.id);
        continue;
      }

      if (now >= job.next_run) {
        try {
          const start = Date.now();
          const res = await fetch(job.url);
          const ms = Date.now() - start;

          await supabase.from("logs").insert([{
            job_id: job.id,
            url: job.url,
            status: res.status,
            response_time: ms
          }]);
        } catch (err) {
          await supabase.from("logs").insert([{
            job_id: job.id,
            url: job.url,
            status: "ERROR",
            error: err.message
          }]);
        }

        const next = await getNext(job.cron, now);
        await supabase
          .from("jobs")
          .update({
            last_run: now,
            next_run: next
          })
          .eq("id", job.id);
      }
    }
  }
};
