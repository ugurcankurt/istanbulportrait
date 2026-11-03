import type { SiteSettings } from "./settings-service";
import { generateNativeSlug } from "./slug-generator";

export function getBaseUrl() {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL)
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "https://istanbulportrait.com";
}

// ----------------------------------------------------
// CORE SEO HELPERS
// ----------------------------------------------------

/**
 * Formats a clean, high-CTR page title strictly within 50-65 characters.
 * Prevents double-branding when the title already includes the brand name,
 * and avoids SERP truncation on mobile and desktop.
 */
export function formatPageTitle(
  title: string | null | undefined,
  siteName: string = "Istanbul Portrait",
): string {
  const cleanTitle = (title || "").trim();
  if (!cleanTitle) return siteName;

  const normalizedTitle = cleanTitle.replace(/\s+/g, "").toLowerCase();
  const normalizedSite = siteName.replace(/\s+/g, "").toLowerCase();

  // If title already contains the brand name (e.g. "Istanbul Portrait" or "IstanbulPortrait")
  if (
    normalizedTitle.includes(normalizedSite) ||
    normalizedTitle.includes("istanbulportrait")
  ) {
    return cleanTitle;
  }

  // If appending the site name fits within 65 characters, append it with standard separator
  const separator = " | ";
  if (cleanTitle.length + separator.length + siteName.length <= 65) {
    return `${cleanTitle}${separator}${siteName}`;
  }

  // Otherwise return the clean title as is to prevent Google from truncating it mid-word
  return cleanTitle;
}

/**
 * Strips HTML tags and markdown formatting, and truncates cleanly for SEO meta description.
 * Respects natural sentence boundaries (. ! ? 。 ！ ？ ؟) so descriptions don't end mid-sentence with '...'.
 * Safely handles CJK (Chinese) without whitespace requirements (max 80 chars for CJK, 155 for others).
 */
