import { userFromRequest } from "@/lib/auth";
import { updateManagedNickname } from "@/lib/admin-store";

export async function PATCH(request, { params }) {
  const user = await userFromRequest(request);
  if (!user) return Response.json({ error: "ログインが必要です。" }, { status: 401 });
  if (!user.isAdmin) return Response.json({ error: "管理者権限が必要です。" }, { status: 403 });

  const body = await request.json();
  const nickname = String(body.nickname ?? "").trim();
  if (nickname.length < 2 || nickname.length > 20) {
    return Response.json({ error: "ニックネームは2〜20文字で入力してください。" }, { status: 400 });
  }

  const { id } = await params;
  const result = await updateManagedNickname(id, nickname, user);
  if (result === "not-found") return Response.json({ error: "ユーザーが見つかりません。" }, { status: 404 });
  if (result === "forbidden" || result === "protected") {
    return Response.json({ error: "このユーザーのニックネームは変更できません。" }, { status: 403 });
  }
  if (result === "rate-limited") {
    return Response.json({ error: "このユーザーのニックネーム変更は5時間に3回までです。" }, { status: 429 });
  }
  if (result === "unavailable") {
    return Response.json({ error: "そのニックネームは使用されています。" }, { status: 409 });
  }
  return Response.json({ ok: true });
}
