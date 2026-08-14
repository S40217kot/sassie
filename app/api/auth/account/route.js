import {
  clearSessionCookie,
  deleteOwnAccount,
  userFromRequest,
} from "@/lib/auth";

export async function DELETE(request) {
  const currentUser = await userFromRequest(request);
  if (!currentUser) {
    return Response.json({ error: "ログインが必要です。" }, { status: 401 });
  }

  const body = await request.json();
  const password = String(body.password ?? "");
  if (!password) {
    return Response.json({ error: "現在のパスワードを入力してください。" }, { status: 400 });
  }

  const result = await deleteOwnAccount(currentUser.id, password);
  if (result === "invalid-password") {
    return Response.json({ error: "パスワードが違います。" }, { status: 401 });
  }
  if (result === "protected") {
    return Response.json({ error: "システム管理者アカウントは削除できません。" }, { status: 403 });
  }
  if (result === "not-found") {
    return Response.json({ error: "アカウントが見つかりません。" }, { status: 404 });
  }

  return clearSessionCookie(Response.json({ ok: true }), currentUser.id);
}
