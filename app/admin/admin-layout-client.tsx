"use client";

import {
  BookOpen,
  Calendar,
  Camera,
  CreditCard,
  LayoutDashboard,
  Loader2,
  LogOut,
  Users,
  Bell,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { useAuthStore } from "@/stores/auth-store";

interface AdminLayoutClientProps {
  children: React.ReactNode;
}

const navigation = [
  {
    name: "Dashboard",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Bookings",
    href: "/admin/dashboard/bookings",
    icon: Calendar,
  },
  {
    name: "Customers",
    href: "/admin/dashboard/customers",
    icon: Users,
  },
  {
    name: "Payments",
    href: "/admin/dashboard/payments",
    icon: CreditCard,
  },
  {
    name: "Blog",
    href: "/admin/dashboard/blog",
    icon: BookOpen,
  },
  {
    name: "Notifications",
    href: "/admin/dashboard/notifications",
    icon: Bell,
  },
];

export function AdminLayoutClient({ children }: AdminLayoutClientProps) {
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
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
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
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <Sidebar variant="inset" collapsible="offcanvas">
          <SidebarHeader className="border-b">
            <Link
              href="/admin/dashboard"
              className="flex items-center space-x-2 p-2"
            >
              <Camera className="w-8 h-8 text-blue-600" />
              <span className="font-bold text-xl">Istanbul Photographer</span>
            </Link>
          </SidebarHeader>

          <SidebarContent>
            <SidebarMenu>
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.name}
                    >
                      <Link href={item.href as string}>
                        <item.icon className="w-5 h-5" />
                        <span>{item.name}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
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
  );
}
