import { LOCATIONS } from "@/lib/locations/location-data";

export const PACKAGES = {
    essential: {
        title: "Essential",
        price: 150,
        currency: "€",
        isPerPerson: false,
        duration: "30 Minutes",
        photos: "15 Edited Photos",
        locations: "1 Location",
        features: [
            "Professional photographer",
            "30 minute photoshoot",
            "15 high-resolution edited photos",
            "Online gallery delivery",
            "Basic retouching included"
        ]
    },
    premium: {
        title: "Premium",
        price: 280,
        currency: "€",
        isPerPerson: false,
        duration: "1.5 Hours",
        photos: "40 Edited Photos",
        locations: "2 Locations",
        features: [
            "Professional photographer",
            "1.5 hour photoshoot",
            "40 high-resolution edited photos",
            "2 different locations",
            "Advanced retouching",
            "Same day preview"
        ]
    },
    luxury: {
        title: "Luxury",
        price: 450,
        currency: "€",
        isPerPerson: false,
        duration: "2.5 Hours",
        photos: "80 Edited Photos",
        locations: "3 Locations",
        features: [
            "Professional photographer",
            "2.5 hour photoshoot",
            "80 high-resolution edited photos",
            "3 premium locations",
            "Professional retouching",
            "Same day preview",
            "Styling consultation"
        ]
    },
    rooftop: {
        title: "Rooftop Photoshoot",
        price: 150,
        currency: "€",
        isPerPerson: true,
        duration: "Standard Session",
        photos: "20 Edited Photos",
        locations: "Rooftop Studio",
        features: [
            "Professional photographer",
            "20 high-resolution edited photos",
            "1 modern long tail dress or traditional dress",
            "2 mobile reels video",
            "Rooftop studio fee included",
            "Professional retouching"
        ]
    }
};

export function getSystemContext(): string {
    let context = "### 1. AVAILABLE PACKAGES (STRICTLY ADHERE TO THESE)\n";

    Object.entries(PACKAGES).forEach(([key, pkg]) => {
        const priceStr = pkg.isPerPerson
            ? `${pkg.currency}${pkg.price} PER PERSON`
            : `${pkg.currency}${pkg.price}`;

        context += `\n**${pkg.title}** (${key.toUpperCase()})\n`;
        context += `- Price: ${priceStr}\n`;
        context += `- Duration: ${pkg.duration}\n`;
        context += `- Includes: ${pkg.photos}, ${pkg.locations}\n`;
        context += `- Key Features: ${pkg.features.join(", ")}\n`;
    });

    context += "\n### 2. PHOTOGRAPHY LOCATIONS\n";
    LOCATIONS.forEach(loc => {
        context += `\n**${loc.slug.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ')}**\n`;
        context += `- Best Time: ${loc.bestTime}\n`;
        context += `- Style/Tags: ${loc.tags.join(", ")}\n`;
    });

    return context;
}
