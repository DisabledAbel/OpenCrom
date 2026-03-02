export default {
  async scheduled(event, env, ctx) {
    const jobs = await env.DB.prepare(
      "SELECT * FROM jobs WHERE enabled = 1"
    ).all();

    for (const job of jobs.results) {
      ctx.waitUntil(runJob(env, job));
    }
  },

  async fetch(request, env) {
    const url = new URL(request.url);

    // API: Get jobs
    if (url.pathname === "/api/jobs") {
      const jobs = await env.DB.prepare("SELECT * FROM jobs").all();
      return json(jobs.results);
    }

    // API: Add job
    if (url.pathname === "/api/jobs/add" && request.method === "POST") {
      const body = await request.json();
      await env.DB.prepare(
        "INSERT INTO jobs (url, method, enabled) VALUES (?, ?, 1)"
      )
        .bind(body.url, body.method || "GET")
        .run();

      return json({ success: true });
    }

    // Dashboard UI
    if (url.pathname === "/") {
      return new Response(dashboardHTML, {
        headers: { "content-type": "text/html" },
      });
    }

    return new Response("Not Found", { status: 404 });
  },
};

async function runJob(env, job) {
  try {
    const res = await fetch(job.url, { method: job.method });
    await env.DB.prepare(
      "INSERT INTO job_logs (job_id, status, response_code) VALUES (?, ?, ?)"
    )
      .bind(job.id, res.ok ? "success" : "fail", res.status)
      .run();
  } catch {
    await env.DB.prepare(
      "INSERT INTO job_logs (job_id, status, response_code) VALUES (?, ?, ?)"
    )
      .bind(job.id, "fail", 0)
      .run();
  }
}

function json(data) {
  return new Response(JSON.stringify(data), {
    headers: { "content-type": "application/json" },
  });
}

const dashboardHTML = `
<!DOCTYPE html>
<html>
<head>
  <title>OpenCrom Dashboard</title>
  <style>
    body { font-family: Arial; background:#111; color:white; padding:40px; }
    input, button { padding:8px; margin:5px; }
    table { margin-top:20px; border-collapse: collapse; }
    td, th { padding:10px; border:1px solid #333; }
    button { cursor:pointer; }
  </style>
</head>
<body>
  <h1>🚀 OpenCrom Dashboard</h1>

  <h3>Add Job</h3>
  <input id="url" placeholder="https://example.com" size="40"/>
  <button onclick="addJob()">Add</button>

  <h3>Jobs</h3>
  <table id="jobsTable">
    <thead>
      <tr><th>ID</th><th>URL</th><th>Method</th></tr>
    </thead>
    <tbody></tbody>
  </table>

<script>
async function loadJobs(){
  const res = await fetch('/api/jobs');
  const jobs = await res.json();
  const tbody = document.querySelector('#jobsTable tbody');
  tbody.innerHTML = '';
  jobs.forEach(j=>{
    tbody.innerHTML += 
      '<tr><td>'+j.id+'</td><td>'+j.url+'</td><td>'+j.method+'</td></tr>';
  });
}

async function addJob(){
  const url = document.getElementById('url').value;
  await fetch('/api/jobs/add',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body: JSON.stringify({url})
  });
  loadJobs();
}

loadJobs();
</script>
</body>
</html>
`;
