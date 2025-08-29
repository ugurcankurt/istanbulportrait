import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format currency based on locale
 * @param amount - Amount to format
 * @param locale - Locale code (en, ar, ru, es)
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number, locale: string = "en"): string {
  const currencyMap = {
    en: { currency: "EUR", symbol: "€" },
    ar: { currency: "EUR", symbol: "€" }, // Could be localized to AED/SAR
    ru: { currency: "EUR", symbol: "€" }, // Could be localized to RUB
    es: { currency: "EUR", symbol: "€" }, // EUR is common in Spain
  };

  const { currency, symbol } =
    currencyMap[locale as keyof typeof currencyMap] || currencyMap.en;

  try {
    // Use Intl.NumberFormat for proper locale formatting
    const formatter = new Intl.NumberFormat(getIntlLocale(locale), {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });

    const formatted = formatter.format(amount);

    // Convert to Arabic numerals if locale is Arabic
    return localizeNumerals(formatted, locale);
  } catch (_error) {
    // Fallback to manual formatting
    const fallback = `${symbol}${amount}`;
    return localizeNumerals(fallback, locale);
  }
}

/**
 * Convert our locale codes to Intl.NumberFormat compatible locales
 */
function getIntlLocale(locale: string): string {
  const localeMap = {
    en: "en-US",
    ar: "ar-SA", // Saudi Arabia Arabic
    ru: "ru-RU", // Russian
    es: "es-ES", // Spain Spanish
  };

  return localeMap[locale as keyof typeof localeMap] || "en-US";
}

/**
 * Format phone number based on locale
 */
export function formatPhoneNumber(
  phone: string,
  locale: string = "en",
): string {
  // Remove all non-digits
  const cleaned = phone.replace(/\D/g, "");

  // Turkey phone format for all locales (Istanbul photography business)
  if (cleaned.startsWith("90")) {
    // International format
    const match = cleaned.match(/^90(\d{3})(\d{3})(\d{2})(\d{2})$/);
    const formatted = match
      ? `+90 ${match[1]} ${match[2]} ${match[3]} ${match[4]}`
      : phone;

    // Convert to Arabic numerals if locale is Arabic
    return localizeNumerals(formatted, locale);
  }

  // Domestic format
  if (cleaned.length === 10 && cleaned.startsWith("5")) {
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{2})(\d{2})$/);
    const formatted = match
      ? `${match[1]} ${match[2]} ${match[3]} ${match[4]}`
      : phone;

    // Convert to Arabic numerals if locale is Arabic
    return localizeNumerals(formatted, locale);
  }

  // For any other phone format, just localize numerals
  return localizeNumerals(phone, locale);
}

/**
 * Get direction (ltr/rtl) based on locale
 */
export function getTextDirection(locale: string): "ltr" | "rtl" {
  return locale === "ar" ? "rtl" : "ltr";
}

/**
 * Get locale-specific date formatting
 */
export function formatDate(date: Date, locale: string = "en"): string {
  try {
    return new Intl.DateTimeFormat(getIntlLocale(locale), {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  } catch (_error) {
    return date.toLocaleDateString();
  }
}

/**
 * Convert Latin numerals (0-9) to Arabic-Indic numerals (٠-٩)
 * Used for proper Arabic localization
 */
export function convertToArabicNumerals(text: string): string {
  const arabicNumerals: Record<string, string> = {
    "0": "٠",
    "1": "١",
    "2": "٢",
    "3": "٣",
    "4": "٤",
    "5": "٥",
    "6": "٦",
    "7": "٧",
    "8": "٨",
    "9": "٩",
  };

  return text.replace(/[0-9]/g, (match) => arabicNumerals[match] || match);
}

/**
 * Format text with Arabic numerals if locale is Arabic
 */
export function localizeNumerals(text: string, locale: string): string {
  return locale === "ar" ? convertToArabicNumerals(text) : text;
}
