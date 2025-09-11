/**
 * Tax calculation utilities for Turkey market
 * Handles VAT (KDV) calculations and formatting
 */

export const TAX_RATES = {
  TURKEY: 0.2, // %20 KDV (Turkish VAT)
  DEFAULT: 0.0,
} as const;

export interface TaxBreakdown {
  basePrice: number;
  taxRate: number;
  taxAmount: number;
  totalPrice: number;
}

export interface FormattedTaxBreakdown {
  basePrice: string;
  taxRate: string;
  taxAmount: string;
  totalPrice: string;
  taxRatePercentage: string;
}

/**
 * Calculate tax amount from base price
 * @param basePrice - Price before tax
 * @param taxRate - Tax rate (0.20 for 20%)
 * @returns Tax amount
 */
export function calculateTax(
  basePrice: number,
  taxRate: number = TAX_RATES.TURKEY,
): number {
  return Math.round(basePrice * taxRate * 100) / 100; // Round to 2 decimal places
}

/**
 * Calculate total price including tax
 * @param basePrice - Price before tax
 * @param taxRate - Tax rate (0.20 for 20%)
 * @returns Total price including tax
 */
export function calculateTotalWithTax(
  basePrice: number,
  taxRate: number = TAX_RATES.TURKEY,
): number {
  return Math.round(basePrice * (1 + taxRate) * 100) / 100;
}

/**
 * Calculate base price from tax-inclusive price
 * @param totalPrice - Price including tax
 * @param taxRate - Tax rate (0.20 for 20%)
 * @returns Base price before tax
 */
export function calculateBasePrice(
  totalPrice: number,
  taxRate: number = TAX_RATES.TURKEY,
): number {
  return Math.round((totalPrice / (1 + taxRate)) * 100) / 100;
}

/**
 * Get complete tax breakdown from base price
 * @param basePrice - Price before tax
 * @param taxRate - Tax rate (0.20 for 20%)
 * @returns Complete tax breakdown
 */
export function getTaxBreakdown(
  basePrice: number,
  taxRate: number = TAX_RATES.TURKEY,
): TaxBreakdown {
  const taxAmount = calculateTax(basePrice, taxRate);
  const totalPrice = basePrice + taxAmount;

  return {
    basePrice,
    taxRate,
    taxAmount,
    totalPrice,
  };
}

/**
 * Get tax breakdown from tax-inclusive price (reverse calculation)
 * @param totalPrice - Price including tax
 * @param taxRate - Tax rate (0.20 for 20%)
 * @returns Complete tax breakdown
 */
export function getTaxBreakdownFromTotal(
  totalPrice: number,
  taxRate: number = TAX_RATES.TURKEY,
): TaxBreakdown {
  const basePrice = calculateBasePrice(totalPrice, taxRate);
  const taxAmount = totalPrice - basePrice;

  return {
    basePrice,
    taxRate,
    taxAmount,
    totalPrice,
  };
}

/**
 * Format tax breakdown for display
 * @param breakdown - Tax breakdown object
 * @param locale - Locale for formatting
 * @returns Formatted tax breakdown
 */
export function formatTaxBreakdown(
  breakdown: TaxBreakdown,
  locale: string = "en",
): FormattedTaxBreakdown {
  const formatter = new Intl.NumberFormat(getIntlLocale(locale), {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return {
    basePrice: formatter.format(breakdown.basePrice),
    taxAmount: formatter.format(breakdown.taxAmount),
    totalPrice: formatter.format(breakdown.totalPrice),
    taxRate: `${Math.round(breakdown.taxRate * 100)}%`,
    taxRatePercentage: Math.round(breakdown.taxRate * 100).toString(),
  };
}

/**
 * Convert our locale codes to Intl.NumberFormat compatible locales
 */
function getIntlLocale(locale: string): string {
  const localeMap = {
    en: "en-US",
    ar: "ar-SA",
    ru: "ru-RU",
    es: "es-ES",
  };

  return localeMap[locale as keyof typeof localeMap] || "en-US";
}

/**
 * Check if a price includes tax
 * @param price - Price to check
 * @param taxRate - Expected tax rate
 * @returns True if price appears to include tax
 */
export function isPriceIncludingTax(
  price: number,
  taxRate: number = TAX_RATES.TURKEY,
): boolean {
  // This is a heuristic - check if the price is a "round" number when tax is removed
  const basePrice = calculateBasePrice(price, taxRate);
  const recalculatedTotal = calculateTotalWithTax(basePrice, taxRate);

  // Allow for small rounding differences (1 cent)
  return Math.abs(recalculatedTotal - price) < 0.01;
}
