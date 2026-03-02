import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { z } from "zod";

const subscriptionSchema = z.object({
    endpoint: z.string(),
    keys: z.object({
        p256dh: z.string(),
        auth: z.string(),
    }),
});

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY! // Use service role for admin access
);

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const result = subscriptionSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json(
                { error: "Invalid subscription data" },
                { status: 400 }
            );
        }

        const { endpoint, keys } = result.data;

        // Upsert subscription (avoid duplicates based on endpoint logic if needed, but for now simple insert)
        // Actually, we check if endpoint exists to avoid duplicates
        const { data: existing } = await supabase
            .from("push_subscriptions")
            .select("id")
            .eq("subscription->>endpoint", endpoint)
            .single();

        if (existing) {
            return NextResponse.json({ message: "Subscription already exists" });
        }

        const { error } = await supabase.from("push_subscriptions").insert({
            subscription: body,
            user_agent: request.headers.get("user-agent"),
        });

        if (error) {
            console.error("Database INSERT error:", JSON.stringify(error, null, 2));
            return NextResponse.json(
                { error: "Failed to save subscription", details: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json({ message: "Subscription saved successfully" });
    } catch (error) {
        console.error("Error saving subscription:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
