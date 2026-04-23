"use client";

import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetHeader } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, LayoutDashboard, CreditCard, LogOut } from "lucide-react";
import { Link } from "@/i18n/routing";
import { usePathname } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { cn } from "@/lib/utils";

export function MobileNav({ userEmail, settings }: { userEmail: string; settings?: any }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const t = useTranslations("account.sidebar");

  const links = [
    { href: "/account/dashboard", label: t("myBookings"), icon: LayoutDashboard },
    { href: "/account/payments", label: t("payments"), icon: CreditCard },
  ];

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger className="md:hidden">
        <div className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-secondary/50 hover:text-accent-foreground h-9 w-9">
          <Menu className="w-6 h-6" />
          <span className="sr-only">Toggle Menu</span>
        </div>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0 flex flex-col bg-card border-r border-border/50">
        <SheetHeader className="p-6 border-b border-border/50 text-left">
          <SheetTitle>
            <div className="relative flex items-center w-40 h-8 mt-2">
              {settings?.logo_url ? (
                <Image
                  src={settings.logo_url}
                  alt={settings?.site_name || "Customer Portal"}
                  fill
                  sizes="160px"
                  className={cn("object-contain object-left", settings.logo_dark_url && "dark:hidden")}
                  priority
                />
              ) : (
                <span className="font-bold text-xl tracking-tight dark:hidden">{settings?.site_name || "IstanbulPortrait"}</span>
              )}
              {settings?.logo_dark_url ? (
                <Image
                  src={settings.logo_dark_url}
                  alt={settings?.site_name || "Customer Portal"}
                  fill
                  sizes="160px"
                  className="object-contain object-left hidden dark:block"
                  priority
                />
              ) : !settings?.logo_url && (
                <span className="font-bold text-xl tracking-tight hidden dark:block">{settings?.site_name || "IstanbulPortrait"}</span>
              )}
            </div>
          </SheetTitle>
          <p className="text-xs text-muted-foreground mt-1">{t("portal")}</p>
        </SheetHeader>
        
        <nav className="flex-1 p-4 space-y-2">
          {links.map((link) => {
            const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link 
                key={link.href} 
                href={link.href as any}
                onClick={() => setOpen(false)}
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  isActive 
                    ? 'bg-primary/10 text-primary shadow-sm' 
                    : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground'
                }`}
              >
                <link.icon className={`w-5 h-5 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border/50 bg-secondary/20">
          <div className="mb-4 px-4">
            <p className="text-sm font-medium truncate text-foreground/80">{userEmail}</p>
          </div>
          <form action="/api/account/logout" method="POST">
            <button 
              type="submit" 
              className="flex w-full items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10 hover:text-destructive transition-all"
            >
              <LogOut className="w-5 h-5" />
              <span>{t("logout")}</span>
            </button>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
}
