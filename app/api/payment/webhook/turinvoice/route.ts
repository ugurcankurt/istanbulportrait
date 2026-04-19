import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  DatabaseConnectionError,
  handleSupabaseError,
  logError,
  sanitizeErrorForProduction,
  ValidationError,
} from "@/lib/errors";
import { sendBookingConfirmation } from "@/lib/resend";
import { supabaseAdmin } from "@/lib/supabase";
import { turinvoiceVerifyWebhook } from "@/lib/turinvoice";
import { settingsService } from "@/lib/settings-service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Extract URL origin/referer for Facebook Match Rate
    const origin =
      request.headers.get("origin") || "https://istanbulportrait.com";
    const eventSourceUrl = request.headers.get("referer") || origin;

    // Validate webhook payload
    if (!body.id || !body.state || !body.secret_key) {
      const validationError = new ValidationError("Invalid webhook payload");
      logError(validationError, {
        endpoint: "turinvoice-webhook",
        payload: body,
      });

      return NextResponse.json(
        { error: sanitizeErrorForProduction(validationError) },
        { status: 400 },
      );
    }

    // Verify webhook authenticity
    if (!(await turinvoiceVerifyWebhook(body.secret_key))) {
      const authError = new ValidationError("Invalid webhook secret key");
      logError(authError, {
        endpoint: "turinvoice-webhook",
        orderId: body.id,
      });

      return NextResponse.json(
        { error: sanitizeErrorForProduction(authError) },
        { status: 401 },
      );
    }

    // Only process "paid" status
    if (body.state !== "paid") {
      return NextResponse.json({
        success: true,
        message: "Webhook received, but payment not completed yet",
      });
    }

    try {
      // Find payment record by provider_order_id
      const { data: payment, error: paymentError } = await supabaseAdmin
        .from("payments")
        .select("*, bookings(*)")
        .eq("provider_order_id", body.id.toString())
        .eq("provider", "turinvoice")
        .single();

      if (paymentError) {
        // Payment record not found - this might be first webhook call
        // Log it but don't fail
        logError(handleSupabaseError(paymentError), {
          endpoint: "turinvoice-webhook",
          orderId: body.id,
          action: "payment_lookup",
        });

        return NextResponse.json({
          success: true,
          message: "Payment record not found, will be created by frontend",
        });
      }

      // Update payment status to success
      const { error: updateError } = await supabaseAdmin
        .from("payments")
        .update({
          status: "success",
          provider_response: body,
          updated_at: new Date().toISOString(),
        })
        .eq("id", payment.id);

      if (updateError) {
        throw updateError;
      }

      // If payment has associated booking, update booking status
      if (payment.booking_id) {
        const { error: bookingError } = await supabaseAdmin
          .from("bookings")
          .update({
            status: "confirmed",
            updated_at: new Date().toISOString(),
          })
          .eq("id", payment.booking_id);

        if (bookingError) {
          logError(handleSupabaseError(bookingError), {
            endpoint: "turinvoice-webhook",
            bookingId: payment.booking_id,
            action: "booking_update",
          });
        }

        // Send confirmation email
        try {
          const booking = payment.bookings;
          if (booking) {
            const settings = await settingsService.getSettings();
            await sendBookingConfirmation({
              customerName: booking.user_name,
              customerEmail: booking.user_email,
              customerPhone: booking.user_phone || "",
              packageName: booking.package_id,
              bookingDate: booking.booking_date,
              bookingTime: booking.booking_time,
              totalAmount: body.amount,
              bookingId: booking.id,
            }, settings);
          }
        } catch (emailError) {
          // Don't fail webhook if email fails
          logError(emailError, {
            endpoint: "turinvoice-webhook",
            action: "email_send",
          });
        }

        // Facebook CAPI — Purchase event (server-side, Safari-proof)
        // eventId is not available from webhook, but CAPI still captures the conversion
        try {
          const booking = payment.bookings;
          if (booking) {
            const { trackFacebookPurchase } = await import("@/lib/facebook");
            await trackFacebookPurchase(
              booking.user_email,
              booking.user_phone || "",
              booking.package_id,
              body.amount,
              booking.id, // Transaction ID for deduplication
              undefined,
              { eventSourceUrl },
            );
          }
        } catch (facebookError) {
          // Non-blocking: don't fail webhook if CAPI fails
          logError(facebookError, {
            endpoint: "turinvoice-webhook",
            action: "facebook_capi",
          });
        }

        // ── Meta CRM Lead Event (auto-fires on every confirmed booking) ──
        try {
          const booking = payment.bookings;
          if (booking) {
            const { trackMetaCRMLeadEvent } = await import("@/lib/facebook");
            await trackMetaCRMLeadEvent(
              booking.user_email,
              booking.user_phone || "",
              booking.id,
              undefined,
              { eventSourceUrl },
            );
          }
        } catch (crmError) {
          logError(crmError, {
            endpoint: "turinvoice-webhook",
            action: "meta_crm_lead",
          });
        }

        // ── GA4 Measurement Protocol (server-side, 100% reliable) ──
        try {
          const booking = payment.bookings;
          if (booking) {
            const { trackGA4ServerPurchase, PACKAGE_DISPLAY_NAMES } =
              await import("@/lib/ga4-server");
            await trackGA4ServerPurchase(
              booking.id,
              booking.package_id,
              PACKAGE_DISPLAY_NAMES[booking.package_id] || booking.package_id,
              booking.total_amount,
              "EUR",
            );
          }
        } catch (ga4Error) {
          logError(ga4Error, {
            endpoint: "turinvoice-webhook",
            action: "ga4_measurement_protocol",
          });
        }
      }

      return NextResponse.json({
        success: true,
        message: "Payment processed successfully",
      });
    } catch (supabaseError: unknown) {
      const dbError = new DatabaseConnectionError();
      logError(handleSupabaseError(supabaseError), {
        endpoint: "turinvoice-webhook",
        orderId: body.id,
        action: "database_operation",
      });

      return NextResponse.json(
        {
          error: sanitizeErrorForProduction(dbError),
          details:
            process.env.NODE_ENV === "development"
              ? handleSupabaseError(supabaseError).message
              : undefined,
        },
        { status: 503 },
      );
    }
  } catch (error: unknown) {
    logError(error, {
      endpoint: "turinvoice-webhook",
      action: "unexpected_error",
    });

    return NextResponse.json(
      { error: sanitizeErrorForProduction(error) },
      { status: 500 },
    );
  }
}
