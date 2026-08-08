import { accountFromRequest, setActiveAccountCookie } from "@/lib/auth";

export async function POST(request) {
  const { userId } = await request.json();
  const account = await accountFromRequest(request, String(userId ?? ""));
  if (!account) {
    return Response.json({ error: "このアカウントのログイン状態が切れています。" }, { status: 401 });
  }

  return setActiveAccountCookie(Response.json({ user: account.user }), account);
}
