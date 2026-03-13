"use client";

import { useEffect, useState } from "react";
import { ShoppingBag } from "lucide-react";
import { useTranslations } from "next-intl";
import { usePrintsCartStore } from "@/stores/prints-cart-store";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function PrintsCartIcon() {
    const { items, setCartOpen } = usePrintsCartStore();
    const t = useTranslations("prints"); // Resusing the prints namespace for aria label if we needed, but fallback to en for now
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const itemCount = items.reduce((total, item) => total + item.quantity, 0);
    const hasItems = itemCount > 0;

    // Prevent hydration mismatch by rendering a placeholder of the same size
    if (!mounted) {
        return (
            <div className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "h-9 w-9 px-0")} />
        );
    }

    // Only show the Prints Cart icon if there are items in the cart
    // to avoid cluttering the navigation for photoshoot customers
    if (!hasItems) return null;

    return (
        <button
            onClick={() => setCartOpen(true)}
            aria-label={t("view_cart")}
            className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "relative h-9 w-9 px-0 hover:scale-110 transition-transform duration-200 text-primary",
            )}
            title={t("cart_title")}
        >
            <ShoppingBag className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground animate-bounce">
                {itemCount}
            </span>
        </button>
    );
}
