import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Use /tmp for serverless environments (Vercel), otherwise use local data directory
const isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME;
const DB_PATH = isServerless
  ? '/tmp/mocap.db'
  : (process.env.DB_PATH || path.join(process.cwd(), 'data', 'mocap.db'));

// Ensure data directory exists (only for local development)
if (!isServerless) {
  const dataDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

// Initialize database
let db: Database.Database;

try {
  db = new Database(DB_PATH);

  // Enable WAL mode for better concurrency (only for file-based DB)
  if (!isServerless) {
    db.pragma('journal_mode = WAL');
  }

  // Initialize schema immediately
  initDb();
} catch (error) {
  console.error('Failed to initialize database:', error);
  // Fallback to in-memory database
  db = new Database(':memory:');
  initDb();
}

// Initialize schema
export function initDb() {
  // Sessions table
  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      date TEXT NOT NULL,
      startTime TEXT NOT NULL,
      endTime TEXT NOT NULL,
      location TEXT NOT NULL,
      status TEXT CHECK(status IN ('planned', 'confirmed', 'completed', 'cancelled')) DEFAULT 'planned',
      notes TEXT DEFAULT '',
      team TEXT DEFAULT '[]',
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Animations table
  db.exec(`
    CREATE TABLE IF NOT EXISTS animations (
      id TEXT PRIMARY KEY,
      sessionId TEXT NOT NULL,
      character TEXT NOT NULL,
      shotId TEXT NOT NULL,
      moveName TEXT NOT NULL,
      duration TEXT DEFAULT '',
      description TEXT DEFAULT '',
      performerNotes TEXT DEFAULT '',
      keyPoses TEXT DEFAULT '',
      talentRequired TEXT DEFAULT '',
      props TEXT DEFAULT '',
      referenceType TEXT CHECK(referenceType IN ('link', 'file')) DEFAULT 'link',
      referenceUrl TEXT DEFAULT '',
      priority TEXT CHECK(priority IN ('Low', 'Medium', 'High')) DEFAULT 'Medium',
      "order" INTEGER DEFAULT 0,
      FOREIGN KEY (sessionId) REFERENCES sessions(id) ON DELETE CASCADE
    )
  `);

  // Checklist items table
  db.exec(`
    CREATE TABLE IF NOT EXISTS checklist (
      id TEXT PRIMARY KEY,
      sessionId TEXT NOT NULL,
      category TEXT CHECK(category IN ('equipment', 'talent', 'location', 'files')) NOT NULL,
      task TEXT NOT NULL,
      completed INTEGER DEFAULT 0,
      owner TEXT DEFAULT '',
      FOREIGN KEY (sessionId) REFERENCES sessions(id) ON DELETE CASCADE
    )
  `);

  // Callsheet table
  db.exec(`
    CREATE TABLE IF NOT EXISTS callsheets (
      sessionId TEXT PRIMARY KEY,
      producer TEXT DEFAULT '',
      director TEXT DEFAULT '',
      contactPhone TEXT DEFAULT '',
      parkingInfo TEXT DEFAULT '',
      callTime TEXT DEFAULT '',
      wrapTime TEXT DEFAULT '',
      specialInstructions TEXT DEFAULT '',
      FOREIGN KEY (sessionId) REFERENCES sessions(id) ON DELETE CASCADE
    )
  `);

  console.log('Database initialized successfully at:', DB_PATH);
}

export default db;