export function generateSeoDescription(
  content: string | null | undefined,
  maxLength = 155,
  locale?: string,
): string | null {
  if (!content) return null;

  // 1. Remove HTML tags
  let cleanText = content.replace(/<[^>]*>?/gm, " ");
  // 2. Remove markdown formatting markers (links, headings, bold, italics)
  cleanText = cleanText.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
  cleanText = cleanText.replace(/[#*_~`>[\]()]/g, " ");
  // 3. Normalize whitespaces
  cleanText = cleanText.replace(/\s+/g, " ").trim();

  if (!cleanText) return null;

  const isCJK = locale === "zh" || /[\u4e00-\u9fa5]/.test(cleanText);
  const effectiveMax = isCJK ? Math.min(maxLength, 80) : maxLength;

  if (cleanText.length <= effectiveMax) return cleanText;

  const truncated = cleanText.substring(0, effectiveMax);

  // Look for natural sentence boundary in the latter half of the allowable length
  const minSentencePos = Math.floor(effectiveMax * 0.55);
  const sentenceTerminators = isCJK ? /[。！？]/g : /[.!?؟]/g;
  let lastSentenceEnd = -1;
  let match: RegExpExecArray | null;

  while ((match = sentenceTerminators.exec(truncated)) !== null) {
    if (match.index >= minSentencePos) {
      lastSentenceEnd = match.index + 1;
    }
  }

  if (lastSentenceEnd > 0) {
    return truncated.substring(0, lastSentenceEnd).trim();
  }

  // If no sentence end found, for CJK cut cleanly at effectiveMax
  if (isCJK) {
    return `${truncated.trim()}...`;
  }

  // For Latin and other space-delimited scripts, cut cleanly at last word boundary
  const lastSpace = truncated.lastIndexOf(" ");
  if (lastSpace > minSentencePos) {
    return `${truncated.substring(0, lastSpace).trim()}...`;
  }

  return `${truncated.trim()}...`;
}

/**
 * Fallback curated meta descriptions for core CMS pages when the subtitle is too short (<70 chars).
 * Ensures search engines receive a rich 130-155 character description instead of a brief tagline.
 */
export function enrichSeoDescription(
  rawDesc: string | null | undefined,
  slug: string,
  locale: string = "en",
  _siteName: string = "Istanbul Portrait",
): string {
  const cleaned = generateSeoDescription(rawDesc, 160, locale);
  const isCJK = locale === "zh";
  const minLength = isCJK ? 35 : 75;

  if (cleaned && cleaned.length >= minLength) {
    return cleaned;
  }

  // Curated descriptions by page slug and locale
  const defaults: Record<string, Record<string, string>> = {
    packages: {
      en: "Explore our Istanbul photoshoot packages and transparent EUR pricing. Rooftop sessions, flying dress, couples, families, and solo traveler shoots with same-day delivery.",
      tr: "İstanbul profesyonel fotoğraf çekimi paketleri ve güncel fiyatları. Çatı terası, uçan elbise, çift, aile ve evlilik teklifi çekimlerinde aynı gün teslim.",
      ar: "استكشف باقات جلسات التصوير الاحترافية في إسطنبول بأسعار شفافة. جلسات أسطح المنازل، الفستان الطائر، والأزواج مع تسليم سريع للصور.",
      ru: "Пакеты профессиональных фотосессий в Стамбуле: фотосессии на крыше, в летящем платье, для пар и семей. Прозрачные цены и быстрая передача фото.",
      es: "Descubre nuestros paquetes de sesiones de fotos en Estambul con precios transparentes. Sesiones en terrazas, vestido volador, parejas y familias.",
      zh: "探索伊斯坦布尔专业摄影套餐与透明价格。天台写真、飞天裙拍摄、情侣与家庭写真，支持当天交付底片。",
      fr: "Découvrez nos forfaits de séances photo à Istanbul. Séances sur les toits, robe volante, couples et familles avec livraison rapide des photos.",
      de: "Entdecken Sie professionelle Fotoshooting-Pakete in Istanbul mit transparenten Preisen. Rooftop-Shootings, Flying Dress, Paare und Familien.",
      ro: "Descoperiți pachetele noastre de ședințe foto în Istanbul cu prețuri transparente. Ședințe pe acoperiș, flying dress, cupluri și familii.",
    },
    locations: {
      en: "Discover the best photo shoot locations in Istanbul. From Galata Tower and Ortaköy Mosque to Balat and rooftop views, find optimal times and photo tips.",
      tr: "İstanbul'un en güzel fotoğraf çekim yerleri ve tarihi mekanları. Galata Kulesi, Ortaköy, Balat ve çatı teraslarında en iyi çekim saatleri ve rehberler.",
      ar: "اكتشف أفضل أماكن جلسات التصوير في إسطنبول من برج غلطة وأورتاكوي إلى بالات والأسطح البانورامية مع نصائح التصوير وأوقات الإضاءة المثالية.",
      ru: "Лучшие локации для фотосессий в Стамбуле: Галатская башня, Ортакёй, Балат и крыши с видом на Босфор. Советы фотографа и идеальное время для съёмки.",
      es: "Las mejores ubicaciones para sesiones de fotos en Estambul: Torre de Gálata, mezquita de Ortaköy, Balat y terrazas con vistas al Bósforo.",
      zh: "探索伊斯坦布尔绝佳摄影取景地：加拉塔石塔、奥塔科伊清真寺、巴拉特老街与博斯普鲁斯全景天台。",
      fr: "Les meilleurs lieux pour une séance photo à Istanbul: Tour de Galata, mosquée d'Ortaköy, Balat et toits avec vue sur le Bosphore.",
      de: "Die besten Foto-Spots in Istanbul: Galataturm, Ortaköy, Balat und Panoramadächer mit Blick auf den Bosporus. Tipps für das beste Licht.",
      ro: "Cele mai bune locații pentru ședințe foto în Istanbul: Turnul Galata, Moscheea Ortaköy, Balat și terase panoramice cu vedere la Bosfor.",
    },
    blog: {
      en: "Istanbul photography blog: insider tips on what to wear, best sunrise and sunset light spots, and travel inspiration from local portrait photographers.",
      tr: "İstanbul fotoğrafçılık ve gezi rehberi: çekim için kıyafet önerileri, en iyi gün doğumu ve gün batımı ışık noktaları ve yerel fotoğrafçı tavsiyeleri.",
      ar: "مدونة التصوير في إسطنبول: نصائح لاختيار الملابس، أفضل أوقات الإضاءة لشروق وغروب الشمس، وأفكار لجلسات تصوير مميزة من مصور محلي.",
      ru: "Блог о фотосессиях в Стамбуле: советы по выбору одежды, лучшие точки для съемки на рассвете и закате от местного профессионального фотографа.",
      es: "Blog de fotografía en Estambul: consejos de vestuario, mejores horas de luz al amanecer y atardecer, e inspiración para tus fotos de viaje.",
      zh: "伊斯坦布尔摄影指南与旅行博客：穿搭建议、日出与日落最佳光线取景机位、本地摄影师独家实拍攻略。",
      fr: "Blog photo à Istanbul: conseils vestimentaires, meilleurs moments de lumière au lever et coucher du soleil, et astuces de photographes locaux.",
      de: "Istanbul Fotografie-Blog: Styling-Tipps, beste Zeiten für Sonnenaufgang und Sonnenuntergang sowie Fotoguides von lokalen Fotografen.",
      ro: "Blog de fotografie în Istanbul: sfaturi pentru ținute, cele mai bune momente de lumină la răsărit și apus, și ghiduri locale de călătorie.",
    },
    contact: {
      en: "Contact Istanbul Portrait to reserve your photoshoot date in Istanbul. Fast response on WhatsApp, transparent EUR pricing, and tailored photography sessions.",
      tr: "İstanbul'da fotoğraf çekimi randevunuzu ayırtmak için iletişime geçin. WhatsApp üzerinden anında yanıt, şeffaf fiyatlar ve size özel çekim planı.",
      ar: "تواصل مع إسطنبول بورتريت لحجز موعد جلسة التصوير الخاصة بك في إسطنبول. استجابة سريعة عبر واتساب وباقات مصممة خصيصاً لك.",
      ru: "Свяжитесь с Istanbul Portrait для бронирования фотосессии в Стамбуле. Быстрый ответ в WhatsApp, прозрачные цены и индивидуальный подход.",
      es: "Contacta con Istanbul Portrait para reservar tu sesión de fotos en Estambul. Respuesta rápida por WhatsApp y paquetes personalizados.",
      zh: "联系伊斯坦布尔专业摄影工作室预约拍摄档期。支持微信与WhatsApp快速咨询，价格透明，按需定制专属行程。",
      fr: "Contactez Istanbul Portrait pour réserver votre séance photo à Istanbul. Réponse rapide sur WhatsApp et forfaits sur mesure.",
      de: "Kontaktieren Sie Istanbul Portrait für Ihr Fotoshooting in Istanbul. Schnelle Antwort via WhatsApp und maßgeschneiderte Shootings.",
      ro: "Contactați Istanbul Portrait pentru a rezerva data ședinței foto în Istanbul. Răspuns rapid pe WhatsApp și pachete personalizate.",
    },
    about: {
      en: "Meet your local Istanbul portrait photographer. Over 10 years of experience capturing couples, proposals, families, and solo travelers in Istanbul.",
      tr: "İstanbul'daki yerel profesyonel fotoğrafçınız ile tanışın. 10 yılı aşkın deneyimle çift, evlilik teklifi, aile ve solo seyahat fotoğraf çekimleri.",
      ar: "تعرف على مصورك المحلي المحترف في إسطنبول. أكثر من 10 سنوات من الخبرة في توثيق لحظات الأزواج والعائلات والمسافرين المنفردين.",
      ru: "Познакомьтесь с вашим фотографом в Стамбуле. Более 10 лет опыта съемок для пар, предложений руки и сердца, семей и путешественников.",
      es: "Conoce a tu fotógrafo local en Estambul. Más de 10 años de experiencia capturando parejas, pedidas de mano, familias y viajeros solos.",
      zh: "认识您在伊斯坦布尔的本地专属摄影师。拥有超过10年肖像摄影经验，专注情侣写真、浪漫求婚、家庭及个人旅拍记录。",
      fr: "Rencontrez votre photographe local à Istanbul. Plus de 10 ans d'expérience au service des couples, demandes en mariage et familles.",
      de: "Lernen Sie Ihren lokalen Fotografen in Istanbul kennen. Über 10 Jahre Erfahrung mit Porträts, Heiratsanträgen, Paaren und Familien.",
      ro: "Faceți cunoștință cu fotograful dvs. local din Istanbul. Peste 10 ani de experiență în capturarea cuplurilor, cererilor în căsătorie și familiilor.",
    },
    privacy: {
      en: "Istanbul Portrait Privacy Policy. Learn how we securely collect, use, and protect your personal information and booking details in full privacy compliance.",
      tr: "Istanbul Portrait Gizlilik Politikası. Kişisel verilerinizin ve rezervasyon bilgilerinizin nasıl güvenle korunduğunu ve işlendiğini öğrenin.",
      ar: "سياسة الخصوصية لموقع إسطنبول بورتريت. تعرف على كيفية حماية بياناتك الشخصية وتفاصيل حجزك وفقاً لأعلى معايير الأمان.",
      ru: "Политика конфиденциальности Istanbul Portrait. Узнайте, как мы защищаем и обрабатываем ваши персональные данные и информацию о бронировании.",
      es: "Política de Privacidad de Istanbul Portrait. Descubre cómo recopilamos y protegemos tus datos personales y detalles de reserva.",
      zh: "伊斯坦布尔人像摄影网站隐私政策。了解我们如何妥善保护与合规处理您的个人隐私信息及预约订单数据。",
      fr: "Politique de confidentialité d'Istanbul Portrait. Découvrez comment nous protégeons vos données personnelles et informations de réservation.",
      de: "Datenschutzerklärung von Istanbul Portrait. Erfahren Sie, wie wir Ihre persönlichen Daten und Buchungsdetails sicher schützen.",
      ro: "Politica de confidențialitate Istanbul Portrait. Aflați cum colectăm și protejăm în siguranță datele dvs. personale și detaliile rezervării.",
    },
  };

  const pageGroup = defaults[slug];
  if (pageGroup) {
    const text = pageGroup[locale] || pageGroup.en;
    if (text) return text;
  }

  return cleaned || "";
}

/**
 * Normalizes title for Meta Tags
 */
export function generateSeoTitle(
  title: string | null | undefined,
  _locale: string = "en",
  fallbackTitle: string = "Istanbul Portrait",
): string {
  if (!title || !title.trim()) return fallbackTitle;
  return title.trim();
}

/**
 * Resolves an image URL for SEO (OpenGraph & Schema).
 * Uses Next.js /api/og dynamic image generation to guarantee a perfect 1200x630
 * aspect ratio for social media crawlers, avoiding cropped or improperly sized previews.
 */
export function optimizeSeoImage(
  imageUrl: string | null | undefined,
  width: 1200 | 1080 | 1920 = 1200,
): string {
  if (!imageUrl) return "";

  // Get absolute URL
  const absoluteUrl = imageUrl.startsWith("/")
    ? `${getBaseUrl()}${imageUrl}`
    : imageUrl;

  // Social media bots (WhatsApp, Facebook, LinkedIn) strictly require a JPEG/PNG format and often fail
  // to parse Next.js dynamic /_next/image endpoints emitting AVIF/WebP based on crawler headers.
  // Using wsrv.nl securely globally caches the image, guarantees a fixed JPG output format,
  // and optimally scales it for Open Graph requirements without cropping.
  return `https://wsrv.nl/?url=${encodeURIComponent(absoluteUrl)}&w=${width}&h=630&fit=cover&output=jpg&q=85`;
}

/**
 * Base open graph constructor helping out dynamic layouts.
 */
export function constructOpenGraph(
  title: string,
  description: string | null,
  imageUrl: string,
  siteName: string,
  locale: string,
  extraOverrides: any = {},
) {
  const optimizedUrl = optimizeSeoImage(imageUrl, 1200);

  const ogLocaleMap: Record<string, string> = {
    en: "en_US",
    ar: "ar_SA",
    tr: "tr_TR",
    ru: "ru_RU",
    es: "es_ES",
    zh: "zh_CN",
    fr: "fr_FR",
    de: "de_DE",
    ro: "ro_RO",
  };
  const ogLocale = ogLocaleMap[locale] || "en_US";

  return {
    title,
    description,
    url: getBaseUrl(), // Base URL handled by metadataBase in layout
    siteName: siteName || title,
    images: [
      {
        url: optimizedUrl,
        width: 1200,
        height: 630,
        alt: title,
      },
    ],
    locale: ogLocale,
    type: "website",
    ...extraOverrides,
  };
}

// ----------------------------------------------------
// SCHEMA.ORG (JSON-LD) GENERATORS
// ----------------------------------------------------

/**
 * Resolves an image URL for Schema.org JSON-LD structured data.
 * Guarantees a direct canonical URL served from this website (e.g. https://istanbulportrait.com/storage/...)
 * so Googlebot-Image crawls and associates the image directly with this domain,
 * free of third-party proxy canonicals or x-robots-tag penalties.
 */
export function resolveSchemaImage(
  imageUrl: string | null | undefined,
): string {
  if (!imageUrl) return "";

  const baseUrl = getBaseUrl();

  // Rewrite direct Supabase storage URLs to our canonical domain storage route
  const resolved = imageUrl.replace(
    "https://xfntnamwfnqjgqmyxwfz.supabase.co/storage/v1/object/public",
    `${baseUrl}/storage`,
  );

  // If already full http(s) URL
  if (resolved.startsWith("http://") || resolved.startsWith("https://")) {
    return resolved;
  }

  // If relative path
  if (resolved.startsWith("/")) {
    return `${baseUrl}${resolved}`;
  }

  return `${baseUrl}/${resolved}`;
}

/**
 * Normalizes a URL for JSON-LD structured data to ensure RFC 3986 percent-encoding
 * matching `<link rel="canonical">` without double-encoding already encoded URLs.
 */
export function normalizeSchemaUrl(url: string | null | undefined): string {
  if (!url) return "";
  const full = url.startsWith("http")
    ? url
    : `${getBaseUrl()}${url.startsWith("/") ? "" : "/"}${url}`;
  try {
    return encodeURI(decodeURI(full));
  } catch {
    return encodeURI(full);
  }
}

export function buildLocalBusinessSchema(
  settings: SiteSettings,
  priceRange?: string,
  reviews?: any[],
  aggregateRatingValue?: number,
  reviewCount?: number,
  coverImage?: string,
  locale?: string,
  packages?: any[],
  packagesParentSlug?: string,
) {
  const imageUrl = resolveSchemaImage(
    coverImage || settings.logo_url || settings.default_og_image_url,
  );

  const localizedStreet =
    (typeof settings.address === "string" ? settings.address : null) ||
    (locale && settings.address?.[locale]) ||
    settings.address?.en ||
    settings.city ||
    "Istanbul, Turkey";

  const baseUrl = getBaseUrl();
  const orgName = settings.organization_name || settings.site_name || "Istanbul Portrait";
  const orgId = `${baseUrl}/#organization`;

  const schema: any = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: orgName,
    inLanguage: locale || "en",
    image: imageUrl
      ? {
          "@type": "ImageObject",
          url: imageUrl,
          contentUrl: imageUrl,
          caption: orgName,
        }
      : undefined,
    "@id": `${baseUrl}/#localbusiness`,
    parentOrganization: {
      "@type": "Organization",
      "@id": orgId,
      name: orgName,
    },
    url: `${baseUrl}${locale ? `/${locale}` : ""}`,
    telephone: settings.contact_phone || settings.whatsapp_number,
    priceRange: priceRange || undefined,
    address: {
      "@type": "PostalAddress",
      addressLocality: settings.city || "Istanbul",
      addressCountry: settings.country_code || "TR",
      streetAddress: localizedStreet,
      postalCode: "34116",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: settings.latitude || 41.0082,
      longitude: settings.longitude || 28.9784,
    },
    openingHoursSpecification: {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: settings.working_days || [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ],
      opens: settings.opening_time || "06:00",
      closes: settings.closing_time || "22:00",
    },
    sameAs: [
      settings.instagram_url,
      settings.facebook_url,
      settings.youtube_url,
      settings.tiktok_url,
      "https://www.linkedin.com/company/istanbulportrait",
    ].filter(Boolean),
  };

  if (
    aggregateRatingValue &&
    aggregateRatingValue > 0 &&
    reviewCount &&
    reviewCount > 0
  ) {
    schema.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: aggregateRatingValue.toString(),
      reviewCount: reviewCount.toString(),
      bestRating: "5",
      worstRating: "1",
    };
  }

  // Include individual reviews with language tagging
  if (reviews && reviews.length > 0) {
    schema.review = reviews
      .filter((r: any) => r.text && r.text.trim().length > 0)
      .slice(0, 5)
      .map((r: any) => ({
        "@type": "Review",
        inLanguage: locale || "en",
        author: {
          "@type": "Person",
          name: r.author?.name || "Customer",
        },
        datePublished: r.date ? r.date.split("T")[0] : undefined,
        reviewBody: r.text,
        reviewRating: {
          "@type": "Rating",
          bestRating: "5",
          ratingValue: r.rating?.toString() || "5",
          worstRating: "1",
        },
      }));
  }

  // Include dynamic packages in OfferCatalog for rich snippet discovery and Google Image Pack indexing
  if (packages && packages.length > 0) {
    const parentSeg = packagesParentSlug || "packages";
    schema.hasOfferCatalog = {
      "@type": "OfferCatalog",
      name: `${orgName} Photoshoot Packages`,
      itemListElement: packages.map((pkg: any) => {
        const pkgTitle =
          pkg.title?.[locale || "en"] || pkg.title?.en || pkg.slug;
        const pkgDesc =
          pkg.description?.[locale || "en"] || pkg.description?.en || "";
        const cleanPkgDesc = pkgDesc
          ? pkgDesc.replace(/<[^>]*>?/gm, " ").replace(/\s+/g, " ").trim().substring(0, 200)
          : "";
        const pkgCover = pkg.cover_image || pkg.gallery_images?.[0];
        const pkgImageUrl = resolveSchemaImage(pkgCover);
        const localPkgTitle = pkg.title?.[locale || "en"];
        const pkgSeg = localPkgTitle
          ? generateNativeSlug(localPkgTitle) || pkg.slug
          : pkg.slug;
        const pkgUrl = encodeURI(
          `${baseUrl}/${locale || "en"}/${parentSeg}/${pkgSeg}`,
        );

        return {
          "@type": "Offer",
          name: pkgTitle,
          url: pkgUrl,
          price: pkg.price,
          priceCurrency: "EUR",
          availability: "https://schema.org/InStock",
          ...(pkgImageUrl ? { image: pkgImageUrl } : {}),
          itemOffered: {
            "@type": "Service",
            name: pkgTitle,
            description: cleanPkgDesc || undefined,
            url: pkgUrl,
            provider: {
              "@type": "Organization",
              "@id": orgId,
              name: orgName,
            },
            ...(pkgImageUrl
              ? {
                  image: {
                    "@type": "ImageObject",
                    url: pkgImageUrl,
                    contentUrl: pkgImageUrl,
                    caption: pkgTitle,
                  },
                }
              : {}),
          },
        };
      }),
    };
  }

  return schema;
}

