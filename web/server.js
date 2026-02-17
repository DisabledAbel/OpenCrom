// server.js
import express from 'express';
import session from 'express-session';
import SQLiteStoreFactory from 'connect-sqlite3';
import sqlite3 from 'sqlite3';
import fs from 'fs';
import path from 'path';
import cors from 'cors';

const app = express();
const port = process.env.PORT || 3000;

// --------------------
// Middleware
// --------------------
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --------------------
// Database setup
// --------------------
const dbFolder = path.resolve('./db');
if (!fs.existsSync(dbFolder)) {
  fs.mkdirSync(dbFolder, { recursive: true });
  console.log('Created database folder at', dbFolder);
}

const dbPath = path.join(dbFolder, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Failed to open database:', err);
  } else {
    console.log('Database opened at', dbPath);
  }
});

// Optional: initialize tables if not exist
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT
  );`);
});

// --------------------
// Session setup
// --------------------
const SQLiteStore = SQLiteStoreFactory(session);

app.use(
  session({
    store: new SQLiteStore({ db: 'sessions.sqlite', dir: dbFolder }),
    secret: process.env.SESSION_SECRET || 'super-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 24 }, // 1 day
  })
);

// --------------------
// Routes
// --------------------
app.get('/', (req, res) => {
  res.send('Hello from Render! Database and sessions are ready.');
});

app.get('/users', (req, res) => {
  db.all('SELECT id, username FROM users', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/users', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: 'Username and password required' });

  db.run(
    'INSERT INTO users (username, password) VALUES (?, ?)',
    [username, password],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID, username });
    }
  );
});

// --------------------
// Start server
// --------------------
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
