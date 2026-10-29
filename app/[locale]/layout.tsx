import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import {
  Geist_Mono,
  Instrument_Sans,
  Playfair_Display,
} from "next/font/google";
import Script from "next/script";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { CoreWebVitals } from "@/components/analytics/core-web-vitals";
import { FacebookPixel } from "@/components/analytics/facebook-pixel";
import { GclidTracker } from "@/components/analytics/gclid-tracker";
import { GoogleAnalytics } from "@/components/analytics/google-analytics";
import { InteractionLoader } from "@/components/analytics/interaction-loader";
import { WebMCPProvider } from "@/components/analytics/webmcp-provider";
import { YandexMetrica } from "@/components/analytics/yandex-metrica";
import { ConsentGate } from "@/components/consent-gate";
import { ConsentProvider } from "@/contexts/consent-context";
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

const fontHeading = Playfair_Display({
  variable: "--font-heading",
  subsets: ["latin", "latin-ext", "cyrillic"],
});

const fontSans = Instrument_Sans({
  variable: "--font-sans",
  subsets: ["latin", "latin-ext"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin", "latin-ext"],
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
    openGraph: constructOpenGraph(title, desc, ogImage, title, locale),
    twitter: {
      card: "summary_large_image",
      title,
      description: desc,
      images: [optimizeSeoImage(ogImage, 1200)],
    },
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

  const [
    { pagesContentService },
    { settingsService },
    { getRatesForBase },
    { cookies },
    { getServerUser, isServerAdmin },
    { getConsentCookie },
    { discountService },
  ] = await Promise.all([
    import("@/lib/pages-content-service"),
    import("@/lib/settings-service"),
    import("@/lib/currency"),
    import("next/headers"),
    import("@/lib/auth-server"),
    import("@/app/actions/consent"),
    import("@/lib/discount-service"),
  ]);

  // Execute all asynchronous data fetching in parallel
  const [
    messages,
    dynamicNavData,
    settings,
    rates,
    cookieStore,
    user,
    consentData,
    activeDiscounts,
  ] = await Promise.all([
    getMessages(),
    pagesContentService.getDynamicCoreNavData(locale),
    settingsService.getSettings(),
    getRatesForBase("EUR"),
    cookies(),
    getServerUser(),
    getConsentCookie(),
    discountService.getActiveDiscounts(),
  ]);

  let selectedCurrency = cookieStore.get("NEXT_CURRENCY")?.value;

  if (!selectedCurrency) {
    selectedCurrency = locale === "tr" ? "TRY" : "EUR";
  }

  const currentRate =
    selectedCurrency === "EUR" ? 1 : rates[selectedCurrency] || 1;

  const isGranted =
    consentData?.consent === "accepted_all" ? "granted" : "denied";

  // GA4 User-ID: Supabase auth UUID (non-PII). Only sent with analytics consent,
  // and never for admins so internal traffic doesn't pollute customer data.
  const analyticsUserId =
    user && isGranted === "granted" && !(await isServerAdmin(user.email))
      ? user.id
      : null;

  return (
    <html
      lang={locale === "zh" ? "zh-CN" : locale}
      dir={locale === "ar" ? "rtl" : "ltr"}
      data-scroll-behavior="smooth"
      className={`${fontSans.variable} ${fontHeading.variable} ${geistMono.variable} theme-${settings.theme_color || "violet"}`}
      suppressHydrationWarning
    >
      <head>
        <link
          rel="ai-catalog"
          href="/.well-known/ai-catalog.json"
          type="application/json"
        />
      </head>
      <body className="antialiased" suppressHydrationWarning>
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
                'analytics_storage': '${isGranted}',
                'ad_storage': '${isGranted}',
                'ad_user_data': '${isGranted}',
                'ad_personalization': '${isGranted}',
                'functionality_storage': 'granted',
                'security_storage': 'granted',
                'wait_for_update': 500
              });
              window.gtag('set', 'url_passthrough', true);
              window.gtag('set', 'ads_data_redaction', ${isGranted === "granted" ? "false" : "true"});
              window.gtag('set', 'allow_enhanced_conversions', true);
              window.__GA_ID = ${JSON.stringify(settings.google_analytics_id || null)};
              window.__GOOGLE_ADS_CONFIG = ${JSON.stringify({
                conversionId: settings.google_ads_id || null,
                purchaseLabel: settings.google_ads_purchase_label || null,
                leadLabel: settings.google_ads_lead_label || null,
                beginCheckoutLabel:
                  settings.google_ads_begin_checkout_label || null,
              })};
              ${analyticsUserId ? `window.gtag('set', 'user_id', ${JSON.stringify(analyticsUserId)});` : ""}
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
              window.fbq('consent', '${isGranted === "granted" ? "grant" : "revoke"}');
              window.fbq('dataProcessingOptions', ['LDU'], 0, 0);
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
          <ConsentProvider initialConsent={consentData?.consent ?? null}>
            <NextIntlClientProvider messages={messages} now={new Date()}>
              <CurrencyProvider rate={currentRate} currency={selectedCurrency}>
                <TooltipProvider>
                  <div className="flex min-h-[100dvh] flex-col">
                    {/* Critical Analytics — mounted before <main> so their useEffect hooks (cookies, PageView) execute before child page effects (ViewContent, Purchase) */}
                    <GclidTracker />
                    <WebMCPProvider />
                    <GoogleAnalytics
                      gaId={settings.google_analytics_id}
                      googleAdsId={settings.google_ads_id}
                      userId={analyticsUserId}
                    />
                    <FacebookPixel pixelId={settings.facebook_pixel_id} />

                    <TopDiscountBanner discounts={activeDiscounts} />
                    <Navigation
                      dynamicNavData={dynamicNavData}
                      settings={settings}
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
                      settings={settings}
                    />
                  </div>
                  <Toaster />
                  <DeferredCookieConsent />
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
