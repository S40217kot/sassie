import { notFound, redirect } from "next/navigation";
import { ServerDetailClientV2 } from "@/components/server-detail-client-v2";
import { currentUser } from "@/lib/auth";
import { findPost } from "@/lib/server-store";

export const dynamic = "force-dynamic";

export default async function DetailPage({ params }) {
  const user = await currentUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const post = await findPost(id, user.id);
  if (!post) notFound();
  return <ServerDetailClientV2 initialPost={post} />;
}
