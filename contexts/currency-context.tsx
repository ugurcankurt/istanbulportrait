"use client";

import { useLocale } from "next-intl";
import type React from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

interface CurrencyContextType {
  rate: number;
  formatPrice: (amountEUR: number, forceEur?: boolean) => string;
  currency: string;
  convertPrice: (amountEUR: number) => number;
  setCurrency: (code: string) => void;
}

const CurrencyContext = createContext<CurrencyContextType>({
  rate: 1,
  formatPrice: (amountEUR: number) => `€${amountEUR}`,
  currency: "EUR",
  convertPrice: (amountEUR: number) => amountEUR,
  setCurrency: () => {},
});

export function CurrencyProvider({
  children,
  rate: initialRate,
  rates,
  currency: initialCurrency = "EUR",
}: {
  children: React.ReactNode;
  rate?: number;
  rates?: Record<string, number>;
  currency?: string;
}) {
  const locale = useLocale();
  const [currency, setCurrencyState] = useState<string>(initialCurrency);

  // Hydrate user-selected currency from client cookie on mount so SSR stays ISR-cacheable
  useEffect(() => {
    const match = document.cookie.match(/(?:^|; )NEXT_CURRENCY=([A-Z]{3})/);
    if (match?.[1] && match[1] !== initialCurrency) {
      setCurrencyState(match[1]);
    }
  }, [initialCurrency]);

  const setCurrency = useCallback((code: string) => {
    document.cookie = `NEXT_CURRENCY=${code}; path=/; max-age=31536000; SameSite=Lax`;
    setCurrencyState(code);
  }, []);

  const rate =
    currency === "EUR"
      ? 1
      : (rates?.[currency] ??
        (currency === initialCurrency ? initialRate : 1) ??
        1);

  const intlLocaleMap: Record<string, string> = {
    en: "en-US",
    ar: "ar-SA",
    ru: "ru-RU",
    es: "es-ES",
    zh: "zh-CN",
    fr: "fr-FR",
    de: "de-DE",
    ro: "ro-RO",
    tr: "tr-TR",
  };
  const intlLocale = intlLocaleMap[locale] || "en-US";

  const convertPrice = (amountEUR: number) => {
    if (currency !== "EUR") {
      return Math.round(amountEUR * rate);
    }
    return amountEUR;
  };

  const formatPrice = (amountEUR: number, forceEur: boolean = false) => {
    if (forceEur) {
      return new Intl.NumberFormat(intlLocale, {
        style: "currency",
        currency: "EUR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(amountEUR);
    }

    const amountConverted =
      currency === "EUR" ? amountEUR : Math.round(amountEUR * rate);

    return new Intl.NumberFormat(intlLocale, {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amountConverted);
  };

  return (
    <CurrencyContext.Provider
      value={{ rate, formatPrice, currency, convertPrice, setCurrency }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
}
