import { getClient, jsonForClient } from "@/lib/api-session";
import { createPost, listPosts } from "@/lib/server-store";

export async function GET(request) {
  const clientId = getClient(request);
  return jsonForClient({ posts: await listPosts(clientId) }, request, clientId);
}

export async function POST(request) {
  const body = await request.json();
  const length = Number(body.length);
  const duration = Math.max(1, Number(body.duration) || 1);
  if (!Number.isInteger(length) || length < 1 || length > 10000) {
    return Response.json({ error: "投稿内容が不正です。" }, { status: 400 });
  }
  return Response.json({ post: await createPost({ length, duration }) }, { status: 201 });
}
