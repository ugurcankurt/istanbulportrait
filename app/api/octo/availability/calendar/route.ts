import { NextRequest, NextResponse } from "next/server";
import { requireOctoAuth, octoUnauthorizedResponse } from "@/lib/octo-auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  if (!requireOctoAuth(request)) {
    return octoUnauthorizedResponse();
  }

  try {
    const body = await request.json();
    const { productId, optionId, localDateStart, localDateEnd } = body;

    // 1. Validate Input
    if (!productId || !localDateStart || !localDateEnd) {
      return NextResponse.json(
        { error: "BAD_REQUEST", errorMessage: "Missing required fields (productId, localDateStart, localDateEnd)" },
        { status: 400 }
      );
    }

    // 2. Validate Product
    const { data: pkgData, error: pkgError } = await supabaseAdmin
      .from("packages")
      .select("id, slug")
      .eq("id", productId)
      .single();

    if (pkgError || !pkgData) {
      return NextResponse.json(
        { error: "INVALID_PRODUCT_ID", errorMessage: "Product not found", productId }, 
        { status: 400 }
      );
    }

    // 3. Validate Option
    if (optionId && optionId !== "DEFAULT" && optionId !== `opt_${productId}`) {
      return NextResponse.json(
        { error: "INVALID_OPTION_ID", errorMessage: "Option not found", optionId }, 
        { status: 400 }
      );
    }

    // 4. Fetch Settings
    const { data: settingsData } = await supabaseAdmin
      .from("availability_settings")
      .select("start_time, end_time")
      .eq("id", "default")
      .single();
      
    const startHourStr = settingsData?.start_time || "06:00";
    const endHourStr = settingsData?.end_time || "20:00";

    // 5. Generate Dates Array
    const dates: string[] = [];
    let currentDate = new Date(localDateStart);
    const endDate = new Date(localDateEnd);
    
    // Safety check to prevent infinite loops (max 31 days)
    let daysCount = 0;
    while (currentDate <= endDate && daysCount < 31) {
      dates.push(currentDate.toISOString().split("T")[0]);
      currentDate.setDate(currentDate.getDate() + 1);
      daysCount++;
    }

    // 6. Fetch all blocked slots for the date range
    const { data: allBlockedData } = await supabaseAdmin
      .from("blocked_slots")
      .select("date, time")
      .in("date", dates);

    const calendarResponse = [];

    // 7. Calculate Availability Calendar per Date
    for (const date of dates) {
      let isDayFullyBlocked = false;

      const dayBlockedData = (allBlockedData || []).filter((b: any) => b.date === date);
      for (const b of dayBlockedData) {
        if (!b.time) {
          isDayFullyBlocked = true;
          break;
        }
      }

      if (isDayFullyBlocked) {
        // According to OCTO, you can either omit the date or return it as unavailable
        calendarResponse.push({
          localDate: date,
          available: false,
          status: "SOLD_OUT",
          vacancies: 0,
          capacity: 0,
          openingHours: []
        });
      } else {
        // If not fully blocked, the day is broadly available for scheduling
        calendarResponse.push({
          localDate: date,
          available: true,
          status: "AVAILABLE",
          vacancies: 10, // Abstract daily capacity
          capacity: 10,
          openingHours: [
            {
              from: startHourStr,
              to: endHourStr
            }
          ]
        });
      }
    }

    return NextResponse.json(calendarResponse);
  } catch (error) {
    console.error("OCTO API Error - Availability Calendar:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: "Failed to fetch calendar" },
      { status: 500 }
    );
  }
}
