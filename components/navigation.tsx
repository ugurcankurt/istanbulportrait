"use client";

import { Globe, Menu } from "lucide-react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { usePathname, useRouter } from "@/i18n/routing";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";

const locales = [
  { code: "en", name: "English", flag: "🇬🇧" },
  { code: "ar", name: "العربية", flag: "🇸🇦" },
  { code: "ru", name: "Русский", flag: "🇷🇺" },
  { code: "es", name: "Español", flag: "🇪🇸" },
  { code: "zh", name: "简体中文", flag: "🇨🇳" },
  { code: "fr", name: "Français", flag: "🇫🇷" },
  { code: "de", name: "Deutsch", flag: "🇩🇪" },
  { code: "ro", name: "Română", flag: "🇷🇴" },
  { code: "tr", name: "Türkçe", flag: "🇹🇷" },
];

interface NavigationProps {
  dynamicNavData?: Record<string, { path: string; title: string | null }>;
  settings?: any;
}

export function Navigation({ dynamicNavData = {}, settings }: NavigationProps) {
  const t = useTranslations("nav");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const params = useParams();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme } = useTheme();

  // Prevent hydration mismatch by waiting for client-side mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // Helper logic to accurately detect multi-language active states
  const isLinkActive = (href: string) => {
    // pathname omits locale in next-intl (e.g. "/" or "/blog/post")
    const currentFullPath = pathname === "/" ? `/${locale}` : `/${locale}${pathname}`;
    // Exact match for the Home page
    if (href === `/${locale}`) {
      return currentFullPath === href;
    }
    // Exact match or sub-route (e.g. /tr/blog matching /tr/blog/hello)
    return currentFullPath === href || currentFullPath.startsWith(`${href}/`);
  };

  const navItems = [
    { href: `/${locale}`, label: t("home") },
    { href: `/${locale}/${dynamicNavData.packages?.path || "packages"}`, label: dynamicNavData.packages?.title || t("packages") },
    { href: `/${locale}/${dynamicNavData.locations?.path || "locations"}`, label: dynamicNavData.locations?.title || t("locations") },
    { href: `/${locale}/${dynamicNavData.blog?.path || "blog"}`, label: dynamicNavData.blog?.title || t("blog") },
    { href: `/${locale}/${dynamicNavData.about?.path || "about"}`, label: dynamicNavData.about?.title || t("about") },
    { href: `/${locale}/${dynamicNavData.contact?.path || "contact"}`, label: dynamicNavData.contact?.title || t("contact") },
  ];

  const handleLocaleChange = (newLocale: string) => {
    // Handle locale change by refreshing with new locale
    // For dynamic routes, use window.location to preserve params
    if (pathname.includes("[")) {
      window.location.href = `/${newLocale}${window.location.pathname.replace(/^\/[a-z]{2}/, "")}`;
    } else {
      router.push(pathname as any, { locale: newLocale });
    }
  };

  const [isLangOpen, setIsLangOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 sm:h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href={`/${locale}`} className="relative flex items-center w-36 h-10 sm:w-48 sm:h-12 transition-transform hover:opacity-90">
          {settings?.logo_url ? (
            <Image
              src={settings.logo_url}
              alt={settings?.site_name || "Istanbul Photographer"}
              fill
              sizes="(max-width: 640px) 144px, 192px"
              className={cn("object-contain object-left", settings.logo_dark_url && "dark:hidden")}
              priority
            />
          ) : (
            <span className="text-xl font-bold dark:hidden tracking-tight">{settings?.site_name || "Istanbul Portrait"}</span>
          )}
          {settings?.logo_dark_url ? (
            <Image
              src={settings.logo_dark_url}
              alt={settings?.site_name || "Istanbul Photographer"}
              fill
              sizes="(max-width: 640px) 144px, 192px"
              className="object-contain object-left hidden dark:block"
              priority
            />
          ) : !settings?.logo_url && (
            <span className="text-xl font-bold hidden dark:block tracking-tight">{settings?.site_name || "Istanbul Portrait"}</span>
          )}
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-4 lg:space-x-6 text-sm font-medium">
          {navItems.map((item, index) => (
            <div
              key={item.href}
              className=""
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <Link
                href={item.href as any}
                className={cn(
                  "relative transition-all duration-200 hover:text-foreground/80 hover:scale-110",
                  isLinkActive(item.href as string)
                    ? "text-foreground"
                    : "text-foreground/60",
                )}
              >
                {item.label}
                {isLinkActive(item.href as string) && (
                  <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-primary transition-all duration-300" />
                )}
              </Link>
            </div>
          ))}
        </nav>

        <div className="flex items-center space-x-2">
          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Language Switcher Modal */}
          <Dialog open={isLangOpen} onOpenChange={setIsLangOpen}>
            <DialogTrigger
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "h-9 px-3 hover:bg-muted/50 hover:scale-105 active:scale-95 transition-all duration-200 gap-2 border border-transparent hover:border-border/50",
              )}
              aria-label="Change language"
            >
              <span className="text-lg leading-none">
                {locales.find((l) => l.code === locale)?.flag || (
                  <Globe className="h-4 w-4" />
                )}
              </span>
              <span className="text-xs font-medium uppercase hidden sm:inline-block">
                {locale}
              </span>
              <span className="sr-only">Change language</span>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-center sm:text-left flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  {t("selectLanguage") || "Select Language"}
                </DialogTitle>
                <DialogDescription className="text-center sm:text-left">
                  {t("selectLanguageDescription") ||
                    "Choose your preferred language to explore Istanbul Portrait."}
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-2 pt-4">
                {locales.map((loc) => (
                  <Button
                    key={loc.code}
                    variant={locale === loc.code ? "default" : "outline"}
                    className={cn(
                      "justify-start gap-3 h-12 px-4 transition-all duration-200",
                      locale === loc.code
                        ? "bg-primary shadow-md hover:bg-primary/90"
                        : "hover:bg-muted/50 hover:scale-[1.02] active:scale-[0.98]",
                    )}
                    onClick={() => {
                      handleLocaleChange(loc.code);
                      setIsLangOpen(false);
                    }}
                  >
                    <span className="text-xl leading-none">{loc.flag}</span>
                    <span className="font-medium">{loc.name}</span>
                  </Button>
                ))}
              </div>
            </DialogContent>
          </Dialog>

          {/* Mobile Menu */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "md:hidden h-8 w-8 px-0 relative hover:scale-110 transition-transform duration-200",
              )}
              aria-label="Open menu"
            >
              <div
                className={cn(
                  "transition-transform duration-300",
                  isOpen && "rotate-180",
                )}
              >
                <Menu className="h-4 w-4" />
              </div>
              <span className="sr-only">Open menu</span>
            </SheetTrigger>
            <SheetContent side="right" className="w-80 p-0">
              <SheetHeader className="p-6 pb-4 bg-muted/30">
                <div className="relative flex items-center justify-center w-32 h-10 mx-auto">
                  {settings?.logo_url ? (
                    <Image
                      src={settings.logo_url}
                      alt={settings?.site_name || "Istanbul Photographer"}
                      fill
                      sizes="128px"
                      className={cn("object-contain", settings.logo_dark_url && "dark:hidden")}
                    />
                  ) : (
                    <span className="text-lg font-bold dark:hidden tracking-tight">{settings?.site_name || "Istanbul Portrait"}</span>
                  )}
                  {settings?.logo_dark_url ? (
                    <Image
                      src={settings.logo_dark_url}
                      alt={settings?.site_name || "Istanbul Photographer"}
                      fill
                      sizes="128px"
                      className="object-contain hidden dark:block"
                    />
                  ) : !settings?.logo_url && (
                    <span className="text-lg font-bold hidden dark:block tracking-tight">{settings?.site_name || "Istanbul Portrait"}</span>
                  )}
                  <SheetTitle className="sr-only">
                    Istanbul Photographer
                  </SheetTitle>
                  <SheetDescription className="sr-only">
                    Navigation menu
                  </SheetDescription>
                </div>
              </SheetHeader>

              <nav className="flex flex-col p-6 space-y-2">
                {navItems.map((item, index) => (
                  <div
                    key={item.href}
                    className="animate-slide-in-right"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center px-5 py-4 rounded-md transition-all duration-300 group hover:scale-[1.03] active:scale-[0.98] hover:translate-x-2",
                        isLinkActive(item.href as string)
                          ? "bg-primary text-primary-foreground shadow-md"
                          : "hover:bg-muted/60 text-foreground/90",
                      )}
                      onClick={() => setIsOpen(false)}
                    >
                      <span className="text-lg font-semibold tracking-tight">
                        {item.label}
                      </span>
                    </Link>
                  </div>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
