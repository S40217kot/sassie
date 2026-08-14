import "server-only";

import { randomUUID } from "node:crypto";
import { db } from "@/lib/db";

export const reactionEmojis = ["\uD83C\uDF19", "\u2615", "\uD83D\uDD6F\uFE0F", "\uD83C\uDF31", "\uD83D\uDCD6"];
export const feelingChoices = ["\u9759\u304b", "\u4e00\u606f\u3064\u304f", "\u305d\u3063\u3068\u706f\u3059", "\u5927\u4e08\u592b\u3060\u3088", "\u672c\u306b\u3059\u308b"];

function parsePost(row) {
  return {
    id: row.id,
    userId: row.user_id,
    ownerNickname: row.owner_nickname,
    masked: row.masked_text,
    length: row.original_length,
    traces: JSON.parse(row.traces_json),
    detailTraces: JSON.parse(row.detail_traces_json),
    baseReactions: JSON.parse(row.base_reactions_json),
    stopped: row.stopped,
    createdAt: row.created_at,
  };
}

function decorate(post, userId, savedReactions = [], selectedFeeling = null, stoppedCount = 0) {
  const reactions = post.baseReactions.map(([emoji, baseCount]) => {
    const matching = savedReactions.filter((reaction) => reaction.emoji === emoji);
    return {
      emoji,
      count: baseCount + matching.length,
      selected: matching.some((reaction) => reaction.user_id === userId),
    };
  });

  return {
    id: post.id,
    ownerNickname: post.ownerNickname,
    masked: post.masked,
    length: post.length,
    traces: post.traces,
    detailTraces: post.detailTraces,
    reactions,
    stopped: Number(post.stopped) + Number(stoppedCount),
    selectedFeeling,
    isOwn: post.userId === userId,
  };
}

async function decorateRows(rows, userId) {
  if (!rows.length) return [];

  const ids = rows.map((row) => row.id);
  const placeholders = ids.map(() => "?").join(",");
  const [savedReactions, selectedFeelings, stopCounts] = await Promise.all([
    db.all(
      `SELECT post_id, user_id, emoji FROM reactions WHERE post_id IN (${placeholders})`,
      ids,
    ),
    db.all(
      `SELECT post_id, feeling FROM feelings WHERE user_id = ? AND post_id IN (${placeholders})`,
      [userId, ...ids],
    ),
    db.all(
      `SELECT post_id, COUNT(*) AS count FROM post_stops WHERE post_id IN (${placeholders}) GROUP BY post_id`,
      ids,
    ),
  ]);

  const reactionsByPost = new Map();
  for (const reaction of savedReactions) {
    const reactions = reactionsByPost.get(reaction.post_id) ?? [];
    reactions.push(reaction);
    reactionsByPost.set(reaction.post_id, reactions);
  }
  const feelingByPost = new Map(selectedFeelings.map((row) => [row.post_id, row.feeling]));
  const stopsByPost = new Map(stopCounts.map((row) => [row.post_id, row.count]));

  return rows.map((row) => {
    const post = decorate(
      parsePost(row),
      userId,
      reactionsByPost.get(row.id) ?? [],
      feelingByPost.get(row.id) ?? null,
      stopsByPost.get(row.id) ?? 0,
    );
    return {
      ...post,
      reactions: post.reactions.map(({ emoji, count, selected }) => [emoji, count, selected]),
    };
  });
}

export async function listPosts(userId) {
  const rows = await db.all(`
    SELECT posts.*, users.nickname AS owner_nickname
    FROM posts
    JOIN users ON users.id = posts.user_id
    ORDER BY posts.created_at DESC
  `);
  return decorateRows(rows, userId);
}

export async function listUserPosts(userId) {
  const rows = await db.all(
    `SELECT posts.*, users.nickname AS owner_nickname
     FROM posts
     JOIN users ON users.id = posts.user_id
     WHERE posts.user_id = ?
     ORDER BY posts.created_at DESC`,
    [userId],
  );
  return decorateRows(rows, userId);
}

export async function findPost(id, userId) {
  const row = await db.get(`
    SELECT posts.*, users.nickname AS owner_nickname
    FROM posts
    JOIN users ON users.id = posts.user_id
    WHERE posts.id = ?
  `, [id]);
  if (!row) return null;

  const [savedReactions, selectedFeeling, stopCount] = await Promise.all([
    db.all("SELECT user_id, emoji FROM reactions WHERE post_id = ?", [id]),
    db.get("SELECT feeling FROM feelings WHERE post_id = ? AND user_id = ?", [id, userId]),
    db.get("SELECT COUNT(*) AS count FROM post_stops WHERE post_id = ?", [id]),
  ]);
  return decorate(
    parsePost(row),
    userId,
    savedReactions,
    selectedFeeling?.feeling ?? null,
    stopCount?.count ?? 0,
  );
}

