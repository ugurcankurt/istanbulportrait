import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { initializePayment } from "@/lib/iyzico";
import { sendBookingConfirmation } from "@/lib/resend";
import type { PaymentRequest } from "@/lib/iyzico";

// Add rate limiting
const rateLimitMap = new Map();

function rateLimit(ip: string): boolean {
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = 5; // Max 5 payment attempts per minute

  if (!rateLimitMap.has(ip)) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
    return true;
  }

  const record = rateLimitMap.get(ip);
  
  if (now > record.resetTime) {
    record.count = 1;
    record.resetTime = now + windowMs;
    return true;
  }

  if (record.count >= maxRequests) {
    return false;
  }

  record.count++;
  return true;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Get client IP for rate limiting
    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded?.split(",")[0] ?? request.headers.get("x-real-ip") ?? "127.0.0.1";

    // Apply rate limiting
    if (!rateLimit(ip)) {
      console.warn(`Payment rate limit exceeded for IP: ${ip}`);
      return NextResponse.json(
        { error: "Too many payment attempts. Please try again later." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { bookingId, paymentData, customerData, amount } = body;

    // Validate required fields
    if (!bookingId || !paymentData || !customerData || !amount) {
      return NextResponse.json(
        { error: "Missing required payment data" },
        { status: 400 }
      );
    }

    // Validate amount
    if (typeof amount !== 'number' || amount <= 0 || amount > 10000) {
      return NextResponse.json(
        { error: "Invalid payment amount" },
        { status: 400 }
      );
    }

    if (process.env.NODE_ENV === 'development') {
      console.log(`💳 Payment initialization from ${ip} for booking ${bookingId}, amount: €${amount}`);
    }

    let booking;
    
    try {
      // Try to get booking details from database first
      const { data: bookingData, error: bookingError } = await supabaseAdmin
        .from("bookings")
        .select("*")
        .eq("id", bookingId)
        .single();

      if (bookingError) {
        throw bookingError;
      }
      
      booking = bookingData;
    } catch (supabaseError: any) {
      console.error("❌ Failed to get booking details:", supabaseError);
      return NextResponse.json(
        { 
          error: "Booking not found. Please create a booking first.",
          details: process.env.NODE_ENV === 'development' ? supabaseError.message : undefined
        },
        { status: 404 }
      );
    }

    // Format price with proper decimal handling (max 2 decimal places)
    const formattedPrice = parseFloat(amount.toString()).toFixed(2);
    
    // Prepare Iyzico payment request
    const paymentRequest: PaymentRequest = {
      conversationId: bookingId,
      price: formattedPrice,
      paidPrice: formattedPrice,
      currency: "EUR",
      basketId: `basket_${bookingId}`,
      paymentCard: {
        cardHolderName: paymentData.cardHolderName,
        cardNumber: paymentData.cardNumber,
        expireMonth: paymentData.expireMonth,
        expireYear: paymentData.expireYear,
        cvc: paymentData.cvc,
      },
      buyer: {
        id: `buyer_${bookingId}`,
        name: customerData.customerName.split(' ')[0] || 'Customer',
        surname: customerData.customerName.split(' ').slice(1).join(' ') || 'User',
        gsmNumber: customerData.customerPhone,
        email: customerData.customerEmail,
        identityNumber: "11111111111", // Required by Iyzico, using dummy value
        registrationAddress: "Istanbul, Turkey",
        ip: ip,
        city: "Istanbul",
        country: "Turkey",
      },
      shippingAddress: {
        contactName: customerData.customerName,
        city: "Istanbul",
        country: "Turkey",
        address: "Istanbul, Turkey",
      },
      billingAddress: {
        contactName: customerData.customerName,
        city: "Istanbul", 
        country: "Turkey",
        address: "Istanbul, Turkey",
      },
      basketItems: [
        {
          id: booking.package_id,
          name: `Photography Package - ${booking.package_id}`,
          category1: "Photography",
          itemType: "PHYSICAL",
          price: formattedPrice,
        },
      ],
    };

    // Initialize payment with Iyzico
    const paymentResult = await initializePayment(paymentRequest);

    if (paymentResult.status === "success") {
      // Try to update booking status in Supabase
      try {
        // Update booking status
        const { error: bookingUpdateError } = await supabaseAdmin
          .from("bookings")
          .update({ 
            status: "confirmed",
            updated_at: new Date().toISOString()
          })
          .eq("id", bookingId);

        if (bookingUpdateError) {
          console.error("Booking update error:", bookingUpdateError);
        }

        // Record payment in database
        const { error: paymentInsertError } = await supabaseAdmin
          .from("payments")
          .insert({
            booking_id: bookingId,
            payment_id: paymentResult.paymentId || `demo_${Date.now()}`,
            conversation_id: bookingId,
            status: "success",
            amount: amount,
            currency: "EUR",
            provider: "iyzico",
            provider_response: paymentResult
          });

        if (paymentInsertError) {
          console.error("Payment insert error:", paymentInsertError);
        }

        const duration = Date.now() - startTime;
        if (process.env.NODE_ENV === 'development') {
          console.log(`✅ Payment successful in ${duration}ms:`, paymentResult.paymentId);
        }

      } catch (dbError: any) {
        console.error(`❌ Database update failed for successful payment:`, dbError);
        // Payment was successful but database update failed
        // The payment should still be processed, but we need to handle this gracefully
      }

      // Send confirmation email (works in both demo and production)
      try {
        await sendBookingConfirmation({
          customerName: customerData.customerName,
          customerEmail: customerData.customerEmail,
          packageName: `${booking.package_id.charAt(0).toUpperCase() + booking.package_id.slice(1)} Package`,
          bookingDate: booking.booking_date,
          bookingTime: booking.booking_time,
          totalAmount: amount,
          bookingId: bookingId,
        });
        console.log("✅ Confirmation email sent to", customerData.customerEmail);
      } catch (emailError) {
        console.error("❌ Failed to send confirmation email:", emailError);
      }

      return NextResponse.json({
        success: true,
        status: "success",
        paymentId: paymentResult.paymentId,
        conversationId: bookingId,
      });
    } else {
      // Payment failed - try to update booking status
      try {
        // Update booking status to cancelled
        const { error: bookingUpdateError } = await supabaseAdmin
          .from("bookings")
          .update({ 
            status: "cancelled",
            updated_at: new Date().toISOString()
          })
          .eq("id", bookingId);

        if (bookingUpdateError) {
          console.error("Booking cancellation error:", bookingUpdateError);
        }

        // Record failed payment
        const { error: paymentInsertError } = await supabaseAdmin
          .from("payments")
          .insert({
            booking_id: bookingId,
            payment_id: paymentResult.paymentId || `failed_${Date.now()}`,
            conversation_id: bookingId,
            status: "failure",
            amount: amount,
            currency: "EUR",
            provider: "iyzico",
            provider_response: paymentResult
          });

        if (paymentInsertError) {
          console.error("Failed payment insert error:", paymentInsertError);
        }

        const duration = Date.now() - startTime;
        if (process.env.NODE_ENV === 'development') {
          console.log(`❌ Payment failed in ${duration}ms:`, paymentResult.errorMessage);
        }

      } catch (dbError: any) {
        console.error(`❌ Database update failed for failed payment:`, dbError);
      }

      return NextResponse.json({
        success: false,
        status: "failure",
        errorMessage: paymentResult.errorMessage || "Payment failed",
      });
    }

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ Payment initialization error after ${duration}ms:`, error);
    
    // Don't expose internal error details in production
    const errorResponse = {
      error: "Payment processing failed. Please try again later.",
      details: process.env.NODE_ENV === 'development' ? 
        (error instanceof Error ? error.message : "Unknown error") : undefined
    };
    
    return NextResponse.json(errorResponse, { status: 500 });
  }
}