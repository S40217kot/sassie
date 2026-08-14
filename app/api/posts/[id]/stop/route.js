import { userFromRequest } from "@/lib/auth";
import { recordPostStop } from "@/lib/server-store";

export async function POST(request, { params }) {
  const user = await userFromRequest(request);
  if (!user) return Response.json({ error: "ログインが必要です。" }, { status: 401 });

  const { id } = await params;
  const result = await recordPostStop(id, user.id);
  if (result.status === "not-found") {
    return Response.json({ error: "投稿が見つかりません。" }, { status: 404 });
  }
  return Response.json({ stopped: result.stopped });
}
