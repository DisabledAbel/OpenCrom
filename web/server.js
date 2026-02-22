import express from "express";
import fs from "fs";

const app = express();

/* ---------- CONFIG ---------- */
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "change-this-token";
const IP_FILE = "./allowed-ips.json";

/* ---------- LOAD IPS ---------- */
let allowedIps = [];

try {
  if (fs.existsSync(IP_FILE)) {
    allowedIps = JSON.parse(fs.readFileSync(IP_FILE, "utf8"));
  }
} catch {
  allowedIps = [];
}

function saveIps() {
  fs.writeFileSync(IP_FILE, JSON.stringify(allowedIps, null, 2));
}

/* ---------- PARSERS ---------- */
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

/* ---------- TRUST PROXY (Render needs this) ---------- */
app.set("trust proxy", 1);

/* ---------- GET REAL IP ---------- */
function getIp(req) {
  return (
    req.headers["x-forwarded-for"]?.split(",")[0].trim() ||
    req.socket.remoteAddress
  );
}

/* ---------- BLOCK NON-ALLOWED IPS ---------- */
app.use((req, res, next) => {
  if (allowedIps.length === 0) return next(); // open until first IP added

  const ip = getIp(req);

  if (!allowedIps.includes(ip)) {
    return res.status(403).send("Access denied");
  }

  next();
});

/* ---------- ROOT → DASHBOARD ---------- */
app.get("/", (req, res) => {
  res.redirect("/dashboard");
});

/* ---------- DASHBOARD ---------- */
app.get("/dashboard", (req, res) => {
  const ip = getIp(req);

  const list = allowedIps
    .map(
      x => `<li>${x}
        <form method="POST" action="/remove-ip">
          <input type="hidden" name="ip" value="${x}">
          <input type="hidden" name="token" value="">
          <button>Remove</button>
        </form>
      </li>`
    )
    .join("");

  res.send(`
    <h1>Cron Dashboard</h1>

    <p><b>Your IP:</b> ${ip}</p>

    <h3>Allowed IPs</h3>
    <ul>${list || "<li>No IPs yet (open access)</li>"}</ul>

    <h3>Add IP</h3>
    <form method="POST" action="/add-ip">
      <input name="ip" placeholder="1.2.3.4" required />
      <input name="token" placeholder="admin token required" required />
      <button>Add</button>
    </form>

    <h3>Auto-add my IP</h3>
    <form method="POST" action="/add-my-ip">
      <input name="token" placeholder="admin token required" required />
      <button>Add My IP</button>
    </form>
  `);
});

/* ---------- ADD IP ---------- */
app.post("/add-ip", (req, res) => {
  if (req.body.token !== ADMIN_TOKEN) {
    return res.status(403).send("Invalid token");
  }

  const ip = req.body.ip?.trim();
  if (!ip) return res.redirect("/dashboard");

  if (!allowedIps.includes(ip)) {
    allowedIps.push(ip);
    saveIps();
  }

  res.redirect("/dashboard");
});

/* ---------- ADD MY IP ---------- */
app.post("/add-my-ip", (req, res) => {
  if (req.body.token !== ADMIN_TOKEN) {
    return res.status(403).send("Invalid token");
  }

  const ip = getIp(req);

  if (!allowedIps.includes(ip)) {
    allowedIps.push(ip);
    saveIps();
  }

  res.redirect("/dashboard");
});

/* ---------- REMOVE IP ---------- */
app.post("/remove-ip", (req, res) => {
  if (req.body.token !== ADMIN_TOKEN) {
    return res.status(403).send("Invalid token");
  }

  const ip = req.body.ip;
  allowedIps = allowedIps.filter(x => x !== ip);
  saveIps();

  res.redirect("/dashboard");
});

/* ---------- SERVER ---------- */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on", PORT));
