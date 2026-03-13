"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, UploadCloud, Info, CheckCircle2, AlertTriangle, AlertCircle, Globe, ShieldCheck, Award } from "lucide-react";
import { usePrintsCartStore } from "@/stores/prints-cart-store";
import { toast } from "sonner";
import { trackPrintAddToCart } from "@/lib/analytics";
import { ProdigiProduct } from "@/lib/prodigi";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface PrintConfiguratorProps {
    product: ProdigiProduct;
}

export function PrintConfigurator({ product }: PrintConfiguratorProps) {
    const locale = useLocale();
    const t = useTranslations("prints");
    const router = useRouter();
    const { addPrintToCart } = usePrintsCartStore();

    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [dpiStatus, setDpiStatus] = useState<"unchecked" | "valid" | "invalid">("unchecked");
    const [dpiMessage, setDpiMessage] = useState("");

    // Extract available variant options from product attributes (only those with > 1 option)
    const availableOptions = Object.entries(product.attributes || {}).filter(([key, values]) => {
        return Array.isArray(values) && values.length > 1;
    });

    // Initialize state mapping each option key to its first available value
    const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>(() => {
        const initial: Record<string, string> = {};
        for (const [key, values] of availableOptions) {
            if (Array.isArray(values) && values.length > 0) {
                initial[key] = values[0];
            }
        }
        return initial;
    });

    // We optionally extract dimensions from SKU. E.g: GLOBAL-CANVAS-10X8
    // If not found, we use a fallback minimum e.g. 2000x2000 pixels.
    const extractDimensions = (sku: string) => {
        const match = sku.toUpperCase().match(/(\d+)\s*X\s*(\d+)/);
        if (match) {
            const w = parseInt(match[1]);
            const h = parseInt(match[2]);
            return { widthInch: w, heightInch: h };
        }
        return { widthInch: 10, heightInch: 8 }; // Fallback
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        // Reset states
        setFile(selectedFile);
        setDpiStatus("unchecked");

        const objUrl = URL.createObjectURL(selectedFile);
        setPreviewUrl(objUrl);

        // Validate DPI immediately on client
        const img = new Image();
        img.onload = () => {
            const { widthInch, heightInch } = extractDimensions(product.sku);

            // Calculate effective DPI for both orientations (landscape vs portrait)
            const dpi1 = Math.min(img.width / widthInch, img.height / heightInch);
            const dpi2 = Math.min(img.width / heightInch, img.height / widthInch);
            const maxDpi = Math.max(dpi1, dpi2);

            if (maxDpi >= 200) {
                setDpiStatus("valid");
                setDpiMessage(t("quality_approved_msg", { dpiMsg: t("est_dpi", { dpi: Math.round(maxDpi) }) }));
            } else {
                setDpiStatus("invalid");
                setDpiMessage(t("low_res_msg", { dpiMsg: t("est_dpi", { dpi: Math.round(maxDpi) }), minDpi: t("min_dpi") }));
            }
        };
        img.src = objUrl;
    };

    const handleAddToCart = async () => {
        if (!file || dpiStatus === "invalid") {
            toast.error(t("min_dpi"));
            return;
        }

        setIsUploading(true);

        try {
            // 1. Upload to Supabase via our secure API route
            const formData = new FormData();
            formData.append("file", file);

            const uploadRes = await fetch("/api/prints/upload", {
                method: "POST",
                body: formData,
            });

            if (!uploadRes.ok) {
                throw new Error(t("upload_failed_toast"));
            }

            const { url: uploadUrl } = await uploadRes.json();

            // 2. Add to Zustand Cart
            addPrintToCart({
                productId: product.sku,
                sku: product.sku,
                name: product.description,
                price: product.pricing?.eur || 0,
                currency: "EUR",
                quantity: 1,
                uploadUrl: uploadUrl,
                attributes: selectedAttributes,
            });

            // Tracking: GA4 Add to Cart
            trackPrintAddToCart(product.sku, product.description || "Print", product.subcategory || "Art", product.pricing?.eur || 0);

            toast.success(t("add_to_cart_success"));
            router.push(`/${locale}/prints`);

        } catch (error) {
            console.error("Add to cart error:", error);
            toast.error(t("add_to_cart_failed"));
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <Card className="shadow-lg border-primary/10">
            <CardContent className="p-6 sm:p-8 space-y-6">
                <div>
                    <h3 className="text-xl font-semibold mb-2">{t("upload_photo")}</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                        {t("quality_description")}
                    </p>

                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-xl p-8 text-center hover:bg-muted/30 transition-colors cursor-pointer relative">
                        <input
                            type="file"
                            accept="image/jpeg, image/png"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            onChange={handleFileChange}
                        />
                        {previewUrl ? (
                            <div className="flex flex-col items-center">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={previewUrl} alt="Preview" className="max-h-64 object-contain rounded-md shadow-sm mb-4" />
                                <Button variant="outline" size="sm" type="button">{t("change_image")}</Button>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center placeholder-content">
                                <UploadCloud className="w-12 h-12 text-muted-foreground mb-3" />
                                <span className="font-medium">{t("drag_drop")}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Variant Options (if any) */}
                {availableOptions.length > 0 && (
                    <div className="space-y-4 pt-4 border-t">
                        <h4 className="font-medium text-sm">{t("product_options")}</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {availableOptions.map(([key, values]) => (
                                <div key={key} className="space-y-1.5">
                                    <Label className="capitalize">{key}</Label>
                                    <Select
                                        value={selectedAttributes[key] || ""}
                                        onValueChange={(val) => setSelectedAttributes(prev => ({ ...prev, [key]: val }))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder={t("select_option", { option: key })} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {(values as string[]).map((val) => (
                                                <SelectItem key={val} value={val}>{val}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Quality Check Banner */}
                {dpiStatus !== "unchecked" && (
                    <div className={`p-4 rounded-lg flex items-start gap-3 border ${dpiStatus === "valid" ? "bg-success/5 border-success/30 text-success" : "bg-destructive/10 border-destructive/20 text-destructive"
                        }`}>
                        {dpiStatus === "valid" ? <CheckCircle2 className="w-5 h-5 mt-0.5 text-success" /> : <AlertCircle className="w-5 h-5 mt-0.5" />}
                        <div>
                            <p className="font-medium">{dpiStatus === "valid" ? t("quality_approved") : t("low_resolution")}</p>
                            <p className="text-sm opacity-90">{dpiMessage}</p>
                        </div>
                    </div>
                )}

                <div className="pt-4 border-t">
                    <Button
                        size="lg"
                        className="w-full text-lg h-14 font-semibold shadow-lg"
                        disabled={!file || dpiStatus !== "valid" || isUploading}
                        onClick={handleAddToCart}
                    >
                        {isUploading ? (
                            <Loader2 className="w-5 h-5 animate-spin mr-2" />
                        ) : null}
                        {isUploading ? t("uploading") : `${t("add_to_cart")} - €${(product.pricing?.eur || 0).toFixed(2)}`}
                    </Button>
                </div>

                {/* Trust Indicators Section */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t">
                    <div className="flex flex-col items-center text-center p-2 rounded-lg bg-muted/20">
                        <Globe className="w-5 h-5 text-primary mb-2" />
                        <span className="text-[10px] uppercase font-bold tracking-tighter mb-1 text-primary">{t("worldwide_shipping")}</span>
                        <p className="text-[10px] text-muted-foreground leading-tight">{t("worldwide_shipping_desc")}</p>
                    </div>
                    <div className="flex flex-col items-center text-center p-2 rounded-lg bg-muted/20">
                        <Award className="w-5 h-5 text-primary mb-2" />
                        <span className="text-[10px] uppercase font-bold tracking-tighter mb-1 text-primary">{t("premium_quality")}</span>
                        <p className="text-[10px] text-muted-foreground leading-tight">{t("premium_quality_desc")}</p>
                    </div>
                    <div className="flex flex-col items-center text-center p-2 rounded-lg bg-muted/20">
                        <ShieldCheck className="w-5 h-5 text-primary mb-2" />
                        <span className="text-[10px] uppercase font-bold tracking-tighter mb-1 text-primary">{t("secure_payment")}</span>
                        <p className="text-[10px] text-muted-foreground leading-tight">{t("secure_payment_desc")}</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
