import { userFromRequest } from "@/lib/auth";
import { findPost } from "@/lib/server-store";

export async function GET(request, { params }) {
  const user = await userFromRequest(request);
  if (!user) return Response.json({ error: "ログインが必要です。" }, { status: 401 });

  const { id } = await params;
  const post = await findPost(id, user.id);
  if (!post) return Response.json({ error: "投稿が見つかりません。" }, { status: 404 });
  return Response.json({ post });
}
