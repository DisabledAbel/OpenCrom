import express from "express";
import cron from "node-cron";
import pkg from "pg";
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const app = express();
app.use(express.json());
app.set("trust proxy", true);

async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS jobs (
      id SERIAL PRIMARY KEY,
      schedule TEXT NOT NULL,
      url TEXT NOT NULL
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS ips (
      id SERIAL PRIMARY KEY,
      ip TEXT NOT NULL UNIQUE
    );
  `);
}

function getIP(req) {
  const xf = req.headers["x-forwarded-for"];
  if (xf) return xf.split(",")[0].trim();
  return req.socket.remoteAddress;
}

async function checkIP(req,res,next){
  const { rows } = await pool.query("SELECT ip FROM ips");
  if(rows.length === 0) return next();
  const ip = getIP(req);
  if(!rows.find(r=>r.ip===ip)){
    return res.status(403).send("IP not allowed");
  }
  next();
}

app.use(checkIP);

let tasks = [];

async function loadJobs(){
  tasks.forEach(t=>t.stop());
  tasks=[];

  const { rows } = await pool.query("SELECT * FROM jobs");
  rows.forEach(job=>{
    const t = cron.schedule(job.schedule, ()=>{
      fetch(job.url).catch(()=>{});
    });
    tasks.push(t);
  });
}

app.get("/",(req,res)=>res.send("OpenCrom running"));

app.get("/jobs", async (req,res)=>{
  const { rows } = await pool.query("SELECT * FROM jobs ORDER BY id");
  res.json(rows);
});

app.post("/jobs", async (req,res)=>{
  const { schedule, url } = req.body;
  await pool.query(
    "INSERT INTO jobs(schedule,url) VALUES($1,$2)",
    [schedule,url]
  );
  await loadJobs();
  res.json({ok:true});
});

app.delete("/jobs/:id", async (req,res)=>{
  await pool.query("DELETE FROM jobs WHERE id=$1",[req.params.id]);
  await loadJobs();
  res.json({ok:true});
});

app.get("/ips", async (req,res)=>{
  const { rows } = await pool.query("SELECT ip FROM ips");
  res.json(rows);
});

app.post("/ips", async (req,res)=>{
  await pool.query(
    "INSERT INTO ips(ip) VALUES($1) ON CONFLICT DO NOTHING",
    [req.body.ip]
  );
  res.json({ok:true});
});

const port = process.env.PORT || 3000;

initDB().then(()=>{
  loadJobs().then(()=>{
    app.listen(port,()=>{
      console.log("Server running on",port);
    });
  });
});
