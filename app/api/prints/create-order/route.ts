import { NextResponse } from "next/server";
import { createProdigiOrder } from "@/lib/prodigi";
import { PrintCartItem } from "@/stores/prints-cart-store";
import { supabaseAdmin } from "@/lib/supabase";
import { sendPrintOrderConfirmation } from "@/lib/resend";
import { trackGA4ServerPurchase } from "@/lib/ga4-server";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { items, shipping, shippingMethod, paymentId, locale, totalAmount, shippingCost, taxCost } = body as { 
            items: PrintCartItem[]; 
            shipping: any; 
            shippingMethod?: string;
            paymentId?: string;
            locale?: string;
            totalAmount?: number;
            shippingCost?: number;
            taxCost?: number;
        };

        if (!items || items.length === 0) {
            return NextResponse.json({ error: "No items in the order." }, { status: 400 });
        }

        if (!shipping || !shipping.firstName || !shipping.email) {
            return NextResponse.json({ error: "Invalid shipping details." }, { status: 400 });
        }

        const merchantReference = `IP-${Date.now()}-${Math.random().toString(36).substring(7)}`;

        // Map frontend cart items to Prodigi API expected format
        const prodigiItems = items.map((item, index) => ({
            merchantReference: `item-${index}`,
            sku: item.sku.toUpperCase(),
            copies: item.quantity,
            sizing: "fitPrintArea",
            assets: [
                {
                    printArea: "default",
                    url: item.uploadUrl,
                }
            ],
            attributes: item.attributes && Object.keys(item.attributes).length > 0 ? item.attributes : undefined
        }));

        const prodigiOrderData = {
            merchantReference,
            shippingMethod: shippingMethod || "Budget", // Default to Budget if not provided
            recipient: {
                name: `${shipping.firstName} ${shipping.lastName}`.trim(),
                email: shipping.email,
                address: {
                    line1: shipping.addressLine1,
                    line2: shipping.addressLine2 || undefined,
                    postalOrZipCode: shipping.postalOrZipCode,
                    countryCode: shipping.countryCode.length === 2 ? shipping.countryCode.toUpperCase() : "TR",
                    townOrCity: shipping.city,
                },
                phoneNumber: shipping.phone
            },
            items: prodigiItems,
        };

        // Call our prodigi.ts service to create the order
        const createdOrder = await createProdigiOrder(prodigiOrderData);

        // Map and insert each item into Supabase 'print_orders' table
        const orderInsertPromises = items.map(async (item) => {
            const { error } = await supabaseAdmin.from("print_orders").insert({
                customer_name: `${shipping.firstName} ${shipping.lastName}`.trim(),
                customer_email: shipping.email,
                customer_phone: shipping.phone || null,
                shipping_line1: shipping.addressLine1,
                shipping_line2: shipping.addressLine2 || null,
                shipping_postal_code: shipping.postalOrZipCode,
                shipping_town_city: shipping.city,
                shipping_state_county: shipping.stateOrCounty || null,
                shipping_country_code: shipping.countryCode.length === 2 ? shipping.countryCode.toUpperCase() : "TR",
                sku: item.attributes && Object.keys(item.attributes).length > 0
                    ? `${item.sku.toUpperCase()} (${Object.entries(item.attributes).map(([k, v]) => `${k}: ${v}`).join(", ")})`
                    : item.sku.toUpperCase(),
                image_url: item.uploadUrl,
                copies: item.quantity,
                total_amount: item.price * item.quantity,
                shipping_amount: shippingCost || 0,
                tax_amount: taxCost || 0,
                order_total_amount: totalAmount || (item.price * item.quantity),
                currency: "EUR",
                payment_status: "success",
                prodigi_order_id: createdOrder.order?.id || createdOrder.id || merchantReference,
                prodigi_status: "in_progress",
                iyzico_payment_id: paymentId || null,
                locale: locale || "en",
            });
            
            if (error) {
                console.error(`Supabase Insert Error for SKU ${item.sku}:`, error);
            }
        });

        await Promise.all(orderInsertPromises);

        // Calculate subtotal from items for tracking and fallback
        const itemsSubtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        // Tracking: GA4 Server-Side Purchase (100% Reliable)
        try {
            const primaryItem = items[0];
            await trackGA4ServerPurchase(
                createdOrder.order?.id || createdOrder.id || merchantReference,
                primaryItem.sku,
                primaryItem.name,
                totalAmount || itemsSubtotal,
                "EUR"
            );
        } catch (err) {
            console.error("[GA4 Server] Print purchase tracking failed:", err);
        }

        // Send confirmation email
        try {
            await sendPrintOrderConfirmation({
                customerName: `${shipping.firstName} ${shipping.lastName}`.trim(),
                customerEmail: shipping.email,
                orderId: createdOrder.order?.id || createdOrder.id || merchantReference,
                items: items.map(item => ({
                    name: item.attributes && Object.keys(item.attributes).length > 0
                        ? `${item.sku.toUpperCase()} (${Object.entries(item.attributes).map(([k, v]) => `${k}: ${v}`).join(", ")})`
                        : item.sku.toUpperCase(),
                    quantity: item.quantity,
                    price: item.price
                })),
                shippingAddress: {
                    line1: shipping.addressLine1,
                    line2: shipping.addressLine2,
                    city: shipping.city,
                    postalCode: shipping.postalOrZipCode,
                    country: shipping.countryCode
                },
                totalAmount: totalAmount || itemsSubtotal,
                currency: "EUR",
                locale: locale || "en"
            });
        } catch (emailError) {
            console.error("Failed to send print order confirmation email:", emailError);
            // Non-blocking error
        }

        return NextResponse.json({ success: true, order: createdOrder });

    } catch (error: any) {
        console.error("API Create Print Order Error:", error);
        return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
    }
}
