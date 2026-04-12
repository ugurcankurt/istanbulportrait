import { Outfit, Geist_Mono } from "next/font/google";
import { AdminLayoutClient } from "./admin-layout-client";
import { settingsService } from "@/lib/settings-service";
import "../globals.css";

const fontHeading = Outfit({
  variable: "--font-heading",
  subsets: ["latin"],
});

const fontSans = Outfit({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});



export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await settingsService.getSettings();

  return (
    <html
      lang="en"
      className={`${fontSans.variable} ${fontHeading.variable} ${geistMono.variable}`}
      suppressHydrationWarning
    >
      <body className="antialiased min-h-screen bg-background font-sans">
        <AdminLayoutClient settings={settings}>{children}</AdminLayoutClient>
      </body>
    </html>
  );
}
