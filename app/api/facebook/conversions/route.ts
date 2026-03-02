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
  event_name: z.enum(["Lead", "Purchase", "ViewContent", "InitiateCheckout"]),
  customer_email: z
    .string()
    .email({ message: "Invalid email format" })
    .optional(),
  customer_phone: z.string().optional(),
  package_id: z.string().min(1),
  amount: z.number().positive(),
  transaction_id: z.string().optional(),
  lead_id: z.number().optional(),
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
      customer_email,
      customer_phone,
      package_id,
      amount,
      transaction_id,
      lead_id,
      custom_data = {},
    } = validationResult.data;

    // Prepare user data with hashed customer information
    const user_data: FacebookConversionEvent["user_data"] = {};

    if (customer_email) {
      user_data.em = [hashCustomerData(customer_email)];
    }

    if (customer_phone) {
      user_data.ph = [hashPhoneNumber(customer_phone)];
    }

    // Generate or use provided lead ID for Lead events
    if (event_name === "Lead") {
      user_data.lead_id = lead_id || generateLeadId();
    }

    // Prepare the conversion event
    const conversionEvent: FacebookConversionEvent = {
      event_name,
      event_time: Math.floor(Date.now() / 1000),
      action_source: "system_generated",
      user_data,
      custom_data: {
        event_source: "crm",
        lead_event_source: "Istanbul Portrait CRM",
        content_ids: [package_id],
        content_type: "photography_package",
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

    return NextResponse.json({
      success: true,
      event_name,
      lead_id: user_data.lead_id,
      processing_time_ms: processingTime,
    });
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
