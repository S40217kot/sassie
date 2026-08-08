import { clearSession, clearSessionCookie } from "@/lib/auth";

export async function POST(request) {
  const user = await clearSession(request);
  return clearSessionCookie(Response.json({ ok: true }), user?.id);
}