export function buildOrganizationSchema(settings: SiteSettings) {
  const imageUrl = resolveSchemaImage(
    settings.logo_url || settings.default_og_image_url,
  );
  const baseUrl = getBaseUrl();
  const orgName = settings.organization_name || settings.site_name || "Istanbul Portrait";
  const orgId = `${baseUrl}/#organization`;

  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: orgName,
    "@id": orgId,
    url: baseUrl,
    logo: imageUrl
      ? {
          "@type": "ImageObject",
          "@id": `${baseUrl}/#logo`,
          url: imageUrl,
          contentUrl: imageUrl,
          caption: orgName,
        }
      : undefined,
    image: imageUrl || undefined,
    founder: settings.founder_name
      ? {
          "@type": "Person",
          name: settings.founder_name,
          ...(settings.founder_image_url
            ? {
                image: resolveSchemaImage(settings.founder_image_url),
              }
            : {}),
        }
      : undefined,
    foundingDate: settings.organization_founding_date || undefined,
    contactPoint: {
      "@type": "ContactPoint",
      telephone: settings.contact_phone || settings.whatsapp_number,
      contactType: "customer service",
      email: settings.contact_email,
    },
    sameAs: [
      settings.instagram_url,
      settings.facebook_url,
      settings.youtube_url,
      settings.tiktok_url,
      "https://www.linkedin.com/company/istanbulportrait",
    ].filter(Boolean),
  };
}

