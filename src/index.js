import { getEnabledJobs, logJob } from "./db.js";

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Manual trigger
    if (url.pathname === "/run") {
      ctx.waitUntil(runJobs(env));
      return new Response("Manual run triggered");
    }

    // List jobs
    if (url.pathname === "/jobs" && request.method === "GET") {
      const jobs = await env.DB.prepare("SELECT * FROM jobs ORDER BY id DESC").all();
      return new Response(JSON.stringify(jobs.results), {
        headers: { "content-type": "application/json" }
      });
    }

    // Add job
    if (url.pathname === "/jobs" && request.method === "POST") {
      const data = await request.json();
      await env.DB.prepare("INSERT INTO jobs (name, url, method, enabled) VALUES (?, ?, ?, 1)")
        .bind(data.name ?? "", data.url, data.method ?? "GET")
        .run();
      return new Response(JSON.stringify({ success: true }), { headers: { "content-type": "application/json" }});
    }

    // Basic UI
    return new Response(renderUI(), {
      headers: { "content-type": "text/html; charset=utf-8" }
    });
  },

  async scheduled(event, env, ctx) {
    // Run jobs on schedule
    ctx.waitUntil(runJobs(env));
  }
};

async function runJobs(env) {
  const jobs = await getEnabledJobs(env);

  for (const job of jobs) {
    try {
      const response = await fetch(job.url, { method: job.method });
      await logJob(env, job.id, response.ok ? "success" : "fail", response.status);
    } catch (err) {
      await logJob(env, job.id, "fail", 0);
    }
  }
}

function renderUI() {
  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>OpenCrom Dashboard</title>
<style>
body { font-family: Arial, sans-serif; padding: 30px; background: #f8f8f8; }
button { padding: 8px 12px; margin-top: 8px; }
</style>
</head>
<body>
<h1>OpenCrom Dashboard</h1>
<section>
<h3>Add Job</h3>
<input id="name" placeholder="Name"/><br/>
<input id="url" placeholder="https://example.com"/><br/>
<select id="method"><option>GET</option><option>POST</option></select><br/>
<button onclick="addJob()">Add</button>
</section>

<section>
<h3>Jobs</h3>
<table border="1" cellpadding="4">
<thead><tr><th>ID</th><th>Name</th><th>URL</th><th>Method</th></tr></thead>
<tbody id="jobs"></tbody>
</table>
</section>

<script>
async function loadJobs() {
  const res = await fetch('/jobs');
  const jobs = await res.json();
  const tbody = document.getElementById('jobs');
  tbody.innerHTML = '';
  jobs.forEach(j => {
    tbody.innerHTML += 
      '<tr><td>' + j.id + '</td><td>' + j.name + 
      '</td><td>' + j.url + '</td><td>' + j.method + '</td></tr>';
  });
}

async function addJob() {
  await fetch('/jobs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: document.getElementById('name').value,
      url: document.getElementById('url').value,
      method: document.getElementById('method').value
    })
  });
  loadJobs();
}

loadJobs();
</script>

</body>
</html>`;
}
