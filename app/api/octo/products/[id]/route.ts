import { NextRequest, NextResponse } from "next/server";
import { packagesService } from "@/lib/packages-service";
import { availabilityService } from "@/lib/availability-service";
import { requireOctoAuth, octoUnauthorizedResponse } from "@/lib/octo-auth";
import { mapPackageToOctoProduct } from "../route";

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  // 1. Authenticate Request
  if (!requireOctoAuth(request)) {
    return octoUnauthorizedResponse();
  }

  try {
    const params = await props.params;
    
    // 2. Fetch the specific package and availability settings
    const [pkg, settings] = await Promise.all([
      packagesService.getPackageById(params.id),
      availabilityService.getSettings()
    ]);

    // 3. Handle INVALID_PRODUCT_ID (400 Bad Request per OCTO spec)
    if (!pkg || !pkg.is_active) {
      return NextResponse.json(
        {
          error: "INVALID_PRODUCT_ID",
          errorMessage: `Product with ID ${params.id} was not found or is inactive.`,
          productId: params.id
        },
        { status: 400 } // OCTO spec strictly requires 400, not 404
      );
    }

    // Parse requested locale from Accept-Language header
    const acceptLanguage = request.headers.get("accept-language")?.toLowerCase() || "";
    let reqLocale = "en";
    const supportedLocales = ["tr", "ru", "es", "ar", "de", "fr", "ro", "zh"];
    for (const loc of supportedLocales) {
      if (acceptLanguage.includes(loc)) {
        reqLocale = loc;
        break;
      }
    }

    // Generate dynamic start times (every 30 mins) based on settings
    const startHour = parseInt(settings.start_time.split(":")[0]) || 6;
    const endHour = parseInt(settings.end_time.split(":")[0]) || 20;
    const dynamicStartTimes: string[] = [];
    
    for (let h = startHour; h <= endHour; h++) {
      for (const m of ["00", "30"]) {
        dynamicStartTimes.push(`${h.toString().padStart(2, "0")}:${m}`);
      }
    }

    // 4. Map to OCTO Product Schema using the shared mapper
    const octoProduct = mapPackageToOctoProduct(pkg, reqLocale, dynamicStartTimes);

    return NextResponse.json(octoProduct, {
      headers: {
        "Content-Language": reqLocale
      }
    });

  } catch (error) {
    console.error(`OCTO API Error - Get Product:`, error);
    return NextResponse.json(
      { error: "Internal Server Error", message: "Failed to fetch product" },
      { status: 500 }
    );
  }
}