export function buildServiceSchema({
  name,
  description,
  image,
  price,
  currency = "EUR",
  aggregateRating,
  reviewCount,
  providerName,
  providerUrl,
  discount,
  reviews,
  url,
}: {
  name: string;
  description: string | null;
  image: string;
  price: number;
  currency?: string;
  aggregateRating?: number;
  reviewCount?: number;
  providerName?: string | null;
  providerUrl?: string;
  discount?: { discount_percentage: number; end_date?: string } | null;
  reviews?: any[];
  url?: string;
}) {
  const rawDiscountPct =
    discount && discount.discount_percentage > 0
      ? Number(discount.discount_percentage)
      : 0;
  const discountFraction =
    rawDiscountPct > 1 ? rawDiscountPct / 100 : rawDiscountPct;
  const finalPrice =
    discountFraction > 0
      ? Number((price * (1 - discountFraction)).toFixed(2))
      : price;

  const schemaImageUrl = resolveSchemaImage(image);
  const canonicalUrl = url ? normalizeSchemaUrl(url) : undefined;
  const baseUrl = getBaseUrl();
  const orgName = providerName || "Istanbul Portrait";
  const orgId = `${baseUrl}/#organization`;

  const schema: any = {
    "@context": "https://schema.org/",
    "@type": "Product",
    mainEntityOfPage: canonicalUrl
      ? {
          "@type": "WebPage",
          "@id": canonicalUrl,
        }
      : undefined,
    url: canonicalUrl,
    name,
    sku: name
      .toLowerCase()
      .trim()
      .replace(/[^\p{L}\p{N}]/gu, "-")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, ""),
    image: schemaImageUrl || undefined,
    description: description || undefined,
    brand: {
      "@type": "Brand",
      name: orgName,
    },
    offers: {
      "@type": "Offer",
      url: canonicalUrl || providerUrl || baseUrl,
      priceCurrency: currency,
      price: finalPrice,
      priceValidUntil: discount?.end_date
        ? discount.end_date.split("T")[0]
        : `${new Date().getFullYear()}-12-31`,
      availability: "https://schema.org/InStock",
      validFrom: `${new Date().getFullYear()}-01-01`,
      hasMerchantReturnPolicy: {
        "@type": "MerchantReturnPolicy",
        applicableCountry: "TR",
        returnPolicyCategory: "https://schema.org/MerchantReturnNotPermitted",
      },
      shippingDetails: {
        "@type": "OfferShippingDetails",
        shippingRate: {
          "@type": "MonetaryAmount",
          value: "0",
          currency: currency,
        },
        shippingDestination: {
          "@type": "DefinedRegion",
          addressCountry: "TR",
        },
        deliveryTime: {
          "@type": "ShippingDeliveryTime",
          handlingTime: {
            "@type": "QuantitativeValue",
            minValue: 0,
            maxValue: 0,
            unitCode: "d",
          },
          transitTime: {
            "@type": "QuantitativeValue",
            minValue: 0,
            maxValue: 0,
            unitCode: "d",
          },
        },
      },
      seller: {
        "@type": "Organization",
        "@id": orgId,
        name: orgName,
      },
    },
  };

  if (discount && discount.discount_percentage > 0) {
    const specs: any[] = [];
    specs.push({
      "@type": "UnitPriceSpecification",
      priceType: "https://schema.org/StrikethroughPrice",
      price: price,
      priceCurrency: currency,
    });

    if (discount.end_date) {
      schema.offers.priceValidUntil = discount.end_date.split("T")[0];
    }

    schema.offers.priceSpecification = specs;
  }

  if (
    aggregateRating &&
    aggregateRating > 0 &&
    reviewCount &&
    reviewCount > 0
  ) {
    schema.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: aggregateRating.toString(),
      reviewCount: reviewCount.toString(),
      bestRating: "5",
      worstRating: "1",
    };
  }

  if (reviews && reviews.length > 0) {
    schema.review = reviews.slice(0, 5).map((r: any) => ({
      "@type": "Review",
      author: {
        "@type": "Person",
        name: r.author?.name || "Customer",
      },
      datePublished: r.date ? r.date.split("T")[0] : undefined,
      reviewBody: r.text,
      reviewRating: {
        "@type": "Rating",
        bestRating: "5",
        ratingValue: r.rating?.toString() || "5",
        worstRating: "1",
      },
    }));
  }

  return schema;
}

