export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === "/run") {
      ctx.waitUntil(runJobs(env));
      return new Response("Manual run triggered");
    }

    if (url.pathname === "/jobs") {
      return await getJobs(env);
    }

    return new Response(renderUI(), {
      headers: { "content-type": "text/html" }
    });
  },

  async scheduled(event, env, ctx) {
    ctx.waitUntil(runJobs(env));
  }
};

async function runJobs(env) {
  console.log("Scheduler executing");

  const jobsRes = await fetch(`${env.SUPABASE_URL}/rest/v1/jobs`, {
    headers: {
      apikey: env.SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}`
    }
  });

  const jobs = await jobsRes.json();
  const now = Date.now();

  for (const job of jobs) {
    if (!job.next_run || now >= job.next_run) {
      try {
        const start = Date.now();
        const res = await fetch(job.url);
        const ms = Date.now() - start;

        await fetch(`${env.SUPABASE_URL}/rest/v1/logs`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: env.SUPABASE_SERVICE_KEY,
            Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}`
          },
          body: JSON.stringify({
            job_id: job.id,
            url: job.url,
            status: res.status,
            response_time: ms
          })
        });

      } catch (err) {
        await fetch(`${env.SUPABASE_URL}/rest/v1/logs`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: env.SUPABASE_SERVICE_KEY,
            Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}`
          },
          body: JSON.stringify({
            job_id: job.id,
            url: job.url,
            status: "ERROR",
            error: err.message
          })
        });
      }
    }
  }
}

async function getJobs(env) {
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/jobs?select=*`, {
    headers: {
      apikey: env.SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}`
    }
  });

  return new Response(await res.text(), {
    headers: {
      "content-type": "application/json",
      "cache-control": "no-store"
    }
  });
}

function renderUI() {
  return `
  <html>
    <body style="font-family: sans-serif; padding: 40px;">
      <h1>Job Dashboard</h1>
      <button onclick="fetch('/run')">Run Now</button>
      <button onclick="load()">Refresh Jobs</button>
      <pre id="data"></pre>

      <script>
        async function load() {
          const res = await fetch('/jobs');
          document.getElementById('data').textContent = await res.text();
        }
      </script>
    </body>
  </html>
  `;
}
