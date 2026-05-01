import { NextRequest, NextResponse } from "next/server";
import { packagesService } from "@/lib/packages-service";
import { availabilityService } from "@/lib/availability-service";
import { requireOctoAuth, octoUnauthorizedResponse } from "@/lib/octo-auth";
import { 
  Product, 
  DeliveryFormat, 
  DeliveryMethod, 
  RedemptionMethod, 
  AvailabilityType,
  DurationUnit,
  ContactField,
  UnitType,
  FeatureType,
  MediaType,
  MediaRel
} from "@octocloud/types";

export async function GET(request: NextRequest) {
  // 1. Authenticate Request
  if (!requireOctoAuth(request)) {
    return octoUnauthorizedResponse();
  }

  try {
    // 2. Fetch Packages and Availability Settings from DB
    const [packages, settings] = await Promise.all([
      packagesService.getActivePackages(),
      availabilityService.getSettings()
    ]);

    // 3. Generate dynamic start times (every 30 mins) based on settings
    const startHour = parseInt(settings.start_time.split(":")[0]) || 6;
    const endHour = parseInt(settings.end_time.split(":")[0]) || 20;
    const dynamicStartTimes: string[] = [];
    
    for (let h = startHour; h <= endHour; h++) {
      for (const m of ["00", "30"]) {
        dynamicStartTimes.push(`${h.toString().padStart(2, "0")}:${m}`);
      }
    }

    // 4. Map to OCTO Product Schema
    const octoProducts: Product[] = packages.map((pkg) => {
      // Parse duration from string (e.g. "2 hours" or "45 mins")
      const durStr = (pkg.duration?.en || "").toLowerCase();
      let durationMins = 120; // fallback
      if (durStr.includes("hour")) {
        const h = parseFloat(durStr);
        if (!isNaN(h)) durationMins = h * 60;
      } else if (durStr.includes("min")) {
        const m = parseInt(durStr);
        if (!isNaN(m)) durationMins = m;
      }

      return {
        id: pkg.id,
        internalName: pkg.title?.en || "Photography Package",
        reference: pkg.slug,
        locale: "en",
        timeZone: "Europe/Istanbul",
        allowFreesale: false,
        instantConfirmation: true,
        instantDelivery: true,
        availabilityRequired: true,
        availabilityType: AvailabilityType.START_TIME,
        deliveryFormats: [DeliveryFormat.PDF_URL, DeliveryFormat.QRCODE],
        deliveryMethods: [DeliveryMethod.VOUCHER],
        redemptionMethod: RedemptionMethod.DIGITAL,
        
        // -- OCTO CONTENT CAPABILITY FIELDS --
        title: pkg.title?.en || "Photography Package",
        description: pkg.description?.en || "Beautiful photography experience in Istanbul.",
        shortDescription: pkg.description?.en ? pkg.description.en.substring(0, 150) + "..." : "Photography experience in Istanbul.",
        durationMinutesFrom: durationMins, 
        durationMinutesTo: durationMins,
        features: pkg.features?.en ? pkg.features.en.map((f: string) => ({
          type: FeatureType.INCLUSION,
          description: f,
          shortDescription: null
        })) : [],
        media: pkg.cover_image ? [{
          url: pkg.cover_image,
          type: MediaType.IMAGE_JPEG,
          primary: true,
          src: pkg.cover_image,
          rel: MediaRel.COVER,
          title: pkg.title?.en || "Cover Image",
          caption: pkg.title?.en || "Cover Image",
          copyright: "Istanbul Portrait"
        }] : [],
        // ------------------------------------

        options: [
          {
            id: `opt_${pkg.id}`,
            default: true,
            internalName: "Standard",
            reference: "standard",
            title: "Standard Shoot",
            availabilityLocalStartTimes: dynamicStartTimes,
            cancellationCutoff: "24 hours before the activity",
            cancellationCutoffAmount: 24,
            cancellationCutoffUnit: DurationUnit.HOUR,
            pricingFrom: [{
              original: Math.round(pkg.price * 100),
              retail: Math.round(pkg.price * 100),
              net: Math.round(pkg.price * 0.9 * 100),
              currency: "EUR",
              currencyPrecision: 2,
              includedTaxes: []
            }],
            requiredContactFields: [
              ContactField.FIRST_NAME, 
              ContactField.LAST_NAME, 
              ContactField.EMAIL_ADDRESS, 
              ContactField.PHONE_NUMBER
            ],
            restrictions: {
              minPaxCount: 1,
              maxPaxCount: 10,
              hasAdultRequirement: false,
              minUnits: 1,
              maxUnits: 10
            },
            units: [
              {
                id: `unit_${pkg.id}_adult`,
                internalName: "Adult",
                reference: "adult",
                type: UnitType.ADULT,
                requiredContactFields: [
                  ContactField.FIRST_NAME, 
                  ContactField.LAST_NAME
                ],
                restrictions: {
                  minAge: 18,
                  maxAge: 99,
                  idRequired: false,
                  minQuantity: 1,
                  maxQuantity: 10,
                  paxCount: 1,
                  accompaniedBy: []
                },
                pricingFrom: [{
                  original: Math.round(pkg.price * 100),
                  retail: Math.round(pkg.price * 100),
                  net: Math.round(pkg.price * 0.9 * 100),
                  currency: "EUR",
                  currencyPrecision: 2,
                  includedTaxes: []
                }]
              }
            ]
          }
        ]
      };
    });

    return NextResponse.json(octoProducts);
  } catch (error) {
    console.error("OCTO API Error - Products:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: "Failed to fetch products" },
      { status: 500 }
    );
  }
}
