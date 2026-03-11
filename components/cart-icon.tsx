"use client";

import { ShoppingCart } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCartStore } from "@/stores/cart-store";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function CartIcon() {
    const { item, setCartOpen } = useCartStore();
    const hasItem = !!item;
    const t = useTranslations("cart");

    return (
        <button
            onClick={() => setCartOpen(true)}
            aria-label={t("title")}
            className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "relative h-9 w-9 px-0 hover:scale-110 transition-transform duration-200",
            )}
        >
            <ShoppingCart className="h-5 w-5" />
            {hasItem && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground animate-bounce">
                    1
                </span>
            )}
            <span className="sr-only">{t("title")}</span>
        </button>
    );
}
