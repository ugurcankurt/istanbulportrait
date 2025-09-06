import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { GoogleAnalytics } from "@/components/analytics/google-analytics";
import { MultilingualCookieConsent } from "@/components/analytics/multilingual-cookie-consent";
import { FacebookPixel } from "@/components/analytics/facebook-pixel";
import "../globals.css";
import { ThemeProvider } from "next-themes";
import { Footer } from "@/components/footer";
import { Navigation } from "@/components/navigation";
import { StructuredData } from "@/components/seo/structured-data";
import { Toaster } from "@/components/ui/sonner";
import { WhatsAppButton } from "@/components/whatsapp-button";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "seo.home" });

  const baseUrl = "https://istanbulportrait.com";

  return {
    metadataBase: new URL(baseUrl),
    title: t("title"),
    description: t("description"),
    keywords:
      "istanbul photographer, istanbul photoshoot, istanbul rooftop photoshoot, portrait photographer istanbul, couple photography istanbul, professional photographer istanbul, wedding photographer istanbul",
    authors: [
      { name: "Istanbul Photographer Professional Photographer", url: baseUrl },
    ],
    publisher: "istanbulportrait.com",
    category: "Photography Services",
    robots: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-video-preview": -1,
      "max-snippet": -1,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
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
      siteName: "Istanbul Photographer",
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
    other: { "yandex-verification": "326ca03cbdc0e2bf",}
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: _locale } = await params;
  const messages = await getMessages();

  return (
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
          <Footer />
        </div>
        <Toaster />
        <MultilingualCookieConsent />
        <WhatsAppButton phoneNumber="+905367093724" />
        <StructuredData type="website" />
        <StructuredData type="organization" />
        <StructuredData type="localbusiness" />

        <StructuredData type="person" />
      </NextIntlClientProvider>
    </ThemeProvider>
  );
}
