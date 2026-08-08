import { redirect } from "next/navigation";
import { ServerCreateClientV2 } from "@/components/server-create-client-v2";
import { currentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function CreatePage() {
  if (!await currentUser()) redirect("/login");
  return <ServerCreateClientV2 />;
}
