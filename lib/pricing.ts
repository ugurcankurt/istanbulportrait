/**
 * Enhanced pricing system with tax breakdown
 * Integrates with package pricing and tax calculations
 */

import {
  type FormattedTaxBreakdown,
  formatTaxBreakdown,
  getTaxBreakdownFromTotal,
  TAX_RATES,
  type TaxBreakdown,
} from "./tax";
import { type PackageId, packagePrices } from "./validations";

export interface PriceBreakdown extends TaxBreakdown {
  packageId: PackageId;
  displayName: string;
}

export interface FormattedPriceBreakdown extends FormattedTaxBreakdown {
  packageId: PackageId;
  displayName: string;
}

/**
 * Get complete price breakdown for a package
 * Current package prices are treated as tax-inclusive
 * @param packageId - Package identifier
 * @param taxRate - Tax rate (defaults to Turkey VAT)
 * @returns Complete price breakdown
 */
export function getPackagePricing(
  packageId: PackageId,
  taxRate: number = TAX_RATES.TURKEY,
): PriceBreakdown {
  const totalPrice = packagePrices[packageId];
  const taxBreakdown = getTaxBreakdownFromTotal(totalPrice, taxRate);

  return {
    ...taxBreakdown,
    packageId,
    displayName: getPackageDisplayName(packageId),
  };
}

/**
 * Format package pricing for display
 * @param packageId - Package identifier
 * @param locale - Locale for formatting
 * @param taxRate - Tax rate (defaults to Turkey VAT)
 * @returns Formatted price breakdown
 */
export function formatPackagePricing(
  packageId: PackageId,
  locale: string = "en",
  taxRate: number = TAX_RATES.TURKEY,
): FormattedPriceBreakdown {
  const breakdown = getPackagePricing(packageId, taxRate);
  const formatted = formatTaxBreakdown(breakdown, locale);

  return {
    ...formatted,
    packageId: breakdown.packageId,
    displayName: breakdown.displayName,
  };
}

/**
 * Get package display name (can be enhanced with translations later)
 * @param packageId - Package identifier
 * @returns Display name for the package
 */
function getPackageDisplayName(packageId: PackageId): string {
  const displayNames = {
    essential: "Essential Package",
    premium: "Premium Package",
    luxury: "Luxury Package",
    rooftop: "Rooftop Package",
  };

  return displayNames[packageId];
}

/**
 * Calculate total for multiple packages (if needed in future)
 * @param packageIds - Array of package IDs
 * @param taxRate - Tax rate (defaults to Turkey VAT)
 * @returns Combined price breakdown
 */
export function calculateMultiPackageTotal(
  packageIds: PackageId[],
  taxRate: number = TAX_RATES.TURKEY,
): TaxBreakdown {
  const breakdowns = packageIds.map((id) => getPackagePricing(id, taxRate));

  const totals = breakdowns.reduce(
    (acc, breakdown) => ({
      basePrice: acc.basePrice + breakdown.basePrice,
      taxAmount: acc.taxAmount + breakdown.taxAmount,
      totalPrice: acc.totalPrice + breakdown.totalPrice,
    }),
    { basePrice: 0, taxAmount: 0, totalPrice: 0 },
  );

  return {
    basePrice: Math.round(totals.basePrice * 100) / 100,
    taxRate,
    taxAmount: Math.round(totals.taxAmount * 100) / 100,
    totalPrice: Math.round(totals.totalPrice * 100) / 100,
  };
}

/**
 * Validate package price integrity
 * Ensures our tax calculations are consistent
 * @param packageId - Package identifier
 * @param taxRate - Tax rate to validate against
 * @returns True if price structure is valid
 */
export function validatePackagePrice(
  packageId: PackageId,
  taxRate: number = TAX_RATES.TURKEY,
): boolean {
  try {
    const breakdown = getPackagePricing(packageId, taxRate);
    const recalculatedTotal = breakdown.basePrice + breakdown.taxAmount;

    // Allow for small rounding differences (1 cent)
    return Math.abs(recalculatedTotal - breakdown.totalPrice) < 0.01;
  } catch {
    return false;
  }
}

/**
 * Get all package pricings for comparison display
 * @param locale - Locale for formatting
 * @param taxRate - Tax rate (defaults to Turkey VAT)
 * @returns Array of formatted price breakdowns
 */
export function getAllPackagePricing(
  locale: string = "en",
  taxRate: number = TAX_RATES.TURKEY,
): FormattedPriceBreakdown[] {
  return Object.keys(packagePrices).map((packageId) =>
    formatPackagePricing(packageId as PackageId, locale, taxRate),
  );
}

/**
 * Utility to get just the total price (backwards compatibility)
 * @param packageId - Package identifier
 * @returns Total price including tax
 */
export function getPackageTotal(packageId: PackageId): number {
  return packagePrices[packageId];
}

/**
 * Utility to get just the base price
 * @param packageId - Package identifier
 * @param taxRate - Tax rate (defaults to Turkey VAT)
 * @returns Base price before tax
 */
export function getPackageBasePrice(
  packageId: PackageId,
  taxRate: number = TAX_RATES.TURKEY,
): number {
  return getPackagePricing(packageId, taxRate).basePrice;
}
