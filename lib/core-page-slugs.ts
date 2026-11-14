export const CORE_PAGE_LOCALIZED_SLUGS: Record<
  string,
  Record<string, string>
> = {
  packages: {
    en: "packages",
    tr: "paketler",
    ar: "الباقات",
    ru: "пакеты",
    es: "paquetes",
    zh: "套餐",
    fr: "forfaits",
    de: "pakete",
    ro: "pachete",
  },
  locations: {
    en: "locations",
    tr: "mekanlar",
    ar: "المواقع",
    ru: "локации",
    es: "ubicaciones",
    zh: "地点",
    fr: "lieux",
    de: "orte",
    ro: "locatii",
  },
  blog: {
    en: "blog",
    tr: "blog",
    ar: "المدونة",
    ru: "блог",
    es: "blog",
    zh: "博客",
    fr: "blog",
    de: "blog",
    ro: "blog",
  },
  about: {
    en: "about",
    tr: "hakkimizda",
    ar: "من-نحن",
    ru: "о-нас",
    es: "sobre-nosotros",
    zh: "关于我们",
    fr: "a-propos",
    de: "ueber-uns",
    ro: "despre-noi",
  },
  contact: {
    en: "contact",
    tr: "iletisim",
    ar: "اتصل-بنا",
    ru: "контакты",
    es: "contacto",
    zh: "联系我们",
    fr: "contact",
    de: "kontakt",
    ro: "contact",
  },
  privacy: {
    en: "privacy",
    tr: "gizlilik",
    ar: "الخصوصية",
    ru: "конфиденциальность",
    es: "privacidad",
    zh: "隐私政策",
    fr: "confidentialite",
    de: "datenschutz",
    ro: "confidentialitate",
  },
};

export const LEGACY_CORE_PAGE_SLUGS: Record<string, string[]> = {
  packages: [
    "packages",
    "paketler",
    "baqat",
    "pakety",
    "taocan",
    "paquetes",
    "forfaits",
    "pakete",
    "pachete",
    "الباقات",
    "باقات",
    "пакеты",
    "套餐",
  ],
  locations: [
    "locations",
    "mekanlar",
    "amakin",
    "lokatsii",
    "didian",
    "ubicaciones",
    "lieux",
    "orte",
    "locatii",
    "المواقع",
    "مواقع",
    "أماكن",
    "локации",
    "地点",
  ],
  blog: ["blog", "المدونة", "مدونة", "блог", "博客"],
  about: [
    "about",
    "hakkimizda",
    "man-nahnu",
    "o-nas",
    "guanyu",
    "sobre-nosotros",
    "a-propos",
    "ueber-uns",
    "despre-noi",
    "من-نحن",
    "حول",
    "о-нас",
    "关于我们",
    "关于",
  ],
  contact: [
    "contact",
    "iletisim",
    "ittisal",
    "kontakty",
    "lianxi",
    "contacto",
    "kontakt",
    "اتصل-بنا",
    "اتصل",
    "контакты",
    "联系我们",
    "联系",
  ],
  privacy: [
    "privacy",
    "gizlilik",
    "khususiya",
    "konfidentsialnost",
    "yinsi",
    "privacidad",
    "confidentialite",
    "datenschutz",
    "confidentialitate",
    "الخصوصية",
    "سياسة-الخصوصية",
    "конфиденциальность",
    "политика-конфиденциальности",
    "隐私政策",
    "隐私",
  ],
};

export const BLOG_TAXONOMY_LOCALIZED_SLUGS: Record<
  "category" | "tag",
  Record<string, string>
> = {
  category: {
    en: "category",
    tr: "kategori",
    ar: "تصنيف",
    ru: "категория",
    es: "categoria",
    zh: "分类",
    fr: "categorie",
    de: "kategorie",
    ro: "categorie",
  },
  tag: {
    en: "tag",
    tr: "etiket",
    ar: "وسم",
    ru: "тег",
    es: "etiqueta",
    zh: "标签",
    fr: "etiquette",
    de: "schlagwort",
    ro: "eticheta",
  },
};

const CATEGORY_ALIASES = new Set([
  "category",
  ...Object.values(BLOG_TAXONOMY_LOCALIZED_SLUGS.category),
  "الفئة",
  "فئة",
  "категории",
  "categoría",
  "catégorie",
]);

const TAG_ALIASES = new Set([
  "tag",
  ...Object.values(BLOG_TAXONOMY_LOCALIZED_SLUGS.tag),
  "وسوم",
  "теги",
  "étiquette",
]);

export function getBlogTaxonomySegment(
  type: "category" | "tag",
  locale: string,
): string {
  return BLOG_TAXONOMY_LOCALIZED_SLUGS[type]?.[locale] || type;
}

export function resolveBlogTaxonomyType(
  segment: string,
): "category" | "tag" | null {
  let decoded = segment;
  try {
    decoded = decodeURIComponent(segment);
  } catch {}
  const normalized = decoded.trim().toLowerCase();

  if (CATEGORY_ALIASES.has(normalized)) return "category";
  if (TAG_ALIASES.has(normalized)) return "tag";
  return null;
}

export function getAllBlogTaxonomySegments(): string[] {
  return Array.from(new Set([...CATEGORY_ALIASES, ...TAG_ALIASES]));
}

export const CHECKOUT_LOCALIZED_PATHS: Record<string, string> = {
  en: "/checkout",
  ar: "/الدفع",
  ru: "/оплата",
  es: "/pago",
  zh: "/结算",
  fr: "/paiement",
  de: "/kasse",
  ro: "/finalizare",
  tr: "/odeme",
};

export function getLocalizedCheckoutPath(locale: string): string {
  return CHECKOUT_LOCALIZED_PATHS[locale] || "/checkout";
}
