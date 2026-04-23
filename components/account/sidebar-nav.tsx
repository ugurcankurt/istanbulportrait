"use client";

import { LayoutDashboard, CreditCard } from "lucide-react";
import { Link, usePathname } from "@/i18n/routing";
import { useTranslations } from "next-intl";

export function SidebarNav() {
  const pathname = usePathname();
  const t = useTranslations("account.sidebar");

  const links = [
    { href: "/account/dashboard", label: t("myBookings"), icon: LayoutDashboard },
    { href: "/account/payments", label: t("payments"), icon: CreditCard },
  ];

  return (
    <nav className="flex-1 p-6 space-y-2">
      {links.map((link) => {
        const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
        return (
          <Link 
            key={link.href} 
            href={link.href as any}
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
  );
}
