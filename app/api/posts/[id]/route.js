import { getClient, jsonForClient } from "@/lib/api-session";
import { findPost } from "@/lib/server-store";

export async function GET(request, { params }) {
  const { id } = await params;
  const clientId = getClient(request);
  const post = await findPost(id, clientId);
  if (!post) return Response.json({ error: "投稿が見つかりません。" }, { status: 404 });
  return jsonForClient({ post }, request, clientId);
}
