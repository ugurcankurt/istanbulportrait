import { cache } from "react";

/**
 * Currency Exchange Rate Utility
 *
 * Uses free ExchangeRate-API for EUR to TRY conversion.
 * Includes caching to minimize API requests.
 */

// In-memory cache for exchange rates
interface ExchangeRateCache {
  rates: Record<string, number>;
  timestamp: number;
}

const rateCache: Map<string, ExchangeRateCache> = new Map();
const CACHE_DURATION_MS = 60 * 60 * 1000; // 1 hour cache

/**
 * Get all exchange rates for a given base currency
 * Wrapped in cache() for request deduplication.
 */
export const getRatesForBase = cache(
  async (base: string = "EUR"): Promise<Record<string, number>> => {
    const cached = rateCache.get(base);

    if (cached && Date.now() - cached.timestamp < CACHE_DURATION_MS) {
      return cached.rates;
    }

    try {
      const response = await fetch(
        `https://open.er-api.com/v6/latest/${base.toUpperCase()}`,
        {
          method: "GET",
          headers: { Accept: "application/json" },
          next: { revalidate: 3600 }, // Share cache across users for 1 hour
          signal: AbortSignal.timeout(5000),
        },
      );

      if (!response.ok)
        throw new Error(`Exchange rate API error: ${response.status}`);
      const data = await response.json();

      if (data.result !== "success" || !data.rates) {
        throw new Error("Invalid response from exchange rate API");
      }

      rateCache.set(base, {
        rates: data.rates,
        timestamp: Date.now(),
      });

      return data.rates;
    } catch (error) {
      console.error(`[Currency] Failed to fetch rates for ${base}:`, error);
      if (cached) return cached.rates;

      // Final fallback: identity or common defaults
      return base.toUpperCase() === "EUR"
        ? { TRY: 36.5, GBP: 0.84, USD: 1.05 }
        : { [base]: 1.0 };
    }
  },
);

/**
 * Convert an amount between any two currencies dynamically
 */
export async function convertCurrency(
  amount: number,
  from: string,
  to: string = "EUR",
): Promise<number> {
  if (from.toUpperCase() === to.toUpperCase()) return amount;

  const rates = await getRatesForBase(from);
  const rate = rates[to.toUpperCase()];

  if (!rate) {
    // If direct rate not found, try via EUR as bridge
    const eurRates = await getRatesForBase("EUR");
    const fromToEur = 1 / (eurRates[from.toUpperCase()] || 1);
    const eurToTarget = eurRates[to.toUpperCase()] || 1;
    return amount * fromToEur * eurToTarget;
  }

  return amount * rate;
}

/**
 * Get EUR to TRY exchange rate (for backward compatibility)
 */
export async function getEURtoTRYRate(): Promise<number> {
  const rates = await getRatesForBase("EUR");
  return rates["TRY"] || 36.5;
}

/**
 * Convert EUR amount to TRY
 * Adds 1 EUR buffer to account for exchange rate fluctuations
 */
export async function convertEURtoTRY(amountEUR: number): Promise<number> {
  const rate = await getEURtoTRYRate();
  const amountWithBuffer = amountEUR + 1;
  const amountTRY = amountWithBuffer * rate;
  return Math.round(amountTRY * 100) / 100;
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number, currency: string): string {
  const formatter = new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return formatter.format(amount);
}
