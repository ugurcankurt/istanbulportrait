import { NextRequest, NextResponse } from "next/server";
import { requireOctoAuth, octoUnauthorizedResponse } from "@/lib/octo-auth";
import { availabilityService } from "@/lib/availability-service";
import { Availability, AvailabilityStatus } from "@octocloud/types";

export async function POST(request: NextRequest) {
  // 1. Authenticate Request
  if (!requireOctoAuth(request)) {
    return octoUnauthorizedResponse();
  }

  try {
    const body = await request.json();
    const { productId, optionId, localDateStart, localDateEnd } = body;

    if (!productId || !localDateStart || !localDateEnd) {
      return NextResponse.json(
        { error: "Bad Request", message: "Missing required fields (productId, localDateStart, localDateEnd)" },
        { status: 400 }
      );
    }

    // 2. Fetch Availability Data from DB
    const settings = await availabilityService.getSettings();
    const blockedSlots = await availabilityService.getBlockedSlots();

    // In a full implementation, you would generate dates between localDateStart and localDateEnd
    // and check them against settings.start_time / end_time and blockedSlots.
    
    const availableSlots: Availability[] = [];
    
    // Simulate generating slots for the requested date range
    availableSlots.push({
      id: `${localDateStart}T10:00:00+03:00`,
      localDateTimeStart: `${localDateStart}T10:00:00+03:00`,
      localDateTimeEnd: `${localDateStart}T11:00:00+03:00`,
      allDay: false,
      status: AvailabilityStatus.AVAILABLE,
      vacancies: 1,
      capacity: 1,
      maxUnits: 1,
      utcCutoffAt: `${localDateStart}T06:00:00Z`, // OCTO requirement: when booking cuts off
      available: true,
      openingHours: []
    });

    return NextResponse.json(availableSlots);
  } catch (error) {
    console.error("OCTO API Error - Availability:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: "Failed to fetch availability" },
      { status: 500 }
    );
  }
}
