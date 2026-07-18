"use client";

import React, { createContext, useContext } from "react";
import { useLocale } from "next-intl";

interface CurrencyContextType {
  rate: number;
  formatPrice: (amountEUR: number, forceEur?: boolean) => string;
  currency: string;
  convertPrice: (amountEUR: number) => number;
}

const CurrencyContext = createContext<CurrencyContextType>({
  rate: 1,
  formatPrice: (amountEUR: number) => `€${amountEUR}`,
  currency: "EUR",
  convertPrice: (amountEUR: number) => amountEUR,
});

export function CurrencyProvider({
  children,
  rate,
  currency = "EUR",
}: {
  children: React.ReactNode;
  rate: number;
  currency?: string;
}) {
  const locale = useLocale();

  const convertPrice = (amountEUR: number) => {
    if (currency !== "EUR") {
      return Math.round(amountEUR * rate);
    }
    return amountEUR;
  };

  const formatPrice = (amountEUR: number, forceEur: boolean = false) => {
    if (forceEur) {
      return new Intl.NumberFormat(locale === "tr" ? "tr-TR" : "en-US", {
        style: "currency",
        currency: "EUR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(amountEUR);
    }

    const amountConverted = currency === "EUR" ? amountEUR : Math.round(amountEUR * rate);
    
    return new Intl.NumberFormat(locale === "tr" ? "tr-TR" : "en-US", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amountConverted);
  };

  return (
    <CurrencyContext.Provider value={{ rate, formatPrice, currency, convertPrice }}>
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
