import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import {
  Cormorant_Garamond,
  Geist_Mono,
  Plus_Jakarta_Sans,
} from "next/font/google";
import Script from "next/script";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { CoreWebVitals } from "@/components/analytics/core-web-vitals";
import { FacebookPixel } from "@/components/analytics/facebook-pixel";
import { GclidTracker } from "@/components/analytics/gclid-tracker";
import { GoogleAnalytics } from "@/components/analytics/google-analytics";
import { InteractionLoader } from "@/components/analytics/interaction-loader";
import { WebMCPProvider } from "@/components/analytics/webmcp-provider";
import { YandexMetrica } from "@/components/analytics/yandex-metrica";
import { ConsentGate } from "@/components/consent-gate";
import { ConsentProvider } from "@/contexts/consent-context";
import { routing } from "@/i18n/routing";
import "../globals.css";
import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { ThemeProvider } from "next-themes";

import { SchemaInjector } from "@/components/schema-injector";
import { TopDiscountBanner } from "@/components/top-discount-banner";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CurrencyProvider } from "@/contexts/currency-context";
import {
  buildOrganizationSchema,
  constructOpenGraph,
  getBaseUrl,
  optimizeSeoImage,
} from "@/lib/seo-utils";

const WhatsAppButton = dynamic(() =>
  import("@/components/whatsapp-button").then((mod) => mod.WhatsAppButton),
);

const Navigation = dynamic(() =>
  import("@/components/navigation").then((mod) => mod.Navigation),
);
const Footer = dynamic(() =>
  import("@/components/footer").then((mod) => mod.Footer),
);
const DeferredAnalytics = dynamic(() =>
  import("@/components/analytics/deferred-analytics").then(
    (mod) => mod.DeferredAnalytics,
  ),
);
const DeferredCookieConsent = dynamic(() =>
  import("@/components/analytics/deferred-analytics").then(
    (mod) => mod.DeferredCookieConsent,
  ),
);
const FestiveParticles = dynamic(() =>
  import("@/components/festive-particles").then((mod) => mod.FestiveParticles),
);

const fontHeading = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin", "latin-ext", "cyrillic"],
  display: "swap",
  style: ["normal"],
  weight: ["400", "500", "600"],
});

const fontSans = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin", "latin-ext"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  preload: false,
});

