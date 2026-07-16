import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { ServerDetailClientV2 } from "@/components/server-detail-client-v2";
import { findPost } from "@/lib/server-store";

export const dynamic = "force-dynamic";

export default async function DetailPage({ params }) {
  const { id } = await params;
  const cookieStore = await cookies();
  const clientId = cookieStore.get("sassie_client")?.value ?? "server-render";
  const post = await findPost(id, clientId);
  if (!post) notFound();
  return <ServerDetailClientV2 initialPost={post} />;
}