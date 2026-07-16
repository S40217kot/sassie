import { getClient, jsonForClient } from "@/lib/api-session";
import { togglePostReaction } from "@/lib/server-store";

const allowed = new Set(["🌙", "☕", "🕯️", "🌱", "📖"]);

export async function POST(request, { params }) {
  const { id } = await params;
  const { emoji } = await request.json();
  if (!allowed.has(emoji)) return Response.json({ error: "リアクションが不正です。" }, { status: 400 });
  const clientId = getClient(request);
  const post = await togglePostReaction(id, emoji, clientId);
  if (!post) return Response.json({ error: "投稿が見つかりません。" }, { status: 404 });
  return jsonForClient({ post }, request, clientId);
}
