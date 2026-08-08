import { userFromRequest } from "@/lib/auth";
import { deleteManagedPost } from "@/lib/admin-store";

export async function DELETE(request, { params }) {
  const user = await userFromRequest(request);
  if (!user) return Response.json({ error: "ログインが必要です。" }, { status: 401 });
  if (!user.isAdmin) return Response.json({ error: "管理者権限が必要です。" }, { status: 403 });

  const { id } = await params;
  const result = await deleteManagedPost(id);
  if (result === "not-found") return Response.json({ error: "投稿が見つかりません。" }, { status: 404 });
  return Response.json({ ok: true });
}
