/**
 * Enhanced pricing system with tax breakdown
 * Integrates with package pricing, tax calculations, and dynamic CMS discounts.
 */

import {
  type FormattedTaxBreakdown,
  formatTaxBreakdown,
  getTaxBreakdownFromTotal,
  TAX_RATES,
  type TaxBreakdown,
} from "./tax";
import { type PackageId } from "./validations";
import { type DiscountDB } from "./discount-service";
export const DEPOSIT_PERCENTAGE = 0.3;

export function matchActiveSurcharge(timeString: string | undefined | null, timeSurcharges: any[] | undefined | null) {
  if (!timeString || !timeSurcharges || !Array.isArray(timeSurcharges)) return null;
  let match = timeSurcharges.find(s => s.time === timeString);
  if (!match && timeString.endsWith(":30")) {
    match = timeSurcharges.find(s => s.time === timeString.replace(":30", ":00"));
  }
  return match || null;
}

export interface PriceBreakdown extends TaxBreakdown {
  packageId: PackageId;
  displayName: string;
  originalPrice: number;
  discountAmount: number;
  isDiscounted: boolean;
  appliedDiscountPercentage: number;
  depositAmount: number;
  remainingAmount: number;
  promoCode?: string;
  promoAmount?: number;
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
  promoCode?: string;
  promoAmount?: string;
}

/**
 * Calculate discounted price based on active campaign
 * @param basePrice - Original price
 * @param activeDiscount - Actively running discount campaign from CMS
 * @param bookingDate - Optional booking date to constrain strictly to discounts window
 * @returns Discounted price and applied percentage
 */
export interface AppliedPromo { code: string; percentage: number; }

export function calculateDiscountedPrice(
  basePrice: number,
  activeDiscount: DiscountDB | null,
  appliedPromo?: AppliedPromo | null,
  bookingDate?: Date | string,
): {
  price: number;
  originalPrice: number;
  discountPercentage: number;
  discountAmount: number;
  isDiscounted: boolean;
  promoCode?: string;
  promoAmount?: number;
} {
  let currentPrice = basePrice;
  let campaignPercentage = 0;
  let campaignAmount = 0;

  if (activeDiscount && activeDiscount.is_active) {
    let isValid = true;
    const targetDate = bookingDate ? new Date(bookingDate) : new Date();

    if (activeDiscount.start_date && activeDiscount.end_date) {
      const start = new Date(activeDiscount.start_date);
      const end = new Date(activeDiscount.end_date);
      
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);

      if (targetDate.getTime() < start.getTime() || targetDate.getTime() > end.getTime()) {
        isValid = false;
      }
    }

    if (isValid) {
      campaignPercentage = Number(activeDiscount.discount_percentage);
      campaignAmount = basePrice * campaignPercentage;
      currentPrice -= campaignAmount;
    }
  }

  let promoPercentage = 0;
  let promoAmount = 0;

  if (appliedPromo) {
    promoPercentage = appliedPromo.percentage / 100;
    promoAmount = currentPrice * promoPercentage; // multiplicative stack
    currentPrice -= promoAmount;
  }

  currentPrice = Math.max(0, currentPrice);

  return {
    price: currentPrice,
    originalPrice: basePrice,
    discountPercentage: campaignPercentage,
    discountAmount: campaignAmount + promoAmount,
    isDiscounted: campaignPercentage > 0 || promoPercentage > 0,
    promoCode: appliedPromo?.code,
    promoAmount: promoAmount
  };
}

/**
 * Get complete price breakdown for a package
 * Current package prices are treated as tax-inclusive
 * @param packageId - Package identifier
 * @param basePrice - Raw price of the package from the database
 * @param maxPeopleCount - Number of people (for per-person pricing logic)
 * @param activeDiscount - Currently active discount campaign to apply
 * @param bookingDate - Optional selected date
 * @param taxRate - Tax rate (defaults to Turkey VAT)
 * @param packageNameOverride - Optional localized name for the package
 * @returns Complete price breakdown
 */
