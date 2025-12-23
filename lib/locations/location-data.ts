/**
 * Istanbul Photography Locations Data
 * 
 * Static data sourced from Wikidata for SEO optimization.
 * Run `npm run update-locations` to refresh from Wikidata API.
 */

export interface LocationData {
    slug: string;
    wikidataId: string;
    coordinates: {
        lat: number;
        lng: number;
    };
    images: {
        hero: string;
        gallery: string[];
    };
    bestTime: string;
    photographyTips: string[];
    nearbyLocations: string[];
    tags: string[];
}

export const LOCATIONS: LocationData[] = [
    {
        slug: "galata-tower",
        wikidataId: "Q181862",
        coordinates: { lat: 41.0256, lng: 28.9744 },
        images: {
            hero: "/images/locations/galata-tower-hero.webp",
            gallery: [
                "/images/locations/galata-tower-1.webp",
                "/images/locations/galata-tower-2.webp",
            ],
        },
        bestTime: "sunset",
        photographyTips: ["golden_hour", "rooftop_view", "cobblestone_streets"],
        nearbyLocations: ["camondo-stairs", "galata-bridge"],
        tags: ["historic", "iconic", "rooftop", "couple"],
    },
    {
        slug: "balat",
        wikidataId: "Q2313872",
        coordinates: { lat: 41.0303, lng: 28.9481 },
        images: {
            hero: "/images/locations/balat-hero.webp",
            gallery: [
                "/images/locations/balat-1.webp",
                "/images/locations/balat-2.webp",
            ],
        },
        bestTime: "morning",
        photographyTips: ["colorful_houses", "narrow_streets", "local_cafes"],
        nearbyLocations: ["suleymaniye", "galata-tower"],
        tags: ["colorful", "historic", "instagram", "couple", "solo"],
    },
    {
        slug: "ortakoy",
        wikidataId: "Q1662306",
        coordinates: { lat: 41.0479, lng: 29.0273 },
        images: {
            hero: "/images/locations/ortakoy-hero.webp",
            gallery: [
                "/images/locations/ortakoy-1.webp",
                "/images/locations/ortakoy-2.webp",
            ],
        },
        bestTime: "sunset",
        photographyTips: ["mosque_bridge", "bosphorus_view", "street_food"],
        nearbyLocations: ["bosphorus-rooftop", "galata-tower"],
        tags: ["bosphorus", "mosque", "bridge", "romantic"],
    },
    {
        slug: "hagia-sophia",
        wikidataId: "Q12506",
        coordinates: { lat: 41.0086, lng: 28.9802 },
        images: {
            hero: "/images/locations/hagia-sophia-hero.webp",
            gallery: [
                "/images/locations/hagia-sophia-1.webp",
                "/images/locations/hagia-sophia-2.webp",
            ],
        },
        bestTime: "early_morning",
        photographyTips: ["exterior_shots", "fountain_reflection", "sultanahmet_square"],
        nearbyLocations: ["blue-mosque", "topkapi"],
        tags: ["historic", "unesco", "iconic", "architecture"],
    },
    {
        slug: "blue-mosque",
        wikidataId: "Q194342",
        coordinates: { lat: 41.0054, lng: 28.9768 },
        images: {
            hero: "/images/locations/blue-mosque-hero.webp",
            gallery: [
                "/images/locations/blue-mosque-1.webp",
                "/images/locations/blue-mosque-2.webp",
            ],
        },
        bestTime: "sunrise",
        photographyTips: ["six_minarets", "courtyard", "garden_view"],
        nearbyLocations: ["hagia-sophia", "hippodrome"],
        tags: ["historic", "mosque", "iconic", "architecture"],
    },
    {
        slug: "bosphorus-rooftop",
        wikidataId: "Q124089",
        coordinates: { lat: 41.04, lng: 29.01 },
        images: {
            hero: "/images/locations/bosphorus-rooftop-hero.webp",
            gallery: [
                "/images/locations/bosphorus-rooftop-1.webp",
                "/images/locations/bosphorus-rooftop-2.webp",
            ],
        },
        bestTime: "golden_hour",
        photographyTips: ["panoramic_view", "flying_dress", "sunset_silhouette"],
        nearbyLocations: ["galata-tower", "ortakoy"],
        tags: ["rooftop", "panoramic", "romantic", "premium"],
    },
    {
        slug: "suleymaniye",
        wikidataId: "Q133458",
        coordinates: { lat: 41.0163, lng: 28.9641 },
        images: {
            hero: "/images/locations/suleymaniye-hero.webp",
            gallery: [
                "/images/locations/suleymaniye-1.webp",
                "/images/locations/suleymaniye-2.webp",
            ],
        },
        bestTime: "afternoon",
        photographyTips: ["terrace_view", "golden_horn", "ottoman_architecture"],
        nearbyLocations: ["camondo-stairs", "balat"],
        tags: ["historic", "mosque", "panoramic", "architecture"],
    },
    {
        slug: "camondo-stairs",
        wikidataId: "Q6027749",
        coordinates: { lat: 41.024, lng: 28.974 },
        images: {
            hero: "/images/locations/camondo-stairs-hero.webp",
            gallery: [
                "/images/locations/camondo-stairs-1.webp",
                "/images/locations/camondo-stairs-2.webp",
            ],
        },
        bestTime: "morning",
        photographyTips: ["art_nouveau", "symmetry", "spiral_view"],
        nearbyLocations: ["galata-tower", "galata-bridge"],
        tags: ["historic", "architecture", "instagram", "solo"],
    },
    {
        slug: "galata-bridge",
        wikidataId: "Q81523",
        coordinates: { lat: 41.02, lng: 28.973 },
        images: {
            hero: "/images/locations/galata-bridge-hero.webp",
            gallery: [
                "/images/locations/galata-bridge-1.webp",
                "/images/locations/galata-bridge-2.webp",
            ],
        },
        bestTime: "sunset",
        photographyTips: ["golden_horn_view", "fishermen", "mosque_skyline"],
        nearbyLocations: ["galata-tower", "camondo-stairs"],
        tags: ["historic", "bosphorus", "iconic", "couple"],
    },
];

// Helper functions
export function getLocationBySlug(slug: string): LocationData | undefined {
    return LOCATIONS.find((loc) => loc.slug === slug);
}

export function getAllLocationSlugs(): string[] {
    return LOCATIONS.map((loc) => loc.slug);
}

export function getLocationsByTag(tag: string): LocationData[] {
    return LOCATIONS.filter((loc) => loc.tags.includes(tag));
}
