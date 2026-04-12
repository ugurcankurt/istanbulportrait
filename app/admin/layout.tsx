import { DM_Sans, Figtree, Geist_Mono } from "next/font/google";
import { AdminLayoutClient } from "./admin-layout-client";
import "../globals.css";

const fontHeading = DM_Sans({
  variable: "--font-heading",
  subsets: ["latin"],
});

const fontSans = Figtree({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});



export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${fontSans.variable} ${fontHeading.variable} ${geistMono.variable}`}
      suppressHydrationWarning
    >
      <body className="antialiased min-h-screen bg-background font-sans">
        <AdminLayoutClient>{children}</AdminLayoutClient>
      </body>
    </html>
  );
}
