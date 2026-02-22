# Cron Job Dashboard (IP-Protected)

A self-hosted cron job control panel designed for deployment on Render.

This app lets you:

- Schedule cron jobs from a web dashboard  
- Keep jobs private using IP allow-listing  
- Avoid logins/passwords entirely  
- Control which IPs can access the app  
- Persist allowed IPs and jobs on disk  

The dashboard automatically blocks anyone whose IP is not approved.

---

# Features

## Security
- IP-based access control (no login required)
- Admin token required to modify allowed IPs
- Automatic blocking before UI loads
- Trust proxy enabled for correct client IP detection on hosting platforms

## Dashboard
- Shows your current IP
- Lists all allowed IPs
- Add/remove IPs from UI
- Auto-add your current IP button

## Cron Engine
- Schedule background jobs
- Jobs persist between restarts
- Designed for lightweight automation tasks

---

# Folder Structure

```

project-root/
│
├── web/
│   └── server.js
│
├── allowed-ips.json      # auto-generated
├── jobs.json             # cron job storage
├── package.json
└── README.md

```

---

# Environment Variables

You **must** set this in Render:

```

ADMIN_TOKEN=your_secret_token_here

```

Use a long random string.

This token is required to:

- Add IPs
- Remove IPs
- Auto-add your own IP

Without it, nobody can modify access rules.

---

# Local Development

Install dependencies:

```

npm install

```

Run the server:

```

node web/server.js

```

Open:

```

[http://localhost:3000](http://localhost:3000)

```

---

# Deploying to Render

## 1. Push repo to GitHub

Make sure these files exist:

- package.json
- web/server.js
- README.md

Do NOT commit:

- allowed-ips.json
- jobs.json

Add them to `.gitignore`.

---

## 2. Create a Web Service in Render

Settings:

- Runtime: Node
- Build command:
```

npm install

```
- Start command:
```

node web/server.js

```

---

## 3. Add Environment Variable

In Render dashboard:

```

ADMIN_TOKEN=your_secret_token

```

Redeploy after adding.

---

# First Launch Flow

1. Open your Render URL
2. Dashboard loads immediately
3. Add your IP using admin token
4. After that:
   - Only allowed IPs can access the app
   - Everyone else gets blocked

If you forget to add your IP, the app remains open until the first IP is saved.

---

# How IP Detection Works

The server checks:

1. `x-forwarded-for` header (from proxy)
2. Socket remote address fallback

Trust proxy is enabled so real client IPs work correctly behind hosting platforms.

---

# Resetting Access If Locked Out

You have three options:

### Option A — Delete IP file
Remove:

```

allowed-ips.json

```

Then redeploy.

App becomes open again.

---

### Option B — Use Render Shell
Open Render shell and run:

```

rm allowed-ips.json

```

Restart service.

---

### Option C — Change Admin Token
Update:

```

ADMIN_TOKEN

```

Redeploy.

---

# Production Recommendations

- Always keep admin token private
- Allow only your home IP or static ISP range
- Consider allowing multiple backup IPs
- Use HTTPS (Render already does this)

---

# Future Improvements (optional)

Possible upgrades:

- CIDR network allow-listing
- Job history logs
- Dark mode UI
- Cron syntax helper
- Export/import jobs
- Multi-user admin roles
- First-run setup wizard

---

# License

MIT — free to use, modify, and deploy.

---

# Author Notes

This project is intentionally simple, self-contained, and designed to run on low-resource hosting 
