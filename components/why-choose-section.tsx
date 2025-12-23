"use client";

import { Award, Camera, Clock } from "lucide-react";
import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";

export function WhyChooseSection() {
    const t = useTranslations("why_choose");

    const features = [
        {
            icon: Award,
            title: t("features.local_knowledge.title"),
            description: t("features.local_knowledge.description"),
        },
        {
            icon: Camera,
            title: t("features.premium_equipment.title"),
            description: t("features.premium_equipment.description"),
        },
        {
            icon: Clock,
            title: t("features.fast_delivery.title"),
            description: t("features.fast_delivery.description"),
        },
    ];

    return (
        <section className="py-8 sm:py-12 lg:py-16 bg-gradient-to-b from-muted/20 to-background">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="text-center mb-8 sm:mb-12 lg:mb-16 animate-fade-in-up">
                    <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6">
                        {t("title")}
                    </h2>
                    <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-3xl mx-auto px-2">
                        {t("subtitle")}
                    </p>
                    <p className="text-sm sm:text-base text-muted-foreground/80 max-w-4xl mx-auto px-4 mt-4">
                        {t("intro")}
                    </p>
                </div>

                {/* Features Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mx-auto stagger-children">
                    {features.map((feature, index) => (
                        <div
                            key={feature.title}
                            className={`hover-scale ${index === 2 ? "col-span-2 lg:col-span-1" : ""}`}
                        >
                            <Card className="text-center p-4 sm:p-5 lg:p-6 h-full">
                                <CardContent className="p-0">
                                    <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 mx-auto mb-3 sm:mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                                        <feature.icon className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-primary" />
                                    </div>
                                    <h3 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3">
                                        {feature.title}
                                    </h3>
                                    <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">
                                        {feature.description}
                                    </p>
                                </CardContent>
                            </Card>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
