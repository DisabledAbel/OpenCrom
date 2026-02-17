import express from "express";
import cors from "cors";
import { db } from "../db.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static("web/public"));

app.get("/api/jobs", async (req,res)=>{
  const { rows } = await db.query(
    "SELECT * FROM jobs ORDER BY id DESC"
  );
  res.json(rows);
});

app.post("/api/jobs", async (req,res)=>{
  const { url, cron } = req.body;

  const { rows } = await db.query(
    "INSERT INTO jobs(url,cron,next_run) VALUES($1,$2,$3) RETURNING *",
    [url,cron,Date.now()]
  );

  res.json(rows[0]);
});

app.delete("/api/jobs/:id", async (req,res)=>{
  await db.query("DELETE FROM jobs WHERE id=$1",[req.params.id]);
  res.sendStatus(204);
});

app.get("/api/logs", async (req,res)=>{
  const { rows } = await db.query(
    "SELECT * FROM logs ORDER BY ran_at DESC LIMIT 50"
  );
  res.json(rows);
});

app.listen(3000,()=>console.log("Web running"));
