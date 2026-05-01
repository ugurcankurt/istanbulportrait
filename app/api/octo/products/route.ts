import { NextRequest, NextResponse } from "next/server";
import { packagesService } from "@/lib/packages-service";
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
    // 2. Fetch Packages from DB
    const packages = await packagesService.getActivePackages();

    // 3. Map to OCTO Product Schema
    const octoProducts: Product[] = packages.map((pkg) => ({
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
      durationMinutesFrom: 120, // Defaulting to 2 hours
      durationMinutesTo: 180,
      features: pkg.features?.en ? pkg.features.en.map(f => ({
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
          title: "Standard Shoot", // Added title for content
          availabilityLocalStartTimes: ["10:00", "14:00", "16:00"],
          cancellationCutoff: "24 hours before the activity",
          cancellationCutoffAmount: 24,
          cancellationCutoffUnit: DurationUnit.HOUR,
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
              }
            }
          ]
        }
      ]
    }));

    return NextResponse.json(octoProducts);
  } catch (error) {
    console.error("OCTO API Error - Products:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: "Failed to fetch products" },
      { status: 500 }
    );
  }
}
