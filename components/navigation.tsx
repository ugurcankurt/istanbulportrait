"use client";

import { Globe, Menu } from "lucide-react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Link, usePathname, useRouter } from "@/i18n/routing";
import { cn } from "@/lib/utils";

const locales = [
  { code: "en", name: "English", flag: "🇬🇧" },
  { code: "ar", name: "العربية", flag: "🇸🇦" },
  { code: "ru", name: "Русский", flag: "🇷🇺" },
  { code: "es", name: "Español", flag: "🇪🇸" },
  { code: "zh", name: "简体中文", flag: "🇨🇳" },
  { code: "fr", name: "Français", flag: "🇫🇷" },
  { code: "de", name: "Deutsch", flag: "🇩🇪" },
  { code: "ro", name: "Română", flag: "🇷🇴" },
];

export function Navigation() {
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

  const navItems = [
    { href: "/" as const, label: t("home") },
    { href: "/packages" as const, label: t("packages") },
    { href: "/locations" as const, label: t("locations") },
    { href: "/blog" as const, label: t("blog") },
    { href: "/about" as const, label: t("about") },
    { href: "/contact" as const, label: t("contact") },
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

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 animate-fade-in-down">
      <div className="container mx-auto flex h-14 sm:h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center w-40 sm:w-48">
          <AspectRatio ratio={15 / 4}>
            <Image
              src={
                mounted && resolvedTheme === "dark"
                  ? "/istanbulportrait_white_logo.webp"
                  : "/istanbulportrait_dark_logo.webp"
              }
              alt="Photographer in Istanbul - Istanbul Photoshoot"
              fill
              sizes="(max-width: 640px) 160px, 192px"
              className="object-contain"
              priority
              suppressHydrationWarning
            />
          </AspectRatio>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-4 lg:space-x-6 text-sm font-medium">
          {navItems.map((item, index) => (
            <div
              key={item.href}
              className="animate-fade-in-down"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <Link
                href={item.href}
                className={cn(
                  "relative transition-all duration-200 hover:text-foreground/80 hover:scale-110",
                  pathname === item.href
                    ? "text-foreground"
                    : "text-foreground/60",
                )}
              >
                {item.label}
                {pathname === item.href && (
                  <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-primary transition-all duration-300" />
                )}
              </Link>
            </div>
          ))}
        </nav>

        <div className="flex items-center space-x-4">
          {/* Language Switcher */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  buttonVariants({ variant: "ghost", size: "sm" }),
                  "h-9 px-2 hover:scale-105 transition-transform duration-200 gap-2"
                )}
                aria-label="Change language"
              >
                <span className="text-lg leading-none">
                  {locales.find((l) => l.code === locale)?.flag || <Globe className="h-4 w-4" />}
                </span>
                <span className="text-xs font-medium uppercase hidden sm:inline-block">
                  {locale}
                </span>
                <span className="sr-only">Change language</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {locales.map((loc) => (
                <DropdownMenuItem
                  key={loc.code}
                  onClick={() => handleLocaleChange(loc.code)}
                  className={cn(
                    "cursor-pointer",
                    locale === loc.code && "bg-accent",
                  )}
                >
                  <span className="mr-2">{loc.flag}</span>
                  {loc.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Mobile Menu */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="md:hidden">
              <button
                className={cn(
                  buttonVariants({ variant: "ghost", size: "sm" }),
                  "h-8 w-8 px-0 relative hover:scale-110 transition-transform duration-200"
                )}
                aria-label="Open menu"
              >
                <div className={cn("transition-transform duration-300", isOpen && "rotate-180")}>
                  <Menu className="h-4 w-4" />
                </div>
                <span className="sr-only">Open menu</span>
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80 p-0">
              <SheetHeader className="p-6 pb-4 bg-muted/30">
                <div className="flex items-center justify-center w-32 mx-auto">
                  <AspectRatio ratio={15 / 4}>
                    <Image
                      src={
                        mounted && resolvedTheme === "dark"
                          ? "/istanbulportrait_white_logo.webp"
                          : "/istanbulportrait_dark_logo.webp"
                      }
                      alt="Best Istanbul photographer - Professional photography services"
                      fill
                      sizes="128px"
                      className="object-contain"
                      suppressHydrationWarning
                    />
                  </AspectRatio>
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
                        "flex items-center px-4 py-4 rounded-lg transition-all duration-200 group hover:scale-[1.02] hover:translate-x-1",
                        pathname === item.href
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "hover:bg-muted/50",
                      )}
                      onClick={() => setIsOpen(false)}
                    >
                      <span className="text-base font-medium">
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
