export default {
  async scheduled(event, env, ctx) {
    const { results } = await env.DB.prepare(
      "SELECT * FROM jobs WHERE enabled = 1"
    ).all();

    for (const job of results) {
      ctx.waitUntil(runJob(env, job));
    }
  },

  async fetch(request, env) {
    const url = new URL(request.url);

    // Root Dashboard
    if (url.pathname === "/") {
      return new Response(dashboardHTML, {
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }

    // Get Jobs
    if (url.pathname === "/api/jobs" && request.method === "GET") {
      const { results } = await env.DB.prepare(
        "SELECT * FROM jobs ORDER BY id DESC"
      ).all();
      return json(results);
    }

    // Add Job
    if (url.pathname === "/api/jobs" && request.method === "POST") {
      const body = await request.json();

      await env.DB.prepare(
        "INSERT INTO jobs (url, method, enabled) VALUES (?, ?, 1)"
      )
        .bind(body.url, body.method || "GET")
        .run();

      return json({ success: true });
    }

    // Delete Job
    if (url.pathname.startsWith("/api/jobs/") && request.method === "DELETE") {
      const id = url.pathname.split("/").pop();
      await env.DB.prepare("DELETE FROM jobs WHERE id = ?")
        .bind(id)
        .run();
      return json({ success: true });
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
<meta charset="utf-8"/>
<title>OpenCrom Dashboard</title>
<style>
body {
  font-family: Arial, sans-serif;
  background: #0f172a;
  color: white;
  padding: 40px;
}
input, button {
  padding: 10px;
  margin: 5px;
  border-radius: 6px;
  border: none;
}
button {
  background: #3b82f6;
  color: white;
  cursor: pointer;
}
table {
  margin-top: 20px;
  width: 100%;
  border-collapse: collapse;
}
th, td {
  padding: 12px;
  border-bottom: 1px solid #1e293b;
}
th {
  text-align: left;
}
</style>
</head>
<body>

<h1>🚀 OpenCrom Dashboard</h1>

<section>
<h3>Add New Job</h3>
<input id="url" placeholder="https://example.com" size="40"/>
<button onclick="addJob()">Add Job</button>
</section>

<section>
<h3>Jobs</h3>
<table>
<thead>
<tr>
<th>ID</th>
<th>URL</th>
<th>Method</th>
<th>Action</th>
</tr>
</thead>
<tbody id="jobs"></tbody>
</table>
</section>

<script>
async function loadJobs() {
  const res = await fetch('/api/jobs');
  const jobs = await res.json();
  const tbody = document.getElementById('jobs');
  tbody.innerHTML = '';
  jobs.forEach(job => {
    tbody.innerHTML += \`
      <tr>
        <td>\${job.id}</td>
        <td>\${job.url}</td>
        <td>\${job.method}</td>
        <td><button onclick="deleteJob(\${job.id})">Delete</button></td>
      </tr>
    \`;
  });
}

async function addJob() {
  const url = document.getElementById('url').value;
  await fetch('/api/jobs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url })
  });
  document.getElementById('url').value = '';
  loadJobs();
}

async function deleteJob(id) {
  await fetch('/api/jobs/' + id, { method: 'DELETE' });
  loadJobs();
}

loadJobs();
</script>

</body>
</html>
`;
