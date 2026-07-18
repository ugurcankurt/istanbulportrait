import { Link } from "@/i18n/routing";
import { redirect } from "next/navigation";
import { getServerUser } from "@/lib/auth-server";
import { LogOut } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { MobileNav } from "../../../../components/account/mobile-nav";
import { SidebarNav } from "../../../../components/account/sidebar-nav";

import { settingsService } from "@/lib/settings-service";
import Image from "next/image";
import { cn } from "@/lib/utils";

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getServerUser();
  const t = await getTranslations("account.sidebar");
  const settings = await settingsService.getSettings();

  if (!user) {
    redirect("/account/login");
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Mobile Navbar */}
      <div className="md:hidden sticky top-0 z-40 border-b border-border/50 bg-background/80 backdrop-blur-xl p-4 flex items-center justify-between shadow-sm">
        <Link href="/account/dashboard" className="relative flex items-center w-32 h-8 transition-transform hover:opacity-90">
          {settings?.logo_url ? (
            <Image
              src={settings.logo_url}
              alt={settings?.site_name || "Customer Portal"}
              fill
              sizes="128px"
              className={cn("object-contain object-left", settings.logo_dark_url && "dark:hidden")}
            />
          ) : (
            <span className="font-bold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70 dark:hidden">{settings?.site_name || "IstanbulPortrait"}</span>
          )}
          {settings?.logo_dark_url ? (
            <Image
              src={settings.logo_dark_url}
              alt={settings?.site_name || "Customer Portal"}
              fill
              sizes="128px"
              className="object-contain object-left hidden dark:block"
            />
          ) : !settings?.logo_url && (
            <span className="font-bold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70 hidden dark:block">{settings?.site_name || "IstanbulPortrait"}</span>
          )}
        </Link>
        <MobileNav userEmail={user.email || ""} settings={settings} />
      </div>

      <div className="flex flex-col md:flex-row min-h-screen">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex w-72 flex-col border-r border-border/50 bg-background/50 backdrop-blur-xl sticky top-0 h-screen">
          <div className="p-8 border-b border-border/50">
            <Link href="/account/dashboard" className="relative flex items-center w-48 h-10 transition-transform hover:opacity-90">
              {settings?.logo_url ? (
                <Image
                  src={settings.logo_url}
                  alt={settings?.site_name || "Customer Portal"}
                  fill
                  sizes="192px"
                  className={cn("object-contain object-left", settings.logo_dark_url && "dark:hidden")}
                  priority
                />
              ) : (
                <span className="font-bold text-2xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70 dark:hidden">{settings?.site_name || "IstanbulPortrait"}</span>
              )}
              {settings?.logo_dark_url ? (
                <Image
                  src={settings.logo_dark_url}
                  alt={settings?.site_name || "Customer Portal"}
                  fill
                  sizes="192px"
                  className="object-contain object-left hidden dark:block"
                  priority
                />
              ) : !settings?.logo_url && (
                <span className="font-bold text-2xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70 hidden dark:block">{settings?.site_name || "IstanbulPortrait"}</span>
              )}
            </Link>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mt-2">{t("portal")}</p>
          </div>

          <SidebarNav />

          <div className="p-6 border-t border-border/50 bg-secondary/10 mt-auto">
            <div className="mb-4 px-3">
              <p className="text-sm font-semibold truncate text-foreground/80">{user.email}</p>
            </div>
            <form action="/api/account/logout" method="POST">
              <button type="submit" className="flex w-full items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10 hover:text-destructive transition-all">
                <LogOut className="w-5 h-5" />
                <span>{t("logout")}</span>
              </button>
            </form>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="p-4 md:p-8 lg:p-12 max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
