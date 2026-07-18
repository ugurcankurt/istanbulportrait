import { NextResponse } from "next/server";
import { Resend } from "resend";
import { checkRateLimit, createRateLimitError } from "@/lib/rate-limit";
import { settingsService } from "@/lib/settings-service";
import { promoService } from "@/lib/promo-service";
import { sendNewsletterWelcomeEmail } from "@/lib/resend";
import { z } from "zod";

const subscribeSchema = z.object({
  firstName: z.string().min(2, "First name is too short."),
  lastName: z.string().min(2, "Last name is too short."),
  email: z.string().email("Please provide a valid email address."),
  locale: z.string().default("en"),
});

export async function POST(req: Request) {
  try {
    // 1. Rate limiting
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("remote-addr") || "unknown-ip";
    const { success: isAllowed, resetTime } = await checkRateLimit(`subscribe_${ip}`, {
      maxRequests: 3, // Max 3 subscribes per 15 min per IP to prevent spam abuse
      windowMs: 15 * 60 * 1000, 
    });

    if (!isAllowed) {
      return createRateLimitError(resetTime);
    }

    // 2. Parse request body
    const body = await req.json();
    const result = subscribeSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0]?.message || "Invalid input" }, { status: 400 });
    }

    const { firstName, lastName, email, locale } = result.data;
    const settings = await settingsService.getSettings();

    // 3. Connect to Resend to create the audience contact
    const apiKey = settings.resend_api_key || process.env.RESEND_API_KEY || "demo-resend-key";
    if (!apiKey || apiKey === "demo-resend-key") {
       throw new Error("Resend API key is missing or invalid. Check your settings.");
    }
    
    const resend = new Resend(apiKey);
    
    // Add to Resend Audience if configured
    if (settings.resend_audience_id) {
       try {
          await resend.contacts.create({
            email: email,
            firstName: firstName,
            lastName: lastName,
            audienceId: settings.resend_audience_id,
          });
       } catch (contactError: any) {
          // If the user is already subscribed, Resend might return a 409 or similar. 
          // We can proceed to send the promo code anyway or handle it locally.
          console.warn("Resend contact creation warning/error:", contactError);
       }
    }

    // 4. Fetch the active promo-code
    const allPromos = await promoService.getAllPromoCodes();
    
    // Pick the first promo code that is active and hasn't expired/run out
    const now = new Date().getTime();
    let selectedPromo = null;

    for (const promo of allPromos) {
       if (!promo.is_active) continue;
       if (promo.max_uses !== null && promo.current_uses >= promo.max_uses) continue;
       if (promo.start_date && now < new Date(promo.start_date).getTime()) continue;
       if (promo.end_date && now > new Date(promo.end_date).getTime()) continue;
       
       selectedPromo = promo;
       break; 
    }

    if (!selectedPromo) {
       return NextResponse.json(
         { error: "No active promo code is currently available to send. We have added you to our newsletter list!" }, 
         { status: 400 }
       );
    }

    // 5. Send Welcome Email containing the promo-code
    await sendNewsletterWelcomeEmail(
      email, 
      selectedPromo.code, 
      selectedPromo.discount_percentage, 
      settings, 
      locale
    );

    return NextResponse.json({ 
       success: true,
       message: "Successfully subscribed and welcome email dispatched." 
    });

  } catch (error: any) {
    console.error("Newsletter Subscription Error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred while subscribing. Please try again later." },
      { status: 500 }
    );
  }
}
