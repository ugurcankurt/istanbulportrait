"use client";

import React, { createContext, useContext } from "react";
import { useLocale } from "next-intl";

interface CurrencyContextType {
  rate: number;
  formatPrice: (amountEUR: number, forceEur?: boolean) => string;
}

const CurrencyContext = createContext<CurrencyContextType>({
  rate: 36.5,
  formatPrice: (amountEUR: number) => `€${amountEUR}`,
});

export function CurrencyProvider({
  children,
  rate,
}: {
  children: React.ReactNode;
  rate: number;
}) {
  const locale = useLocale();

  const formatPrice = (amountEUR: number, forceEur: boolean = false) => {
    if (!forceEur && locale === "tr") {
      // Clean integer rounding for TRY conversions as requested
      const amountTRY = Math.round(amountEUR * rate);
      return new Intl.NumberFormat("tr-TR", {
        style: "currency",
        currency: "TRY",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(amountTRY);
    }
    
    // Default formatting for EUR (or English / forced contexts)
    return new Intl.NumberFormat(locale === "tr" ? "de-DE" : "en-US", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0, // Keep clean numbers unless decimals exist
      maximumFractionDigits: 2,
    }).format(amountEUR);
  };

  return (
    <CurrencyContext.Provider value={{ rate, formatPrice }}>
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
