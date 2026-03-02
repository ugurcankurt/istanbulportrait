import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import webpush from "web-push";
import { z } from "zod";

const sendNotificationSchema = z.object({
    title: z.string(),
    active: z.string().optional(),
    message: z.string(),
    url: z.string().optional(),
});

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
);

export async function POST(request: Request) {
    try {
        // Initialize VAPID at runtime, not module load time
        webpush.setVapidDetails(
            "mailto:ugurcankurt@gmail.com",
            process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
            process.env.VAPID_PRIVATE_KEY!
        );

        const body = await request.json();

        const result = sendNotificationSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json(
                { error: "Invalid notification data" },
                { status: 400 }
            );
        }

        const { title, message, url } = result.data;

        // Fetch all subscriptions
        const { data: subscriptions, error } = await supabase
            .from("push_subscriptions")
            .select("subscription");

        if (error) {
            console.error("Supabase fetch error:", error);
            return NextResponse.json(
                { error: "Failed to fetch subscriptions" },
                { status: 500 }
            );
        }

        if (!subscriptions || subscriptions.length === 0) {
            return NextResponse.json({
                message: "No subscriptions found to send.",
            });
        }

        const payload = JSON.stringify({
            title,
            body: message,
            icon: "/icon1.webp",
            url: url || "/",
        });

        const promises = subscriptions.map((sub) =>
            webpush.sendNotification(sub.subscription, payload).then(() => {
                return { success: true };
            }).catch((err: any) => {
                console.error("Error sending notification:", err);

                // Optional: Delete invalid subscription from DB
                if (err.statusCode === 410 || err.statusCode === 404) {
                    // TODO: Implement cleanup logic
                    // await supabase.from('push_subscriptions').delete().match({ subscription: sub.subscription })
                }
                return { success: false, error: err };
            })
        );

        const results = await Promise.all(promises);
        const successCount = results.filter(r => r.success).length;
        const failureCount = results.filter(r => !r.success).length;

        return NextResponse.json({
            message: `Notification sent to ${successCount} subscribers. (${failureCount} failed)`,
        });
    } catch (error) {
        console.error("Error sending notifications:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
