import { NextResponse } from "next/server";
import { packagesService } from "@/lib/packages-service";
import { getBaseUrl, generateSeoDescription } from "@/lib/seo-utils";
import { settingsService } from "@/lib/settings-service";
import { discountService } from "@/lib/discount-service";
import { reviewsService } from "@/lib/reviews-service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const locale = searchParams.get("locale") || "en";
  const format = searchParams.get("format") || "xml";

  const baseUrl = getBaseUrl();
  const packages = await packagesService.getAllPackages();
  const settings = await settingsService.getSettings();
  const activeDiscount = await discountService.getActiveDiscount();
  
  // Fetch real Google Reviews aggregate data
  const { average, count } = await reviewsService.getAggregateRating();

  const channelTitle = settings.site_name || "Istanbul Portrait Packages";
  const channelDesc = settings.site_description?.[locale] || settings.site_description?.en || "Photography and Tour Packages in Istanbul";

  // Helper to resolve images through our proxy if needed
  const cleanImage = (url?: string | null) => {
    if (!url) return "";
    return url.replace(
      "https://xfntnamwfnqjgqmyxwfz.supabase.co/storage/v1/object/public",
      `${baseUrl}/storage`
    );
  };

  const escapeXml = (unsafe: string) => {
    return unsafe.replace(/[<>&'"]/g, function (c) {
      switch (c) {
        case "<": return "&lt;";
        case ">": return "&gt;";
        case "&": return "&amp;";
        case "'": return "&apos;";
        case "\"": return "&quot;";
        default: return c;
      }
    });
  };

  if (format === "csv") {
    const localeToOverride: Record<string, string> = {
      tr: "tr_TR",
      ru: "ru_RU",
      es: "es_XX",
      de: "de_DE",
      fr: "fr_XX",
      ro: "ro_RO",
      ar: "ar_AR",
      zh: "zh_CN",
      en: "en_XX"
    };

    let csv = "id,override,title,description,link\n";
    for (const pkg of packages) {
      let title = pkg.title?.[locale] || pkg.title?.en || "";
      // Meta secondary feeds have a strict 65-character limit for titles
      if (title.length > 65) {
        title = title.substring(0, 62) + "...";
      }

      const desc = pkg.description?.[locale] || pkg.description?.en || "";
      const cleanDesc = desc.replace(/<[^>]*>?/gm, "").trim();
      const link = `${baseUrl}/${locale}/packages/${pkg.slug}`;

      const override = localeToOverride[locale] || `${locale}_${locale.toUpperCase()}`;

      const escapeCsv = (str: string) => `"${str.replace(/"/g, '""')}"`;

      csv += `${escapeCsv(pkg.slug)},${escapeCsv(override)},${escapeCsv(title)},${escapeCsv(cleanDesc)},${escapeCsv(link)}\n`;
    }

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="meta_catalog_${locale}.csv"`,
      },
    });
  }

  let xml = `<?xml version="1.0" encoding="utf-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>${escapeXml(channelTitle)}</title>
    <link>${baseUrl}</link>
    <description>${escapeXml(channelDesc)}</description>
`;

  packages.forEach((pkg) => {
    // Dynamically pull translated titles and descriptions based on the requested locale
    const title = pkg.title?.[locale] || pkg.title?.en || "Photography Package";

    // We need a clean text description without HTML tags for the feed
    const rawDesc = pkg.description?.[locale] || pkg.description?.en || title;
    const cleanDesc = generateSeoDescription(rawDesc, 500);

    const rawImageUrl = cleanImage(pkg.cover_image || (pkg.gallery_images && pkg.gallery_images[0]));
    let imageUrl = rawImageUrl;

    // Generate GetYourGuide style dynamic ad image if we have a base image
    if (rawImageUrl) {
      // Use real reviews data fetched from Google Reviews
      const rating = average > 0 ? average.toFixed(1) : "5.0";
      const reviewsCount = count > 0 ? count : 124;
      
      imageUrl = `${baseUrl}/api/og-catalog?image=${encodeURIComponent(rawImageUrl)}&title=${encodeURIComponent(title)}&rating=${rating}&reviews=${reviewsCount}`;
    }

    const videoUrl = cleanImage(pkg.video_url);

    // Create language-specific URL
    const itemUrl = `${baseUrl}/${locale}/packages/${pkg.slug}`;

    let finalBasePrice = pkg.price;
    let finalSalePrice = null;
    let effectiveDate = "";

    // 1. Check if the package has a hardcoded original price
    if (pkg.original_price && pkg.original_price > pkg.price) {
      finalBasePrice = pkg.original_price;
      finalSalePrice = pkg.price;
    }

    // 2. Check if there is a global dynamic discount running
    if (activeDiscount && activeDiscount.discount_percentage > 0) {
      finalBasePrice = pkg.price; // The regular price is what's on the package
      const calculatedSalePrice = pkg.price - (pkg.price * activeDiscount.discount_percentage);
      finalSalePrice = parseFloat(calculatedSalePrice.toFixed(2));

      if (activeDiscount.start_date && activeDiscount.end_date) {
        effectiveDate = `${new Date(activeDiscount.start_date).toISOString()}/${new Date(activeDiscount.end_date).toISOString()}`;
      }
    }

    xml += `    <item>
      <g:id>${escapeXml(pkg.slug)}</g:id>
      <g:title>${escapeXml(title)}</g:title>
      <g:description>${escapeXml(cleanDesc)}</g:description>
      <g:availability>${pkg.is_active ? 'in stock' : 'out of stock'}</g:availability>
      <g:condition>new</g:condition>
      <g:identifier_exists>no</g:identifier_exists>
      <g:product_type>Photography Services &gt; Photoshoots</g:product_type>
      <g:price>${finalBasePrice} EUR</g:price>`;

    if (finalSalePrice !== null) {
      xml += `\n      <g:sale_price>${finalSalePrice} EUR</g:sale_price>`;
      if (effectiveDate) {
        xml += `\n      <g:sale_price_effective_date>${escapeXml(effectiveDate)}</g:sale_price_effective_date>`;
      }
    }

    xml += `\n      <g:link>${escapeXml(itemUrl)}</g:link>`;

    if (imageUrl) {
      xml += `\n      <g:image_link>${escapeXml(imageUrl)}</g:image_link>`;
    }

    if (videoUrl) {
      xml += `\n      <video>\n        <url>${escapeXml(videoUrl)}</url>\n      </video>`;
    }

    xml += `\n      <g:brand>IstanbulPortrait</g:brand>
      <g:custom_label_0>${pkg.is_popular ? 'Popular' : 'Standard'}</g:custom_label_0>
    </item>\n`;
  });

  xml += `  </channel>\n</rss>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      // Optionally add Cache-Control headers to cache the feed for an hour
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
