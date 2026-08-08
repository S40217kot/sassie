import { redirect } from "next/navigation";
import { AdminClient } from "@/components/admin-client";
import { currentUser } from "@/lib/auth";
import { getAdminOverview } from "@/lib/admin-store";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await currentUser();
  if (!user) redirect("/login");
  if (!user.isAdmin) redirect("/");

  return <AdminClient initialData={await getAdminOverview(user)} />;
}
