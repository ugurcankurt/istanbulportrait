import { routing } from "@/i18n/routing";

/**
 * Image Sitemap for photography content
 * Helps Google Images index gallery photos with proper metadata
 * Following 2025 SEO best practices for photography businesses
 */

interface ImageData {
  src: string;
  alt: string;
  category: string;
  title: string;
  caption: string;
  geoLocation: string;
  license: string;
}

const galleryImages: ImageData[] = [
  {
    src: "/gallery/couple_photoshoot_in_istanbul.jpg",
    alt: "Professional couple photoshoot Istanbul Balat romantic session with city skyline",
    category: "couple",
    title: "Couple Photoshoot in Istanbul Balat",
    caption: "Romantic couple photography session in historic Balat district with Istanbul skyline",
    geoLocation: "Balat, Istanbul, Turkey",
    license: "https://istanbulportrait.com/privacy#image-license",
  },
  {
    src: "/gallery/istanbul_couple_photoshoot_1.jpg",
    alt: "Istanbul couple photography session romantic poses historic Galata Tower professional photographer",
    category: "couple",
    title: "Istanbul Couple Photography at Galata Tower",
    caption: "Romantic couple poses with historic Galata Tower in Istanbul",
    geoLocation: "Galata Tower, Istanbul, Turkey",
    license: "https://istanbulportrait.com/privacy#image-license",
  },
  {
    src: "/gallery/istanbul_couple_photoshoot.jpg",
    alt: "Istanbul ortaköy couple photoshoot panoramic city view Bosphorus professional photography session",
    category: "couple",
    title: "Ortaköy Couple Photoshoot with Bosphorus View",
    caption: "Panoramic Bosphorus view couple photography session in Ortaköy",
    geoLocation: "Ortaköy, Istanbul, Turkey",
    license: "https://istanbulportrait.com/privacy#image-license",
  },
  {
    src: "/gallery/istanbul_photographer_1.jpg",
    alt: "Professional Istanbul photographer portrait session premium quality studio lighting techniques",
    category: "company",
    title: "Professional Istanbul Photographer Portrait Session",
    caption: "Premium quality portrait photography with professional studio lighting in Istanbul",
    geoLocation: "Istanbul, Turkey",
    license: "https://istanbulportrait.com/privacy#image-license",
  },
  {
    src: "/gallery/istanbul_rooftop_photoshoot_1.jpg",
    alt: "Istanbul rooftop photoshoot city skyline panoramic view professional photographer sunset session",
    category: "rooftop",
    title: "Istanbul Rooftop Photoshoot with City Skyline",
    caption: "Sunset rooftop photography session with panoramic Istanbul skyline",
    geoLocation: "Istanbul, Turkey",
    license: "https://istanbulportrait.com/privacy#image-license",
  },
  {
    src: "/gallery/istanbul_rooftop_photoshoot.jpg",
    alt: "Couple rooftop photoshoot Istanbul Galata Tower view romantic session professional photographer",
    category: "rooftop",
    title: "Couple Rooftop Photoshoot at Galata Tower",
    caption: "Romantic rooftop couple session with Galata Tower panoramic view",
    geoLocation: "Galata, Istanbul, Turkey",
    license: "https://istanbulportrait.com/privacy#image-license",
  },
  {
    src: "/gallery/istanbul_wedding_photographer_1.jpg",
    alt: "Istanbul wedding photographer professional ceremony photography Ortaköy historic venue",
    category: "wedding",
    title: "Istanbul Wedding Photography at Ortaköy",
    caption: "Professional wedding ceremony photography at historic Ortaköy venue",
    geoLocation: "Ortaköy, Istanbul, Turkey",
    license: "https://istanbulportrait.com/privacy#image-license",
  },
  {
    src: "/gallery/istanbul_wedding_photographer.jpg",
    alt: "Professional wedding photography Istanbul historic landmarks Blue Mosque ceremony session",
    category: "wedding",
    title: "Wedding Photography at Blue Mosque Istanbul",
    caption: "Professional wedding photography session at historic Blue Mosque landmark",
    geoLocation: "Sultanahmet, Istanbul, Turkey",
    license: "https://istanbulportrait.com/privacy#image-license",
  },
];

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function generateImageSitemapXml(baseUrl: string): string {
  // Generate URLs for all localized pages
  const pages = [
    { path: "", title: "Home" },
    { path: "/packages", title: "Photography Packages" },
    { path: "/about", title: "About Us" },
  ];

  const urlsXml = pages
    .flatMap((page) => {
      return routing.locales.map((locale) => {
        const pathConfig = routing.pathnames[page.path as keyof typeof routing.pathnames];
        let localizedPath = page.path;

        if (pathConfig && typeof pathConfig === "object") {
          localizedPath = pathConfig[locale as keyof typeof pathConfig] as string;
        }

        const pageUrl = `${baseUrl}/${locale}${localizedPath}`;

        // All images appear on homepage and packages page
        const imagesForPage =
          page.path === "" || page.path === "/packages" ? galleryImages : [];

        const imagesXml = imagesForPage
          .map(
            (image) => `    <image:image>
      <image:loc>${escapeXml(`${baseUrl}${image.src}`)}</image:loc>
      <image:title>${escapeXml(image.title)}</image:title>
      <image:caption>${escapeXml(image.caption)}</image:caption>
      <image:geo_location>${escapeXml(image.geoLocation)}</image:geo_location>
      <image:license>${escapeXml(image.license)}</image:license>
    </image:image>`
          )
          .join("\n");

        if (!imagesXml) return "";

        return `  <url>
    <loc>${escapeXml(pageUrl)}</loc>
${imagesXml}
  </url>`;
      });
    })
    .filter((xml) => xml !== "")
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urlsXml}
</urlset>`;
}

export async function GET() {
  const baseUrl = "https://istanbulportrait.com";
  const xml = generateImageSitemapXml(baseUrl);

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
