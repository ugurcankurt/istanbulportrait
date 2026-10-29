"use client";

import { useEffect } from "react";

/**
 * Registers client-side WebMCP (Web Model Context Protocol) tools on
 * `document.modelContext` / `navigator.modelContext` so browser-native AI
 * agents (e.g., Chrome AI / Gemini in Chrome) and Lighthouse Agentic Browsing
 * audits can discover and invoke live Supabase-backed capabilities.
 */
export function WebMCPProvider() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const modelContext =
      document.modelContext || window.navigator?.modelContext;
    if (!modelContext || typeof modelContext.registerTool !== "function") {
      return;
    }

    const controller = new AbortController();

    const tools: WebMCPToolDefinition[] = [
      {
        name: "search_photography_packages",
        description:
          "Search and filter active Istanbul Portrait photography packages by keyword, language locale, or maximum price in EUR.",
        inputSchema: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description:
                "Optional search keyword such as rooftop, couple, solo, family, galata, or flying dress",
            },
            maxPrice: {
              type: "number",
              description: "Optional maximum package price in EUR",
            },
            locale: {
              type: "string",
              description:
                "Two-letter language code (en, tr, ar, ru, es, zh, fr, de, ro)",
            },
          },
          additionalProperties: false,
        },
        execute: async (args) => {
          const params = new URLSearchParams();
          if (typeof args.query === "string" && args.query.trim()) {
            params.set("query", args.query.trim());
          }
          if (
            typeof args.maxPrice === "number" &&
            !Number.isNaN(args.maxPrice)
          ) {
            params.set("maxPrice", String(args.maxPrice));
          }
          if (typeof args.locale === "string" && args.locale.trim()) {
            params.set("locale", args.locale.trim());
          }
          const queryString = params.toString();
          const res = await fetch(
            `/api/packages${queryString ? `?${queryString}` : ""}`,
          );
          const data = await res.json();
          return {
            content: [{ type: "text", text: JSON.stringify(data) }],
          };
        },
      },
      {
        name: "check_photoshoot_availability",
        description:
          "Check real-time available and blocked 30-minute photoshoot time slots in Istanbul for a given date (YYYY-MM-DD) and package slug.",
        inputSchema: {
          type: "object",
          properties: {
            date: {
              type: "string",
              description:
                "Photoshoot date in YYYY-MM-DD format (for example, 2026-11-15)",
            },
            packageId: {
              type: "string",
              description:
                "Package slug identifier (for example: essential, premium, luxury, rooftop)",
            },
          },
          required: ["date", "packageId"],
          additionalProperties: false,
        },
        execute: async (args) => {
          const date = String(args.date || "").trim();
          const packageId = String(args.packageId || "").trim();
          const params = new URLSearchParams({ date, packageId });
          const res = await fetch(
            `/api/booking/availability?${params.toString()}`,
          );
          const data = await res.json();
          return {
            content: [{ type: "text", text: JSON.stringify(data) }],
          };
        },
      },
      {
        name: "book_istanbul_photoshoot",
        description:
          "Book an Istanbul Portrait photoshoot session for a selected package, date, time, and customer contact details. No credit card or upfront deposit is required — all payments are made in cash on the photoshoot day.",
        inputSchema: {
          type: "object",
          properties: {
            packageId: {
              type: "string",
              description:
                "Package slug identifier (for example: essential, premium, luxury, rooftop)",
            },
            bookingDate: {
              type: "string",
              description: "Photoshoot date in YYYY-MM-DD format",
            },
            bookingTime: {
              type: "string",
              description: "24-hour photoshoot time slot in HH:MM format",
            },
            customerName: {
              type: "string",
              description: "Customer's full name",
            },
            customerEmail: {
              type: "string",
              description: "Customer's email address",
            },
            customerPhone: {
              type: "string",
              description:
                "Customer's phone or WhatsApp number with international country code (e.g., +905551234567)",
            },
            peopleCount: {
              type: "number",
              description:
                "Number of people joining the photoshoot (default 1)",
            },
            promoCode: {
              type: "string",
              description: "Optional discount promo code",
            },
            notes: {
              type: "string",
              description:
                "Optional special requests or location notes for the photographer",
            },
            autoConfirm: {
              type: "boolean",
              description:
                "When true (default), automatically finalizes the cash-on-shoot-day booking on the checkout screen without requiring an extra click",
            },
            locale: {
              type: "string",
              description:
                "Two-letter language code (en, tr, ar, ru, es, zh, fr, de, ro)",
            },
          },
          required: [
            "packageId",
            "bookingDate",
            "bookingTime",
            "customerName",
            "customerEmail",
            "customerPhone",
          ],
          additionalProperties: false,
        },
        execute: async (args) => {
          const packageId = String(args.packageId || "").trim();
          const bookingDate = String(args.bookingDate || "").trim();
          const bookingTime = String(args.bookingTime || "").trim();
          const customerName = String(args.customerName || "").trim();
          const customerEmail = String(args.customerEmail || "").trim();
          const customerPhone = String(args.customerPhone || "").trim();
          const peopleCount =
            typeof args.peopleCount === "number" && args.peopleCount > 0
              ? args.peopleCount
              : 1;
          const promoCode =
            typeof args.promoCode === "string"
              ? args.promoCode.trim().toUpperCase()
              : "";
          const notes = typeof args.notes === "string" ? args.notes.trim() : "";
          const autoConfirm = args.autoConfirm !== false;
          const pathLocale =
            window.location.pathname.split("/").filter(Boolean)[0] || "en";
          const locale =
            typeof args.locale === "string" && args.locale.trim()
              ? args.locale.trim()
              : pathLocale;

          const pkgRes = await fetch(
            `/api/packages?locale=${encodeURIComponent(locale)}`,
          );
          const pkgJson = await pkgRes.json();
          const matchedPkg = (pkgJson.packages || []).find(
            (p: { slug: string }) => p.slug === packageId,
          );

          if (!matchedPkg) {
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify({
                    success: false,
                    error: `Package "${packageId}" not found.`,
                  }),
                },
              ],
            };
          }

          const basePrice = matchedPkg.isPerPerson
            ? matchedPkg.price * peopleCount
            : matchedPkg.price;

          const draftRes = await fetch("/api/booking/create-draft", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              packageId,
              customerName,
              customerEmail,
              customerPhone,
              bookingDate,
              bookingTime,
              peopleCount,
              notes,
              totalAmount: basePrice,
              selectedAddons: [],
              addonQuantities: {},
              locale,
            }),
          });

          const draftResult = await draftRes.json();
          if (!draftRes.ok) {
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify({
                    success: false,
                    error:
                      draftResult.error || "Failed to create booking draft",
                    details: draftResult.details || null,
                  }),
                },
              ],
            };
          }

          const bookingDataToStore = {
            packageId,
            customerName,
            customerEmail,
            customerPhone,
            bookingDate,
            bookingTime,
            peopleCount,
            notes,
            totalAmount: basePrice,
            basePrice: matchedPkg.price,
            originalPrice: matchedPkg.originalPrice || matchedPkg.price,
            isPerPerson: Boolean(matchedPkg.isPerPerson),
            packageDisplayName: matchedPkg.title,
            packageDuration: matchedPkg.duration,
            packagePhotos: matchedPkg.features?.[0] || "",
            packageLocations: `${matchedPkg.locationsCount || 1}`,
            packageFeatures: matchedPkg.features || [],
            bookingId: draftResult.bookingId,
            selectedAddons: [],
            addonQuantities: {},
          };

          sessionStorage.setItem(
            "bookingData",
            JSON.stringify(bookingDataToStore),
          );

          const checkoutParams = new URLSearchParams();
          if (promoCode) checkoutParams.set("coupon", promoCode);
          if (autoConfirm) checkoutParams.set("autoconfirm", "1");
          const qs = checkoutParams.toString();
          const checkoutUrl = `/${locale}/checkout${qs ? `?${qs}` : ""}`;
          window.location.assign(checkoutUrl);

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  success: true,
                  bookingId: draftResult.bookingId,
                  paymentMethod: "cash_on_shoot_day",
                  checkoutUrl,
                  message: autoConfirm
                    ? "Booking created and auto-confirming on checkout (cash payment on photoshoot day, no credit card required)."
                    : "Booking draft created and navigated to checkout summary.",
                }),
              },
            ],
          };
        },
      },
    ];

    for (const tool of tools) {
      try {
        modelContext.registerTool(tool, { signal: controller.signal });
      } catch {
        try {
          modelContext.registerTool(tool);
        } catch {
          // Ignore duplicate registration errors across hot reloads
        }
      }
    }

    return () => {
      controller.abort();
      if (typeof modelContext.unregisterTool === "function") {
        for (const tool of tools) {
          try {
            modelContext.unregisterTool(tool.name);
          } catch {
            // Ignore cleanup errors
          }
        }
      }
    };
  }, []);

  return null;
}
