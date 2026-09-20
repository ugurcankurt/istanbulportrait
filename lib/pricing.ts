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
import type { DiscountDB } from "./discount-service";
import type { TimeSurcharge } from "./availability-service";
import type { AddonDB } from "./addons-service";

export const DEPOSIT_PERCENTAGE = 0.5; // From previous constants or logic


export function matchActiveSurcharge(
  timeString: string | undefined | null,
  timeSurcharges: any[] | undefined | null,
) {
  if (!timeString || !timeSurcharges || !Array.isArray(timeSurcharges))
    return null;
  let match = timeSurcharges.find((s) => s.time === timeString);
  if (!match && timeString.endsWith(":30")) {
    match = timeSurcharges.find(
      (s) => s.time === timeString.replace(":30", ":00"),
    );
  }
  return match || null;
}

export interface PriceBreakdown extends TaxBreakdown {
  packageId: PackageId;
  displayName: string;
  rawBasePrice: number;
  timeSurchargeAmount: number;
  yieldAmount: number;
  originalPrice: number;
  discountAmount: number;
  isDiscounted: boolean;
  appliedDiscountPercentage: number;
  depositAmount: number;
  remainingAmount: number;
  promoCode?: string;
  promoAmount?: number;
  discountName?: string;
  addonsAmount?: number;
}

export interface FormattedPriceBreakdown extends FormattedTaxBreakdown {
  packageId: PackageId;
  displayName: string;
  rawBasePrice: string;
  timeSurchargeAmount: string;
  yieldAmount: string;
  originalPrice: string;
  discountAmount: string;
  isDiscounted: boolean;
  appliedDiscountPercentage: number;
  depositAmount: string;
  remainingAmount: string;
  promoCode?: string;
  promoAmount?: string;
  discountName?: string;
  addonsAmount?: string;
}

/**
 * Calculate discounted price based on active campaign
 * @param basePrice - Original price
 * @param activeDiscount - Actively running discount campaign from CMS
 * @param bookingDate - Optional booking date to constrain strictly to discounts window
 * @returns Discounted price and applied percentage
 */
export interface AppliedPromo {
  code: string;
  percentage: number;
}

