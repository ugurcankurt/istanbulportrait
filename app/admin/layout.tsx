import type { Metadata } from "next";
import {
  Cormorant_Garamond,
  Geist_Mono,
  Plus_Jakarta_Sans,
} from "next/font/google";
import { ThemeProvider } from "next-themes";
import { settingsService } from "@/lib/settings-service";
import { AdminLayoutClient } from "./admin-layout-client";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: "Admin Portal | Istanbul Portrait",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

const fontHeading = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin", "latin-ext"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

const fontSans = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin", "latin-ext"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await settingsService.getSettings();
  const publicSettings = settingsService.toPublicSettings(settings);

  return (
    <html
      lang="en"
      className={`${fontSans.variable} ${fontHeading.variable} ${geistMono.variable} theme-${settings.theme_color || "bronze"}`}
      suppressHydrationWarning
    >
      <body className="antialiased min-h-screen bg-background font-sans">
        <ThemeProvider
          attribute="class"
          defaultTheme={settings.color_mode || "system"}
          enableSystem
          disableTransitionOnChange
        >
          <AdminLayoutClient settings={publicSettings}>
            {children}
          </AdminLayoutClient>
        </ThemeProvider>
      </body>
    </html>
  );
}
