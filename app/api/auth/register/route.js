import { createSession, registerUser, setSessionCookie } from "@/lib/auth";

export async function POST(request) {
  const body = await request.json();
  const nickname = String(body.nickname ?? "").trim();
  const password = String(body.password ?? "");

  if (nickname.length < 2 || nickname.length > 20) {
    return Response.json({ error: "ニックネームは2〜20文字で入力してください。" }, { status: 400 });
  }
  if (password.length < 8 || password.length > 72) {
    return Response.json({ error: "パスワードは8〜72文字で入力してください。" }, { status: 400 });
  }

  const user = await registerUser(nickname, password);
  if (!user) {
    return Response.json({ error: "そのニックネームは使用されています。" }, { status: 409 });
  }

  const response = Response.json({ user }, { status: 201 });
  return setSessionCookie(response, await createSession(user.id), request);
}
