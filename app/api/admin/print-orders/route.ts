import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createServerAdminClient, requireServerAdmin } from "@/lib/auth-server";
import {
  DatabaseConnectionError,
  handleSupabaseError,
  logError,
  sanitizeErrorForProduction,
  ValidationError,
} from "@/lib/errors";

export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    await requireServerAdmin();

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") || "20", 10)),
    );
    const status = searchParams.get("status"); // prodigi_status
    const search = searchParams.get("search");
    const sortBy = searchParams.get("sortBy") || "created_at";
    const sortOrder = searchParams.get("sortOrder") === "asc" ? "asc" : "desc";

    const offset = (page - 1) * limit;

    // Get admin client
    const supabase = await createServerAdminClient();

    try {
      let query = supabase.from("print_orders").select("*", { count: "exact" });

      // Apply filters
      if (status && status !== "all") {
        query = query.eq("prodigi_status", status);
      }

      if (search) {
        query = query.or(
          `customer_name.ilike.%${search}%,customer_email.ilike.%${search}%,prodigi_order_id.ilike.%${search}%`
        );
      }

      // Apply sorting
      query = query.order(sortBy, { ascending: sortOrder === "asc" });

      // Apply pagination
      query = query.range(offset, offset + limit - 1);

      const { data: orders, error, count } = await query;

      if (error) {
        throw error;
      }

      // Proactively fetch real-time status from Prodigi for displayed orders
      // This ensures the dashboard is always up to date even if webhooks were missed
      const ordersWithLiveStatus = await Promise.all((orders || []).map(async (order) => {
        if (order.prodigi_order_id && order.prodigi_order_id.startsWith('ord_')) {
          try {
            const { getProdigiOrder } = await import("@/lib/prodigi");
            const liveOrder = await getProdigiOrder(order.prodigi_order_id);
            
            if (liveOrder && liveOrder.status) {
              const liveStage = liveOrder.status.stage;
              const liveDetails = liveOrder.status.details;
              
              // Determine a display status based on Prodigi's internal stages
              let displayStatus = order.prodigi_status;
              
              const stageMap: Record<string, string> = {
                "Draft": "draft",
                "Placed": "placed",
                "InProgress": "in_progress",
                "Shipped": "shipped",
                "Complete": "shipped",
                "Cancelled": "cancelled"
              };

              if (stageMap[liveStage]) {
                displayStatus = stageMap[liveStage];
              }

              // Special case: InProgress can be 'shipped' if shipping is complete in details
              if (liveStage === "InProgress" && (liveDetails?.shipping === "Complete" || liveDetails?.shipping === "InProgress")) {
                displayStatus = "shipped";
              }

              // Update local DB if out of sync or if tracking info is missing
              const hasStatusChange = displayStatus !== order.prodigi_status;
              const shipment = liveOrder.shipments?.[0];
              
              // Defensive parsing for tracking details
              const carrier = shipment?.carrier?.name || shipment?.carrierName;
              const trackingNumber = shipment?.tracking?.number || shipment?.trackingNumber;
              const trackingUrl = shipment?.tracking?.url || shipment?.trackingUrl;
              
              const needsUpdate = hasStatusChange || 
                                 (carrier && carrier !== order.shipping_carrier) ||
                                 (trackingNumber && trackingNumber !== order.tracking_number) ||
                                 (trackingUrl && trackingUrl !== order.tracking_url);

              if (needsUpdate) {
                const updatePayload: any = {
                  prodigi_status: displayStatus,
                  updated_at: new Date().toISOString()
                };
                
                if (carrier) updatePayload.shipping_carrier = carrier;
                if (trackingNumber) updatePayload.tracking_number = trackingNumber;
                if (trackingUrl) updatePayload.tracking_url = trackingUrl;

                await supabase.from("print_orders").update(updatePayload).eq("id", order.id);
                
                // Trigger shipping notification if stage becomes Shipped or Complete for the first time in our DB
                const isShippedStage = liveStage === "Shipped" || liveStage === "Complete";
                if (isShippedStage && order.prodigi_status !== "shipped") {
                  try {
                    const { sendPrintShippingNotification } = await import("@/lib/resend");
                    await sendPrintShippingNotification({
                      customerName: order.customer_name,
                      customerEmail: order.customer_email,
                      orderId: order.prodigi_order_id,
                      carrier: carrier || "Courier",
                      trackingNumber: trackingNumber || "N/A",
                      trackingUrl: trackingUrl || "#",
                      locale: order.locale || "en"
                    });
                    console.log(`[Admin Status Sync] Shipping notification sent for ${order.prodigi_order_id}`);
                  } catch (emailError) {
                    console.error(`[Admin Status Sync] Failed to send shipping email:`, emailError);
                  }
                }

                // Update the object in memory for the response
                order.prodigi_status = displayStatus;
                if (carrier) order.shipping_carrier = carrier;
                if (trackingNumber) order.tracking_number = trackingNumber;
                if (trackingUrl) order.tracking_url = trackingUrl;
              }
            }
          } catch (e) {
            console.error(`Status sync failed for ${order.prodigi_order_id}:`, e);
          }
        }
        return order;
      }));

      return NextResponse.json({
        success: true,
        orders: ordersWithLiveStatus,
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit),
        },
      });
    } catch (supabaseError) {
      const dbError = new DatabaseConnectionError();
      logError(handleSupabaseError(supabaseError), {
        endpoint: "admin/print-orders",
        action: "fetch_orders",
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
  } catch (error) {
    logError(error, {
      endpoint: "admin/print-orders",
      action: "auth_or_unexpected",
    });

    return NextResponse.json(
      { error: sanitizeErrorForProduction(error) },
      {
        status:
          error instanceof Error &&
          error.message.includes("Admin access required")
            ? 403
            : 500,
      },
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    // Verify admin access
    await requireServerAdmin();

    const body = await request.json();
    const { orderId, paymentStatus } = body;

    if (!orderId) {
      throw new ValidationError("Order ID is required");
    }

    // Get admin client
    const supabase = await createServerAdminClient();

    try {
      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };

      if (paymentStatus) {
        updateData.payment_status = paymentStatus;
      }

      const { data: order, error } = await supabase
        .from("print_orders")
        .update(updateData)
        .eq("id", orderId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return NextResponse.json({
        success: true,
        order,
      });
    } catch (supabaseError) {
      const dbError = new DatabaseConnectionError();
      logError(handleSupabaseError(supabaseError), {
        endpoint: "admin/print-orders",
        action: "update_order",
        orderId,
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
  } catch (error) {
    logError(error, {
      endpoint: "admin/print-orders",
      action: "auth_or_unexpected",
    });

    return NextResponse.json(
      { error: sanitizeErrorForProduction(error) },
      {
        status:
          error instanceof Error &&
          error.message.includes("Admin access required")
            ? 403
            : 500,
      },
    );
  }
}
