# OpenCrom

> Lightweight, serverless cron job scheduler built on Cloudflare Workers + D1.

OpenCrom is a globally distributed, edge-native cron system designed for developers who want reliable scheduled HTTP execution without running servers, managing background workers, or fighting hosting provider sleep policies.

Built on:

* Cloudflare
* Cloudflare Workers
* Cloudflare D1

---

## Why OpenCrom?

Traditional cron setups require:

* Always-on servers
* Background workers
* VPS management
* Paid hosting tiers
* Complex deployment pipelines

OpenCrom removes all of that.

You get:

* Global cron execution
* Serverless deployment
* Built-in job logging
* Enable/disable toggles
* HTTP-based job execution
* No idle timeout hacks
* No self-pinging
* No background daemons

Everything runs at the edge.

---

## Features

* Scheduled execution via Cloudflare Cron Triggers
* Enable / disable jobs per record
* HTTP job execution (GET / POST)
* Execution logs (success / failure / response code)
* D1-backed persistence
* Fully serverless
* Zero infrastructure management

---

## Architecture

```
Cloudflare Cron Trigger
        ↓
Cloudflare Worker
        ↓
Fetch enabled jobs from D1
        ↓
Execute HTTP requests
        ↓
Store logs in D1
```

No servers. No containers. No long-running processes.

---

## Installation

### 1. Install Wrangler CLI

```bash
npm install -g wrangler
```

### 2. Clone the Repository

```bash
git clone https://github.com/DisabledAbel/OpenCrom.git
cd OpenCrom
```

### 3. Create D1 Database

```bash
wrangler d1 create opencrom-db
```

Copy the generated `database_id`.

---

### 4. Configure `wrangler.toml`

```toml
name = "opencrom"
main = "src/index.js"
compatibility_date = "2024-01-01"

[triggers]
crons = ["*/15 * * * *"]

[[d1_databases]]
binding = "DB"
database_name = "opencrom-db"
database_id = "<your-database-id>"
```

---

### 5. Apply Schema

Create `schema.sql`:

```sql
CREATE TABLE jobs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  method TEXT DEFAULT 'GET',
  enabled INTEGER DEFAULT 1
);

CREATE TABLE job_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  job_id INTEGER,
  status TEXT,
  response_code INTEGER,
  executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

Run:

```bash
wrangler d1 execute opencrom-db --file=schema.sql
```

---

### 6. Deploy

```bash
wrangler deploy
```

Done.

Your cron is live.

---

## Cron Schedule

Defined in `wrangler.toml`:

```
*/15 * * * *
```

This runs every 15 minutes.

You can change it to:

| Schedule      | Meaning           |
| ------------- | ----------------- |
| `*/5 * * * *` | Every 5 minutes   |
| `0 * * * *`   | Every hour        |
| `0 0 * * *`   | Daily at midnight |
| `0 0 * * 0`   | Weekly            |

---

## API Endpoints

### GET /health

Health check endpoint.

---

### GET /jobs

Returns all jobs in the system.

---

### (Optional) Add Job Endpoint Example

You can extend with:

```js
if (url.pathname === "/jobs" && request.method === "POST") {
  const body = await request.json();
  await env.DB.prepare(
    "INSERT INTO jobs (name, url, method) VALUES (?, ?, ?)"
  )
    .bind(body.name, body.url, body.method || "GET")
    .run();

  return new Response("Created", { status: 201 });
}
```

---

## Job Execution Model

Each cron cycle:

1. Fetches all enabled jobs
2. Executes HTTP request
3. Records:

   * success / failure
   * response code
   * execution timestamp

Logs stored in `job_logs`.

---

## Security Considerations

If exposing publicly:

* Add authentication middleware
* Restrict job creation endpoints
* Rate-limit job insertion
* Validate URLs before execution

Never allow arbitrary unvalidated URL execution in production.

---

## Development

Run locally:

```bash
wrangler dev
```

Simulate cron:

```bash
wrangler tail
```

---

## Project Structure

```
src/
  index.js      → Worker entry
  jobs.js       → Job execution logic
  db.js         → Database abstraction

wrangler.toml
schema.sql
README.md
```

---

## Limitations

* Workers have CPU limits (free tier ~50ms CPU)
* Not suitable for heavy computation
* Best for:

  * Webhooks
  * Health checks
  * Data sync triggers
  * API polling
  * Cache refresh jobs

---

## When Not to Use OpenCrom

* Long-running batch jobs
* Heavy data processing
* Large file transfers
* Direct TCP database connections

For those, use a VPS or container runtime.

---

## Roadmap Ideas

* Web UI dashboard
* Auth layer
* Retry with exponential backoff
* Rate limiting per job
* Job grouping
* Webhook-based manual trigger
* Queue-backed execution
* Multi-tenant support

---

## Philosophy

OpenCrom is built around:

* Simplicity
* Serverless-first design
* No hidden infrastructure
* Transparent job logging
* Edge-native execution
