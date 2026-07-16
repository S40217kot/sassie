import { cookies } from "next/headers";
import { TimelineInteractive } from "@/components/timeline-interactive";
import { listPosts } from "@/lib/server-store";

export const dynamic = "force-dynamic";

export default async function TimelinePage() {
  const cookieStore = await cookies();
  const clientId = cookieStore.get("sassie_client")?.value ?? "server-render";
  const posts = await listPosts(clientId);
  return <TimelineInteractive initialPosts={posts} />;
}