export function buildArticleSchema({
  title,
  description,
  image,
  datePublished,
  dateModified,
  authorName,
  authorUrls,
  authorImage,
  authorBio,
  publisherName,
  publisherLogo,
  inLanguage,
  keywords,
  url,
}: {
  title: string;
  description: string | null;
  image: string;
  datePublished: string;
  dateModified: string;
  authorName: string;
  authorUrls?: string[];
  authorImage?: string;
  authorBio?: string;
  publisherName?: string;
  publisherLogo?: string;
  inLanguage?: string;
  keywords?: string[];
  url?: string;
}) {
  const canonicalUrl = url ? normalizeSchemaUrl(url) : undefined;
  const baseUrl = getBaseUrl();
  const orgName = publisherName || "Istanbul Portrait";
  const orgId = `${baseUrl}/#organization`;

  return {
    "@context": "https://schema.org",
    "@type": "Article",
    mainEntityOfPage: canonicalUrl
      ? {
          "@type": "WebPage",
          "@id": canonicalUrl,
        }
      : undefined,
    url: canonicalUrl,
    headline: title,
    inLanguage: inLanguage,
    image: image ? [resolveSchemaImage(image)] : [],
    datePublished,
    dateModified,
    author: [
      {
        "@type": "Person",
        name: authorName,
        ...(authorImage ? { image: resolveSchemaImage(authorImage) } : {}),
        ...(authorBio ? { description: authorBio } : {}),
        ...(authorUrls && authorUrls.length > 0 ? { sameAs: authorUrls } : {}),
      },
    ],
    publisher: {
      "@type": "Organization",
      "@id": orgId,
      name: orgName,
      ...(publisherLogo
        ? {
            logo: {
              "@type": "ImageObject",
              url: resolveSchemaImage(publisherLogo),
              contentUrl: resolveSchemaImage(publisherLogo),
            },
          }
        : {}),
    },
    description: description || undefined,
    ...(keywords && keywords.length > 0
      ? { keywords: keywords.join(", ") }
      : {}),
  };
}

