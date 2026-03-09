/**
 * Meta Custom Audience Export API
 *
 * Exports confirmed customers from Supabase as a Meta-compatible CSV
 * with SHA256-hashed PII data (email + phone).
 *
 * Meta requires:
 * - Email: lowercase + trim → SHA256
 * - Phone: E.164 format (no spaces/dashes) → SHA256
 * - Name: first/last split, lowercase, trimmed → SHA256
 *
 * Usage:
 *   GET /api/admin/meta-audience               → All confirmed customers
 *   GET /api/admin/meta-audience?raw=true      → Unhashed (for debugging — admin only)
 *   GET /api/admin/meta-audience?min_bookings=2 → Repeat customers only
 *
 * @see https://www.facebook.com/business/help/2082575038703844
 */

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createServerAdminClient, requireServerAdmin } from "@/lib/auth-server";
import { hashCustomerData, hashPhoneNumber } from "@/lib/facebook";
import { logError, sanitizeErrorForProduction } from "@/lib/errors";

// Split full name into first/last for Meta's format
function splitName(fullName: string): { first: string; last: string } {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return { first: parts[0], last: "" };
  const last = parts.pop() ?? "";
  return { first: parts.join(" "), last };
}

export async function GET(request: NextRequest) {
  try {
    // Admin only — no public access
    await requireServerAdmin();

    const { searchParams } = new URL(request.url);
    const rawMode = searchParams.get("raw") === "true"; // Debug mode (unhashed)
    const minBookings = parseInt(searchParams.get("min_bookings") || "1", 10);
    const status = searchParams.get("status") || "confirmed"; // confirmed | all

    const supabase = await createServerAdminClient();

    // ── 1. Fetch all customers with their confirmed bookings ──────────────────
    const { data: customers, error: customerError } = await supabase
      .from("customers")
      .select("id, name, email, phone, created_at")
      .order("created_at", { ascending: false });

    if (customerError) throw customerError;
    if (!customers || customers.length === 0) {
      return new NextResponse("No customers found", { status: 404 });
    }

    // ── 2. Fetch bookings for those customers ──────────────────────────────────
    const emails = customers.map((c) => c.email);
    const bookingQuery = supabase
      .from("bookings")
      .select("user_email, status, total_amount, package_id, created_at")
      .in("user_email", emails);

    if (status !== "all") {
      bookingQuery.eq("status", status);
    }

    const { data: bookings } = await bookingQuery;

    // Group booking counts/value by email
    const bookingStats: Record<
      string,
      { count: number; total_value: number; last_package: string }
    > = {};

    for (const b of bookings || []) {
      if (!bookingStats[b.user_email]) {
        bookingStats[b.user_email] = {
          count: 0,
          total_value: 0,
          last_package: b.package_id,
        };
      }
      bookingStats[b.user_email].count++;
      bookingStats[b.user_email].total_value += b.total_amount || 0;
      bookingStats[b.user_email].last_package = b.package_id;
    }

    // ── 3. Filter by minimum booking count ───────────────────────────────────
    const eligible = customers.filter(
      (c) => (bookingStats[c.email]?.count ?? 0) >= minBookings,
    );

    if (eligible.length === 0) {
      return new NextResponse("No eligible customers for export", {
        status: 404,
      });
    }

    // ── 4. Build Meta-compatible CSV ──────────────────────────────────────────
    //
    // Meta Custom Audience CSV columns:
    // email, phone, fn (first name), ln (last name), ct (city), country, value
    //
    // All PII must be SHA256-hashed UNLESS raw=true (debug only).
    //
    const csvHeader = "email,phone,fn,ln,country,value,LOOKALIKE_VALUE";
    const csvRows = eligible.map((customer) => {
      const { first, last } = splitName(customer.name || "");
      const stats = bookingStats[customer.email];
      const value = stats?.total_value ?? 0;

      if (rawMode) {
        // Raw (unhashed) — for debugging only, never upload to Meta raw
        return [
          customer.email,
          customer.phone || "",
          first,
          last,
          "TR",
          value,
          value, // LOOKALIKE_VALUE = spend amount for value-based lookalike
        ].join(",");
      }

      // Hashed per Meta specification
      return [
        customer.email ? hashCustomerData(customer.email) : "",
        customer.phone ? hashPhoneNumber(customer.phone) : "",
        first ? hashCustomerData(first) : "",
        last ? hashCustomerData(last) : "",
        hashCustomerData("tr"), // country code lowercase
        value, // value is NOT hashed
        value, // LOOKALIKE_VALUE
      ].join(",");
    });

    const csv = [csvHeader, ...csvRows].join("\n");

    // ── 5. Return as downloadable CSV ─────────────────────────────────────────
    const filename = `meta-audience-${new Date().toISOString().split("T")[0]}.csv`;

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "X-Total-Customers": String(eligible.length),
        "X-Export-Mode": rawMode ? "raw-debug" : "hashed",
        "X-Min-Bookings": String(minBookings),
      },
    });
  } catch (error) {
    logError(error instanceof Error ? error : new Error("Unknown error"), {
      endpoint: "admin/meta-audience",
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
