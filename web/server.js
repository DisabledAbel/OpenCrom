import express from "express";
import cors from "cors";
import { supabase } from "../src/db.js";

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("web/public"));

const PORT = process.env.PORT || 3000;

// Routes
app.get("/api/jobs", async (req, res) => {
  const { data: jobs, error } = await supabase
    .from("jobs")
    .select("*")
    .order("id", { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(jobs);
});

app.post("/api/jobs", async (req, res) => {
  const { url, cron } = req.body;
  const { data, error } = await supabase
    .from("jobs")
    .insert([{ url, cron, last_run: 0, next_run: Date.now() }])
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
  const { data: logs, error } = await supabase
    .from("logs")
    .select("*")
    .order("ran_at", { ascending: false })
    .limit(50);
  if (error) return res.status(500).json({ error: error.message });
  res.json(logs);
});

app.listen(PORT, () => console.log(`Web server running on port ${PORT}`));