export async function recordPostStop(postId, userId) {
  const post = await db.get("SELECT user_id, stopped FROM posts WHERE id = ?", [postId]);
  if (!post) return { status: "not-found", stopped: 0 };

  if (post.user_id !== userId) {
    await db.run(`
      INSERT OR IGNORE INTO post_stops (post_id, user_id, created_at)
      VALUES (?, ?, ?)
    `, [postId, userId, new Date().toISOString()]);
  }

  const row = await db.get("SELECT COUNT(*) AS count FROM post_stops WHERE post_id = ?", [postId]);
  return {
    status: "ok",
    stopped: Number(post.stopped) + Number(row?.count ?? 0),
  };
}

export async function createPost({ length, duration, userId }) {
  const owner = await db.get("SELECT nickname FROM users WHERE id = ?", [userId]);
  const durationText = duration < 60
    ? `\u9001\u4fe1\u307e\u3067${duration}\u79d2\u304b\u304b\u308a\u307e\u3057\u305f`
    : `\u9001\u4fe1\u307e\u3067${Math.floor(duration / 60)}\u5206${duration % 60}\u79d2\u304b\u304b\u308a\u307e\u3057\u305f`;
  const post = {
    id: randomUUID(),
    userId,
    ownerNickname: owner?.nickname ?? "",
    masked: "\u25A1".repeat(Math.max(8, Math.min(12, Math.ceil(length / 4)))),
    length,
    traces: [durationText],
    detailTraces: [durationText],
    baseReactions: reactionEmojis.map((emoji) => [emoji, 0]),
    stopped: 0,
    createdAt: new Date().toISOString(),
  };

  await db.run(`
    INSERT INTO posts (
      id, user_id, masked_text, original_length, traces_json,
      detail_traces_json, base_reactions_json, stopped, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    post.id,
    post.userId,
    post.masked,
    post.length,
    JSON.stringify(post.traces),
    JSON.stringify(post.detailTraces),
    JSON.stringify(post.baseReactions),
    post.stopped,
    post.createdAt,
  ]);

  return decorate(post, userId);
}

export async function togglePostReaction(postId, emoji, userId) {
  const row = await db.get("SELECT * FROM posts WHERE id = ?", [postId]);
  if (!row) return { status: "not-found" };
  if (row.user_id === userId) return { status: "forbidden" };

  const existing = await db.get(`
    SELECT emoji FROM reactions WHERE post_id = ? AND user_id = ?
  `, [postId, userId]);
  if (existing?.emoji === emoji) {
    await db.run(
      "DELETE FROM reactions WHERE post_id = ? AND user_id = ? AND emoji = ?",
      [postId, userId, emoji],
    );
  } else {
    await db.batch([
      {
        sql: "DELETE FROM reactions WHERE post_id = ? AND user_id = ?",
        args: [postId, userId],
      },
      {
        sql: `INSERT INTO reactions (post_id, user_id, emoji, created_at)
              VALUES (?, ?, ?, ?)`,
        args: [postId, userId, emoji, new Date().toISOString()],
      },
    ]);
  }

  return { status: "ok", post: await findPost(postId, userId) };
}

export async function chooseFeeling(postId, feeling, userId) {
  const row = await db.get("SELECT * FROM posts WHERE id = ?", [postId]);
  if (!row) return { status: "not-found", selectedFeeling: null };
  if (row.user_id === userId) return { status: "forbidden", selectedFeeling: null };

  const existing = await db.get(`
    SELECT feeling FROM feelings WHERE post_id = ? AND user_id = ?
  `, [postId, userId]);

  if (existing?.feeling === feeling) {
    await db.run("DELETE FROM feelings WHERE post_id = ? AND user_id = ?", [postId, userId]);
    return { status: "ok", selectedFeeling: null };
  }

  await db.run(`
    INSERT INTO feelings (post_id, user_id, feeling, created_at)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(post_id, user_id) DO UPDATE SET
      feeling = excluded.feeling,
      created_at = excluded.created_at
  `, [postId, userId, feeling, new Date().toISOString()]);
  return { status: "ok", selectedFeeling: feeling };
}
