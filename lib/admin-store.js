import "server-only";

import { db } from "@/lib/db";

export async function getAdminOverview(currentUser) {
  const [userRows, postRows, reactionRows] = await Promise.all([
    db.all(`
      SELECT
        users.id,
        users.nickname,
        users.is_system AS isSystem,
        users.is_admin AS isAdmin,
        users.is_super_admin AS isSuperAdmin,
        users.created_at AS createdAt,
        (SELECT COUNT(*) FROM posts WHERE posts.user_id = users.id) AS postCount,
        (
          (SELECT COUNT(*) FROM reactions WHERE reactions.user_id = users.id) +
          (SELECT COUNT(*) FROM feelings WHERE feelings.user_id = users.id)
        ) AS reactionCount
      FROM users
      ORDER BY users.is_system DESC, users.is_super_admin DESC, users.is_admin DESC, users.created_at ASC
    `),
    db.all(`
      SELECT
        posts.id,
        posts.original_length AS length,
        posts.masked_text AS masked,
        posts.created_at AS createdAt,
        users.nickname AS ownerNickname,
        users.is_system AS ownerIsSystem,
        users.is_admin AS ownerIsAdmin,
        users.is_super_admin AS ownerIsSuperAdmin,
        (
          (SELECT COUNT(*) FROM reactions WHERE reactions.post_id = posts.id) +
          (SELECT COUNT(*) FROM feelings WHERE feelings.post_id = posts.id)
        ) AS reactionCount
      FROM posts
      JOIN users ON users.id = posts.user_id
      ORDER BY posts.created_at DESC
    `),
    db.all(`
      SELECT
        'emoji' AS kind,
        reactions.post_id AS postId,
        reactions.user_id AS userId,
        reactions.emoji AS value,
        reactions.created_at AS createdAt,
        users.nickname AS userNickname,
        posts.original_length AS postLength
      FROM reactions
      JOIN users ON users.id = reactions.user_id
      JOIN posts ON posts.id = reactions.post_id
      UNION ALL
      SELECT
        'feeling' AS kind,
        feelings.post_id AS postId,
        feelings.user_id AS userId,
        feelings.feeling AS value,
        feelings.created_at AS createdAt,
        users.nickname AS userNickname,
        posts.original_length AS postLength
      FROM feelings
      JOIN users ON users.id = feelings.user_id
      JOIN posts ON posts.id = feelings.post_id
      ORDER BY createdAt DESC
    `),
  ]);

  const users = userRows.map((user) => ({
    ...user,
    isSystem: Boolean(user.isSystem),
    isAdmin: Boolean(user.isAdmin),
    isSuperAdmin: Boolean(user.isSuperAdmin),
    isSelf: user.id === currentUser.id,
  }));
  const posts = postRows.map((post) => ({
    ...post,
    ownerIsSystem: Boolean(post.ownerIsSystem),
    ownerIsAdmin: Boolean(post.ownerIsAdmin),
    ownerIsSuperAdmin: Boolean(post.ownerIsSuperAdmin),
  }));

  return {
    users,
    posts,
    reactions: reactionRows,
    permissions: { isSuperAdmin: currentUser.isSuperAdmin },
  };
}

export async function deleteManagedUser(targetId, actor) {
  const target = await db.get(`
    SELECT id, is_system, is_admin, is_super_admin FROM users WHERE id = ?
  `, [targetId]);
  if (!target) return "not-found";
  if (target.id === actor.id || target.is_system || target.is_super_admin) return "protected";
  if (target.is_admin && !actor.isSuperAdmin) return "protected";

  await db.batch([
    {
      sql: "DELETE FROM reactions WHERE user_id = ? OR post_id IN (SELECT id FROM posts WHERE user_id = ?)",
      args: [targetId, targetId],
    },
    {
      sql: "DELETE FROM feelings WHERE user_id = ? OR post_id IN (SELECT id FROM posts WHERE user_id = ?)",
      args: [targetId, targetId],
    },
    {
      sql: "DELETE FROM post_stops WHERE user_id = ? OR post_id IN (SELECT id FROM posts WHERE user_id = ?)",
      args: [targetId, targetId],
    },
    { sql: "DELETE FROM posts WHERE user_id = ?", args: [targetId] },
    { sql: "DELETE FROM sessions WHERE user_id = ?", args: [targetId] },
    { sql: "DELETE FROM users WHERE id = ?", args: [targetId] },
  ]);
  return "ok";
}

export async function promoteManagedUser(targetId) {
  const target = await db.get(`
    SELECT id, is_system, is_admin, is_super_admin FROM users WHERE id = ?
  `, [targetId]);
  if (!target) return "not-found";
  if (target.is_system || target.is_super_admin) return "protected";
  if (target.is_admin) return "already-admin";

  await db.run("UPDATE users SET is_admin = 1 WHERE id = ?", [targetId]);
  return "ok";
}

export async function demoteManagedUser(targetId, actor) {
  if (!actor.isSuperAdmin) return "forbidden";

  const target = await db.get(`
    SELECT id, is_system, is_admin, is_super_admin FROM users WHERE id = ?
  `, [targetId]);
  if (!target) return "not-found";
  if (target.id === actor.id || target.is_system || target.is_super_admin) return "protected";
  if (!target.is_admin) return "not-admin";

  await db.run("UPDATE users SET is_admin = 0 WHERE id = ?", [targetId]);
  return "ok";
}

export async function deleteManagedPost(postId) {
  const existing = await db.get("SELECT 1 FROM posts WHERE id = ?", [postId]);
  if (!existing) return "not-found";
  await db.batch([
    { sql: "DELETE FROM reactions WHERE post_id = ?", args: [postId] },
    { sql: "DELETE FROM feelings WHERE post_id = ?", args: [postId] },
    { sql: "DELETE FROM post_stops WHERE post_id = ?", args: [postId] },
    { sql: "DELETE FROM posts WHERE id = ?", args: [postId] },
  ]);
  return "ok";
}

export async function deleteManagedReaction({ kind, postId, userId, value }) {
  let result;
  if (kind === "emoji") {
    result = await db.run(`
      DELETE FROM reactions WHERE post_id = ? AND user_id = ? AND emoji = ?
    `, [postId, userId, value]);
  } else if (kind === "feeling") {
    result = await db.run(`
      DELETE FROM feelings WHERE post_id = ? AND user_id = ? AND feeling = ?
    `, [postId, userId, value]);
  } else {
    return "invalid";
  }
  return result.rowsAffected ? "ok" : "not-found";
}
