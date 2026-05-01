import { NextRequest, NextResponse } from "next/server";
import { requireOctoAuth, octoUnauthorizedResponse } from "@/lib/octo-auth";
import { settingsService } from "@/lib/settings-service";

export async function GET(request: NextRequest) {
  // 1. Authenticate Request
  if (!requireOctoAuth(request)) {
    return octoUnauthorizedResponse();
  }

  // 2. Fetch Dynamic Settings from Supabase
  const settings = await settingsService.getSettings();

  // 3. Return Supplier Details
  const supplier = {
    id: "istanbul-portrait-supplier-001",
    name: settings?.site_name || "Istanbul Portrait",
    endpoint: `${process.env.NEXT_PUBLIC_BASE_URL || "https://istanbulportrait.com"}/api/octo`,
    contact: {
      website: process.env.NEXT_PUBLIC_BASE_URL || "https://istanbulportrait.com",
      email: settings?.contact_email || process.env.NEXT_PUBLIC_ADMIN_EMAIL || "info@istanbulportrait.com",
      telephone: settings?.contact_phone || "+905367093724", 
      address: settings?.address?.en || "Istanbul, Turkey"
    }
  };

  return NextResponse.json(supplier);
}
