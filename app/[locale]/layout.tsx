import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Geist, Geist_Mono } from "next/font/google";
import { FacebookPixel } from "@/components/analytics/facebook-pixel";
import { GoogleAnalytics } from "@/components/analytics/google-analytics";
import { CoreWebVitals } from "@/components/analytics/core-web-vitals";
import { MultilingualCookieConsent } from "@/components/analytics/multilingual-cookie-consent";
import { YandexMetrica } from "@/components/analytics/yandex-metrica";
import { SEO_CONFIG } from "@/lib/seo-config";
import "../globals.css";
import { ThemeProvider } from "next-themes";
import { Footer } from "@/components/footer";
import { Navigation } from "@/components/navigation";
import { Toaster } from "@/components/ui/sonner";
import { WhatsAppButton } from "@/components/whatsapp-button";

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

  const baseUrl = SEO_CONFIG.site.url;

  return {
    metadataBase: new URL(baseUrl),
    title: t("title"),
    description: t("description"),
    keywords: SEO_CONFIG.seo.keywords.join(", "),
    authors: [{ name: SEO_CONFIG.person.name, url: baseUrl }],
    publisher: "istanbulportrait.com",
    category: "Photography Services",
    robots: {
      ...SEO_CONFIG.seo.robotsDirectives,
      googleBot: {
        ...SEO_CONFIG.seo.robotsDirectives,
        noimageindex: false,
        noarchive: false,
        nocache: false,
      },
    },
    alternates: {
      canonical: `${baseUrl}/${locale}`,
      languages: {
        en: `${baseUrl}/en`,
        ar: `${baseUrl}/ar`,
        ru: `${baseUrl}/ru`,
        es: `${baseUrl}/es`,
      },
    },
    openGraph: {
      title: t("title"),
      description: t("description"),
      images: [
        {
          url: `${baseUrl}/og-image.jpg`,
          width: 1200,
          height: 630,
          alt: `${t("title")} | Professional Photography Services in Istanbul`,
          type: "image/jpeg",
        },
      ],
      locale: locale,
      type: "website",
      url: `${baseUrl}/${locale}`,
      siteName: SEO_CONFIG.organization.name,
      countryName: "Turkey",
    },
    twitter: {
      card: "summary_large_image",
      title: t("title"),
      description: t("description"),
      images: [
        {
          url: `${baseUrl}/og-image.jpg`,
          alt: `${t("title")} - Professional Photography Services in Istanbul`,
        },
      ],
      creator: "@istanbulportrait",
      site: "@istanbulportrait",
    },
    icons: {
      icon: [
        {
          url: "/favicon.ico",
          sizes: "48x48",
          type: "image/x-icon",
        },
        {
          url: "/icon1.png",
          sizes: "96x96",
          type: "image/png",
        },
        {
          url: "/icon0.svg",
          sizes: "any",
          type: "image/svg+xml",
        },
      ],
      apple: [
        {
          url: "/apple-icon.png",
          sizes: "180x180",
          type: "image/png",
        },
      ],
    },
    manifest: "/manifest.json",
    other: {
      "yandex-verification": "326ca03cbdc0e2bf",
      "msvalidate.01": process.env.BING_WEBMASTER_KEY || "",
      y_key: process.env.YANDEX_WEBMASTER_KEY || "",
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
      <head>
        <link
          rel="preload"
          as="image"
          href="/istanbul_photographer.jpg"
          fetchPriority="high"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
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
              <FacebookPixel />
              <YandexMetrica />
              <CoreWebVitals />
              <Footer />

              {/* GetYourGuide Analytics */}
              <Script
                src="https://widget.getyourguide.com/dist/pa.umd.production.min.js"
                strategy="lazyOnload"
                data-gyg-partner-id="S6XXHTA"
              />
            </div>
            <Toaster />
            <MultilingualCookieConsent />
            <WhatsAppButton phoneNumber="+905367093724" />
          </NextIntlClientProvider>
        </ThemeProvider>
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
