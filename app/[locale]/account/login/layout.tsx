import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/routing";
import { getServerUser } from "@/lib/auth-server";

export default async function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, locale] = await Promise.all([getServerUser(), getLocale()]);

  // If the user is already logged in, redirect them to the dashboard
  if (user) {
    redirect({ href: "/account/dashboard", locale });
  }

  return <>{children}</>;
}
