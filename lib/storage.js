const POSTS_KEY = "sassie:posts";
const REACTIONS_KEY = "sassie:reactions";
const FEELINGS_KEY = "sassie:feelings";

function read(key, fallback) {
  if (typeof window === "undefined") return fallback;
  try { return JSON.parse(window.localStorage.getItem(key)) ?? fallback; }
  catch { return fallback; }
}

function write(key, value) { window.localStorage.setItem(key, JSON.stringify(value)); }

export function getLocalPosts() { return read(POSTS_KEY, []); }
export function addLocalPost(post) { write(POSTS_KEY, [post, ...getLocalPosts()]); }
export function getReactionCounts(post) {
  const saved = read(REACTIONS_KEY, {});
  return post.reactions.map(([emoji, count]) => [emoji, count + (saved[post.id]?.[emoji] ?? 0)]);
}
export function toggleReaction(postId, emoji) {
  const saved = read(REACTIONS_KEY, {});
  const postReactions = saved[postId] ?? {};
  const selected = postReactions[emoji] === 1;
  saved[postId] = { ...postReactions, [emoji]: selected ? 0 : 1 };
  write(REACTIONS_KEY, saved);
  return !selected;
}
export function getSelectedReactions(postId) {
  const saved = read(REACTIONS_KEY, {});
  return Object.entries(saved[postId] ?? {}).filter(([, value]) => value === 1).map(([emoji]) => emoji);
}
export function getFeeling(postId) { return read(FEELINGS_KEY, {})[postId] ?? null; }
export function setFeeling(postId, feeling) {
  const saved = read(FEELINGS_KEY, {});
  saved[postId] = saved[postId] === feeling ? null : feeling;
  write(FEELINGS_KEY, saved);
  return saved[postId];
}
