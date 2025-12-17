import { supabaseAdmin } from "./supabase";

interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
}

interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetTime: number;
}

export async function checkRateLimit(
  identifier: string,
  options: RateLimitOptions = {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10,
  },
): Promise<RateLimitResult> {
  try {
    const now = new Date();
    const windowStart = new Date(now.getTime() - options.windowMs);

    // Clean up old records first
    await supabaseAdmin
      .from("rate_limits")
      .delete()
      .lt("window_start", windowStart.toISOString());

    // Get or create current record
    const { data: existingRecord, error: selectError } = await supabaseAdmin
      .from("rate_limits")
      .select("*")
      .eq("identifier", identifier)
      .gte("window_start", windowStart.toISOString())
      .single();

    if (selectError && selectError.code !== "PGRST116") {
      // PGRST116 = no rows returned, which is fine
      console.error("Rate limit check error:", selectError);
      // Fail open - allow request if database is having issues
      return {
        success: true,
        remaining: options.maxRequests - 1,
        resetTime: now.getTime() + options.windowMs,
      };
    }

    if (!existingRecord) {
      // First request in window - create new record
      const { error: insertError } = await supabaseAdmin
        .from("rate_limits")
        .insert({
          identifier,
          count: 1,
          window_start: now.toISOString(),
        });

      if (insertError) {
        console.error("Rate limit insert error:", insertError);
        // Fail open
        return {
          success: true,
          remaining: options.maxRequests - 1,
          resetTime: now.getTime() + options.windowMs,
        };
      }

      return {
        success: true,
        remaining: options.maxRequests - 1,
        resetTime: now.getTime() + options.windowMs,
      };
    }

    // Check if limit exceeded
    if (existingRecord.count >= options.maxRequests) {
      const resetTime =
        new Date(existingRecord.window_start).getTime() + options.windowMs;
      return {
        success: false,
        remaining: 0,
        resetTime,
      };
    }

    // Increment counter
    const { error: updateError } = await supabaseAdmin
      .from("rate_limits")
      .update({
        count: existingRecord.count + 1,
        updated_at: now.toISOString(),
      })
      .eq("id", existingRecord.id);

    if (updateError) {
      console.error("Rate limit update error:", updateError);
      // Fail open
      return {
        success: true,
        remaining: Math.max(0, options.maxRequests - existingRecord.count - 1),
        resetTime:
          new Date(existingRecord.window_start).getTime() + options.windowMs,
      };
    }

    const resetTime =
      new Date(existingRecord.window_start).getTime() + options.windowMs;
    return {
      success: true,
      remaining: Math.max(0, options.maxRequests - existingRecord.count - 1),
      resetTime,
    };
  } catch (error) {
    console.error("Rate limit unexpected error:", error);
    // Fail open - always allow if something goes wrong
    return {
      success: true,
      remaining: options.maxRequests - 1,
      resetTime: Date.now() + options.windowMs,
    };
  }
}

export function getClientIP(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const cfConnectingIp = request.headers.get("cf-connecting-ip");

  return (
    forwarded?.split(",")[0]?.trim() || cfConnectingIp || realIp || "127.0.0.1"
  );
}

export function createRateLimitError(resetTime: number) {
  const retryAfter = Math.ceil((resetTime - Date.now()) / 1000);

  return new Response(
    JSON.stringify({
      error: "Too many requests. Please try again later.",
      retryAfter,
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": retryAfter.toString(),
        "X-RateLimit-Reset": resetTime.toString(),
      },
    },
  );
}
