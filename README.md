# OpenCrom 🧭

**OpenCrom** is a lightweight, self-hosted cron job scheduler with a browser dashboard and IP-based access control. It’s designed to be deployed with Render and a Postgres database so scheduled jobs persist across redeploys.

---

## Features

- Schedule HTTP requests (cron jobs) to arbitrary URLs  
- Web dashboard (`dashboard.html`) to add / view / delete jobs  
- One-click “Allow My IP” setup (`index.html`) for first-run bootstrapping  
- IP allowlist security (no usernames or passwords required)  
- Postgres-backed persistence (jobs and allowed IPs)  
- Runs on Node.js + Express + node-cron

---

## Repository layout

```

web/
server.js           # main server (Express) — serves API + static UI
public/
index.html        # one-click "Allow My IP" setup page
dashboard.html    # dashboard: add/view/delete jobs
package.json
README.md

````

---

## Quick Start — Deploy on Render (recommended)

1. Push this repository to a Git host (your repo on GitHub or similar).

2. Create a PostgreSQL database on Render:
   - Render → **New → PostgreSQL**
   - Use the free plan
   - Copy the **Internal Database URL**

3. Create a Web Service on Render:
   - Render → **New → Web Service**
   - Connect your repository
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Add environment variables:
     ```
     DATABASE_URL=<your-database-url>
     NODE_VERSION=20
     ```
   - Deploy

4. First-run setup:
   - Open `https://<your-service>.onrender.com/`
   - Click **Allow My IP** — this will insert your detected IP into the allowlist so you won’t be locked out.

5. Open the dashboard:
   - `https://<your-service>.onrender.com/dashboard.html`
   - From there you can add jobs (cron schedule + URL), see current jobs, and delete jobs.

---

## API (for automation / curl)

- `GET /jobs` — list jobs  
- `POST /jobs` — add job (JSON body: `{ "schedule":"*/5 * * * *", "url":"https://example.com/ping" }`)  
- `DELETE /jobs/:id` — delete job by id  

- `GET /ips` — list allowed IPs  
- `POST /ips` — add IP manually (JSON body: `{ "ip": "1.2.3.4" }`)  
- `POST /ips/auto` — server-detected add; useful for first-run (no body required)

> Tip: Use `curl -X POST https://<your-service>.onrender.com/ips/auto` once after deploy if the browser UI is unavailable.

---

## Cron syntax reference

````

---

│ │ │ │ │
│ │ │ │ └─ Day of week (0-6)
│ │ │ └── Month (1-12)
│ │ └──── Day of month (1-31)
│ └──── Hour (0-23)
└────── Minute (0-59)

````

Examples:
- `*/5 * * * *` — every 5 minutes  
- `0 * * * *` — every hour on the hour  
- `0 0 * * *` — daily at midnight  
- `0 9 * * 1` — every Monday at 09:00

---

## Security model & bootstrapping

- On first run the IP allowlist is empty. The app allows access to the root (`/`) and `/ips` (and `/ips/auto`) so you can register your IP.
- Once at least one IP is present, only requests from allowlisted IPs are permitted.
- The app uses proxy-aware IP detection (`x-forwarded-for`) and should work behind typical hosting proxies.

If you accidentally lock yourself out, use the database shell (Render dashboard) to run:
```sql
DELETE FROM ips;
````

Then reload `https://<your-service>.onrender.com/` and click **Allow My IP** again.

---

## Database / Persistence

* Jobs and allowed IPs are stored in Postgres tables (`jobs`, `ips`).
* Deploys and restarts do NOT delete entries — persistence is handled by the DB.

---

## Dependencies

* Node.js 20+
* Express
* node-cron
* pg (Postgres driver)

Example `package.json` minimal dependencies:

```json
{
  "name": "opencrom",
  "type": "module",
  "version": "1.0.0",
  "main": "web/server.js",
  "scripts": {
    "start": "node web/server.js"
  },
  "dependencies": {
    "express": "^4.19.2",
    "node-cron": "^3.0.3",
    "pg": "^8.11.5"
  }
}
```

---

## Recommended improvements (optional)

* Add job execution logs (success / failure / response code)
* Add enable / disable toggle per job
* Add cron helper UI to build schedules visually
* Add export/import backup for jobs (JSON)
* Add admin recovery token or secondary admin IP

---

## Troubleshooting

* `EACCES: permission denied, mkdir '/data'` — occurs if code expects a mounted disk. If you cannot mount a disk, ensure you use Postgres persistence (this project’s default for Render).
* If the dashboard returns `403 IP not allowed` on first load: call `POST /ips/auto` (or use the UI root page to click Allow My IP).
* If jobs aren’t running: verify `node-cron` schedules are valid and that the URLs are reachable from Render.

---

## License

GNU GENERAL PUBLIC LICENSE

---

## Credits

OpenCrom — built to be small, secure, and deployable on Render with a free Postgres DB. Pull requests and improvements welcome.
