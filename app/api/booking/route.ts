import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { bookingSchema } from "@/lib/validations";

// Add rate limiting
const rateLimitMap = new Map();

function rateLimit(ip: string): boolean {
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = 10; // Max 10 requests per minute

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
      console.warn(`Rate limit exceeded for IP: ${ip}`);
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    const body = await request.json();
    
    // Validate the request body
    const validationResult = bookingSchema.safeParse(body);
    if (!validationResult.success) {
      console.error("Validation failed:", validationResult.error.issues);
      return NextResponse.json(
        { error: "Invalid request data", details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const { 
      packageId, 
      customerName, 
      customerEmail, 
      customerPhone, 
      bookingDate, 
      bookingTime,
      notes,
      totalAmount
    } = validationResult.data;

    // Log booking attempt
    console.log(`Booking attempt from ${ip} for package ${packageId}, customer: ${customerEmail}`);

    try {
      // Check if package exists
      const { data: packageData, error: packageError } = await supabaseAdmin
        .from("packages")
        .select("id, price")
        .eq("id", packageId)
        .single();

      if (packageError) {
        console.error("Package validation error:", packageError);
        // Continue with demo mode if package table doesn't exist
      } else if (packageData && Math.abs(packageData.price - totalAmount) > 0.01) {
        console.error("Price mismatch:", { expected: packageData.price, received: totalAmount });
        return NextResponse.json(
          { error: "Invalid package price" },
          { status: 400 }
        );
      }

      // Check for duplicate bookings in the last 5 minutes
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const { data: recentBookings } = await supabaseAdmin
        .from("bookings")
        .select("id")
        .eq("user_email", customerEmail)
        .eq("package_id", packageId)
        .eq("booking_date", bookingDate)
        .eq("booking_time", bookingTime)
        .gte("created_at", fiveMinutesAgo);

      if (recentBookings && recentBookings.length > 0) {
        console.warn("Duplicate booking attempt:", { email: customerEmail, bookingDate, bookingTime });
        return NextResponse.json(
          { error: "A similar booking was recently created. Please check your email or wait a few minutes." },
          { status: 409 }
        );
      }

      // Create booking in Supabase
      const { data: booking, error } = await supabaseAdmin
        .from("bookings")
        .insert({
          package_id: packageId,
          user_name: customerName,
          user_email: customerEmail,
          user_phone: customerPhone,
          booking_date: bookingDate,
          booking_time: bookingTime,
          status: "pending",
          total_amount: totalAmount,
          notes: notes || null,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Also create/update customer record
      await supabaseAdmin
        .from("customers")
        .upsert({
          email: customerEmail,
          name: customerName,
          phone: customerPhone,
        })
        .select()
        .single();

      const duration = Date.now() - startTime;
      console.log(`✅ Booking created successfully in ${duration}ms:`, booking.id);

      return NextResponse.json({ 
        success: true, 
        booking: {
          id: booking.id,
          packageId: booking.package_id,
          customerName: booking.user_name,
          customerEmail: booking.user_email,
          bookingDate: booking.booking_date,
          bookingTime: booking.booking_time,
          totalAmount: booking.total_amount,
          status: booking.status,
        }
      });

    } catch (supabaseError: any) {
      // Production error - log but don't expose details
      console.error("❌ Booking creation failed:", supabaseError);
      return NextResponse.json(
        { 
          error: "Unable to process booking. Please check your Supabase configuration.",
          details: process.env.NODE_ENV === 'development' ? supabaseError.message : undefined
        },
        { status: 503 }
      );
    }

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ Booking API error after ${duration}ms:`, error);
    
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}