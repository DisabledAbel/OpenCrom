# OpenCrom — Self-Hosted Cron Job Runner (Render Edition)

OpenCrom is a lightweight web-based cron scheduler you can deploy in minutes.
It lets you schedule URLs to run automatically, manage jobs from a dashboard, and lock access to your own IP.

This guide shows **everything required** to deploy it from scratch using GitHub + Render + a free database.

---

# ✅ What OpenCrom Does

* Run scheduled HTTP requests (cron jobs)
* Simple browser dashboard (no CLI needed)
* One-click “Allow My IP” setup
* IP-based security (no login system required)
* Persistent storage using a database
* Safe redeploys (jobs never disappear)

---

# ✅ Requirements

You need:

* A GitHub account on GitHub
* A Render account on Render
* Basic ability to push files to a repo

No server knowledge required.

---

# ✅ Step 1 — Upload the Project to GitHub

1. Create a new repository
2. Upload the project files
3. Confirm the repo contains:

```
web/
  server.js
  public/
    index.html
    dashboard.html
package.json
```

Push to GitHub.

---

# ✅ Step 2 — Create the Database

Open Render dashboard:

**New → PostgreSQL**

Use the free plan.

After creation:

Copy:

```
Internal Database URL
```

You will need this in the next step.

---

# ✅ Step 3 — Deploy the Web Service

In Render:

**New → Web Service**

Connect your GitHub repo.

Use these settings:

```
Build Command: npm install
Start Command: npm start
```

Add Environment Variable:

```
DATABASE_URL = (paste the database URL)
NODE_VERSION = 20
```

Deploy.

---

# ✅ Step 4 — First Boot Setup

When deployment finishes:

Open your site root:

```
https://YOUR-SERVICE.onrender.com/
```

You’ll see the setup page.

Click:

```
Allow My IP
```

This locks the app to you automatically.

From now on only your IP can access it.

---

# ✅ Step 5 — Open the Dashboard

Visit:

```
https://YOUR-SERVICE.onrender.com/dashboard.html
```

From here you can:

* Add cron jobs
* View jobs
* Delete jobs
* Manage everything visually

No terminal required.

---

# ✅ How to Add a Job

Example:

**Schedule**

```
*/5 * * * *
```

**URL**

```
https://example.com/api/refresh
```

This runs every 5 minutes.

---

# ✅ Cron Format Reference

```
* * * * *
│ │ │ │ │
│ │ │ │ └─ Day of week (0-6)
│ │ │ └── Month (1-12)
│ │ └──── Day of month (1-31)
│ └────── Hour (0-23)
└──────── Minute (0-59)
```

Examples:

```
*/5 * * * *      every 5 minutes
0 * * * *        every hour
0 0 * * *        every midnight
0 9 * * 1        Mondays at 9am
```

---

# ✅ Security Model

OpenCrom uses:

* IP allowlist protection
* Automatic proxy detection
* No passwords stored
* No sessions
* No login UI

Only your IP can manage jobs.

---

# ✅ If You Get Locked Out

Open the Render shell or redeploy with a temporary change:

Delete table `ips` in the database, or run:

```
DELETE FROM ips;
```

Then reload the site and press **Allow My IP** again.

---

# ✅ Updating the App

Whenever you push changes to GitHub:

Render redeploys automatically.

Your jobs remain safe because they’re stored in the database.

---

# ✅ Tech Stack

* Backend: Node.js on Node.js
* Server framework: Express
* Database: Render PostgreSQL
* Scheduler: node-cron
* Frontend: static HTML dashboard
