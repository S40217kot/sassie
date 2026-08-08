import { redirect } from "next/navigation";
import { TimelineInteractive } from "@/components/timeline-interactive";
import { currentUser } from "@/lib/auth";
import { listUserPosts } from "@/lib/server-store";

export const dynamic = "force-dynamic";

export default async function MyPostsPage() {
  const user = await currentUser();
  if (!user) redirect("/login");

  const posts = await listUserPosts(user.id);
  return (
    <TimelineInteractive
      initialPosts={posts}
      userNickname={user.nickname}
      isAdmin={user.isAdmin}
      pageTitle="自分の投稿"
    />
  );
}
