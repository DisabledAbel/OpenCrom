import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import parser from "cron-parser";
import { supabase } from "../db.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static("web/public"));

const PORT = process.env.PORT || 3000;

/* ---------------- API ---------------- */

app.get("/api/jobs", async (req, res) => {
  const { data, error } = await supabase
    .from("jobs")
    .select("*")
    .order("id", { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.post("/api/jobs", async (req, res) => {
  const { url, cron } = req.body;

  const next = getNextRun(cron, Date.now());

  const { data, error } = await supabase
    .from("jobs")
    .insert([{ url, cron, last_run: 0, next_run: next }])
    .select();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data[0]);
});

app.delete("/api/jobs/:id", async (req, res) => {
  const { error } = await supabase
    .from("jobs")
    .delete()
    .eq("id", req.params.id);

  if (error) return res.status(500).json({ error: error.message });
  res.sendStatus(204);
});

app.get("/api/logs", async (req, res) => {
  const { data, error } = await supabase
    .from("logs")
    .select("*")
    .order("ran_at", { ascending: false })
    .limit(50);

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

/* ---------------- CRON ENGINE ---------------- */

function getNextRun(cron, from) {
  try {
    const it = parser.parseExpression(cron, {
      currentDate: new Date(from)
    });
    return it.next().getTime();
  } catch {
    return null;
  }
}

async function runJobs() {
  const { data: jobs, error } = await supabase.from("jobs").select("*");
  if (error) return console.error("Job fetch error:", error);

  const now = Date.now();

  for (const job of jobs) {
    if (!job.next_run) {
      const next = getNextRun(job.cron, now);
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

      const next = getNextRun(job.cron, now);

      await supabase
        .from("jobs")
        .update({ last_run: now, next_run: next })
        .eq("id", job.id);
    }
  }
}

/* run scheduler every 10 seconds */
setInterval(runJobs, 10000);

/* ---------------- START ---------------- */

app.listen(PORT, () => {
  console.log(`Web server running on port ${PORT}`);
});
