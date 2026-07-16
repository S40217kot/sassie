import { getClient, jsonForClient } from "@/lib/api-session";
import { chooseFeeling, findPost } from "@/lib/server-store";

const allowed = new Set(["静か", "一息つく", "そっと灯す", "大丈夫だよ", "本にする"]);

export async function POST(request, { params }) {
  const { id } = await params;
  const { feeling } = await request.json();
  if (!allowed.has(feeling)) return Response.json({ error: "選択内容が不正です。" }, { status: 400 });
  const clientId = getClient(request);
  if (!await findPost(id, clientId)) return Response.json({ error: "投稿が見つかりません。" }, { status: 404 });
  const selectedFeeling = await chooseFeeling(id, feeling, clientId);
  return jsonForClient({ selectedFeeling }, request, clientId);
}
