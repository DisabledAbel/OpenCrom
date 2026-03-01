# OpenCrom

> Serverless cron job scheduler built on Cloudflare Workers + D1. Execute HTTP jobs globally with logs, toggles, and zero infrastructure.

---

## Features

* Edge-native cron via Cloudflare Cron Triggers
* Enable/disable toggle per job
* HTTP job execution (GET / POST)
* Execution logs (success/failure/response code)
* Cloudflare D1-backed storage
* Fully serverless, no VPS or persistent backend required
* iPad-friendly setup and one-click deploy

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

* All job execution happens in the Worker
* No self-pinging, no background daemons

---

## One-Click Deploy (iPad-Friendly)

Click the button below to deploy OpenCrom directly to your Cloudflare account:

[![Deploy to Cloudflare Workers](https://img.shields.io/badge/Deploy-Worker-orange)](https://dash.cloudflare.com/?to=/:account/workers&template=https://github.com/DisabledAbel/OpenCrom)

**Steps:**

1. Click the button
2. Connect your GitHub repo
3. Set required environment variables:

   * `INTERNAL_SECRET` (a long random string)
4. Deploy

No terminals or scripts needed — works fully in Safari/iPadOS.

---

## iPad Local Development (Optional)

If you want to test locally on iPad (Play.js, iSH, Blink Shell):

1. Install Node.js + Wrangler
2. Clone the repo:

```bash
git clone https://github.com/DisabledAbel/OpenCrom.git
cd OpenCrom
```

3. Install dependencies:

```bash
npm install
```

4. Run dev server:

```bash
npm run dev
```

* This applies D1 schema and starts the Worker locally
* Simulates scheduled execution

---

## Setup for Cloudflare Worker + D1

1. Install Wrangler:

```bash
npm install -g wrangler
```

2. Create a D1 database:

```bash
wrangler d1 create opencrom-db
```

3. Apply schema (`schema.sql` included):

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

```bash
wrangler d1 execute opencrom-db --file=schema.sql
```

4. Update `wrangler.toml`:

```toml
name = "opencrom"
main = "src/index.js"
compatibility_date = "2024-01-01"

[triggers]
crons = ["*/15 * * * *"]

[[d1_databases]]
binding = "DB"
database_name = "opencrom-db"
database_id = "<your-d1-id>"
```

5. Deploy:

```bash
wrangler deploy
```

---

## API Endpoints

| Endpoint  | Method | Description            |
| --------- | ------ | ---------------------- |
| `/health` | GET    | Health check           |
| `/jobs`   | GET    | List all jobs          |
| `/jobs`   | POST   | Add new job (optional) |

---

## Job Execution

Each cron cycle:

1. Fetch enabled jobs from D1
2. Execute HTTP request per job
3. Record:

   * success/failure
   * response code
   * timestamp

All logs stored in `job_logs` table.

---

## Security

* Protect any public endpoints
* Use a strong `INTERNAL_SECRET` for internal calls
* Validate all job URLs before execution

---

## Development Structure

```
src/
  index.js      → Worker entry
  jobs.js       → Job execution logic
  db.js         → D1 database abstraction

wrangler.toml
schema.sql
README.md
```

---

## Limitations

* Workers CPU limits (free tier ~50ms per execution)
* Not for heavy computation
* Best for HTTP calls, webhooks, health checks, cache refreshes

---

## Roadmap / Ideas

* Admin dashboard UI
* Authentication for endpoints
* Retry + backoff logic
* Rate limiting
