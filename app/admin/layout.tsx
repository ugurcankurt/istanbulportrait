import { Outfit, Geist_Mono, Playfair_Display } from "next/font/google";
import { AdminLayoutClient } from "./admin-layout-client";
import { settingsService } from "@/lib/settings-service";
import "../globals.css";

import { ThemeProvider } from "next-themes";

const fontHeading = Playfair_Display({
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
      className={`${fontSans.variable} ${fontHeading.variable} ${geistMono.variable} theme-${settings.theme_color || "violet"}`}
      suppressHydrationWarning
    >
      <body className="antialiased min-h-screen bg-background font-sans">
        <ThemeProvider
          attribute="class"
          defaultTheme={settings.color_mode || 'system'}
          enableSystem
          disableTransitionOnChange
        >
          <AdminLayoutClient settings={settings}>{children}</AdminLayoutClient>
        </ThemeProvider>
      </body>
    </html>
  );
}
