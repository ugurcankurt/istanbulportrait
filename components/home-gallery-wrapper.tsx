import dynamic from "next/dynamic";


const GallerySection = dynamic(() =>
  import("./gallery-section").then((mod) => mod.GallerySection),
);

import type { PackageDB } from "@/lib/packages-service";

export async function HomeGalleryWrapper({
  locale = "en",
  header,
  packages = [],
}: {
  locale?: string;
  header?: React.ReactNode;
  packages?: PackageDB[];
} = {}) {


  // Extract all distinct images from active packages for portfolio display
  // We prioritize cover images and mix in some gallery images dynamically
  const galleryImages = packages
    .flatMap((pkg) => {
      const packageTitle = pkg.title[locale] || pkg.title.en || pkg.slug;
      const imagesList = [];
      if (pkg.cover_image) {
        imagesList.push({
          id: `${pkg.slug}-cover`,
          src: pkg.cover_image,
          alt: `Istanbul Photography ${packageTitle}`,
          category: pkg.slug,
        });
      }
      if (pkg.gallery_images && Array.isArray(pkg.gallery_images)) {
        pkg.gallery_images.forEach((src, idx) => {
          imagesList.push({
            id: `${pkg.slug}-gallery-${idx}`,
            src,
            alt: `${packageTitle} Portfolio in Istanbul`,
            category: pkg.slug,
          });
        });
      }
      return imagesList;
    });



  return (
    <>

      <GallerySection header={header} images={galleryImages} />
    </>
  );
}
