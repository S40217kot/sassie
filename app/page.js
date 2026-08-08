import { redirect } from "next/navigation";
import { TimelineInteractive } from "@/components/timeline-interactive";
import { currentUser } from "@/lib/auth";
import { listPosts } from "@/lib/server-store";

export const dynamic = "force-dynamic";

export default async function TimelinePage() {
  const user = await currentUser();
  if (!user) redirect("/login");

  const posts = await listPosts(user.id);
  return <TimelineInteractive initialPosts={posts} userNickname={user.nickname} isAdmin={user.isAdmin} />;
}
