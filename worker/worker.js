import fetch from "node-fetch";
import parser from "cron-parser";
import { supabase } from "../db.js";

function getNext(cron, from) {
  try {
    const it = parser.parseExpression(cron, { currentDate: new Date(from) });
    return it.next().getTime();
  } catch {
    return null;
  }
}

async function run() {
  const { data: jobs, error } = await supabase.from("jobs").select("*");
  if (error) return console.error("Worker error fetching jobs:", error);

  const now = Date.now();

  for (const job of jobs) {
    if (!job.next_run) {
      const next = getNext(job.cron, now);
      await supabase.from("jobs").update({ next_run: next }).eq("id", job.id);
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

      const next = getNext(job.cron, now);
      await supabase.from("jobs").update({ last_run: now, next_run: next }).eq("id", job.id);
    }
  }
}

console.log("Worker running");
setInterval(run, 10000);
