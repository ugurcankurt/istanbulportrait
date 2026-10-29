import { NextResponse } from "next/server";
import { packagesService } from "@/lib/packages-service";
import { getBaseUrl } from "@/lib/seo-utils";
import { settingsService } from "@/lib/settings-service";

export const revalidate = 3600;

export async function GET() {
  const [settings, activePackages] = await Promise.all([
    settingsService.getSettings(),
    packagesService.getActivePackages(),
  ]);

  const baseUrl = (settings.app_base_url || getBaseUrl()).replace(/\/+$/, "");
  const domain = new URL(baseUrl).hostname.replace(/^www\./, "");
  const siteName = settings.site_name || "Istanbul Portrait";
  const rawLatestUpdate =
    activePackages.reduce((latest, pkg) => {
      const t = pkg.updated_at || pkg.created_at || "";
      return t > latest ? t : latest;
    }, "") || new Date().toISOString();

  const formattedUpdatedAt = new Date(rawLatestUpdate).toISOString();
  const packageSlugs = activePackages.map((p) => p.slug).join(", ");

  // Conforms strictly to https://raw.githubusercontent.com/ards-project/ard-spec/main/spec/schemas/ai-catalog.schema.json
  const catalog = {
    specVersion: "1.0",
    host: {
      displayName: siteName,
      identifier: `did:web:${domain}`,
      documentationUrl: `${baseUrl}/llms.txt`,
      ...(settings.logo_url ? { logoUrl: settings.logo_url } : {}),
    },
    entries: [
      {
        identifier: `urn:air:${domain}:docs:llms-txt`,
        displayName: `${siteName} LLM Context & Guide`,
        type: 'text/markdown; profile="urn:air:agent-skills"',
        description: `Structured Markdown overview of ${siteName} photography packages (${packageSlugs || "all packages"}), iconic Istanbul locations, EUR pricing, and travel guides.`,
        url: `${baseUrl}/llms.txt`,
        version: "1.0.0",
        updatedAt: formattedUpdatedAt,
        tags: ["photography", "istanbul", "travel", "packages", "llms-txt"],
        capabilities: [
          "content-discovery",
          "package-comparison",
          "location-guide",
        ],
        representativeQueries: [
          "best photoshoot packages and prices in Istanbul",
          "flying dress rooftop photoshoot in Istanbul price",
          "best time and locations for couple photography in Istanbul",
        ],
      },
      {
        identifier: `urn:air:${domain}:mcp:packages`,
        displayName: `${siteName} Packages Catalog API`,
        type: "application/mcp-server-card+json",
        description:
          "Public JSON catalog of active photography packages in Istanbul with real-time EUR pricing, duration, included features, and booking URLs. Supports optional ?locale=, ?query=, and ?maxPrice= parameters.",
        url: `${baseUrl}/api/packages`,
        version: "1.0.0",
        updatedAt: formattedUpdatedAt,
        tags: ["packages", "pricing", "photoshoot", "istanbul", "catalog"],
        capabilities: ["catalog-search", "price-lookup"],
        representativeQueries: [
          "list available photography packages in Istanbul",
          "compare Istanbul Portrait packages and durations",
          "find couple or solo photoshoot package in Istanbul under 300 EUR",
        ],
      },
      {
        identifier: `urn:air:${domain}:mcp:availability`,
        displayName: `${siteName} Booking Availability API`,
        type: "application/mcp-server-card+json",
        description:
          "Check real-time available and blocked 30-minute photoshoot time slots in Istanbul via GET ?date=YYYY-MM-DD&packageId=<slug>.",
        url: `${baseUrl}/api/booking/availability`,
        version: "1.0.0",
        updatedAt: formattedUpdatedAt,
        tags: ["booking", "availability", "schedule", "istanbul"],
        capabilities: ["availability-check", "scheduling"],
        representativeQueries: [
          "what photoshoot time slots are available in Istanbul on a specific date",
          "check availability for rooftop photoshoot in Istanbul",
          "is sunrise photoshoot slot open for booking",
        ],
      },
    ],
  };

  return NextResponse.json(catalog, {
    status: 200,
    headers: {
      "Content-Type": "application/ai-catalog+json; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      "X-Robots-Tag": "all",
    },
  });
}
