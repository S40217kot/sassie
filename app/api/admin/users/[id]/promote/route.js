import { userFromRequest } from "@/lib/auth";
import { promoteManagedUser } from "@/lib/admin-store";

export async function POST(request, { params }) {
  const user = await userFromRequest(request);
  if (!user) return Response.json({ error: "ログインが必要です。" }, { status: 401 });
  if (!user.isSuperAdmin) {
    return Response.json({ error: "システム管理者権限が必要です。" }, { status: 403 });
  }

  const { id } = await params;
  const result = await promoteManagedUser(id);
  if (result === "not-found") return Response.json({ error: "ユーザーが見つかりません。" }, { status: 404 });
  if (result === "protected") return Response.json({ error: "このユーザーは変更できません。" }, { status: 403 });
  if (result === "already-admin") return Response.json({ error: "すでに管理者です。" }, { status: 409 });
  return Response.json({ ok: true });
}
