import { userFromRequest } from "@/lib/auth";
import { chooseFeeling, feelingChoices } from "@/lib/server-store";

const allowed = new Set(feelingChoices);

export async function POST(request, { params }) {
  const user = await userFromRequest(request);
  if (!user) return Response.json({ error: "ログインが必要です。" }, { status: 401 });

  const { id } = await params;
  const { feeling } = await request.json();
  if (!allowed.has(feeling)) return Response.json({ error: "選択内容が不正です。" }, { status: 400 });

  const result = await chooseFeeling(id, feeling, user.id);
  if (result.status === "not-found") return Response.json({ error: "投稿が見つかりません。" }, { status: 404 });
  if (result.status === "forbidden") {
    return Response.json({ error: "自分の投稿にはリアクションできません。" }, { status: 403 });
  }
  return Response.json({ selectedFeeling: result.selectedFeeling });
}