export const revalidate = 60;

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

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
  const { routing } = await import("@/i18n/routing");

  // biome-ignore lint/suspicious/noExplicitAny: Routing locale matching
  if (!routing.locales.includes(locale as any)) {
    return { title: "Not Found" };
  }

  const { settingsService } = await import("@/lib/settings-service");
  const settings = await settingsService.getSettings();

  const title = settings.site_name || "Website";
  const desc = settingsService.resolveTranslatable(
    settings.site_description,
    locale,
  );
  const ogImage = settings.default_og_image_url || "";

  const baseUrl = settings.app_base_url || getBaseUrl();

  return {
    metadataBase: new URL(baseUrl),
    title: {
      template: `%s | ${title}`,
      default: title,
    },
    description: desc,
    robots: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
    openGraph: constructOpenGraph(title, desc, ogImage, title, locale, {
      url: `${baseUrl}/${locale}`,
    }),
    twitter: {
      card: "summary_large_image",
      title,
      description: desc,
      ...(ogImage ? { images: [optimizeSeoImage(ogImage, 1200)] } : {}),
    },
    ...(settings.yandex_webmaster_key || settings.bing_webmaster_key
      ? {
          verification: {
            ...(settings.yandex_webmaster_key
              ? { yandex: settings.yandex_webmaster_key }
              : {}),
            ...(settings.bing_webmaster_key
              ? { other: { "msvalidate.01": settings.bing_webmaster_key } }
              : {}),
          },
        }
      : {}),
    icons: {
      icon: settings.favicon_url || "/favicon.ico",
      shortcut: settings.favicon_url || "/favicon.ico",
      apple: settings.favicon_url || "/favicon.ico",
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
  const { routing } = await import("@/i18n/routing");
  const { notFound } = await import("next/navigation");

  // biome-ignore lint/suspicious/noExplicitAny: Routing locale matching
  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  // Enable static/ISR rendering for all public pages under app/[locale]
  setRequestLocale(locale);

  const [
    { pagesContentService },
    { settingsService },
    { getRatesForBase },
    { discountService },
    { packagesService },
  ] = await Promise.all([
    import("@/lib/pages-content-service"),
    import("@/lib/settings-service"),
    import("@/lib/currency"),
    import("@/lib/discount-service"),
    import("@/lib/packages-service"),
  ]);

  // Execute all asynchronous data fetching in parallel (cookie-free for Vercel Edge ISR caching)
  const [
    messages,
    dynamicNavData,
    settings,
    rates,
    activeDiscounts,
    activePackages,
  ] = await Promise.all([
    getMessages({ locale }),
    pagesContentService.getDynamicCoreNavData(locale),
    settingsService.getSettings(),
    getRatesForBase("EUR"),
    discountService.getActiveDiscounts(),
    packagesService.getActivePackages(),
  ]);

  const publicSettings = settingsService.toPublicSettings(settings);
  const defaultCurrency = locale === "tr" ? "TRY" : "EUR";

  // Slim footer packages to only current locale + English fallback to shrink RSC payload on every page
  const footerPackages = (activePackages || []).map((pkg) => ({
    id: pkg.id,
    slug: pkg.slug,
    title: {
      en: pkg.title?.en || pkg.slug,
      ...(pkg.title?.[locale] ? { [locale]: pkg.title[locale] } : {}),
    },
  }));

  return (
    <html
      lang={locale === "zh" ? "zh-CN" : locale}
      dir={locale === "ar" ? "rtl" : "ltr"}
      data-scroll-behavior="smooth"
      className={`${fontSans.variable} ${fontHeading.variable} ${geistMono.variable} theme-${settings.theme_color || "bronze"}`}
      suppressHydrationWarning
    >
      <head>
        <link
          rel="ai-catalog"
          href="/.well-known/ai-catalog.json"
          type="application/ai-catalog+json"
        />
      </head>
      <body className="antialiased font-sans" suppressHydrationWarning>
        {settings.custom_head_scripts && (
          <div
            id="custom-head-scripts"
            className="hidden"
            // biome-ignore lint/security/noDangerouslySetInnerHtml: Dynamic script
            dangerouslySetInnerHTML={{ __html: settings.custom_head_scripts }}
          />
        )}
        {/* Google Consent Mode v2 Default State - MUST be first before any analytics */}
        <Script
          id="google-consent-default"
          strategy="beforeInteractive"
          // biome-ignore lint/security/noDangerouslySetInnerHtml: Consent script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              window.gtag = window.gtag || function(){ (window.dataLayer = window.dataLayer || []).push(arguments); };
              window.gtag('consent', 'default', {
                'analytics_storage': 'denied',
                'ad_storage': 'denied',
                'ad_user_data': 'denied',
                'ad_personalization': 'denied',
                'functionality_storage': 'granted',
                'security_storage': 'granted',
                'wait_for_update': 500
              });
              window.gtag('set', 'url_passthrough', true);
              window.gtag('set', 'ads_data_redaction', true);
              window.gtag('set', 'allow_enhanced_conversions', true);
              window.__GA_ID = ${JSON.stringify(settings.google_analytics_id || null)};
              window.__FB_PIXEL_ID = ${JSON.stringify(settings.facebook_pixel_id || null)};
              window.__GOOGLE_ADS_CONFIG = ${JSON.stringify({
                conversionId: settings.google_ads_id || null,
                purchaseLabel: settings.google_ads_purchase_label || null,
                leadLabel: settings.google_ads_lead_label || null,
                beginCheckoutLabel:
                  settings.google_ads_begin_checkout_label || null,
              })};
              window.gtag('js', new Date());
              ${settings.google_analytics_id ? `window.gtag('config', ${JSON.stringify(settings.google_analytics_id)});` : ""}
              ${settings.google_ads_id && settings.google_ads_id !== settings.google_analytics_id ? `window.gtag('config', ${JSON.stringify(settings.google_ads_id)});` : ""}
              ${
                settings.facebook_pixel_id
                  ? `
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[]}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              window.fbq('consent', 'revoke');
              window.fbq('dataProcessingOptions', ['LDU'], 0, 0);
              window.fbq('set', 'autoConfig', false, ${JSON.stringify(settings.facebook_pixel_id)});
              window.fbq('init', ${JSON.stringify(settings.facebook_pixel_id)});
              window._fbqInitialized = true;
              `
                  : ""
              }
            `,
          }}
        />
        <SchemaInjector schema={buildOrganizationSchema(settings)} />

        <ThemeProvider
          attribute="class"
          defaultTheme={settings.color_mode || "system"}
          enableSystem
          disableTransitionOnChange
        >
          <ConsentProvider>
            <NextIntlClientProvider
              locale={locale}
              messages={messages}
              now={new Date()}
            >
              <CurrencyProvider rates={rates} currency={defaultCurrency}>
                <TooltipProvider>
                  <div className="flex min-h-[100dvh] flex-col">
                    {/* Critical Analytics — mounted before <main> so their useEffect hooks (cookies, PageView) execute before child page effects (ViewContent, Purchase) */}
                    <GclidTracker />
                    <WebMCPProvider />
                    <GoogleAnalytics
                      gaId={settings.google_analytics_id}
                      googleAdsId={settings.google_ads_id}
                    />
                    <FacebookPixel pixelId={settings.facebook_pixel_id} />

                    {settings.theme_color === "christmas" && (
                      <FestiveParticles />
                    )}
                    <TopDiscountBanner discounts={activeDiscounts} />
                    <Navigation
                      dynamicNavData={dynamicNavData}
                      settings={publicSettings}
                    />
                    <main className="flex-1">{children}</main>

                    <DeferredAnalytics
                      clarityId={settings.clarity_project_id}
                    />

                    {/* Non-critical Analytics — deferred until first interaction to minimize main-thread work */}
                    <InteractionLoader>
                      <ConsentGate consent="accepted_all">
                        <YandexMetrica
                          id={settings.yandex_metrica_id || undefined}
                        />
                      </ConsentGate>
                      {/* GetYourGuide Analytics */}
                      <Script
                        src="https://widget.getyourguide.com/dist/pa.umd.production.min.js"
                        strategy="afterInteractive"
                        data-gyg-partner-id="S6XXHTA"
                      />
                    </InteractionLoader>

                    <CoreWebVitals />
                    <Footer
                      dynamicNavData={dynamicNavData}
                      settings={publicSettings}
                      packages={footerPackages}
                    />
                  </div>
                  <Toaster />
                  <DeferredCookieConsent
                    privacyPath={dynamicNavData.privacy?.path}
                  />
                  <WhatsAppButton phoneNumber={settings.whatsapp_number} />
                </TooltipProvider>
              </CurrencyProvider>
            </NextIntlClientProvider>
          </ConsentProvider>
        </ThemeProvider>
        <SpeedInsights />
        <Analytics />

        {/* Ad-hoc Custom Body Scripts Injected from Settings Dashboard */}
        {settings.custom_body_scripts && (
          <div
            // biome-ignore lint/security/noDangerouslySetInnerHtml: Dynamic script
            dangerouslySetInnerHTML={{ __html: settings.custom_body_scripts }}
          />
        )}
      </body>
    </html>
  );
}