export function calculateDiscountedPrice(
  basePrice: number,
  activeDiscounts: DiscountDB[] | null,
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
  discountName?: string;
} {
  let currentPrice = basePrice;
  let campaignPercentage = 0;
  let campaignAmount = 0;
  let campaignName: string | undefined = undefined;

  if (activeDiscounts && activeDiscounts.length > 0) {
    const targetDate = bookingDate ? new Date(bookingDate) : new Date();
    targetDate.setHours(12, 0, 0, 0); // use noon to avoid timezone edge cases

    const validDiscounts = activeDiscounts.filter((discount) => {
      if (!discount.is_active) return false;
      
      let isValid = true;
      if (discount.start_date) {
        const startDate = new Date(discount.start_date);
        startDate.setHours(0, 0, 0, 0);
        if (targetDate.getTime() < startDate.getTime()) isValid = false;
      }
      if (discount.end_date) {
        const endDate = new Date(discount.end_date);
        endDate.setHours(23, 59, 59, 999);
        if (targetDate.getTime() > endDate.getTime()) isValid = false;
      }
      return isValid;
    });

    if (validDiscounts.length > 0) {
      validDiscounts.sort((a, b) => Number(b.discount_percentage) - Number(a.discount_percentage));
      const bestDiscount = validDiscounts[0];
      
      campaignPercentage = Number(bestDiscount.discount_percentage);
      campaignAmount = basePrice * campaignPercentage;
      campaignName = bestDiscount.name;
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
    promoAmount: promoAmount,
    discountName: campaignName,
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
  activeDiscounts: DiscountDB[] | null,
  appliedPromo?: AppliedPromo | null,
  bookingDate?: Date | string,
  peopleCount?: number,
  taxRate: number = TAX_RATES.TURKEY,
  packageNameOverride?: string,
  surchargePercentage: number = 0,
  yieldMultiplier: number = 1.0,
  availableAddons: AddonDB[] = [],
  selectedAddons: string[] = [],
  isPerPerson?: boolean,
  addonQuantities: Record<string, number> = {},
): PriceBreakdown {
  const timeSurchargeAmount = basePrice * (surchargePercentage / 100);
  const priceBeforeYield = basePrice + timeSurchargeAmount;
  const yieldAmount = priceBeforeYield * (yieldMultiplier - 1);
  const packageUnitPrice = priceBeforeYield + yieldAmount;

  // Determine whether this package calculates base price per person
  const isPackagePerPerson =
    isPerPerson ?? (peopleCount !== undefined && peopleCount >= 1);

  // 1. Calculate base original total for the package ONLY
  const packageOriginalTotal = isPackagePerPerson
    ? packageUnitPrice * (peopleCount || 1)
    : packageUnitPrice;

  // 2. Calculate discounts ONLY on the package (add-ons are NEVER discounted!)
  const {
    price: discountedPackagePrice,
    discountPercentage,
    discountAmount: seasonalAmount,
    promoCode,
    promoAmount,
    discountName,
  } = calculateDiscountedPrice(
    packageOriginalTotal,
    activeDiscounts,
    appliedPromo,
    bookingDate,
  );

  // 3. Calculate Addons total at FULL price (NO website discounts or promos applied)
  let totalAddonsAmount = 0;
  if (selectedAddons.length > 0 && availableAddons.length > 0) {
    const addons = availableAddons.filter((a) => selectedAddons.includes(a.id));
    for (const addon of addons) {
      if (addon.is_per_person) {
        const qty = addonQuantities[addon.id] || 1;
        totalAddonsAmount += Number(addon.price) * qty;
      } else {
        totalAddonsAmount += Number(addon.price);
      }
    }
  }

  // 4. Combine discounted package price + full-price addons
  const finalOriginalTotal = packageOriginalTotal + totalAddonsAmount;
  const finalTotalPrice = discountedPackagePrice + totalAddonsAmount;

  const rawBaseTotal = isPackagePerPerson
    ? basePrice * (peopleCount || 1)
    : basePrice;
  const surchargeTotal = isPackagePerPerson
    ? timeSurchargeAmount * (peopleCount || 1)
    : timeSurchargeAmount;
  const yieldTotal = isPackagePerPerson
    ? yieldAmount * (peopleCount || 1)
    : yieldAmount;

  const taxBreakdown = getTaxBreakdownFromTotal(finalTotalPrice, taxRate);

  // Calculate deposit and remaining
  const depositAmount =
    Math.round(finalTotalPrice * DEPOSIT_PERCENTAGE * 100) / 100;
  const remainingAmount =
    Math.round((finalTotalPrice - depositAmount) * 100) / 100;

  return {
    ...taxBreakdown,
    packageId,
    displayName: packageNameOverride || packageId,
    rawBasePrice: rawBaseTotal,
    timeSurchargeAmount: surchargeTotal,
    yieldAmount: yieldTotal,
    originalPrice: finalOriginalTotal,
    totalPrice: finalTotalPrice,
    discountAmount: seasonalAmount,
    isDiscounted:
      discountPercentage > 0 || (promoAmount !== undefined && promoAmount > 0),
    appliedDiscountPercentage: discountPercentage,
    depositAmount,
    remainingAmount,
    promoCode,
    promoAmount,
    discountName,
    addonsAmount: totalAddonsAmount,
  };
}

/**
 * Format package pricing for display
 */
export function formatPackagePricing(
  packageId: PackageId,
  basePrice: number,
  activeDiscounts: DiscountDB[] | null,
  appliedPromo?: AppliedPromo | null,
  bookingDate?: Date | string,
  locale: string = "en",
  peopleCount?: number,
  taxRate: number = TAX_RATES.TURKEY,
  packageNameOverride?: string,
  surchargePercentage: number = 0,
  yieldMultiplier: number = 1.0,
  availableAddons: AddonDB[] = [],
  selectedAddons: string[] = [],
  isPerPerson?: boolean,
  addonQuantities: Record<string, number> = {},
): FormattedPriceBreakdown {
  const breakdown = getPackagePricing(
    packageId,
    basePrice,
    activeDiscounts,
    appliedPromo,
    bookingDate,
    peopleCount,
    taxRate,
    packageNameOverride,
    surchargePercentage,
    yieldMultiplier,
    availableAddons,
    selectedAddons,
    isPerPerson,
    addonQuantities,
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
    rawBasePrice: formatter.format(breakdown.rawBasePrice),
    timeSurchargeAmount: formatter.format(breakdown.timeSurchargeAmount),
    yieldAmount: formatter.format(Math.abs(breakdown.yieldAmount)), // format absolute value, we can add +/- in UI
    originalPrice: formatter.format(breakdown.originalPrice),
    discountAmount: formatter.format(breakdown.discountAmount),
    isDiscounted: breakdown.isDiscounted,
    appliedDiscountPercentage: breakdown.appliedDiscountPercentage,
    depositAmount: formatter.format(breakdown.depositAmount),
    remainingAmount: formatter.format(breakdown.remainingAmount),
    promoCode: breakdown.promoCode,
    promoAmount: breakdown.promoAmount ? formatter.format(breakdown.promoAmount) : undefined,
    discountName: breakdown.discountName,
    addonsAmount: breakdown.addonsAmount ? formatter.format(breakdown.addonsAmount) : undefined,
  };
}
