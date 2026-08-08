import { userFromRequest } from "@/lib/auth";
import { reactionEmojis, togglePostReaction } from "@/lib/server-store";

const allowed = new Set(reactionEmojis);

export async function POST(request, { params }) {
  const user = await userFromRequest(request);
  if (!user) return Response.json({ error: "ログインが必要です。" }, { status: 401 });

  const { id } = await params;
  const { emoji } = await request.json();
  if (!allowed.has(emoji)) return Response.json({ error: "リアクションが不正です。" }, { status: 400 });

  const result = await togglePostReaction(id, emoji, user.id);
  if (result.status === "not-found") return Response.json({ error: "投稿が見つかりません。" }, { status: 404 });
  if (result.status === "forbidden") {
    return Response.json({ error: "自分の投稿にはリアクションできません。" }, { status: 403 });
  }
  return Response.json({ post: result.post });
}
