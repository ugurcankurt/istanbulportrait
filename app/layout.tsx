import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Geist, Geist_Mono } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Istanbul Photographer",
  description: "Professional Photography Services in Istanbul-Türkiye",
};

// Helper function to detect locale from pathname or headers
async function detectLocale(): Promise<string> {
  // Default fallback locale
  return "en";
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await detectLocale();

  // Get messages for error pages - provide fallback empty object
  let messages: any;
  try {
    messages = await getMessages({ locale });
  } catch (_error) {
    // Fallback messages for error pages
    messages = {
      notfound: {
        title: "Page Not Found",
        subtitle: "Oops! This photography session seems to be missing",
        description: "The page you're looking for doesn't exist.",
        homeButton: "Return Home",
        packagesButton: "View Packages",
        goBack: "Go Back",
      },
    };
  }

  return (
    <html
      lang={locale}
      dir={locale === "ar" ? "rtl" : "ltr"}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
          <SpeedInsights />
          <Analytics />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
