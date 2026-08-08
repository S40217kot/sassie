import { authenticateUser, createSession, setSessionCookie } from "@/lib/auth";

export async function POST(request) {
  const body = await request.json();
  const nickname = String(body.nickname ?? "").trim();
  const password = String(body.password ?? "");
  const user = await authenticateUser(nickname, password);

  if (!user) {
    return Response.json({ error: "ニックネームまたはパスワードが違います。" }, { status: 401 });
  }

  return setSessionCookie(Response.json({ user }), await createSession(user.id), request);
}
