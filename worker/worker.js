import fetch from "node-fetch";
import parser from "cron-parser";
import { db } from "../db.js";

function getNext(cron, from){
  try{
    const it = parser.parseExpression(cron,{currentDate:new Date(from)});
    return it.next().getTime();
  }catch{
    return null;
  }
}

async function run(){

  const { rows:jobs } = await db.query("SELECT * FROM jobs");
  const now = Date.now();

  for(const job of jobs){

    if(!job.next_run){
      const next = getNext(job.cron,now);
      await db.query(
        "UPDATE jobs SET next_run=$1 WHERE id=$2",
        [next,job.id]
      );
      continue;
    }

    if(now >= job.next_run){

      try{
        const start = Date.now();
        const res = await fetch(job.url);
        const ms = Date.now() - start;

        await db.query(
          `INSERT INTO logs(job_id,url,status,response_time)
           VALUES($1,$2,$3,$4)`,
          [job.id,job.url,res.status,ms]
        );

      }catch(err){
        await db.query(
          `INSERT INTO logs(job_id,url,status,error)
           VALUES($1,$2,$3,$4)`,
          [job.id,job.url,"ERROR",err.message]
        );
      }

      const next = getNext(job.cron,now);

      await db.query(
        `UPDATE jobs
         SET last_run=$1,next_run=$2
         WHERE id=$3`,
        [now,next,job.id]
      );
    }
  }
}

console.log("Worker running");
setInterval(run,10000);
