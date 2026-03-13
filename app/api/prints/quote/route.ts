import { NextResponse } from "next/server";
import { getProdigiQuote } from "@/lib/prodigi";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { items, destinationCountryCode, city, postalCode, stateOrCounty } = body;

        if (!items || !items.length) {
            return NextResponse.json({ error: "No items provided" }, { status: 400 });
        }
        if (!destinationCountryCode) {
            return NextResponse.json({ error: "Destination country is missing" }, { status: 400 });
        }

        // Map our cart items to Prodigi Quote items
        const quoteItems = items.map((item: any) => {
            const hasAttributes = item.attributes && Object.keys(item.attributes).length > 0;
            
            const prodigiItem: any = {
                sku: item.sku,
                copies: item.quantity,
                assets: [
                    {
                        printArea: "default"
                    }
                ]
            };

            // Only attach attributes key if there are actually attributes to send
            if (hasAttributes) {
                prodigiItem.attributes = item.attributes;
            }

            return prodigiItem;
        });

        const quotePayload: any = {
            // shippingMethod removed to get all available options
            destinationCountryCode,
            currencyCode: "EUR", // We charge in EUR
            items: quoteItems
        };

        const result = await getProdigiQuote(quotePayload);

        // Debug log for Prodigi response to see real structure
        if (process.env.NODE_ENV === "development") {
            console.log(`[Prodigi Quote Debug] Destination: ${destinationCountryCode}, Result:`, JSON.stringify(result, null, 2));
        }

        // Extract all available shipping options
        const shippingOptions = (result.quotes || []).map((q: any) => {
            let itemCost = 0;
            let shippingCost = 0;
            let totalTax = 0;
            let shippingTax = 0;

            const costSummary = q.costSummary;
            if (costSummary) {
                itemCost = parseFloat(costSummary.items?.amount || "0");
                shippingCost = parseFloat(costSummary.shipping?.amount || "0");
                totalTax = parseFloat(costSummary.totalTax?.amount || "0");
            }

            // Extract shipping tax from shipments array if possible
            if (q.shipments?.length > 0) {
                q.shipments.forEach((s: any) => {
                    if (s.tax) {
                        shippingTax += parseFloat(s.tax.amount || "0");
                    }
                });
            }

            // Calculate effective tax rate based on whole-sale prices
            // This rate should be applied to our retail prices too
            const subtotal = itemCost + shippingCost;
            const effectiveTaxRate = subtotal > 0 ? totalTax / subtotal : 0;

            return {
                method: q.shipmentMethod,
                itemCost,
                shippingCost,
                shippingTax,
                itemTax: totalTax - shippingTax,
                totalTax,
                effectiveTaxRate
            };
        });

        return NextResponse.json({ 
            success: true, 
            quote: result,
            shippingOptions
        });
    } catch (error: any) {
        console.error("Shipping Quote API Error:", error);
        return NextResponse.json({ error: error.message || "Failed to calculate shipping" }, { status: 500 });
    }
}
