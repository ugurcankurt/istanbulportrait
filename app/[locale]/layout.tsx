import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { Geist, Geist_Mono } from "next/font/google";
import { GoogleAnalytics } from '@/components/analytics/google-analytics'
import "../globals.css";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { StructuredData } from "@/components/seo/structured-data";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "seo.home" });

  return {
    metadataBase: new URL("https://istanbulportrait.com"),
    title: t("title"),
    description: t("description"),
    keywords:
      "istanbul photographer, istanbul photoshoot, istanbul rooftop photoshoot, portrait photographer istanbul, couple photography istanbul",
    authors: [{ name: "Istanbul Photographer" }],
    publisher: "istanbulportrait.com",
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    alternates: {
      canonical: `https://istanbulportrait.com/${locale}`,
      languages: {
        en: "/en",
        ar: "/ar",
        ru: "/ru",
        es: "/es",
      },
    },
    openGraph: {
      title: t("title"),
      description: t("description"),
      images: ["/og-image.jpg"],
      locale: locale,
      type: "website",
      url: `https://istanbulportrait.com/${locale}`,
      siteName: "Istanbul Portrait",
    },
    twitter: {
      card: "summary_large_image",
      title: t("title"),
      description: t("description"),
      images: ["/og-image.jpg"],
      creator: "@istanbulportrait",
      site: "@istanbulportrait",
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      dir={locale === "ar" ? "rtl" : "ltr"}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <NextIntlClientProvider messages={messages}>
            <div className="flex min-h-screen flex-col">
              <Navigation />
              <main className="flex-1">{children}</main>
              <GoogleAnalytics />
              <Footer />
            </div>
            <Toaster />
            <StructuredData type="website" />
            <StructuredData type="organization" />
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
