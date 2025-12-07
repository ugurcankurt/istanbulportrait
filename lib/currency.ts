/**
 * Currency Exchange Rate Utility
 *
 * Uses free ExchangeRate-API for EUR to TRY conversion.
 * Includes caching to minimize API requests.
 */

// In-memory cache for exchange rates
interface ExchangeRateCache {
    rate: number;
    timestamp: number;
}

const rateCache: Map<string, ExchangeRateCache> = new Map();
const CACHE_DURATION_MS = 60 * 60 * 1000; // 1 hour cache

/**
 * Get EUR to TRY exchange rate from free API
 * Uses ExchangeRate-API open access endpoint (no key required)
 * @returns Current EUR to TRY exchange rate
 */
export async function getEURtoTRYRate(): Promise<number> {
    const cacheKey = "EUR_TRY";
    const cached = rateCache.get(cacheKey);

    // Return cached rate if still valid
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION_MS) {
        return cached.rate;
    }

    try {
        // Primary API: ExchangeRate-API (free, no key required)
        const response = await fetch(
            "https://open.er-api.com/v6/latest/EUR",
            {
                method: "GET",
                headers: {
                    Accept: "application/json",
                },
                // Add timeout using AbortController
                signal: AbortSignal.timeout(5000),
            },
        );

        if (!response.ok) {
            throw new Error(`Exchange rate API error: ${response.status}`);
        }

        const data = await response.json();

        if (data.result !== "success" || !data.rates?.TRY) {
            throw new Error("Invalid response from exchange rate API");
        }

        const rate = data.rates.TRY;

        // Cache the rate
        rateCache.set(cacheKey, {
            rate,
            timestamp: Date.now(),
        });

        return rate;
    } catch (error) {
        console.error("[Currency] Failed to fetch exchange rate:", error);

        // Return cached rate even if expired, as fallback
        if (cached) {
            return cached.rate;
        }

        // Ultimate fallback: approximate rate (should be updated periodically)
        // As of December 2024, EUR/TRY is around 36-37
        const fallbackRate = 36.5;
        return fallbackRate;
    }
}

/**
 * Convert EUR amount to TRY
 * Adds 1 EUR buffer to account for exchange rate fluctuations
 * @param amountEUR Amount in EUR
 * @returns Amount in TRY (rounded to 2 decimal places)
 */
export async function convertEURtoTRY(amountEUR: number): Promise<number> {
    const rate = await getEURtoTRYRate();

    // Add 1 EUR buffer to cover exchange rate differences
    const amountWithBuffer = amountEUR + 1;
    const amountTRY = amountWithBuffer * rate;

    // Round to 2 decimal places
    return Math.round(amountTRY * 100) / 100;
}

/**
 * Format currency for display
 * @param amount Amount
 * @param currency Currency code (EUR, TRY, etc.)
 * @returns Formatted currency string
 */
export function formatCurrency(
    amount: number,
    currency: "EUR" | "TRY" | string,
): string {
    const formatter = new Intl.NumberFormat("tr-TR", {
        style: "currency",
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });

    return formatter.format(amount);
}
