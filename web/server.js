import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import parser from "cron-parser";
import cookieParser from "cookie-parser";
import { supabase } from "../db.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use(express.static("web/public"));

const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

/* -------- AUTH MIDDLEWARE -------- */

function requireAuth(req,res,next){
  if(req.cookies?.auth==="ok") return next();
  return res.status(401).json({error:"Not logged in"});
}

/* -------- LOGIN ROUTES -------- */

app.post("/api/login",(req,res)=>{
  const { password } = req.body;

  if(password===ADMIN_PASSWORD){
    res.cookie("auth","ok",{httpOnly:true,sameSite:"lax"});
    return res.json({success:true});
  }

  res.status(401).json({error:"Wrong password"});
});

app.post("/api/logout",(req,res)=>{
  res.clearCookie("auth");
  res.json({success:true});
});

/* -------- API -------- */

app.get("/api/jobs", requireAuth, async (req,res)=>{
  const {data,error}=await supabase.from("jobs").select("*").order("id",{ascending:false});
  if(error) return res.status(500).json({error:error.message});
  res.json(data);
});

app.post("/api/jobs", requireAuth, async (req,res)=>{
  const {url,cron}=req.body;
  const next=getNextRun(cron,Date.now());

  const {data,error}=await supabase
    .from("jobs")
    .insert([{url,cron,last_run:0,next_run:next}])
    .select();

  if(error) return res.status(500).json({error:error.message});
  res.json(data[0]);
});

app.delete("/api/jobs/:id", requireAuth, async (req,res)=>{
  const {error}=await supabase.from("jobs").delete().eq("id",req.params.id);
  if(error) return res.status(500).json({error:error.message});
  res.sendStatus(204);
});

app.get("/api/logs", requireAuth, async (req,res)=>{
  const {data,error}=await supabase
    .from("logs")
    .select("*")
    .order("ran_at",{ascending:false})
    .limit(50);

  if(error) return res.status(500).json({error:error.message});
  res.json(data);
});

/* -------- CRON ENGINE -------- */

function getNextRun(cron,from){
  try{
    const it=parser.parseExpression(cron,{currentDate:new Date(from)});
    return it.next().getTime();
  }catch{
    return null;
  }
}

async function runJobs(){
  const {data:jobs,error}=await supabase.from("jobs").select("*");
  if(error) return console.error(error);

  const now=Date.now();

  for(const job of jobs){
    if(!job.next_run){
      const next=getNextRun(job.cron,now);
      await supabase.from("jobs").update({next_run:next}).eq("id",job.id);
      continue;
    }

    if(now>=job.next_run){
      try{
        const start=Date.now();
        const r=await fetch(job.url);
        const ms=Date.now()-start;

        await supabase.from("logs").insert([{
          job_id:job.id,
          url:job.url,
          status:r.status,
          response_time:ms
        }]);
      }catch(e){
        await supabase.from("logs").insert([{
          job_id:job.id,
          url:job.url,
          status:"ERROR",
          error:e.message
        }]);
      }

      const next=getNextRun(job.cron,now);

      await supabase.from("jobs")
        .update({last_run:now,next_run:next})
        .eq("id",job.id);
    }
  }
}

setInterval(runJobs,10000);

app.listen(PORT,()=>{
  console.log("Server running on port",PORT);
});
