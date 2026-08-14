import { updateUserNickname, userFromRequest } from "@/lib/auth";

export async function PATCH(request) {
  const currentUser = await userFromRequest(request);
  if (!currentUser) {
    return Response.json({ error: "ログインが必要です。" }, { status: 401 });
  }

  const body = await request.json();
  const nickname = String(body.nickname ?? "").trim();
  if (nickname.length < 2 || nickname.length > 20) {
    return Response.json({ error: "ニックネームは2〜20文字で入力してください。" }, { status: 400 });
  }

  const result = await updateUserNickname(currentUser.id, nickname);
  if (result.status === "rate-limited") {
    return Response.json(
      { error: "ニックネームを変更できるのは5時間に3回までです。時間をおいてお試しください。" },
      { status: 429 },
    );
  }
  if (result.status === "unavailable") {
    return Response.json({ error: "そのニックネームは使用されています。" }, { status: 409 });
  }
  if (result.status !== "ok") {
    return Response.json({ error: "アカウントが見つかりません。" }, { status: 404 });
  }

  return Response.json({ user: result.user });
}
