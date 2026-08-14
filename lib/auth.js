import "server-only";

import { createHash, randomBytes, randomUUID, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";
import { db } from "@/lib/db";

const scrypt = promisify(scryptCallback);
const activeSessionCookie = "sassie_session";
const accountCookiePrefix = "sassie_account_";
const sessionLifetime = 30 * 24 * 60 * 60 * 1000;

function sessionId(token) {
  return createHash("sha256").update(token).digest("hex");
}

function accountCookieName(userId) {
  return `${accountCookiePrefix}${userId}`;
}

function cookieValue(name, token, expiresAt) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${name}=${token}; Path=/; HttpOnly; SameSite=Lax; Expires=${expiresAt.toUTCString()}${secure}`;
}

async function passwordDigest(password, salt) {
  return Buffer.from(await scrypt(password, salt, 64)).toString("hex");
}

function publicUser(row) {
  return {
    id: row.id,
    nickname: row.nickname,
    isAdmin: Boolean(row.is_admin),
    isSuperAdmin: Boolean(row.is_super_admin),
  };
}

export async function registerUser(nickname, password) {
  const id = randomUUID();
  const salt = randomBytes(16).toString("hex");
  const hash = await passwordDigest(password, salt);
  try {
    await db.run(`
      INSERT INTO users (id, nickname, password_hash, password_salt, created_at)
      VALUES (?, ?, ?, ?, ?)
    `, [id, nickname, hash, salt, new Date().toISOString()]);
  } catch (error) {
    if (String(error).includes("UNIQUE")) return null;
    throw error;
  }
  return { id, nickname, isAdmin: false, isSuperAdmin: false };
}

export async function authenticateUser(nickname, password) {
  const user = await db.get(`
    SELECT id, nickname, password_hash, password_salt, is_admin, is_super_admin
    FROM users WHERE nickname = ? AND is_system = 0
  `, [nickname]);
  if (!user?.password_hash || !user?.password_salt) return null;
  const supplied = Buffer.from(await passwordDigest(password, user.password_salt), "hex");
  const saved = Buffer.from(user.password_hash, "hex");
  if (supplied.length !== saved.length || !timingSafeEqual(supplied, saved)) return null;
  return publicUser(user);
}

export async function updateUserNickname(userId, nickname) {
  try {
    await db.run("UPDATE users SET nickname = ? WHERE id = ?", [nickname, userId]);
  } catch (error) {
    if (String(error).includes("UNIQUE")) return null;
    throw error;
  }

  const user = await db.get(`
    SELECT id, nickname, is_admin, is_super_admin
    FROM users
    WHERE id = ?
  `, [userId]);
  return user ? publicUser(user) : null;
}

export async function createSession(userId) {
  const token = randomBytes(32).toString("base64url");
  const now = new Date();
  const expiresAt = new Date(now.getTime() + sessionLifetime);
  await db.run(`
    INSERT INTO sessions (id, user_id, expires_at, created_at)
    VALUES (?, ?, ?, ?)
  `, [sessionId(token), userId, expiresAt.toISOString(), now.toISOString()]);
  return { token, userId, expiresAt };
}

async function sessionForToken(token) {
  if (!token) return null;
  const row = await db.get(`
    SELECT users.id, users.nickname, users.is_admin, users.is_super_admin, sessions.expires_at
    FROM sessions
    JOIN users ON users.id = sessions.user_id
    WHERE sessions.id = ? AND sessions.expires_at > ?
  `, [sessionId(token), new Date().toISOString()]);
  if (!row) return null;
  return {
    token,
    user: publicUser(row),
    expiresAt: new Date(row.expires_at),
  };
}

async function rememberActiveSession(response, request) {
  if (!request) return;
  const activeToken = request.cookies.get(activeSessionCookie)?.value;
  const activeSession = await sessionForToken(activeToken);
  if (activeSession) {
    response.headers.append(
      "Set-Cookie",
      cookieValue(accountCookieName(activeSession.user.id), activeSession.token, activeSession.expiresAt),
    );
  }
}

export async function setSessionCookie(response, session, request) {
  await rememberActiveSession(response, request);
  response.headers.append("Set-Cookie", cookieValue(activeSessionCookie, session.token, session.expiresAt));
  response.headers.append(
    "Set-Cookie",
    cookieValue(accountCookieName(session.userId), session.token, session.expiresAt),
  );
  return response;
}

export function setActiveAccountCookie(response, account) {
  response.headers.append(
    "Set-Cookie",
    cookieValue(activeSessionCookie, account.token, account.expiresAt),
  );
  return response;
}

export async function clearSession(request) {
  const token = request.cookies.get(activeSessionCookie)?.value;
  const session = await sessionForToken(token);
  if (token) await db.run("DELETE FROM sessions WHERE id = ?", [sessionId(token)]);
  return session?.user ?? null;
}

export function clearSessionCookie(response, userId) {
  response.headers.append("Set-Cookie", `${activeSessionCookie}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`);
  if (userId) {
    response.headers.append(
      "Set-Cookie",
      `${accountCookieName(userId)}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`,
    );
  }
  return response;
}

async function userForToken(token) {
  return (await sessionForToken(token))?.user ?? null;
}

async function accountsForCookieStore(cookieStore) {
  const activeToken = cookieStore.get(activeSessionCookie)?.value;
  const accountCookies = cookieStore.getAll().filter((cookie) => cookie.name.startsWith(accountCookiePrefix));
  const [activeSession, ...savedSessions] = await Promise.all([
    sessionForToken(activeToken),
    ...accountCookies.map((cookie) => sessionForToken(cookie.value)),
  ]);
  const accounts = new Map();

  if (activeSession) {
    accounts.set(activeSession.user.id, { ...activeSession.user, isActive: true });
  }

  for (const session of savedSessions) {
    if (!session) continue;
    const existing = accounts.get(session.user.id);
    accounts.set(session.user.id, {
      ...session.user,
      isActive: existing?.isActive ?? session.token === activeToken,
    });
  }

  return [...accounts.values()];
}

export async function userFromRequest(request) {
  return userForToken(request.cookies.get(activeSessionCookie)?.value);
}

export async function accountsFromRequest(request) {
  return accountsForCookieStore(request.cookies);
}

export async function accountFromRequest(request, userId) {
  const accountToken = request.cookies.get(accountCookieName(userId))?.value;
  const activeToken = request.cookies.get(activeSessionCookie)?.value;
  const account = await sessionForToken(accountToken) ?? await sessionForToken(activeToken);
  return account?.user.id === userId ? account : null;
}

export async function currentUser() {
  const cookieStore = await cookies();
  return userForToken(cookieStore.get(activeSessionCookie)?.value);
}

export async function currentAccounts() {
  return accountsForCookieStore(await cookies());
}
