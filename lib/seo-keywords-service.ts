import { cache } from "react";
import { packagesService, type PackageDB } from "./packages-service";

export interface SeoKeywordIntent {
  slug: string;
  title: Record<string, string>;
  description: Record<string, string>;
  cover_image: string;
  related_packages: string[]; // Slugs of packages to feature
}

// Temporary in-memory database until Supabase table is created
const KEYWORD_INTENTS: SeoKeywordIntent[] = [
  {
    slug: "istanbul-secret-proposal",
    title: {
      en: "Istanbul Secret Proposal Photography",
      tr: "İstanbul Gizli Evlilik Teklifi Çekimi",
      ru: "Секретное предложение в Стамбуле Фотосессия"
    },
    description: {
      en: "Capture your special moment with our discreet and professional secret proposal photography services in Istanbul.",
      tr: "İstanbul'daki gizli evlilik teklifi anınızı profesyonel fotoğrafçılarımızla ölümsüzleştirin.",
      ru: "Запечатлейте свой особенный момент с помощью наших скрытых и профессиональных услуг по фотосъемке предложений в Стамбуле."
    },
    cover_image: "/images/locations/ortakoy-hero.webp",
    related_packages: ["secret-proposal", "couples-photoshoot"]
  },
  {
    slug: "flying-dress-photoshoot",
    title: {
      en: "Flying Dress Photoshoot in Turkey",
      tr: "Uçuşan Elbise Fotoğraf Çekimi",
      ru: "Фотосессия в летящем платье в Турции"
    },
    description: {
      en: "Experience the magic of a flying dress photoshoot in the most iconic locations. Feel like a goddess.",
      tr: "En ikonik mekanlarda uçuşan elbise fotoğraf çekiminin büyüsünü yaşayın.",
      ru: "Почувствуйте магию фотосессии в летящем платье в самых знаковых местах."
    },
    cover_image: "/images/locations/galata-tower-hero.webp", // Adjust if there's a better one
    related_packages: ["solo-photoshoot", "couples-photoshoot"]
  },
  {
    slug: "solo-traveler-photography",
    title: {
      en: "Solo Traveler Photography in Istanbul",
      tr: "Yalnız Gezginler İçin İstanbul Fotoğraf Çekimi",
      ru: "Фотосъемка одиночных путешественников в Стамбуле"
    },
    description: {
      en: "Traveling alone? Let our professional photographers capture your best moments exploring Istanbul.",
      tr: "Yalnız mı seyahat ediyorsunuz? Profesyonel fotoğrafçılarımız İstanbul'u keşfederken en iyi anlarınızı yakalasın.",
      ru: "Путешествуете в одиночку? Пусть наши профессиональные фотографы запечатлеют ваши лучшие моменты во время знакомства со Стамбулом."
    },
    cover_image: "/images/locations/hagia-sophia-hero.webp",
    related_packages: ["solo-photoshoot"]
  }
];

export const seoKeywordsService = {
  /**
   * Get all defined search intents
   */
  getAllIntents: cache(async (): Promise<SeoKeywordIntent[]> => {
    return KEYWORD_INTENTS;
  }),

  /**
   * Get a specific intent by its slug
   */
  getIntentBySlug: cache(async (slug: string): Promise<SeoKeywordIntent | null> => {
    const intent = KEYWORD_INTENTS.find((k) => k.slug === slug);
    return intent || null;
  }),

  /**
   * Get packages associated with a specific intent
   */
  getPackagesForIntent: cache(async (intent: SeoKeywordIntent): Promise<PackageDB[]> => {
    const allPackages = await packagesService.getActivePackages();
    return allPackages.filter(pkg => intent.related_packages.includes(pkg.slug));
  })
};