export function buildFAQSchema(
  faqs: Array<{ question: string; answer: string }>,
) {
  if (!faqs || faqs.length === 0) return null;

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

export function buildBreadcrumbSchema(
  items: Array<{ name: string; url: string }>,
) {
  if (!items || items.length === 0) return null;

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: normalizeSchemaUrl(item.url),
    })),
  };
}

export function buildTouristAttractionSchema({
  name,
  description,
  image,
  lat,
  lng,
  url,
}: {
  name: string;
  description: string | null;
  image?: string;
  lat?: number;
  lng?: number;
  url?: string;
}) {
  const schemaImageUrl = resolveSchemaImage(image);
  const canonicalUrl = url ? normalizeSchemaUrl(url) : undefined;

  return {
    "@context": "https://schema.org",
    "@type": "TouristAttraction",
    mainEntityOfPage: canonicalUrl
      ? {
          "@type": "WebPage",
          "@id": canonicalUrl,
        }
      : undefined,
    name,
    description: description || undefined,
    url: canonicalUrl || getBaseUrl(),
    image: schemaImageUrl || undefined,
    geo:
      lat && lng
        ? {
            "@type": "GeoCoordinates",
            latitude: lat,
            longitude: lng,
          }
        : undefined,
  };
}

export function buildAboutPageSchema({
  name,
  description,
  url,
  organizationSchema,
}: {
  name: string;
  description: string | null;
  url?: string;
  organizationSchema?: any;
}) {
  const canonicalUrl = url ? normalizeSchemaUrl(url) : undefined;
  const baseUrl = getBaseUrl();

  return {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    mainEntityOfPage: canonicalUrl
      ? {
          "@type": "WebPage",
          "@id": canonicalUrl,
        }
      : undefined,
    name,
    description: description || undefined,
    url: canonicalUrl || baseUrl,
    mainEntity: organizationSchema || {
      "@type": "Organization",
      "@id": `${baseUrl}/#organization`,
    },
  };
}

