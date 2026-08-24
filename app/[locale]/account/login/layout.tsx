import { redirect } from "next/navigation";
import { getServerUser } from "@/lib/auth-server";

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
