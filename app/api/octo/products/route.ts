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
  UnitType
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
      options: [
        {
          id: `opt_${pkg.id}`,
          default: true,
          internalName: "Standard",
          reference: "standard",
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
