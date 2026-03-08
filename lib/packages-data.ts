import { PackageId } from "./validations";

export interface PackageData {
    id: PackageId;
    gallery: string[];
}

export const PACKAGE_ALIASES: Record<PackageId, string> = {
    essential: "classic-istanbul-portrait",
    premium: "istanbul-discovery-photoshoot",
    luxury: "bosphorus-luxury-collection",
    rooftop: "flying-dress-rooftop",
};

export function getPackageIdFromAlias(alias: string): PackageId | null {
    const entry = Object.entries(PACKAGE_ALIASES).find(([_, v]) => v === alias);
    return entry ? (entry[0] as PackageId) : null;
}

export function getAliasFromPackageId(id: PackageId): string {
    return PACKAGE_ALIASES[id];
}

export const PACKAGES_DATA: Record<PackageId, PackageData> = {
    essential: {
        id: "essential",
        gallery: [
            "/images/locations/galata-bridge-2.webp",
            "/images/locations/galata-tower-1.webp",
            "/gallery/istanbul_photographer_1.webp",
            "/images/locations/camondo-stairs-1.webp",
            "/images/locations/balat-1.webp",
        ],
    },
    premium: {
        id: "premium",
        gallery: [
            "/gallery/istanbul_couple_photoshoot_1.webp",
            "/images/locations/ortakoy-1.webp",
            "/images/locations/blue-mosque-1.webp",
            "/images/locations/hagia-sophia-1.webp",
            "/images/locations/suleymaniye-1.webp",
        ],
    },
    luxury: {
        id: "luxury",
        gallery: [
            "/gallery/istanbul_wedding_photographer.webp",
            "/gallery/istanbul_wedding_photographer_1.webp",
            "/images/locations/ortakoy-hero.webp",
            "/images/locations/galata-tower-hero.webp",
            "/images/locations/blue-mosque-hero.webp",
        ],
    },
    rooftop: {
        id: "rooftop",
        gallery: [
            "/images/locations/bosphorus-rooftop-hero.webp",
            "/images/locations/bosphorus-rooftop-1.webp",
            "/images/locations/bosphorus-rooftop-2.webp",
            "/gallery/istanbul_rooftop_photoshoot.webp",
            "/gallery/istanbul_rooftop_photoshoot_2.webp",
        ],
    },
};
