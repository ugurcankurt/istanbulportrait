"use client";
import { Spinner } from "@/components/ui/spinner";

import {
  BookOpen,
  Calendar,
  LayoutDashboard,
  LogOut,
  Package,
  Users,
  FileText,
  MapPin,
  Settings,
  TicketPercent,
  Ticket,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuthStore } from "@/stores/auth-store";

interface AdminLayoutClientProps {
  children: React.ReactNode;
  settings?: any;
}

const navigationGroups = [
  {
    title: "Overview",
    items: [
      { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    title: "Operations",
    items: [
      { name: "Bookings", href: "/admin/dashboard/bookings", icon: Calendar },
      { name: "Customers", href: "/admin/dashboard/customers", icon: Users },
      { name: "Availability", href: "/admin/dashboard/availability", icon: Calendar },
    ],
  },
  {
    title: "Sales & Catalog",
    items: [
      { name: "Packages", href: "/admin/dashboard/packages", icon: Package },
      { name: "Discounts", href: "/admin/dashboard/discounts", icon: TicketPercent },
      { name: "Promo Codes", href: "/admin/dashboard/promo-codes", icon: Ticket },
    ],
  },
  {
    title: "Content",
    items: [
      { name: "Blog", href: "/admin/dashboard/blog", icon: BookOpen },
      { name: "Pages", href: "/admin/dashboard/pages", icon: FileText },
      { name: "Locations", href: "/admin/dashboard/locations", icon: MapPin },
    ],
  },
  {
    title: "System",
    items: [
      { name: "Settings", href: "/admin/dashboard/settings", icon: Settings },
    ],
  },
];

export function AdminLayoutClient({ children, settings }: AdminLayoutClientProps) {
  const {
    user,
    isAuthenticated,
    isAdminUser,
    loading,
    error,
    checkAuth,
    signOut,
    clearError,
  } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Skip auth check for login page
    if (pathname === "/admin/login") {
      return;
    }

    // Check auth only once on mount if needed
    if (!user && !loading && !isAuthenticated) {
      checkAuth();
      return;
    }

    // If auth check is complete and user is not authenticated/admin, redirect
    if (!loading && (!isAuthenticated || !isAdminUser)) {
      router.push("/admin/login");
    }
  }, [
    pathname,
    user,
    isAuthenticated,
    isAdminUser,
    loading,
    checkAuth,
    router,
  ]);

  const handleLogout = async () => {
    try {
      await signOut();
      router.push("/admin/login");
    } catch (_error) {
      // Silent error handling for production
    }
  };

  // Skip layout for login page
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Spinner className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-sm text-muted-foreground">Verifying access...</p>
        </div>
      </div>
    );
  }

  // Show error state if there's an auth error
  if (error && !loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button
            onClick={() => {
              clearError();
              router.push("/admin/login");
            }}
          >
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  if (!user || !isAuthenticated || !isAdminUser) {
    return null;
  }

  return (
    <TooltipProvider>
      <SidebarProvider>
        <div className="flex h-screen w-full">
          <Sidebar variant="inset" collapsible="offcanvas">
            <SidebarHeader className="border-b">
              <Link
                href="/admin/dashboard"
                className="flex items-center space-x-2 p-2 relative h-12 w-full max-w-[180px]"
              >
                <Image
                  src={
                    settings?.logo_url
                  }
                  alt={settings?.site_name || "Istanbul Photographer"}
                  fill
                  className="object-contain object-left"
                  priority
                />
              </Link>
            </SidebarHeader>

            <SidebarContent>
              {navigationGroups.map((group) => (
                <SidebarGroup key={group.title}>
                  <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {group.items.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                          <SidebarMenuItem key={item.href}>
                            <SidebarMenuButton
                              isActive={isActive}
                              tooltip={item.name}
                              render={
                                <Link href={item.href as string}>
                                  <item.icon className="w-5 h-5" />
                                  <span>{item.name}</span>
                                </Link>
                              }
                            />
                          </SidebarMenuItem>
                        );
                      })}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
              ))}
            </SidebarContent>

            <SidebarFooter className="border-t">
              <div className="p-2 space-y-2">
                <div className="text-sm">
                  <p className="font-medium text-sidebar-foreground truncate">
                    {user.email?.split("@")[0]}
                  </p>
                  <p className="text-sidebar-foreground/70 text-xs truncate">
                    {user.email}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="w-full justify-start"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign out
                </Button>
              </div>
            </SidebarFooter>
          </Sidebar>

          <SidebarInset className="flex-1">
            {/* Mobile header with trigger */}
            <div className="flex h-16 items-center justify-between border-b bg-background px-4 md:px-6">
              <div className="flex items-center gap-2">
                <SidebarTrigger className="md:hidden" />
                <h1 className="text-lg font-semibold">Admin Panel</h1>
              </div>
            </div>

            {/* Main content */}
            <main className="flex-1 overflow-auto">
              <div className="p-6">{children}</div>
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </TooltipProvider>
  );
}
