import { NextRequest, NextResponse } from "next/server";
import { addContactToAudience } from "@/lib/resend";
import { checkRateLimit, createRateLimitError, getClientIP } from "@/lib/rate-limit";
import { z } from "zod";

const subscribeSchema = z.object({
    email: z.string().email(),
    fullName: z.string().min(2),
});

export async function POST(req: NextRequest) {
    try {
        // Rate Limiting
        const ip = getClientIP(req);
        const rateLimit = await checkRateLimit(ip, {
            windowMs: 60 * 1000, // 1 minute
            maxRequests: 5, // 5 requests per minute
        });

        if (!rateLimit.success) {
            return createRateLimitError(rateLimit.resetTime);
        }

        const body = await req.json();
        const result = subscribeSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json(
                { error: "Invalid email or name" },
                { status: 400 }
            );
        }

        const { email, fullName } = result.data;

        // Split name
        const nameParts = fullName.trim().split(" ");
        const firstName = nameParts[0];
        const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : "";

        // Add to Resend
        // We await this to return success/failure to the UI correctly
        await addContactToAudience(email, firstName, lastName);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Newsletter subscription error:", error);
        return NextResponse.json(
            { error: "Failed to subscribe" },
            { status: 500 }
        );
    }
}
