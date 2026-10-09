import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const startTime = Date.now();

  try {
    // Check database connectivity
    const { error: dbError, count } = await supabase
      .from("packages")
      .select("*", { count: "exact" })
      .limit(1);

    const dbStatus = dbError ? "unhealthy" : "healthy";
    const dbResponseTime = Date.now() - startTime;

    // System health
    const health = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || "1.0.0",
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      services: {
        database: {
          status: dbStatus,
          responseTime: dbResponseTime,
          recordCount: count || 0,
          error: dbError?.message || null,
        },
        api: {
          status: "healthy",
          responseTime: Date.now() - startTime,
        },
      },
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      },
    };

    // Determine overall status
    const overallStatus = dbStatus === "healthy" ? "healthy" : "degraded";
    health.status = overallStatus;

    return NextResponse.json(health, {
      status: overallStatus === "healthy" ? 200 : 503,
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Unknown error",
        services: {
          database: { status: "unhealthy", error: "Connection failed" },
          api: { status: "healthy" },
        },
      },
      { status: 503 },
    );
  }
}
