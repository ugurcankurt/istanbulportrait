"use client";

import { ShoppingBag, Trash2, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { usePrintsCartStore } from "@/stores/prints-cart-store";
import { Button } from "@/components/ui/button";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from "@/components/ui/sheet";

export function PrintsCartSheet() {
    const { items, isCartOpen, setCartOpen, removePrintFromCart, getTotalPrice } = usePrintsCartStore();
    const router = useRouter();
    const locale = useLocale();
    const t = useTranslations("prints");

    const handleCheckout = () => {
        if (items.length === 0) return;
        setCartOpen(false);
        router.push(`/${locale}/prints/checkout`);
    };

    return (
        <Sheet open={isCartOpen} onOpenChange={setCartOpen}>
            <SheetContent side="right" className="w-full sm:w-[420px] p-0 flex flex-col">
                {/* Header */}
                <SheetHeader className="p-6 pb-4 bg-gradient-to-r from-primary/5 to-background border-b">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                            <ShoppingBag className="h-5 w-5 text-primary-foreground" />
                        </div>
                        <div>
                            <SheetTitle className="text-xl font-bold">{t("shop_cart_title")}</SheetTitle>
                            <SheetDescription className="text-sm text-muted-foreground">
                                {items.length > 0 ? t("items_in_cart", { count: items.length }) : t("empty_cart")}
                            </SheetDescription>
                        </div>
                    </div>
                </SheetHeader>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {items.length > 0 ? (
                        <div className="space-y-4">
                            {items.map((item) => (
                                <div key={item.id} className="relative rounded-xl border border-primary/20 bg-card overflow-hidden shadow-sm flex items-center gap-4 p-3">
                                    <div className="w-20 h-20 rounded-md overflow-hidden bg-muted flex-shrink-0 relative">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={item.uploadUrl} alt={item.name} className="object-cover w-full h-full" />
                                    </div>
                                    <div className="flex-1 overflow-hidden">
                                        <h4 className="font-semibold text-sm line-clamp-1">{item.name}</h4>

                                        {item.attributes && Object.keys(item.attributes).length > 0 && (
                                            <div className="flex flex-wrap gap-x-2 mt-1">
                                                {Object.entries(item.attributes).map(([key, value]) => (
                                                    <span key={key} className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full capitalize">
                                                        {key}: {value}
                                                    </span>
                                                ))}
                                            </div>
                                        )}

                                        <p className="text-xs text-muted-foreground mt-1">{t("qty")}: {item.quantity}</p>
                                        <div className="flex items-center justify-between mt-1">
                                            <span className="font-bold text-primary">€{(item.price * item.quantity).toFixed(2)}</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => removePrintFromCart(item.id)}
                                        aria-label={t("remove_item")}
                                        className="absolute top-2 right-2 text-muted-foreground hover:text-destructive transition-colors p-1.5 rounded-md hover:bg-destructive/10"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        /* Empty State */
                        <div className="flex flex-col items-center justify-center h-full py-16 text-center gap-4">
                            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
                                <ShoppingBag className="h-10 w-10 text-muted-foreground/40" />
                            </div>
                            <div>
                                <p className="font-semibold text-lg">{t("empty_cart")}</p>
                                <p className="text-muted-foreground text-sm mt-1">
                                    {t("art_description")}
                                </p>
                            </div>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setCartOpen(false);
                                    router.push(`/${locale}/prints`);
                                }}
                            >
                                {t("browse_prints")}
                            </Button>
                        </div>
                    )}
                </div>

                {/* Footer — Checkout Button */}
                {items.length > 0 && (
                    <div className="p-6 border-t bg-background space-y-4">
                        <div className="flex justify-between items-center text-sm font-semibold">
                            <span>{t("subtotal")}</span>
                            <span className="text-lg text-primary">€{getTotalPrice().toFixed(2)}</span>
                        </div>
                        <Button
                            className="w-full gap-2 text-base font-bold h-12"
                            size="lg"
                            onClick={handleCheckout}
                        >
                            {t("checkout")}
                            <ArrowRight className="h-5 w-5" />
                        </Button>
                    </div>
                )}
            </SheetContent>
        </Sheet>
    );
}
