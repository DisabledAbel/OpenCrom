# Render Cronjob Dashboard App

This is a Node.js cronjob application deployed on [Render](https://render.com) with an SQLite database and session management. It provides a simple web dashboard to monitor all scheduled cronjobs and their execution status.

---

## Features

- Runs cronjobs and logs their execution in SQLite.
- Web dashboard at `/dashboard` showing:
  - Job Name
  - Last Run Time
  - Status (success/failure)
- Session management using `express-session` with `connect-sqlite3`.
- Fully deployable on Render with Node.js.

---

## Prerequisites

- Node.js >= 20
- SQLite3
- Render account

---

## Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/your-repo.git
cd your-repo
````

2. Install dependencies:

```bash
npm install
```

3. Create your SQLite databases:

```bash
touch cronjobs.db
touch sessions.db
```

---

## Running Locally

```bash
npm start
```

* Visit `http://localhost:3000` for the root page.
* Visit `http://localhost:3000/dashboard` to see the cronjob dashboard.

---

## Logging Cronjobs

Whenever a cronjob runs, log its execution to the database:

```js
import Database from "better-sqlite3";

const db = new Database("cronjobs.db");

function logCronJob(name, status) {
  db.prepare(`
    INSERT INTO cron_log (job_name, last_run, status)
    VALUES (?, datetime('now'), ?)
  `).run(name, status);
}

// Example usage
logCronJob("daily-report", "success");
```

---

## Deployment on Render

1. Connect your GitHub repository to Render.
2. Set Node version in `package.json`:

```json
{
  "engines": {
    "node": "20.x"
  }
}
```

3. Ensure build and start commands are set:

```bash
Build Command: npm install
Start Command: node web/server.js
```

4. Deploy and visit:

* Root: `https://<your-app>.onrender.com`
* Dashboard: `https://<your-app>.onrender.com/dashboard`

---

## Project Structure

```
/src
  /web
    server.js          # Main server file
    /routes
      dashboard.js     # Dashboard route
  /cpp                # Optional C++ scripts
cronjobs.db            # Cronjob logs
sessions.db            # Session store
package.json
```

---

## Dependencies

* express
* express-session
* connect-sqlite3
* better-sqlite3