export function getPackagePricing(
  packageId: PackageId,
  basePrice: number,
  activeDiscount: DiscountDB | null,
  appliedPromo?: AppliedPromo | null,
  bookingDate?: Date | string,
  peopleCount?: number,
  taxRate: number = TAX_RATES.TURKEY,
  packageNameOverride?: string,
  surchargePercentage: number = 0,
): PriceBreakdown {
  const originalPrice = basePrice * (1 + surchargePercentage / 100);

  // Special handling for packages with per-person pricing
  if (peopleCount && peopleCount >= 1) {
    // Calculate per-person discounts
    const {
      price: discountedPerPerson,
      discountPercentage,
      promoCode,
      promoAmount: perPersonPromoAmount,
    } = calculateDiscountedPrice(originalPrice, activeDiscount, appliedPromo, bookingDate);

    // Calculate total based on people count
    const originalTotal = originalPrice * peopleCount;
    const discountedTotal = discountedPerPerson * peopleCount;
    const seasonalAmount = (originalPrice * discountPercentage) * peopleCount;

    const taxBreakdown = getTaxBreakdownFromTotal(discountedTotal, taxRate);

    // Calculate deposit and remaining
    const depositAmount =
      Math.round(discountedTotal * DEPOSIT_PERCENTAGE * 100) / 100;
    const remainingAmount =
      Math.round((discountedTotal - depositAmount) * 100) / 100;

    return {
      ...taxBreakdown,
      packageId,
      displayName: packageNameOverride || packageId,
      originalPrice: originalTotal,
      discountAmount: seasonalAmount,
      isDiscounted: discountPercentage > 0,
      appliedDiscountPercentage: discountPercentage,
      depositAmount,
      remainingAmount,
      promoCode,
      promoAmount: perPersonPromoAmount ? perPersonPromoAmount * peopleCount : undefined,
    };
  }

  // Standard pricing for other packages
  const {
    price: totalPrice,
    discountPercentage,
    discountAmount: seasonalAmount,
    promoCode,
    promoAmount,
  } = calculateDiscountedPrice(originalPrice, activeDiscount, appliedPromo, bookingDate);

  const taxBreakdown = getTaxBreakdownFromTotal(totalPrice, taxRate);

  // Calculate deposit and remaining
  const depositAmount = Math.round(totalPrice * DEPOSIT_PERCENTAGE * 100) / 100;
  const remainingAmount = Math.round((totalPrice - depositAmount) * 100) / 100;

  return {
    ...taxBreakdown,
    packageId,
    displayName: packageNameOverride || packageId,
    originalPrice,
    discountAmount: seasonalAmount,
    isDiscounted: discountPercentage > 0,
    appliedDiscountPercentage: discountPercentage,
    depositAmount,
    remainingAmount,
    promoCode,
    promoAmount,
  };
}

/**
 * Format package pricing for display
 */
export function formatPackagePricing(
  packageId: PackageId,
  basePrice: number,
  activeDiscount: DiscountDB | null,
  appliedPromo?: AppliedPromo | null,
  bookingDate?: Date | string,
  locale: string = "en",
  peopleCount?: number,
  taxRate: number = TAX_RATES.TURKEY,
  packageNameOverride?: string,
  surchargePercentage: number = 0,
): FormattedPriceBreakdown {
  const breakdown = getPackagePricing(
    packageId,
    basePrice,
    activeDiscount,
    appliedPromo,
    bookingDate,
    peopleCount,
    taxRate,
    packageNameOverride,
    surchargePercentage
  );
  
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
    remainingAmount: formatter.format(breakdown.remainingAmount),
    promoCode: breakdown.promoCode,
    promoAmount: breakdown.promoAmount ? formatter.format(breakdown.promoAmount) : undefined,
  };
}
