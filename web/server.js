import express from "express";
import fs from "fs";
import path from "path";
import cron from "node-cron";

const app = express();
app.use(express.json());
app.set("trust proxy", true);

const DATA_DIR = "/data";
const JOBS_FILE = path.join(DATA_DIR, "jobs.json");
const IPS_FILE = path.join(DATA_DIR, "allowed-ips.json");

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(JOBS_FILE)) fs.writeFileSync(JOBS_FILE, "[]");
if (!fs.existsSync(IPS_FILE)) fs.writeFileSync(IPS_FILE, "[]");

function readJSON(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}
function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function getIP(req) {
  const xf = req.headers["x-forwarded-for"];
  if (xf) return xf.split(",")[0].trim();
  return req.socket.remoteAddress;
}

function checkIP(req, res, next) {
  const allowed = readJSON(IPS_FILE);
  if (allowed.length === 0) return next(); // first run = open
  const ip = getIP(req);
  if (!allowed.includes(ip)) {
    return res.status(403).send("IP not allowed");
  }
  next();
}

app.use(checkIP);

let tasks = [];

function loadJobs() {
  tasks.forEach(t => t.stop());
  tasks = [];
  const jobs = readJSON(JOBS_FILE);
  jobs.forEach(job => {
    const t = cron.schedule(job.schedule, () => {
      fetch(job.url).catch(()=>{});
    });
    tasks.push(t);
  });
}
loadJobs();

app.get("/", (req,res)=>{
  res.send("OpenCrom running");
});

app.get("/jobs",(req,res)=>{
  res.json(readJSON(JOBS_FILE));
});

app.post("/jobs",(req,res)=>{
  const jobs = readJSON(JOBS_FILE);
  jobs.push(req.body);
  writeJSON(JOBS_FILE,jobs);
  loadJobs();
  res.json({ok:true});
});

app.delete("/jobs/:i",(req,res)=>{
  const jobs = readJSON(JOBS_FILE);
  jobs.splice(req.params.i,1);
  writeJSON(JOBS_FILE,jobs);
  loadJobs();
  res.json({ok:true});
});

app.get("/ips",(req,res)=>{
  res.json(readJSON(IPS_FILE));
});

app.post("/ips",(req,res)=>{
  const ips = readJSON(IPS_FILE);
  ips.push(req.body.ip);
  writeJSON(IPS_FILE,ips);
  res.json({ok:true});
});

const port = process.env.PORT || 3000;
app.listen(port,()=>{
  console.log("Server running on",port);
});
