import { AdminLayoutClient } from "./admin-layout-client";
import "../globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Dashboard - Istanbul Photographer",
  description: "Admin dashboard for managing bookings and content",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased min-h-screen bg-background font-sans">
        <AdminLayoutClient>{children}</AdminLayoutClient>
      </body>
    </html>
  );
}
