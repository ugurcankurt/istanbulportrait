import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { BreadcrumbNav } from "@/components/breadcrumb-nav";
import { PackageDetails } from "@/components/package-details";
import { SEO_CONFIG } from "@/lib/seo-config";
import { getPackageLocalizedPaths, getPackageOpenGraphUrl } from "@/lib/localized-url";
import { PackageId, packagePrices } from "@/lib/validations";
import { PACKAGES_DATA } from "@/lib/packages-data";

interface PackagePageProps {
    params: Promise<{
        locale: string;
        slug: string;
    }>;
}

// Map slugs to package IDs (assuming 1:1 mapping for now)
// In a real i18n scenario, we might need a more complex mapping
function getPackageIdFromSlug(slug: string): PackageId | null {
    if (slug in packagePrices) {
        return slug as PackageId;
    }
    return null;
}

export async function generateMetadata({ params }: PackagePageProps) {
    const { locale, slug } = await params;
    const packageId = getPackageIdFromSlug(slug);

    if (!packageId) {
        return {};
    }

    const t = await getTranslations({ locale, namespace: `packages.${packageId}` });
    const tSeo = await getTranslations({ locale, namespace: "seo.packages" });

    const paths = getPackageLocalizedPaths(slug);

    return {
        title: `${t("title")} | ${tSeo("title")}`,
        description: tSeo("description"),
        alternates: {
            canonical: paths.canonical(locale),
        },
        openGraph: {
            title: `${t("title")} | ${tSeo("title")}`,
            description: tSeo("description"),
            // @ts-ignore - Validated by explicit helper
            url: getPackageOpenGraphUrl(slug, locale),
            siteName: SEO_CONFIG.organization.name,
            images: [
                {
                    url: PACKAGES_DATA[packageId].gallery[0], // Use first gallery image
                    width: 1200,
                    height: 630,
                    alt: t("title"),
                },
            ],
            locale,
            type: "website",
        },
    };
}

export default async function PackageDetailPage({ params }: PackagePageProps) {
    const { locale, slug } = await params;
    const packageId = getPackageIdFromSlug(slug);

    if (!packageId) {
        notFound();
    }

    return (
        <div>
            <BreadcrumbNav />
            <PackageDetails packageId={packageId} />
        </div>
    );
}
