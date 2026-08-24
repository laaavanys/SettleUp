const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../../data/app.db');

// Ensure data directory exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function migrate() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS groups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      created_by INTEGER NOT NULL REFERENCES users(id),
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS group_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      group_id INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      joined_at TEXT DEFAULT (datetime('now')),
      UNIQUE(group_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS group_invites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      group_id INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
      email TEXT NOT NULL,
      invited_by INTEGER NOT NULL REFERENCES users(id),
      status TEXT DEFAULT 'pending',
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(group_id, email)
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      group_id INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
      description TEXT NOT NULL,
      amount REAL NOT NULL,
      paid_by INTEGER NOT NULL REFERENCES users(id),
      created_by INTEGER NOT NULL REFERENCES users(id),
      category TEXT DEFAULT 'general',
      recurring INTEGER DEFAULT 0,
      recurring_interval TEXT DEFAULT 'monthly',
      recurring_start TEXT DEFAULT (date('now')),
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- How an expense is split across members (equal split by default,
    -- but stored explicitly so custom/unequal splits work too)
    CREATE TABLE IF NOT EXISTS expense_shares (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      expense_id INTEGER NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id),
      share_amount REAL NOT NULL
    );

    -- Settlements record when someone actually pays back another member
    CREATE TABLE IF NOT EXISTS settlements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      group_id INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
      from_user INTEGER NOT NULL REFERENCES users(id),
      to_user INTEGER NOT NULL REFERENCES users(id),
      amount REAL NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_expenses_group ON expenses(group_id);
    CREATE INDEX IF NOT EXISTS idx_shares_expense ON expense_shares(expense_id);
    CREATE INDEX IF NOT EXISTS idx_members_group ON group_members(group_id);
    CREATE INDEX IF NOT EXISTS idx_invites_group ON group_invites(group_id);
  `);

  const expenseColumns = db.prepare('PRAGMA table_info(expenses)').all();
  const inviteColumns = db.prepare('PRAGMA table_info(group_invites)').all();

  if (!expenseColumns.some((column) => column.name === 'recurring')) {
    db.exec('ALTER TABLE expenses ADD COLUMN recurring INTEGER DEFAULT 0');
  }
  if (!expenseColumns.some((column) => column.name === 'recurring_interval')) {
    db.exec("ALTER TABLE expenses ADD COLUMN recurring_interval TEXT DEFAULT 'monthly'");
  }
  if (!expenseColumns.some((column) => column.name === 'recurring_start')) {
    db.exec("ALTER TABLE expenses ADD COLUMN recurring_start TEXT DEFAULT (date('now'))");
  }
  if (inviteColumns.length === 0) {
    db.exec(`
      CREATE TABLE group_invites (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        group_id INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
        email TEXT NOT NULL,
        invited_by INTEGER NOT NULL REFERENCES users(id),
        status TEXT DEFAULT 'pending',
        created_at TEXT DEFAULT (datetime('now')),
        UNIQUE(group_id, email)
      );
    `);
  }
}

migrate();

module.exports = db;
