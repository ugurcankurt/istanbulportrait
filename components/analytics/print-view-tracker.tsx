"use client";

import { useEffect } from "react";
import { trackPrintViewItem } from "@/lib/analytics";

interface PrintViewTrackerProps {
  sku: string;
  name: string;
  category: string;
  price: number;
}

export function PrintViewTracker({
  sku,
  name,
  category,
  price,
}: PrintViewTrackerProps) {
  useEffect(() => {
    trackPrintViewItem(sku, name, category, price);
  }, [sku, name, category, price]);

  return null;
}
