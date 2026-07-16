import "server-only";

import { promises as fs } from "node:fs";
import path from "node:path";

const dataPath = path.join(process.cwd(), "data", "app-data.json");
let writeQueue = Promise.resolve();

async function readState() {
  try {
    return JSON.parse(await fs.readFile(dataPath, "utf8"));
  } catch {
    return { posts: [], reactions: {}, feelings: {} };
  }
}

async function updateState(updater) {
  let result;
  writeQueue = writeQueue.then(async () => {
    const state = await readState();
    result = await updater(state);
    await fs.writeFile(dataPath, JSON.stringify(state, null, 2), "utf8");
  });
  await writeQueue;
  return result;
}

function reactionData(state, post, clientId) {
  const saved = state.reactions[post.id] ?? {};
  return post.reactions.map(([emoji, baseCount]) => {
    const clients = saved[emoji] ?? [];
    return { emoji, count: baseCount + clients.length, selected: clients.includes(clientId) };
  });
}

function decorate(state, post, clientId) {
  return {
    ...post,
    reactions: reactionData(state, post, clientId),
    selectedFeeling: state.feelings[post.id]?.[clientId] ?? null,
  };
}

export async function listPosts(clientId) {
  const state = await readState();
  return state.posts.map((post) => {
    const decorated = decorate(state, post, clientId);
    return { ...decorated, reactions: decorated.reactions.map(({ emoji, count, selected }) => [emoji, count, selected]) };
  });
}

export async function findPost(id, clientId) {
  const state = await readState();
  const post = state.posts.find((item) => item.id === id);
  return post ? decorate(state, post, clientId) : null;
}

export async function createPost({ length, duration }) {
  return updateState((state) => {
    const durationText = duration < 60
      ? `送信まで${duration}秒かかりました`
      : `送信まで${Math.floor(duration / 60)}分${duration % 60}秒かかりました`;
    const post = {
      id: crypto.randomUUID(),
      masked: "□".repeat(Math.max(8, Math.min(12, Math.ceil(length / 4)))),
      length,
      traces: [durationText],
      detailTraces: [durationText],
      reactions: [["🌙", 0], ["☕", 0], ["🕯️", 0], ["🌱", 0], ["📖", 0]],
      stopped: 0,
      createdAt: new Date().toISOString(),
    };
    state.posts.unshift(post);
    return post;
  });
}

export async function togglePostReaction(postId, emoji, clientId) {
  return updateState((state) => {
    state.reactions[postId] ??= {};
    const clients = state.reactions[postId][emoji] ?? [];
    state.reactions[postId][emoji] = clients.includes(clientId)
      ? clients.filter((id) => id !== clientId)
      : [...clients, clientId];
    const post = state.posts.find((item) => item.id === postId);
    return post ? decorate(state, post, clientId) : null;
  });
}

export async function chooseFeeling(postId, feeling, clientId) {
  return updateState((state) => {
    state.feelings[postId] ??= {};
    state.feelings[postId][clientId] = state.feelings[postId][clientId] === feeling ? null : feeling;
    return state.feelings[postId][clientId];
  });
}

