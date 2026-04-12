import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { DM_Sans, Figtree, Geist_Mono } from "next/font/google";
import Script from "next/script";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { CoreWebVitals } from "@/components/analytics/core-web-vitals";
import { FacebookPixel } from "@/components/analytics/facebook-pixel";
import { InteractionLoader } from "@/components/analytics/interaction-loader";
import { YandexMetrica } from "@/components/analytics/yandex-metrica";
import { ConsentGate } from "@/components/consent-gate";
import { ConsentProvider } from "@/contexts/consent-context";
import "../globals.css";
import dynamic from "next/dynamic";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Metadata } from "next";
import { SchemaInjector } from "@/components/schema-injector";
import { buildLocalBusinessSchema, constructOpenGraph } from "@/lib/seo-utils";

const WhatsAppButton = dynamic(() =>
  import("@/components/whatsapp-button").then((mod) => mod.WhatsAppButton),
);

const Navigation = dynamic(() =>
  import("@/components/navigation").then((mod) => mod.Navigation)
);
const Footer = dynamic(() =>
  import("@/components/footer").then((mod) => mod.Footer)
);
const DeferredAnalytics = dynamic(() =>
  import("@/components/analytics/deferred-analytics").then((mod) => mod.DeferredAnalytics)
);
const DeferredCookieConsent = dynamic(() =>
  import("@/components/analytics/deferred-analytics").then((mod) => mod.DeferredCookieConsent)
);

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
}): Promise<Metadata> {
  const { locale } = await params;
  const { settingsService } = await import("@/lib/settings-service");
  const settings = await settingsService.getSettings();

  const title = settings.site_name || "Website";
  const desc = settingsService.resolveTranslatable(settings.site_description, locale);
  const ogImage = settings.default_og_image_url || "";

  return {
    metadataBase: new URL("https://istanbulphotosession.com.tr"),
    title: {
      template: `%s | ${title}`,
      default: title,
    },
    description: desc,
    alternates: {
      canonical: "./",
      languages: {
        en: "/en",
        tr: "/tr"
      }
    },
    openGraph: constructOpenGraph(title, desc, ogImage, title, locale),
    twitter: {
      card: "summary_large_image",
      title,
      description: desc,
      images: [ogImage],
    },
    icons: {
      icon: settings.favicon_url || "/favicon.ico",
      shortcut: settings.favicon_url || "/favicon.ico",
      apple: "/apple-touch-icon.png",
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

  // Resolve dynamic db slugs and titles for layout links based on locale
  const { pagesContentService } = await import("@/lib/pages-content-service");
  const dynamicNavData = await pagesContentService.getDynamicCoreNavData(locale);
  const { settingsService } = await import("@/lib/settings-service");
  const settings = await settingsService.getSettings();

  return (
    <html
      lang={locale}
      dir={locale === "ar" ? "rtl" : "ltr"}
      data-scroll-behavior="smooth"
      className={`${fontSans.variable} ${fontHeading.variable} ${geistMono.variable}`}
      suppressHydrationWarning
    >
      <body
        className="antialiased"
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

        {/* Ad-hoc Custom Head Scripts Injected from Settings Dashboard */}
        {settings.custom_head_scripts && (
          <div dangerouslySetInnerHTML={{ __html: settings.custom_head_scripts }} />
        )}

        <SchemaInjector schema={buildLocalBusinessSchema(settings)} />

        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <ConsentProvider>
            <NextIntlClientProvider messages={messages}>
              <TooltipProvider>
                <div className="flex min-h-screen flex-col">
                  <Navigation dynamicNavData={dynamicNavData} settings={settings} />
                  <main className="flex-1">{children}</main>

                  {/* Non-critical Analytics — deferred until first interaction to minimize main-thread work */}
                  <InteractionLoader>
                    <FacebookPixel />
                    <DeferredAnalytics gaId={settings.google_analytics_id} />
                    <ConsentGate consent="accepted_all">
                      <YandexMetrica id={settings.yandex_metrica_id || undefined} />
                    </ConsentGate>
                  </InteractionLoader>

                  <CoreWebVitals />
                  <Footer dynamicNavData={dynamicNavData} settings={settings} />
                </div>
                <Toaster />
                <DeferredCookieConsent />
                <WhatsAppButton
                  phoneNumber={settings.whatsapp_number}
                />
              </TooltipProvider>
            </NextIntlClientProvider>
          </ConsentProvider>
        </ThemeProvider>
        <SpeedInsights />
        <Analytics />

        {/* Ad-hoc Custom Body Scripts Injected from Settings Dashboard */}
        {settings.custom_body_scripts && (
          <div dangerouslySetInnerHTML={{ __html: settings.custom_body_scripts }} />
        )}
      </body>
    </html>
  );
}
