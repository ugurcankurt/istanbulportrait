import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { sendPrintShippingNotification } from "@/lib/resend";

export async function POST(request: Request) {
    try {
        const payload = await request.json();
        
        // Log the webhook payload for debugging
        console.log("[Prodigi Webhook] Received CloudEvent:", JSON.stringify(payload, null, 2));

        // CloudEvents spec fields
        const eventType = payload.type || ""; // e.g., com.prodigi.order.status.stage.changed#Shipped
        const eventSource = payload.source || "";
        const eventId = payload.id || "";
        
        // Data contains the full order object according to Prodigi docs
        // Sometimes it's nested in { order: ... } sometimes it's direct.
        const orderData = payload.data?.order || payload.data || payload;
        
        const prodigiOrderId = orderData.id || payload.subject;
        
        if (!prodigiOrderId) {
            console.error("[Prodigi Webhook] Missing order ID in payload subject or data");
            return NextResponse.json({ error: "Missing order ID" }, { status: 400 });
        }

        // Extract status from the order object
        // The stage can also be found in the type fragment (after #)
        const typeFragment = eventType.split("#")[1];
        const statusStage = orderData.status?.stage || typeFragment || "Draft";

        console.log(`[Prodigi Webhook] Processing event ${eventType} for order ${prodigiOrderId} (Stage: ${statusStage})`);

        // Find the order in our database
        const { data: order, error: fetchError } = await supabaseAdmin
            .from("print_orders")
            .select("*")
            .eq("prodigi_order_id", prodigiOrderId)
            .maybeSingle();

        if (fetchError) {
            console.error(`[Prodigi Webhook] Database error fetching order ${prodigiOrderId}:`, fetchError);
            return NextResponse.json({ error: "DB Error" }, { status: 500 });
        }

        if (!order) {
            console.warn(`[Prodigi Webhook] Order ${prodigiOrderId} not found in database. Ignoring.`);
            return NextResponse.json({ success: true, message: "Order not found" });
        }

        // Update status in our database
        // We always update the status to keep it in sync
        const displayStatus = statusStage.toLowerCase();
        const { error: updateError } = await supabaseAdmin
            .from("print_orders")
            .update({ 
                prodigi_status: displayStatus,
                updated_at: new Date().toISOString()
            })
            .eq("prodigi_order_id", prodigiOrderId);

        if (updateError) {
            console.error(`[Prodigi Webhook] Failed to update order status in DB:`, updateError);
        }

        // Trigger shipping notification if stage is Shipped or Complete
        const isShippedStage = statusStage === "Shipped" || statusStage === "Complete";
        if (isShippedStage && order.prodigi_status !== "shipped") {
            console.log(`[Prodigi Webhook] Order ${prodigiOrderId} reached ${statusStage} stage. Sending notification...`);

            // Extract tracking information
            const shipment = orderData.shipments?.[0];
            const trackingNumber = shipment?.tracking?.number || shipment?.trackingNumber || "N/A";
            const trackingUrl = shipment?.tracking?.url || shipment?.trackingUrl || "#";
            const carrierName = shipment?.carrier?.name || shipment?.carrierName || "Courier";

            // Send shipping notification email
            try {
                await sendPrintShippingNotification({
                    customerName: order.customer_name,
                    customerEmail: order.customer_email,
                    orderId: prodigiOrderId,
                    carrier: carrierName,
                    trackingNumber: trackingNumber,
                    trackingUrl: trackingUrl,
                    locale: order.locale || "en"
                });
                console.log(`[Prodigi Webhook] Shipping notification sent for order ${prodigiOrderId}`);
            } catch (emailError) {
                console.error(`[Prodigi Webhook] Failed to send shipping email:`, emailError);
            }
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error("[Prodigi Webhook] Error processing webhook:", error);
        return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
    }
}
