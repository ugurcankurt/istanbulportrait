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

export interface DiscountRule {
  startMonth: number; // 0-based (0 = January)
  endMonth: number;   // 0-based (11 = December)
  discountPercentage: number; // 0.1 = 10%
}

export const SEASONAL_DISCOUNTS: DiscountRule[] = [
  // Low season: January (0), February (1), March (2), April (3)
  { startMonth: 0, endMonth: 3, discountPercentage: 0.33 },
];

export const DEPOSIT_PERCENTAGE = 0.30;

export interface PriceBreakdown extends TaxBreakdown {
  packageId: PackageId;
  displayName: string;
  originalPrice: number;
  discountAmount: number;
  isDiscounted: boolean;
  appliedDiscountPercentage: number;
  depositAmount: number;
  remainingAmount: number;
}

export interface FormattedPriceBreakdown extends FormattedTaxBreakdown {
  packageId: PackageId;
  displayName: string;
  originalPrice: string;
  discountAmount: string;
  isDiscounted: boolean;
  appliedDiscountPercentage: number;
  depositAmount: string;
  remainingAmount: string;
}

/**
 * Calculate discounted price based on date
 * @param basePrice - Original price
 * @param date - Booking date to check against discount rules
 * @returns Discounted price and applied percentage
 */
export function calculateDiscountedPrice(
  basePrice: number,
  date?: Date | string,
): {
  price: number;
  originalPrice: number;
  discountPercentage: number;
  discountAmount: number;
  isDiscounted: boolean;
} {
  if (!date) {
    return {
      price: basePrice,
      originalPrice: basePrice,
      discountPercentage: 0,
      discountAmount: 0,
      isDiscounted: false,
    };
  }

  const checkDate = typeof date === "string" ? new Date(date) : date;
  if (isNaN(checkDate.getTime())) {
    return {
      price: basePrice,
      originalPrice: basePrice,
      discountPercentage: 0,
      discountAmount: 0,
      isDiscounted: false,
    };
  }

  const month = checkDate.getMonth();

  const applicableRule = SEASONAL_DISCOUNTS.find(
    (rule) => month >= rule.startMonth && month <= rule.endMonth,
  );

  if (applicableRule) {
    const discountAmount = basePrice * applicableRule.discountPercentage;
    return {
      price: basePrice - discountAmount,
      originalPrice: basePrice,
      discountPercentage: applicableRule.discountPercentage,
      discountAmount: discountAmount,
      isDiscounted: true,
    };
  }

  return {
    price: basePrice,
    originalPrice: basePrice,
    discountPercentage: 0,
    discountAmount: 0,
    isDiscounted: false,
  };
}

/**
 * Get complete price breakdown for a package
 * Current package prices are treated as tax-inclusive
 * @param packageId - Package identifier
 * @param taxRate - Tax rate (defaults to Turkey VAT)
 * @param date - Optional date to apply seasonal discounts
 * @param peopleCount - Number of people (for rooftop package per-person pricing)
 * @returns Complete price breakdown
 */
export function getPackagePricing(
  packageId: PackageId,
  taxRate: number = TAX_RATES.TURKEY,
  date?: Date | string,
  peopleCount?: number
): PriceBreakdown {
  const originalPrice = packagePrices[packageId];

  // Special handling for rooftop package with per-person pricing
  if (packageId === "rooftop" && peopleCount && peopleCount >= 1) {
    // Apply seasonal discount to per-person price first
    const { price: discountedPerPerson, discountPercentage } = calculateDiscountedPrice(originalPrice, date);

    // Calculate total based on people count
    const originalTotal = originalPrice * peopleCount;
    const discountedTotal = discountedPerPerson * peopleCount;

    const taxBreakdown = getTaxBreakdownFromTotal(discountedTotal, taxRate);

    // Calculate deposit and remaining
    const depositAmount = Math.round(discountedTotal * DEPOSIT_PERCENTAGE * 100) / 100;
    const remainingAmount = Math.round((discountedTotal - depositAmount) * 100) / 100;

    return {
      ...taxBreakdown,
      packageId,
      displayName: getPackageDisplayName(packageId),
      originalPrice: originalTotal,
      discountAmount: originalTotal - discountedTotal,
      isDiscounted: discountPercentage > 0,
      appliedDiscountPercentage: discountPercentage,
      depositAmount,
      remainingAmount
    };
  }

  // Standard pricing for other packages
  const { price: totalPrice, discountPercentage } = calculateDiscountedPrice(originalPrice, date);

  const taxBreakdown = getTaxBreakdownFromTotal(totalPrice, taxRate);

  // Calculate deposit and remaining
  const depositAmount = Math.round(totalPrice * DEPOSIT_PERCENTAGE * 100) / 100;
  const remainingAmount = Math.round((totalPrice - depositAmount) * 100) / 100;

  return {
    ...taxBreakdown,
    packageId,
    displayName: getPackageDisplayName(packageId),
    originalPrice,
    discountAmount: originalPrice - totalPrice,
    isDiscounted: discountPercentage > 0,
    appliedDiscountPercentage: discountPercentage,
    depositAmount,
    remainingAmount
  };
}

/**
 * Format package pricing for display
 * @param packageId - Package identifier
 * @param locale - Locale for formatting
 * @param taxRate - Tax rate (defaults to Turkey VAT)
 * @param date - Optional date to apply seasonal discounts
 * @param peopleCount - Number of people (for rooftop package per-person pricing)
 * @returns Formatted price breakdown
 */
export function formatPackagePricing(
  packageId: PackageId,
  locale: string = "en",
  taxRate: number = TAX_RATES.TURKEY,
  date?: Date | string,
  peopleCount?: number
): FormattedPriceBreakdown {
  const breakdown = getPackagePricing(packageId, taxRate, date, peopleCount);
  const formatted = formatTaxBreakdown(breakdown, locale);

  const formatter = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "EUR",
  });

  return {
    ...formatted,
    packageId: breakdown.packageId,
    displayName: breakdown.displayName,
    originalPrice: formatter.format(breakdown.originalPrice),
    discountAmount: formatter.format(breakdown.discountAmount),
    isDiscounted: breakdown.isDiscounted,
    appliedDiscountPercentage: breakdown.appliedDiscountPercentage,
    depositAmount: formatter.format(breakdown.depositAmount),
    remainingAmount: formatter.format(breakdown.remainingAmount)
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
