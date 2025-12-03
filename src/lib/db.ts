import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'nano_banana.db');
const db = new Database(dbPath);

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    expires_at DATETIME NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS credits (
    user_id INTEGER PRIMARY KEY,
    amount INTEGER DEFAULT 10,
    last_refill_date TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS generations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    prompt TEXT NOT NULL,
    style TEXT,
    size TEXT,
    image_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_favorite INTEGER DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
`);

// Seed default user if not exists
const userCheck = db.prepare("SELECT id FROM users WHERE id = 1").get();
if (!userCheck) {
    db.prepare("INSERT INTO users (id, email, password_hash) VALUES (1, 'demo@example.com', 'placeholder')").run();
    db.prepare("INSERT INTO credits (user_id, amount) VALUES (1, 1000)").run();
}

export default db;
