import { NextResponse } from "next/server";
import { routing } from "@/i18n/routing";
import { locationsService } from "@/lib/locations-service";
import { packagesService } from "@/lib/packages-service";
import { pagesContentService } from "@/lib/pages-content-service";
import { getBaseUrl } from "@/lib/seo-utils";
import { settingsService } from "@/lib/settings-service";
import { generateNativeSlug } from "@/lib/slug-generator";
import { supabaseAdmin } from "@/lib/supabase";

export const revalidate = 3600;

function stripMarkdownAndHtml(text?: string | null): string {
  if (!text) return "";
  return text
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function GET() {
  const [settings, activePackages, activeLocations, corePages] =
    await Promise.all([
      settingsService.getSettings(),
      packagesService.getActivePackages(),
      locationsService.getLocations(),
      pagesContentService.getAllPages(),
    ]);

  const baseUrl = (settings.app_base_url || getBaseUrl()).replace(/\/+$/, "");
  const siteName = settings.site_name || "Istanbul Portrait";
  const siteDesc =
    settingsService.resolveTranslatable(settings.site_description, "en") ||
    "Professional vacation, couple, solo, family, and flying dress photography services in Istanbul, Turkey.";

  const packagesParent = corePages.find((p) => p.slug === "packages");
  const packagesSeg = packagesParent?.title?.en
    ? generateNativeSlug(packagesParent.title.en)
    : "packages";

  const locationsParent = corePages.find((p) => p.slug === "locations");
  const locationsSeg = locationsParent?.title?.en
    ? generateNativeSlug(locationsParent.title.en)
    : "locations";

  const blogParent = corePages.find((p) => p.slug === "blog");
  const blogSeg = blogParent?.title?.en
    ? generateNativeSlug(blogParent.title.en)
    : "blog";

  // Fetch latest published blog posts in English
  let blogEntries: Array<{ title: string; slug: string; excerpt: string }> = [];
  if (supabaseAdmin) {
    const { data: posts } = await supabaseAdmin
      .from("blog_posts")
      .select(
        "id, published_at, translations:blog_post_translations(locale, title, slug, excerpt)",
      )
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(15);

    if (posts) {
      blogEntries = posts
        .map((post: any) => {
          const enTrans =
            post.translations?.find((t: any) => t.locale === "en") ||
            post.translations?.[0];
          if (!enTrans?.slug || !enTrans?.title) return null;
          return {
            title: stripMarkdownAndHtml(enTrans.title),
            slug: enTrans.slug,
            excerpt: stripMarkdownAndHtml(enTrans.excerpt),
          };
        })
        .filter(Boolean) as Array<{
        title: string;
        slug: string;
        excerpt: string;
      }>;
    }
  }

  const lines: string[] = [];

  // 1. Required H1 Title & Summary Blockquote per llms.txt specification
  lines.push(`# ${siteName}`);
  lines.push("");
  lines.push(`> ${stripMarkdownAndHtml(siteDesc)}`);
  lines.push("");
  lines.push(
    `${siteName} connects travelers, couples, families, and solo adventurers with professional local portrait photographers across iconic Istanbul locations (such as Ortaköy, Galata Tower, Sultanahmet, Balat, Cappadocia-style rooftops, and Bosphorus waterfronts). All bookings include high-resolution edited digital photos, guided posing, and transparent online pricing in EUR. No credit card or upfront deposit is required to book online — 100% of the payment is made in cash on the photoshoot day.`,
  );
  lines.push("");

  // 2. Core Pages
  lines.push("## Core Pages");
  lines.push("");
  lines.push(
    `- [Home](${baseUrl}/en): Overview of ${siteName}, portfolio highlights, customer reviews, and instant online booking.`,
  );
  lines.push(
    `- [Photography Packages](${baseUrl}/en/${packagesSeg}): Compare all Istanbul photoshoot packages, durations, locations, and real-time EUR pricing.`,
  );
  lines.push(
    `- [Photoshoot Locations](${baseUrl}/en/${locationsSeg}): Explore the best photo spots in Istanbul with best shooting times and photography tips.`,
  );
  lines.push(
    `- [Istanbul Photography Blog & Travel Guide](${baseUrl}/en/${blogSeg}): Insider guides on what to wear, best times for light, and Istanbul travel tips.`,
  );

  for (const page of corePages) {
    if (
      ["home", "home-hero", "packages", "locations", "blog"].includes(page.slug)
    ) {
      continue;
    }
    const pageTitle = page.title?.en || page.slug;
    const pageSlug = page.title?.en
      ? generateNativeSlug(page.title.en)
      : page.slug;
    const pageSubtitle = stripMarkdownAndHtml(
      page.subtitle?.en || page.content?.en?.slice(0, 140),
    );
    lines.push(
      `- [${pageTitle}](${baseUrl}/en/${pageSlug})${pageSubtitle ? `: ${pageSubtitle}` : ""}`,
    );
  }
  lines.push("");

  // 3. Photography Packages (Dynamic from Supabase)
  if (activePackages.length > 0) {
    lines.push("## Photography Packages & Pricing");
    lines.push("");
    for (const pkg of activePackages) {
      const title = pkg.title?.en || pkg.slug;
      const pkgSlug = pkg.title?.en
        ? generateNativeSlug(pkg.title.en) || pkg.slug
        : pkg.slug;
      const duration = pkg.duration?.en || "1 Hour";
      const priceLabel = `€${pkg.price}${pkg.is_per_person ? " per person" : ""}`;
      const desc = stripMarkdownAndHtml(
        pkg.meta_description?.en || pkg.description?.en,
      );
      const features = (pkg.features?.en || []).slice(0, 4).join(", ");
      lines.push(
        `- [${title} (${priceLabel} — ${duration})](${baseUrl}/en/${packagesSeg}/${pkgSlug}): ${desc}${features ? ` Includes: ${features}.` : ""}`,
      );
    }
    lines.push("");
  }

  // 4. Photoshoot Locations (Dynamic from Supabase)
  if (activeLocations.length > 0) {
    lines.push("## Iconic Photoshoot Locations in Istanbul");
    lines.push("");
    for (const loc of activeLocations) {
      const title = loc.title?.en || loc.slug;
      const locSlug = loc.title?.en
        ? generateNativeSlug(loc.title.en) || loc.slug
        : loc.slug;
      const desc = stripMarkdownAndHtml(loc.description?.en);
      const bestTime = stripMarkdownAndHtml(loc.best_time?.en);
      lines.push(
        `- [${title}](${baseUrl}/en/${locationsSeg}/${locSlug}): ${desc}${bestTime ? ` (Best time: ${bestTime})` : ""}`,
      );
    }
    lines.push("");
  }

  // 5. Latest Blog Guides (Dynamic from Supabase)
  if (blogEntries.length > 0) {
    lines.push("## Travel & Photography Guides");
    lines.push("");
    for (const post of blogEntries) {
      lines.push(
        `- [${post.title}](${baseUrl}/en/${blogSeg}/${post.slug})${post.excerpt ? `: ${post.excerpt}` : ""}`,
      );
    }
    lines.push("");
  }

  // 6. API & Agentic Resources
  lines.push("## AI Agent & Machine-Readable Resources");
  lines.push("");
  lines.push(
    `- [AI Resource Catalog (ARD)](${baseUrl}/.well-known/ai-catalog.json): Agentic Resource Discovery (ARD 1.0) manifest for autonomous AI agents.`,
  );
  lines.push(
    `- [Booking Availability API](${baseUrl}/api/booking/availability): Check real-time photoshoot time-slot availability via GET \`?date=YYYY-MM-DD&packageId=<slug>\`.`,
  );
  lines.push(
    `- [Packages Catalog API](${baseUrl}/api/packages): Public JSON catalog of active Istanbul photoshoot packages, durations, and pricing.`,
  );
  lines.push(
    `- [XML Sitemap](${baseUrl}/sitemap.xml): Complete multilingual sitemap covering ${routing.locales.join(", ")}.`,
  );
  lines.push("");

  // 7. Contact & Support
  lines.push("## Contact & Support");
  lines.push("");
  if (settings.contact_email) {
    lines.push(`- Email: ${settings.contact_email}`);
  }
  if (settings.contact_phone) {
    lines.push(`- Phone: ${settings.contact_phone}`);
  }
  if (settings.whatsapp_number) {
    lines.push(
      `- WhatsApp: https://wa.me/${settings.whatsapp_number.replace(/[^0-9]/g, "")}`,
    );
  }
  lines.push(
    `- Supported Languages: ${routing.locales.map((l) => `[${l.toUpperCase()}](${baseUrl}/${l})`).join(", ")}`,
  );

  return new NextResponse(lines.join("\n"), {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      "X-Robots-Tag": "all",
    },
  });
}
