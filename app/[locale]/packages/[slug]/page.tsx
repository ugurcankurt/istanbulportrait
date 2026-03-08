import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { BreadcrumbNav } from "@/components/breadcrumb-nav";
import { PackageDetails } from "@/components/package-details";
import { SEO_CONFIG } from "@/lib/seo-config";
import { getPackageLocalizedPaths, getPackageOpenGraphUrl } from "@/lib/localized-url";
import { PackageId } from "@/lib/validations";
import { PACKAGES_DATA, getPackageIdFromAlias, PACKAGE_ALIASES } from "@/lib/packages-data";

interface PackagePageProps {
    params: Promise<{
        locale: string;
        slug: string;
    }>;
}

// Map slugs to package IDs (using alias dictionary)
function getPackageIdFromSlug(slug: string): PackageId | null {
    // Attempt to map via alias first
    const mappedId = getPackageIdFromAlias(slug);
    if (mappedId) return mappedId;

    // Fallback: If someone visits the old 'essential' ID directly, map it too
    // so old links don't immediately break.
    if (slug in PACKAGES_DATA) {
        return slug as PackageId;
    }
    return null;
}

export async function generateStaticParams() {
    return Object.values(PACKAGE_ALIASES).map((slug) => ({
        slug,
    }));
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
