"use client";

import { motion } from "framer-motion";
import { Camera, Clock, MapPin } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@/i18n/routing";
import type { LocationData } from "@/lib/locations/location-data";

interface LocationCardProps {
    location: LocationData;
    index: number;
}

export function LocationCard({ location, index }: LocationCardProps) {
    const t = useTranslations("locations");

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
        >
            <Link
                href={{
                    pathname: "/locations/[slug]" as const,
                    params: { slug: location.slug },
                }}
                className="block group"
            >
                <Card className="overflow-hidden h-full transition-all duration-300 hover:shadow-lg hover:border-primary/20">
                    {/* Image */}
                    <div className="relative aspect-[4/3] overflow-hidden">
                        <Image
                            src={location.images.hero}
                            alt={t(`items.${location.slug}.name`)}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                        {/* Tags */}
                        <div className="absolute top-3 left-3 flex gap-2">
                            {location.tags.slice(0, 2).map((tag) => (
                                <Badge
                                    key={tag}
                                    variant="secondary"
                                    className="bg-white/90 text-xs"
                                >
                                    {t(`tags.${tag}`)}
                                </Badge>
                            ))}
                        </div>

                        {/* Best Time Badge */}
                        <div className="absolute bottom-3 right-3">
                            <Badge className="bg-primary/90 text-primary-foreground">
                                <Clock className="w-3 h-3 mr-1" />
                                {t(`bestTime.${location.bestTime}`)}
                            </Badge>
                        </div>
                    </div>

                    <CardContent className="p-4 sm:p-5">
                        <h3 className="text-lg sm:text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                            {t(`items.${location.slug}.name`)}
                        </h3>

                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                            {t(`items.${location.slug}.shortDescription`)}
                        </p>

                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                <span>Istanbul</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Camera className="w-3 h-3" />
                                <span>{t("viewPhotos")}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </Link>
        </motion.div>
    );
}
