import { revalidateTag, unstable_cache } from "next/cache";
import { cache } from "react";
import { availabilityService } from "@/lib/availability-service";
import { discountService } from "@/lib/discount-service";
import { packagesService } from "@/lib/packages-service";
import { supabaseAdmin } from "@/lib/supabase";

const fetchActivePackagesCached = unstable_cache(
  async () => packagesService.getActivePackages(),
  ["active-packages"],
  { tags: ["packages"], revalidate: 60 },
);

const fetchActiveDiscountsCached = unstable_cache(
  async () => discountService.getActiveDiscounts(),
  ["active-discounts"],
  { tags: ["discounts"], revalidate: 60 },
);

const fetchTimeSurchargesCached = unstable_cache(
  async () => availabilityService.getTimeSurcharges(),
  ["time-surcharges"],
  { tags: ["availability"], revalidate: 60 },
);

const fetchCompletedBookingsCountCached = unstable_cache(
  async (): Promise<number> => {
    try {
      const { count, error } = await supabaseAdmin
        .from("bookings")
        .select("id", { count: "exact", head: true })
        .eq("status", "completed");

      if (error) {
        console.error("Error counting completed bookings:", error);
        return 0;
      }

      return count ?? 0;
    } catch (error) {
      console.error("Unexpected error counting completed bookings:", error);
      return 0;
    }
  },
  ["completed-bookings-count"],
  { tags: ["bookings-stats"], revalidate: 60 },
);

/**
 * Server-only request-deduped + cross-request cached fetchers aligned with 60s ISR.
 * Kept isolated from client-imported service files so `next/cache` never enters client bundles.
 */
export const getCachedActivePackages = cache(() => fetchActivePackagesCached());
export const getCachedActiveDiscounts = cache(() =>
  fetchActiveDiscountsCached(),
);
export const getCachedTimeSurcharges = cache(() => fetchTimeSurchargesCached());
export const getCachedCompletedBookingsCount = cache(() =>
  fetchCompletedBookingsCountCached(),
);

export function revalidatePublicPackagesCache() {
  revalidateTag("packages", "max");
}

export function revalidatePublicDiscountsCache() {
  revalidateTag("discounts", "max");
}

export function revalidatePublicBookingsStatsCache() {
  revalidateTag("bookings-stats", "max");
}
