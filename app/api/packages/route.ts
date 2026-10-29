import { NextResponse } from "next/server";
import { packagesService } from "@/lib/packages-service";
import { pagesContentService } from "@/lib/pages-content-service";
import { getBaseUrl } from "@/lib/seo-utils";
import { generateNativeSlug } from "@/lib/slug-generator";

export const revalidate = 1800;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const locale = (searchParams.get("locale") || "en").toLowerCase();
  const query = (searchParams.get("query") || "").trim().toLowerCase();
  const maxPriceParam = searchParams.get("maxPrice");
  const maxPrice = maxPriceParam ? Number(maxPriceParam) : null;

  const [packages, corePages] = await Promise.all([
    packagesService.getActivePackages(),
    pagesContentService.getAllPages(),
  ]);

  const baseUrl = getBaseUrl().replace(/\/+$/, "");
  const packagesParent = corePages.find((p) => p.slug === "packages");
  const packagesSeg =
    packagesParent?.title?.[locale] || packagesParent?.title?.en
      ? generateNativeSlug(
          packagesParent?.title?.[locale] ||
            packagesParent?.title?.en ||
            "packages",
        )
      : "packages";

  const items = packages
    .map((pkg) => {
      const title = pkg.title?.[locale] || pkg.title?.en || pkg.slug;
      const description =
        pkg.description?.[locale] ||
        pkg.description?.en ||
        pkg.meta_description?.[locale] ||
        pkg.meta_description?.en ||
        "";
      const duration = pkg.duration?.[locale] || pkg.duration?.en || "1 Hour";
      const features = pkg.features?.[locale] || pkg.features?.en || [];
      const localizedSlug =
        pkg.title?.[locale] || pkg.title?.en
          ? generateNativeSlug(
              pkg.title?.[locale] || pkg.title?.en || pkg.slug,
            ) || pkg.slug
          : pkg.slug;

      return {
        id: pkg.id,
        slug: pkg.slug,
        title,
        description,
        price: pkg.price,
        originalPrice: pkg.original_price,
        currency: "EUR",
        isPerPerson: pkg.is_per_person,
        isPopular: pkg.is_popular,
        duration,
        locationsCount: pkg.locations,
        features,
        url: `${baseUrl}/${locale}/${packagesSeg}/${localizedSlug}`,
      };
    })
    .filter((item) => {
      if (
        maxPrice !== null &&
        !Number.isNaN(maxPrice) &&
        item.price > maxPrice
      ) {
        return false;
      }
      if (query) {
        const haystack =
          `${item.slug} ${item.title} ${item.description} ${item.features.join(" ")}`.toLowerCase();
        return haystack.includes(query);
      }
      return true;
    });

  return NextResponse.json(
    {
      count: items.length,
      currency: "EUR",
      locale,
      packages: items,
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600",
      },
    },
  );
}
