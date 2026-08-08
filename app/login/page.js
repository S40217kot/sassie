import { redirect } from "next/navigation";
import { AuthClient } from "@/components/auth-client";
import { currentAccounts, currentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }) {
  const params = await searchParams;
  const user = await currentUser();
  if (user && params.switch !== "1") redirect("/");

  return <AuthClient initialAccounts={await currentAccounts()} />;
}
