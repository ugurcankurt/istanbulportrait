import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { CoreWebVitals } from "@/components/analytics/core-web-vitals";
import { FacebookPixel } from "@/components/analytics/facebook-pixel";
import { GoogleAnalytics } from "@/components/analytics/google-analytics";
import { GoogleTag } from "@/components/analytics/google-tag";
import { MicrosoftClarity } from "@/components/analytics/microsoft-clarity";
import { MultilingualCookieConsent } from "@/components/analytics/multilingual-cookie-consent";
import { YandexMetrica } from "@/components/analytics/yandex-metrica";
import { ConsentGate } from "@/components/consent-gate";
import { ConsentProvider } from "@/contexts/consent-context";
import { SEO_CONFIG } from "@/lib/seo-config";
import {
  createSchemaConfig,
  generateWebSiteSchema,
  JsonLd,
} from "@/lib/structured-data";
import "../globals.css";
import { ThemeProvider } from "next-themes";
import { Footer } from "@/components/footer";
import { Navigation } from "@/components/navigation";
import { Toaster } from "@/components/ui/sonner";
import dynamic from "next/dynamic";
const WhatsAppButton = dynamic(
  () => import("@/components/whatsapp-button").then((mod) => mod.WhatsAppButton)
);

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
  width: "device-width",
  initialScale: 1,
};

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
    keywords: t("keywords"),
    authors: [{ name: SEO_CONFIG.person.name, url: baseUrl }],
    publisher: "istanbulportrait.com",
    category: "Photography Services",
    robots: {
      ...SEO_CONFIG.seo.robotsDirectives,
      googleBot: {
        ...SEO_CONFIG.seo.robotsDirectives,
        noimageindex: false,
      },
    },
    alternates: {
      canonical: `${baseUrl}/${locale}`,
    },
    openGraph: {
      title: t("title"),
      description: t("description"),
      images: [
        {
          url: `${baseUrl}/og-image.webp`,
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
      countryName: "Türkiye",
    },
    twitter: {
      card: "summary_large_image",
      title: t("title"),
      description: t("description"),
      images: [
        {
          url: `${baseUrl}/og-image.webp`,
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
          url: "/icon1.webp",
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
          url: "/apple-icon.webp",
          sizes: "180x180",
          type: "image/png",
        },
      ],
    },
    manifest: "/manifest.json",
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: "Istanbul Portrait",
    },
    formatDetection: {
      telephone: false,
    },
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
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        {/* Google Consent Mode v2 Default State - MUST be first before any analytics */}
        <Script
          id="google-consent-default"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('consent', 'default', {
                'analytics_storage': 'denied',
                'ad_storage': 'denied',
                'ad_user_data': 'denied',
                'ad_personalization': 'denied',
                'functionality_storage': 'granted',
                'security_storage': 'granted',
                'wait_for_update': 500
              });
            `,
          }}
        />
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <ConsentProvider>
            <NextIntlClientProvider messages={messages}>
              {/* WebSite Schema for AI Overview & Sitelinks Search Box */}
              <JsonLd data={generateWebSiteSchema(createSchemaConfig(locale))} />

              <div className="flex min-h-screen flex-col">
                {/* PaymentBanner removed as per user request */}
                <Navigation />
                <main className="flex-1">{children}</main>

                {/* Analytics - Google Tag loads on all pages (Advanced Consent Mode) */}
                <GoogleTag />

                {/* Analytics - Only load after user consent */}
                <ConsentGate consent="accepted_all">
                  <GoogleAnalytics />
                  <FacebookPixel />
                  <YandexMetrica />
                  <MicrosoftClarity />
                </ConsentGate>

                <CoreWebVitals />
                <Footer />

                {/* GetYourGuide Analytics */}
                <Script
                  src="https://widget.getyourguide.com/dist/pa.umd.production.min.js"
                  strategy="lazyOnload"
                  data-gyg-partner-id="S6XXHTA"
                />
              </div >
              <Toaster />
              <MultilingualCookieConsent />
              <WhatsAppButton phoneNumber="+905367093724" />
            </NextIntlClientProvider >
          </ConsentProvider >
        </ThemeProvider >
        <SpeedInsights />
        <Analytics />
      </body >
    </html >
  );
}
