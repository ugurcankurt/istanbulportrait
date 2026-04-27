import { NextResponse } from "next/server";
import { packagesService } from "@/lib/packages-service";
import { getBaseUrl, generateSeoDescription } from "@/lib/seo-utils";
import { settingsService } from "@/lib/settings-service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const locale = searchParams.get("locale") || "en";

  const baseUrl = getBaseUrl();
  const packages = await packagesService.getAllPackages();
  const settings = await settingsService.getSettings();

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

    const imageUrl = cleanImage(pkg.cover_image || (pkg.gallery_images && pkg.gallery_images[0]));
    
    // Create language-specific URL
    const itemUrl = `${baseUrl}/${locale}/packages/${pkg.slug}`;

    xml += `    <item>
      <g:id>${escapeXml(pkg.id)}</g:id>
      <g:title>${escapeXml(title)}</g:title>
      <g:description>${escapeXml(cleanDesc)}</g:description>
      <g:availability>${pkg.is_active ? 'in stock' : 'out of stock'}</g:availability>
      <g:condition>new</g:condition>
      <g:price>${pkg.price} EUR</g:price>
      <g:link>${escapeXml(itemUrl)}</g:link>`;

    if (imageUrl) {
      xml += `\n      <g:image_link>${escapeXml(imageUrl)}</g:image_link>`;
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
