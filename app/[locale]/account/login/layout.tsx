import { getServerUser } from "@/lib/auth-server";
import { redirect } from "next/navigation";

export default async function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getServerUser();

  // If the user is already logged in, redirect them to the dashboard
  if (user) {
    redirect("/account/dashboard");
  }

  return <>{children}</>;
}
