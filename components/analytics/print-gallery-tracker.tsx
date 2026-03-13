"use client";

import { useEffect } from "react";
import { trackViewItemList } from "@/lib/analytics";

interface PrintGalleryTrackerProps {
  products: Array<{
    sku: string;
    description: string;
    pricing?: { eur?: number };
    category?: string;
  }>;
}

export function PrintGalleryTracker({ products }: PrintGalleryTrackerProps) {
  useEffect(() => {
    trackViewItemList(
      products.map(p => ({
        id: p.sku,
        name: p.description,
        price: p.pricing?.eur || 0,
        category: "Print"
      })),
      "prints_catalog",
      "Print Shop Catalog"
    );
  }, [products]);

  return null;
}
