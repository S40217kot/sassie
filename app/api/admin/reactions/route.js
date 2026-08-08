import { userFromRequest } from "@/lib/auth";
import { deleteManagedReaction } from "@/lib/admin-store";

export async function DELETE(request) {
  const user = await userFromRequest(request);
  if (!user) return Response.json({ error: "ログインが必要です。" }, { status: 401 });
  if (!user.isAdmin) return Response.json({ error: "管理者権限が必要です。" }, { status: 403 });

  const body = await request.json();
  const result = await deleteManagedReaction({
    kind: body.kind,
    postId: String(body.postId ?? ""),
    userId: String(body.userId ?? ""),
    value: String(body.value ?? ""),
  });
  if (result === "invalid") return Response.json({ error: "リアクション種別が不正です。" }, { status: 400 });
  if (result === "not-found") return Response.json({ error: "リアクションが見つかりません。" }, { status: 404 });
  return Response.json({ ok: true });
}
