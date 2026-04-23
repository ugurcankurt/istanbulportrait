import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  logError,
  sanitizeErrorForProduction,
  ValidationError,
} from "@/lib/errors";
import {
  type FacebookConversionEvent,
  generateLeadId,
  hashCustomerData,
  hashPhoneNumber,
  sendToFacebookConversionsAPI,
} from "@/lib/facebook";
import {
  checkRateLimit,
  createRateLimitError,
  getClientIP,
} from "@/lib/rate-limit";

// Validation schema for Facebook conversion events
const facebookConversionSchema = z.object({
  event_name: z.enum([
    "Lead",
    "Purchase",
    "ViewContent",
    "InitiateCheckout",
    "AddPaymentInfo",
    "Contact",
    "Schedule",
    "PageView",
    "AddToCart"
  ]),
  event_id: z.string().optional(), // For deduplication with Pixel
  customer_email: z
    .string()
    .email({ message: "Invalid email format" })
    .or(z.literal(""))
    .optional()
    .transform(e => e === "" ? undefined : e),
  customer_phone: z.string().optional(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  country: z.string().optional(),
  dob: z.string().optional(),
  gender: z.string().optional(),
  package_id: z.string().min(1),
  amount: z.number().optional(),
  transaction_id: z.string().optional(),
  lead_id: z.number().optional(),
  event_source_url: z.string().optional(),
  custom_data: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Get client IP for rate limiting
    const ip = getClientIP(request);

    // Apply rate limiting - more restrictive for external API calls
    const rateLimitResult = await checkRateLimit(ip, {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 20, // Max 20 requests per minute
    });

    if (!rateLimitResult.success) {
      logError(new Error("Rate limit exceeded"), {
        ip,
        endpoint: "facebook-conversions",
      });
      return createRateLimitError(rateLimitResult.resetTime);
    }

    // Parse request body
    const body = await request.json();

    // Validate the request
    const validationResult = facebookConversionSchema.safeParse(body);
    if (!validationResult.success) {
      const validationError = new ValidationError(
        "Invalid Facebook conversion data",
      );
      console.error("Facebook API Validation Error:", JSON.stringify(validationResult.error.issues, null, 2));
      logError(validationError, {
        ip,
        endpoint: "facebook-conversions",
        validationIssues: validationResult.error.issues,
      });

      return NextResponse.json(
        {
          error: sanitizeErrorForProduction(validationError),
          details:
            process.env.NODE_ENV === "development"
              ? validationResult.error.issues
              : undefined,
        },
        { status: 400 },
      );
    }

    const {
      event_name,
      event_id,
      customer_email,
      customer_phone,
      first_name,
      last_name,
      city,
      state,
      zip,
      country,
      dob,
      gender,
      package_id,
      amount,
      transaction_id,
      lead_id,
      event_source_url,
      custom_data = {},
    } = validationResult.data;

    // Extract Meta matching parameters directly from cookies
    const fbc = request.cookies.get("_fbc")?.value;
    const fbp = request.cookies.get("_fbp")?.value;
    const clientIpAddress = ip;

    // Prepare user data with hashed customer information
    const user_data: FacebookConversionEvent["user_data"] = {
      client_ip_address: clientIpAddress,
      client_user_agent: request.headers.get("user-agent") || undefined,
      fbc: fbc || undefined,
      fbp: fbp || undefined,
    };

    if (customer_email) {
      user_data.em = [await hashCustomerData(customer_email)];
    }

    if (customer_phone) {
      user_data.ph = [await hashPhoneNumber(customer_phone)];
    }

    if (first_name) {
      user_data.fn = [await hashCustomerData(first_name)];
    }

    if (last_name) {
      user_data.ln = [await hashCustomerData(last_name)];
    }

    if (city) {
      user_data.ct = [await hashCustomerData(city)];
    }

    if (state) {
      user_data.st = [await hashCustomerData(state)];
    }

    if (zip) {
      user_data.zp = [await hashCustomerData(zip)];
    }

    if (country) {
      user_data.country = [await hashCustomerData(country)];
    }

    if (dob) {
      user_data.db = [await hashCustomerData(dob)];
    }

    if (gender) {
      user_data.ge = [await hashCustomerData(gender)];
    }

    // Generate or use provided lead ID for Lead events
    if (event_name === "Lead") {
      user_data.lead_id = lead_id || generateLeadId();
    }

    // Prepare the conversion event
    const conversionEvent: FacebookConversionEvent = {
      event_name,
      event_time: Math.floor(Date.now() / 1000),
      event_id: event_id, // Top-level field — Meta uses this for Pixel deduplication
      action_source: "website",
      event_source_url: event_source_url, // Added event_source_url to the payload correctly per Facebook specs
      user_data,
      custom_data: {
        event_source: "website",
        content_ids: [package_id],
        content_type: "product",
        value: amount,
        currency: "EUR",
        ...custom_data,
      },
    };

    // Add transaction_id for Purchase events
    if (event_name === "Purchase" && transaction_id) {
      conversionEvent.custom_data = {
        ...conversionEvent.custom_data,
        transaction_id,
      };
    }

    // Send to Facebook Conversions API
    const success = await sendToFacebookConversionsAPI([conversionEvent]);

    if (!success) {
      const apiError = new Error("Facebook Conversions API request failed");
      logError(apiError, {
        ip,
        endpoint: "facebook-conversions",
        event_name,
        package_id,
      });

      return NextResponse.json(
        {
          success: false,
          error: "Failed to send conversion event",
          details:
            process.env.NODE_ENV === "development"
              ? "Check server logs for Facebook API response"
              : undefined,
        },
        { status: 500 },
      );
    }

    // Success response
    const processingTime = Date.now() - startTime;

    const response = NextResponse.json({
      success: true,
      event_name,
      lead_id: user_data.lead_id,
      processing_time_ms: processingTime,
    });

    return response;
  } catch (error) {
    const processingTime = Date.now() - startTime;

    logError(error instanceof Error ? error : new Error("Unknown error"), {
      endpoint: "facebook-conversions",
      processing_time_ms: processingTime,
    });

    return NextResponse.json(
      {
        success: false,
        error: sanitizeErrorForProduction(
          error instanceof Error ? error : new Error("Internal server error"),
        ),
      },
      { status: 500 },
    );
  }
}

// Health check endpoint for Facebook Conversions API
export async function GET() {
  try {
    // Check if required environment variables are set
    const requiredEnvVars = [
      "FACEBOOK_ACCESS_TOKEN",
      "FACEBOOK_DATASET_ID",
      "NEXT_PUBLIC_FACEBOOK_PIXEL_ID",
    ];

    const missingVars = requiredEnvVars.filter(
      (varName) => !process.env[varName],
    );

    if (missingVars.length > 0) {
      return NextResponse.json(
        {
          status: "error",
          message: "Facebook Conversions API not properly configured",
          missing_environment_variables: missingVars,
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      status: "healthy",
      message: "Facebook Conversions API endpoint is ready",
      pixel_id: process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID,
      dataset_configured: !!process.env.FACEBOOK_DATASET_ID,
      access_token_configured: !!process.env.FACEBOOK_ACCESS_TOKEN,
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        message: "Health check failed",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