export function buildContactPageSchema({
  name,
  description,
  url,
}: {
  name: string;
  description: string | null;
  url?: string;
}) {
  const canonicalUrl = url ? normalizeSchemaUrl(url) : undefined;
  return {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    mainEntityOfPage: canonicalUrl
      ? {
          "@type": "WebPage",
          "@id": canonicalUrl,
        }
      : undefined,
    name,
    description: description || undefined,
    url: canonicalUrl || getBaseUrl(),
  };
}

export function buildCollectionPageSchema({
  name,
  description,
  url,
  items,
}: {
  name: string;
  description: string | null;
  url?: string;
  items: Array<{
    name: string;
    description?: string | null;
    url: string;
    image?: string;
  }>;
}) {
  const canonicalUrl = url ? normalizeSchemaUrl(url) : undefined;
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    mainEntityOfPage: canonicalUrl
      ? {
          "@type": "WebPage",
          "@id": canonicalUrl,
        }
      : undefined,
    name,
    description: description || undefined,
    url: canonicalUrl || getBaseUrl(),
    mainEntity: {
      "@type": "ItemList",
      itemListElement: items.map((item, index) => {
        const itemImageUrl = resolveSchemaImage(item.image);
        return {
          "@type": "ListItem",
          position: index + 1,
          url: normalizeSchemaUrl(item.url),
          name: item.name,
          ...(item.description ? { description: item.description } : {}),
          ...(itemImageUrl ? { image: itemImageUrl } : {}),
        };
      }),
    },
  };
}

export function buildImageGallerySchema({
  name,
  description,
  url,
  images,
}: {
  name: string;
  description?: string;
  url: string;
  images: Array<{
    url: string;
    caption?: string;
  }>;
}) {
  if (!images || images.length === 0) return null;

  return {
    "@context": "https://schema.org",
    "@type": "ImageGallery",
    name,
    description: description || undefined,
    url: url ? normalizeSchemaUrl(url) : getBaseUrl(),
    image: images.map((img) => {
      const cleanUrl = resolveSchemaImage(img.url);
      return {
        "@type": "ImageObject",
        contentUrl: cleanUrl,
        url: cleanUrl,
        caption: img.caption || name,
      };
    }),
  };
}
