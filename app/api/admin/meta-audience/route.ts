/**
 * Meta Custom Audience Export API
 *
 * Exports customers from Supabase BOOKINGS table as a Meta-compatible CSV.
 * Uses bookings table (not customers) because all confirmed bookings store
 * user_name, user_email, user_phone directly — customers table is incomplete.
 *
 * Deduplication: Groups by email, keeps max total_amount as LOOKALIKE_VALUE.
 *
 * Meta SHA256 requirements:
 * - Email: lowercase + trim → SHA256
 * - Phone: E.164 digits only → SHA256
 * - Name: lowercase + trimmed first/last → SHA256
 *
 * Usage:
 *   GET /api/admin/meta-audience                     → All confirmed bookings
 *   GET /api/admin/meta-audience?status=all          → All statuses
 *   GET /api/admin/meta-audience?min_bookings=2      → Repeat customers only
 *   GET /api/admin/meta-audience?raw=true            → Unhashed (debug only!)
 *
 * @see https://www.facebook.com/business/help/2082575038703844
 */

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createServerAdminClient, requireServerAdmin } from "@/lib/auth-server";
import { hashCustomerData, hashPhoneNumber } from "@/lib/facebook";
import { logError, sanitizeErrorForProduction } from "@/lib/errors";

function splitName(fullName: string): { first: string; last: string } {
  const parts = (fullName || "").trim().split(/\s+/);
  if (parts.length === 1) return { first: parts[0] ?? "", last: "" };
  const last = parts.pop() ?? "";
  return { first: parts.join(" "), last };
}

interface BookingRow {
  user_name: string;
  user_email: string;
  user_phone: string;
  total_amount: number;
  package_id: string;
  status: string;
}

export async function GET(request: NextRequest) {
  try {
    await requireServerAdmin();

    const { searchParams } = new URL(request.url);
    const rawMode = searchParams.get("raw") === "true";
    const minBookings = Math.max(
      1,
      parseInt(searchParams.get("min_bookings") || "1", 10),
    );
    const statusFilter = searchParams.get("status") || "all"; // default: tüm rezervasyonlar

    const supabase = await createServerAdminClient();

    // ── 1. Query bookings table directly ────────────────────────────────────
    // This is the source of truth — all customer data lives here.
    let query = supabase
      .from("bookings")
      .select(
        "user_name, user_email, user_phone, total_amount, package_id, status",
      )
      .not("user_email", "is", null)
      .not("user_email", "eq", "");

    if (statusFilter !== "all") {
      query = query.eq("status", statusFilter);
    }

    const { data: bookings, error } = await query;

    if (error) throw error;
    if (!bookings || bookings.length === 0) {
      return new NextResponse(
        `No bookings found with status: ${statusFilter}`,
        { status: 404 },
      );
    }

    // ── 2. Deduplicate by email — one row per customer ────────────────────────
    const customerMap = new Map<
      string,
      {
        name: string;
        email: string;
        phone: string;
        booking_count: number;
        total_value: number;
        packages: string[];
      }
    >();

    for (const b of bookings as BookingRow[]) {
      const email = (b.user_email || "").toLowerCase().trim();
      if (!email) continue;

      if (!customerMap.has(email)) {
        customerMap.set(email, {
          name: b.user_name || "",
          email,
          phone: b.user_phone || "",
          booking_count: 0,
          total_value: 0,
          packages: [],
        });
      }

      const entry = customerMap.get(email)!;
      entry.booking_count++;
      entry.total_value += b.total_amount || 0;
      if (b.package_id && !entry.packages.includes(b.package_id)) {
        entry.packages.push(b.package_id);
      }
    }

    // ── 3. Filter by minimum booking count ────────────────────────────────────
    const eligible = Array.from(customerMap.values()).filter(
      (c) => c.booking_count >= minBookings,
    );

    if (eligible.length === 0) {
      return new NextResponse(
        `No customers with at least ${minBookings} booking(s) found`,
        { status: 404 },
      );
    }

    // ── 4. Build Meta-compatible CSV ──────────────────────────────────────────
    // Columns: email, phone, fn, ln, country, value, LOOKALIKE_VALUE
    const csvHeader = "email,phone,fn,ln,country,value,LOOKALIKE_VALUE";

    const csvRows = eligible.map((customer) => {
      const { first, last } = splitName(customer.name);
      const value = Math.round(customer.total_value * 100) / 100; // 2 decimal

      if (rawMode) {
        // Unhashed — NEVER upload this to Meta. For debugging only.
        return [
          customer.email,
          customer.phone,
          first,
          last,
          "TR",
          value,
          value,
        ].join(",");
      }

      return [
        customer.email ? hashCustomerData(customer.email) : "",
        customer.phone ? hashPhoneNumber(customer.phone) : "",
        first ? hashCustomerData(first.toLowerCase().trim()) : "",
        last ? hashCustomerData(last.toLowerCase().trim()) : "",
        hashCustomerData("tr"),
        value, // value is NOT hashed per Meta spec
        value, // LOOKALIKE_VALUE — same amount used for value-based lookalike
      ].join(",");
    });

    const csv = [csvHeader, ...csvRows].join("\n");

    // ── 5. Return downloadable CSV ─────────────────────────────────────────────
    const filename = `meta-audience-${new Date().toISOString().split("T")[0]}${minBookings > 1 ? `-repeat${minBookings}x` : ""}.csv`;

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "X-Total-Customers": String(eligible.length),
        "X-Total-Bookings": String(bookings.length),
        "X-Export-Mode": rawMode ? "raw-debug" : "hashed",
        "X-Status-Filter": statusFilter,
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
