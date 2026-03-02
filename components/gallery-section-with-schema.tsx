import {
  createSchemaConfig,
  generateImageGallerySchema,
  type ImageGalleryData,
  JsonLd,
} from "@/lib/structured-data";
import { GallerySection } from "./gallery-section";

const galleryImages = [
  {
    id: 1,
    src: "/gallery/couple_photoshoot_in_istanbul.webp",
    alt: "Professional couple photoshoot Istanbul Balat romantic session with city skyline",
    category: "couple",
  },
  {
    id: 2,
    src: "/gallery/istanbul_couple_photoshoot_1.webp",
    alt: "Istanbul couple photography session romantic poses historic Galata Tower professional photographer",
    category: "couple",
  },
  {
    id: 3,
    src: "/gallery/istanbul_couple_photoshoot.webp",
    alt: "Istanbul ortaköy couple photoshoot panoramic city view Bosphorus professional photography session",
    category: "couple",
  },
  {
    id: 4,
    src: "/gallery/istanbul_photographer_1.webp",
    alt: "Professional Istanbul photographer portrait session premium quality studio lighting techniques",
    category: "company",
  },
  {
    id: 5,
    src: "/gallery/istanbul_fashion_photoshoot.webp",
    alt: "Istanbul Topkapı Palace Photoshoot, city skyline panoramic view professional photographer sunset session",
    category: "rooftop",
  },
  {
    id: 6,
    src: "/gallery/istanbul_rooftop_photoshoot.webp",
    alt: "Couple rooftop photoshoot Istanbul Galata Tower view romantic session professional photographer",
    category: "rooftop",
  },
  {
    id: 7,
    src: "/gallery/istanbul_wedding_photographer_1.webp",
    alt: "Istanbul wedding photographer professional ceremony photography Ortaköy historic venue",
    category: "wedding",
  },
  {
    id: 8,
    src: "/gallery/istanbul_wedding_photographer.webp",
    alt: "Professional wedding photography Istanbul historic landmarks Blue Mosque ceremony session",
    category: "wedding",
  },
];

export async function GallerySectionWithSchema({
  locale = "en",
}: {
  locale?: string;
} = {}) {
  // Create schema configuration
  const schemaConfig = createSchemaConfig(locale);

  // Convert gallery images to ImageGalleryData format
  const imageGalleryData: ImageGalleryData[] = galleryImages.map((image) => ({
    name: `Istanbul Photography - ${image.category} ${image.id}`,
    description: image.alt,
    url: `${schemaConfig.baseUrl}#gallery-image-${image.id}`,
    contentUrl: `${schemaConfig.baseUrl}${image.src}`,
    thumbnailUrl: `${schemaConfig.baseUrl}${image.src}`,
    width: 800,
    height: 600,
    caption: image.alt,
    creditText: "Photography by Uğur Cankurt - Istanbul Portrait Photographer",
    license: `${schemaConfig.baseUrl}/privacy#image-license`,
    copyrightNotice: `© ${new Date().getFullYear()} Istanbul Portrait - Uğur Cankurt`,
    acquireLicensePage: `${schemaConfig.baseUrl}/contact`,
  }));

  // Generate ImageGallery schema for carousel rich results
  const imageGallerySchema = generateImageGallerySchema(
    imageGalleryData,
    "Istanbul Photography Portfolio",
    schemaConfig,
  );

  return (
    <>
      {/* JSON-LD Schema for Image Gallery */}
      <JsonLd data={imageGallerySchema} />

      <GallerySection />
    </>
  );
}
