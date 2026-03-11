"use client";

import { ShoppingCart, Calendar, Clock, Users, Trash2, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useCartStore } from "@/stores/cart-store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from "@/components/ui/sheet";

export function CartSheet() {
    const { item, isCartOpen, setCartOpen, removeFromCart } = useCartStore();
    const router = useRouter();
    const locale = useLocale();
    const t = useTranslations("cart");

    const handleCheckout = () => {
        if (!item) return;
        setCartOpen(false);
        router.push(`/${locale}/checkout?package=${item.packageId}`);
    };

    const handleRemove = () => {
        removeFromCart();
    };

    return (
        <Sheet open={isCartOpen} onOpenChange={setCartOpen}>
            <SheetContent side="right" className="w-full sm:w-[420px] p-0 flex flex-col">
                {/* Header */}
                <SheetHeader className="p-6 pb-4 bg-gradient-to-r from-primary/5 to-background border-b">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                            <ShoppingCart className="h-5 w-5 text-primary-foreground" />
                        </div>
                        <div>
                            <SheetTitle className="text-xl font-bold">{t("title")}</SheetTitle>
                            <SheetDescription className="text-sm text-muted-foreground">
                                {item ? t("item_selected") : t("empty")}
                            </SheetDescription>
                        </div>
                    </div>
                </SheetHeader>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {item ? (
                        <div className="space-y-6">
                            {/* Package Card */}
                            <div className="rounded-xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-background overflow-hidden">
                                {/* Package Header */}
                                <div className="p-4 bg-primary/10 border-b border-primary/10">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1">
                                            <Badge className="mb-2 bg-primary text-primary-foreground text-xs">
                                                {t("photo_package")}
                                            </Badge>
                                            <h3 className="text-lg font-bold leading-tight">{item.packageName}</h3>
                                        </div>
                                        <button
                                            onClick={handleRemove}
                                            aria-label={t("remove")}
                                            className="text-muted-foreground hover:text-destructive transition-colors p-1 rounded-md hover:bg-destructive/10"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* Booking Details */}
                                <div className="p-4 space-y-3">
                                    <div className="flex items-center gap-3 text-sm">
                                        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                            <Calendar className="h-3.5 w-3.5 text-primary" />
                                        </div>
                                        <span className="text-muted-foreground">{t("date")}</span>
                                        <span className="font-semibold ml-auto">{item.bookingDate}</span>
                                    </div>

                                    <div className="flex items-center gap-3 text-sm">
                                        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                            <Clock className="h-3.5 w-3.5 text-primary" />
                                        </div>
                                        <span className="text-muted-foreground">{t("time")}</span>
                                        <span className="font-semibold ml-auto">{item.bookingTime}</span>
                                    </div>

                                    {item.peopleCount && item.packageId === "rooftop" && (
                                        <div className="flex items-center gap-3 text-sm">
                                            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                                <Users className="h-3.5 w-3.5 text-primary" />
                                            </div>
                                            <span className="text-muted-foreground">{t("people")}</span>
                                            <span className="font-semibold ml-auto">
                                                {t("person_count", { count: item.peopleCount })}
                                            </span>
                                        </div>
                                    )}

                                    <Separator className="my-2" />

                                    {/* Customer */}
                                    <div className="text-sm space-y-1">
                                        <p className="text-muted-foreground text-xs uppercase tracking-wide font-medium">
                                            {t("customer")}
                                        </p>
                                        <p className="font-semibold">{item.customerName}</p>
                                        <p className="text-muted-foreground text-xs">{item.customerEmail}</p>
                                    </div>
                                </div>

                                {/* Price Footer */}
                                <div className="px-4 pb-4">
                                    <div className="rounded-lg bg-primary/10 border border-primary/20 p-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-muted-foreground">{t("total")}</span>
                                            <span className="text-xl font-bold text-primary">€{item.price}</span>
                                        </div>
                                        <div className="flex justify-between items-center mt-1.5">
                                            <span className="text-xs text-muted-foreground">{t("deposit_now")}</span>
                                            <span className="text-sm font-bold text-primary">€{item.depositAmount.toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* Empty State */
                        <div className="flex flex-col items-center justify-center h-full py-16 text-center gap-4">
                            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
                                <ShoppingCart className="h-10 w-10 text-muted-foreground/40" />
                            </div>
                            <div>
                                <p className="font-semibold text-lg">{t("empty")}</p>
                                <p className="text-muted-foreground text-sm mt-1">
                                    {t("empty_desc")}
                                </p>
                            </div>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setCartOpen(false);
                                    router.push(`/${locale}/packages`);
                                }}
                            >
                                {t("go_to_packages")}
                            </Button>
                        </div>
                    )}
                </div>

                {/* Footer — Checkout Button */}
                {item && (
                    <div className="p-6 border-t bg-background">
                        <Button
                            className="w-full gap-2 text-base font-bold h-12"
                            size="lg"
                            onClick={handleCheckout}
                        >
                            {t("checkout")}
                            <ArrowRight className="h-5 w-5" />
                        </Button>
                        <p className="text-xs text-muted-foreground text-center mt-3">
                            🔒 {t("secure_deposit", { amount: item.depositAmount.toFixed(2) })}
                        </p>
                    </div>
                )}
            </SheetContent>
        </Sheet>
    );
}
