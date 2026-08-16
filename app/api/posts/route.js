import { userFromRequest } from "@/lib/auth";
import { createPost, listPosts } from "@/lib/server-store";

export async function GET(request) {
  const user = await userFromRequest(request);
  if (!user) return Response.json({ error: "ログインが必要です。" }, { status: 401 });
  return Response.json({ posts: await listPosts(user.id) });
}

export async function POST(request) {
  const user = await userFromRequest(request);
  if (!user) return Response.json({ error: "ログインが必要です。" }, { status: 401 });

  const body = await request.json();
  const length = Number(body.length);
  const duration = Math.max(1, Number(body.duration) || 1);
  const clearedCount = Number(body.clearedCount);
  if (!Number.isInteger(length) || length < 1 || length > 10000) {
    return Response.json({ error: "投稿内容が不正です。" }, { status: 400 });
  }
  if (!Number.isInteger(clearedCount) || clearedCount < 0 || clearedCount > 10000) {
    return Response.json({ error: "書き直し回数が不正です。" }, { status: 400 });
  }

  const post = await createPost({ length, duration, clearedCount, userId: user.id });
  return Response.json({ post }, { status: 201 });
}
