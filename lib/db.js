import "server-only";

import { createClient } from "@libsql/client";
import fs from "node:fs";
import path from "node:path";

const dataDirectory = path.join(process.cwd(), "data");
const localDatabasePath = path.join(dataDirectory, "sassie.db");
const remoteUrl = process.env.TURSO_DATABASE_URL?.trim();
const remoteToken = process.env.TURSO_AUTH_TOKEN?.trim();
const isRemoteDatabase = Boolean(remoteUrl);

if (process.env.VERCEL && !isRemoteDatabase) {
  throw new Error("TURSO_DATABASE_URL must be configured on Vercel.");
}

if (isRemoteDatabase && !remoteToken) {
  throw new Error("TURSO_AUTH_TOKEN is required when TURSO_DATABASE_URL is set.");
}

if (!isRemoteDatabase) fs.mkdirSync(dataDirectory, { recursive: true });

const globalDatabase = globalThis;
const client = globalDatabase.__sassieLibsqlClient ?? createClient({
  url: remoteUrl || `file:${localDatabasePath.replaceAll("\\", "/")}`,
  authToken: remoteToken,
});

if (process.env.NODE_ENV !== "production") globalDatabase.__sassieLibsqlClient = client;

const schemaStatements = [
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
  `CREATE TABLE IF NOT EXISTS post_stops (
    post_id TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL,
    PRIMARY KEY (post_id, user_id)
  )`,
  `CREATE TABLE IF NOT EXISTS reserved_nicknames (
    nickname TEXT PRIMARY KEY COLLATE NOCASE,
    user_id TEXT NOT NULL,
    reserved_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS nickname_change_events (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    changed_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS migrations (
    name TEXT PRIMARY KEY,
    applied_at TEXT NOT NULL
  )`,
  "CREATE INDEX IF NOT EXISTS posts_created_at_idx ON posts(created_at DESC)",
  "CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON sessions(user_id)",
  "CREATE INDEX IF NOT EXISTS post_stops_post_id_idx ON post_stops(post_id)",
  `DELETE FROM reactions
    WHERE rowid NOT IN (
      SELECT MAX(rowid) FROM reactions GROUP BY post_id, user_id
    )`,
  "CREATE UNIQUE INDEX IF NOT EXISTS reactions_one_per_user_post_idx ON reactions(post_id, user_id)",
  "CREATE INDEX IF NOT EXISTS nickname_change_events_user_time_idx ON nickname_change_events(user_id, changed_at DESC)",
  `CREATE TRIGGER IF NOT EXISTS users_nickname_reservation_on_insert
    BEFORE INSERT ON users
    WHEN EXISTS (
      SELECT 1 FROM reserved_nicknames WHERE nickname = NEW.nickname
    )
    BEGIN
      SELECT RAISE(ABORT, 'nickname_reserved');
    END`,
  `CREATE TRIGGER IF NOT EXISTS users_nickname_guard_on_update
    BEFORE UPDATE OF nickname ON users
    WHEN OLD.nickname <> NEW.nickname
    BEGIN
      SELECT CASE WHEN EXISTS (
        SELECT 1 FROM reserved_nicknames
        WHERE nickname = NEW.nickname AND user_id <> OLD.id
      ) THEN RAISE(ABORT, 'nickname_reserved') END;
      SELECT CASE WHEN (
        SELECT COUNT(*) FROM nickname_change_events
        WHERE user_id = OLD.id
          AND changed_at > strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-5 hours')
      ) >= 3 THEN RAISE(ABORT, 'nickname_rate_limit') END;
    END`,
  `CREATE TRIGGER IF NOT EXISTS users_nickname_record_on_update
    AFTER UPDATE OF nickname ON users
    WHEN OLD.nickname <> NEW.nickname
    BEGIN
      INSERT OR IGNORE INTO reserved_nicknames (nickname, user_id, reserved_at)
      VALUES (OLD.nickname, OLD.id, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'));
      INSERT INTO nickname_change_events (id, user_id, changed_at)
      VALUES (lower(hex(randomblob(16))), OLD.id, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'));
    END`,
  `CREATE TRIGGER IF NOT EXISTS users_nickname_reserve_on_delete
    AFTER DELETE ON users
    BEGIN
      INSERT OR IGNORE INTO reserved_nicknames (nickname, user_id, reserved_at)
      VALUES (OLD.nickname, OLD.id, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'));
    END`,
];

function statement(sql, args = []) {
  return { sql, args };
}

async function execute(sql, args = []) {
  return client.execute(statement(sql, args));
}

async function migrateLegacyData() {
  if (isRemoteDatabase) return;

  const migrationName = "legacy-json-v1";
  const migrated = await execute("SELECT 1 FROM migrations WHERE name = ?", [migrationName]);
  if (migrated.rows.length) return;

  const legacyPath = path.join(dataDirectory, "app-data.json");
  const now = new Date().toISOString();
  const systemUserId = "system-legacy";
  const statements = [
    statement(`
      INSERT OR IGNORE INTO users (id, nickname, is_system, created_at)
      VALUES (?, ?, 1, ?)
    `, [systemUserId, "Sassie", now]),
  ];

  if (fs.existsSync(legacyPath)) {
    const legacy = JSON.parse(fs.readFileSync(legacyPath, "utf8"));
    for (const post of legacy.posts ?? []) {
      statements.push(statement(`
        INSERT OR IGNORE INTO posts (
          id, user_id, masked_text, original_length, traces_json,
          detail_traces_json, base_reactions_json, stopped, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        post.id,
        systemUserId,
        post.masked,
        post.length,
        JSON.stringify(post.traces ?? []),
        JSON.stringify(post.detailTraces ?? post.traces ?? []),
        JSON.stringify(post.reactions ?? []),
        post.stopped ?? 0,
        post.createdAt ?? now,
      ]));
    }
  }

  statements.push(statement(
    "INSERT INTO migrations (name, applied_at) VALUES (?, ?)",
    [migrationName, now],
  ));
  await client.batch(statements, "write");
}

async function initializeDatabase() {
  if (!isRemoteDatabase) await execute("PRAGMA foreign_keys = ON");
  await client.batch(schemaStatements.map((sql) => statement(sql)), "write");

  const columns = await execute("PRAGMA table_info(users)");
  const names = new Set(columns.rows.map((column) => column.name));
  if (!names.has("is_admin")) {
    await execute("ALTER TABLE users ADD COLUMN is_admin INTEGER NOT NULL DEFAULT 0");
  }
  if (!names.has("is_super_admin")) {
    await execute("ALTER TABLE users ADD COLUMN is_super_admin INTEGER NOT NULL DEFAULT 0");
  }

  await migrateLegacyData();
}

async function ensureReady() {
  if (!globalDatabase.__sassieDbReady) {
    globalDatabase.__sassieDbReady = initializeDatabase();
  }
  await globalDatabase.__sassieDbReady;
}

function rowsFrom(result) {
  return result.rows.map((row) => ({ ...row }));
}

export const db = {
  isRemote: isRemoteDatabase,

  async all(sql, args = []) {
    await ensureReady();
    return rowsFrom(await execute(sql, args));
  },

  async get(sql, args = []) {
    await ensureReady();
    const result = await execute(sql, args);
    return result.rows[0] ? { ...result.rows[0] } : undefined;
  },

  async run(sql, args = []) {
    await ensureReady();
    return execute(sql, args);
  },

  async batch(statements, mode = "write") {
    await ensureReady();
    return client.batch(
      statements.map(({ sql, args = [] }) => statement(sql, args)),
      mode,
    );
  },
};
