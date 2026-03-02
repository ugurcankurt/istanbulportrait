"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export function NewsletterPopup() {
    const [isOpen, setIsOpen] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Translations
    const t = useTranslations("newsletter");

    useEffect(() => {
        setIsMounted(true);
        const isDismissed = localStorage.getItem("newsletter_dismissed");
        const isSubscribed = localStorage.getItem("newsletter_subscribed");

        // Show popup if not dismissed/subscribed
        if (!isDismissed && !isSubscribed) {
            const timer = setTimeout(() => {
                setIsOpen(true);
            }, 8000); // 8 seconds delay

            return () => clearTimeout(timer);
        }
    }, []);

    const handleClose = (open: boolean) => {
        setIsOpen(open);
        if (!open) {
            localStorage.setItem("newsletter_dismissed", "true");
        }
    };

    const handleCloseClick = () => {
        setIsOpen(false);
        localStorage.setItem("newsletter_dismissed", "true");
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);

        const formData = new FormData(e.currentTarget);
        const email = formData.get("email") as string;
        const fullName = formData.get("fullName") as string;

        try {
            const response = await fetch("/api/newsletter/subscribe", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, fullName }),
            });

            if (!response.ok) throw new Error("Subscription failed");

            localStorage.setItem("newsletter_subscribed", "true");
            setIsOpen(false);
            toast.success(t("success_title"), {
                description: t("success_message"),
            });
        } catch (error) {
            toast.error(t("error_message"));
        } finally {
            setIsLoading(false);
        }
    };

    if (!isMounted) return null;

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-md p-0 overflow-hidden border-none text-white" showCloseButton={false}>
                {/* Background Image */}
                <div className="absolute inset-0 z-0">
                    <Image
                        src="/gallery/istanbul_couple_photoshoot.webp"
                        alt="Istanbul Photoshoot"
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 33vw"
                        priority
                        loading="eager"
                    />
                    {/* Dark Overlay for readability */}
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />
                </div>

                <div className="relative z-10 p-6 sm:p-8">
                    <DialogHeader className="space-y-3">
                        <DialogTitle className="text-center text-2xl sm:text-3xl font-bold tracking-tight text-white drop-shadow-md flex items-center justify-center gap-3">
                            {t("title")}
                            <Sparkles className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
                        </DialogTitle>
                        <DialogDescription className="text-center text-gray-200 text-sm sm:text-base drop-shadow-sm font-medium">
                            {t("description")}
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-5 py-4 mt-2">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="fullName" className="text-sm font-medium text-white drop-shadow-sm">
                                    {t("name_placeholder")}
                                </Label>
                                <Input
                                    id="fullName"
                                    name="fullName"
                                    placeholder={t("name_placeholder")}
                                    required
                                    className="h-11 bg-white/10 border-white/20 text-white placeholder:text-gray-300 focus-visible:ring-white/30 focus-visible:border-white/50 backdrop-blur-sm"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-sm font-medium text-white drop-shadow-sm">
                                    {t("email_placeholder")}
                                </Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    placeholder="Email"
                                    required
                                    className="h-11 bg-white/10 border-white/20 text-white placeholder:text-gray-300 focus-visible:ring-white/30 focus-visible:border-white/50 backdrop-blur-sm"
                                />
                            </div>
                        </div>

                        <DialogFooter className="flex-col sm:flex-col sm:space-x-0 gap-3 pt-2">
                            <Button
                                type="submit"
                                className="w-full h-12 text-base font-bold shadow-lg bg-primary hover:bg-primary/90 text-primary-foreground border-none transition-transform active:scale-[0.98]"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        {t("subscribing")}
                                    </>
                                ) : (
                                    t("button")
                                )}
                            </Button>

                            <Button
                                type="button"
                                variant="ghost"
                                className="w-full h-auto py-2 text-gray-300 hover:text-white hover:bg-white/10"
                                onClick={handleCloseClick}
                            >
                                {t("close")}
                            </Button>
                        </DialogFooter>
                    </form>
                </div>
            </DialogContent>
        </Dialog>
    );
}
