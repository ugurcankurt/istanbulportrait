import { NextRequest, NextResponse } from "next/server";
import { getProdigiCatalog } from "@/lib/prodigi";
import { SEO_CONFIG } from "@/lib/seo-config";

export async function GET(req: NextRequest) {
  try {
    const products = await getProdigiCatalog();
    const baseUrl = SEO_CONFIG.site.url;
    
    // Support locale query parameter, default to 'en'
    const { searchParams } = new URL(req.url);
    const locale = searchParams.get("locale") || "en"; 

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
  <channel>
    <title>${SEO_CONFIG.organization.name} - Prints Catalog (${locale.toUpperCase()})</title>
    <link>${baseUrl}/${locale}/prints</link>
    <description>Premium quality prints from Istanbul Portrait. Worldwide shipping available.</description>
    ${products.map(p => {
      const link = `${baseUrl}/${locale}/prints/${p.sku.toLowerCase()}`;
      const imageLink = p.imageUrls?.[0] 
        ? (p.imageUrls[0].startsWith("http") ? p.imageUrls[0] : `${baseUrl}${p.imageUrls[0]}`)
        : `${baseUrl}/products/${p.sku.toLowerCase()}-1.webp`;
      
      // Better Google Product Category detection based on our auto-categorization
      let googleCategory = "Arts & Entertainment > Hobbies & Creative Arts > Arts & Crafts > Art Prints";
      if (p.category === "Technology") {
        googleCategory = "Electronics > Communications > Telephony > Mobile Phone Accessories > Mobile Phone Cases";
      } else if (p.category === "Home & living") {
        googleCategory = "Home & Garden > Decor";
      } else if (p.category === "Wall art") {
        googleCategory = "Home & Garden > Decor > Artwork > Posters, Prints, & Visual Artwork";
      }

      return `
    <item>
      <g:id>${p.sku}</g:id>
      <g:title><![CDATA[${p.description}]]></g:title>
      <g:description><![CDATA[Order a custom ${p.description}. Upload your photo and get it printed with high quality. Worldwide shipping available.]]></g:description>
      <g:link>${link}</g:link>
      <g:checkout_link_template>${baseUrl}/${locale}/prints/checkout?sku={id}</g:checkout_link_template>
      <g:image_link>${imageLink}</g:image_link>
      <g:condition>new</g:condition>
      <g:availability>in stock</g:availability>
      <g:price>${p.pricing?.eur?.toFixed(2) || "0.00"} EUR</g:price>
      <g:brand>${SEO_CONFIG.organization.name}</g:brand>
      <g:google_product_category>${googleCategory}</g:google_product_category>
      <g:identifier_exists>no</g:identifier_exists>
      <g:shipping>
        <g:country>TR</g:country>
        <g:service>Standard</g:service>
        <g:price>0.00 EUR</g:price>
      </g:shipping>
      <g:shipping>
        <g:country>US</g:country>
        <g:service>Standard</g:service>
        <g:price>0.00 EUR</g:price>
      </g:shipping>
      <g:shipping>
        <g:country>GB</g:country>
        <g:service>Standard</g:service>
        <g:price>0.00 EUR</g:price>
      </g:shipping>
      <g:shipping>
        <g:country>DE</g:country>
        <g:service>Standard</g:service>
        <g:price>0.00 EUR</g:price>
      </g:shipping>
    </item>`;
    }).join("")}
  </channel>
</rss>`;

    return new NextResponse(xml, {
      headers: {
        "Content-Type": "application/xml",
        "Cache-Control": "s-maxage=86400, stale-while-revalidate",
      },
    });
  } catch (error) {
    console.error("Error generating Google Shopping feed:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
