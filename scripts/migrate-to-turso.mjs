import { createClient } from "@libsql/client";
import path from "node:path";

const url = process.env.TURSO_DATABASE_URL?.trim();
const authToken = process.env.TURSO_AUTH_TOKEN?.trim();

if (!url || !authToken) {
  console.error("TURSO_DATABASE_URL and TURSO_AUTH_TOKEN are required.");
  console.error("Create .env.local from .env.example, then run npm run db:migrate:turso.");
  process.exit(1);
}

if (!url.startsWith("libsql://") && !url.startsWith("https://")) {
  console.error("TURSO_DATABASE_URL must point to a remote Turso database.");
  process.exit(1);
}

const localPath = path.join(process.cwd(), "data", "sassie.db").replaceAll("\\", "/");
const source = createClient({ url: `file:${localPath}` });
const target = createClient({ url, authToken });

const schema = [
  `CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    nickname TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT,
    password_salt TEXT,
    is_system INTEGER NOT NULL DEFAULT 0,
    is_admin INTEGER NOT NULL DEFAULT 0,
    is_super_admin INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS posts (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    masked_text TEXT NOT NULL,
    original_length INTEGER NOT NULL,
    traces_json TEXT NOT NULL,
    detail_traces_json TEXT NOT NULL,
    base_reactions_json TEXT NOT NULL,
    stopped INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS reactions (
    post_id TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    emoji TEXT NOT NULL,
    created_at TEXT NOT NULL,
    PRIMARY KEY (post_id, user_id, emoji)
  )`,
  `CREATE TABLE IF NOT EXISTS feelings (
    post_id TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    feeling TEXT NOT NULL,
    created_at TEXT NOT NULL,
    PRIMARY KEY (post_id, user_id)
  )`,
  `CREATE TABLE IF NOT EXISTS migrations (
    name TEXT PRIMARY KEY,
    applied_at TEXT NOT NULL
  )`,
  "CREATE INDEX IF NOT EXISTS posts_created_at_idx ON posts(created_at DESC)",
  "CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON sessions(user_id)",
];

const tables = ["users", "posts", "reactions", "feelings", "migrations"];

async function copyTable(table) {
  const columnResult = await source.execute(`PRAGMA table_info(${table})`);
  const columns = columnResult.rows.map((row) => String(row.name));
  if (!columns.length) {
    console.log(`${table}: skipped (not found locally)`);
    return;
  }

  const result = await source.execute(`SELECT * FROM ${table}`);
  const rows = result.rows;
  const placeholders = columns.map(() => "?").join(", ");
  const sql = `INSERT OR IGNORE INTO ${table} (${columns.join(", ")}) VALUES (${placeholders})`;

  for (let offset = 0; offset < rows.length; offset += 100) {
    const batch = rows.slice(offset, offset + 100).map((row) => ({
      sql,
      args: columns.map((column) => row[column]),
    }));
    await target.batch(batch, "write");
  }
  console.log(`${table}: ${rows.length} row(s) copied`);
}

try {
  await target.batch(schema.map((sql) => ({ sql })), "write");
  for (const table of tables) await copyTable(table);
  console.log("Migration completed. Sessions were intentionally not copied; log in again on Vercel.");
} finally {
  source.close();
  target.close();
}