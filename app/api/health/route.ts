import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    // Check database connectivity
    const { error: dbError } = await supabase
      .from("packages")
      .select("id")
      .limit(1);

    const dbStatus = dbError ? "unhealthy" : "healthy";
    const overallStatus = dbStatus === "healthy" ? "healthy" : "degraded";

    return NextResponse.json(
      {
        status: overallStatus,
        timestamp: new Date().toISOString(),
        services: {
          database: { status: dbStatus },
          api: { status: "healthy" },
        },
      },
      {
        status: overallStatus === "healthy" ? 200 : 503,
      },
    );
  } catch {
    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        services: {
          database: { status: "unhealthy" },
          api: { status: "healthy" },
        },
      },
      { status: 503 },
    );
  }
}
