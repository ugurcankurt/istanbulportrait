"use client";

import { ImagePlus, Loader2, X } from "lucide-react";
import Image from "next/image";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { createClientSupabaseClient } from "@/lib/supabase/client";

interface ImageUploadProps {
    value?: string | null;
    onChange: (url: string) => void;
    onRemove?: () => void;
    disabled?: boolean;
    className?: string;
    bucketName?: string;
}

export function ImageUpload({
    value,
    onChange,
    onRemove,
    disabled,
    className,
    bucketName = "blog-images", // Default bucket
}: ImageUploadProps) {
    const [isUploading, setIsUploading] = useState(false);
    const supabase = createClientSupabaseClient();

    const convertToWebP = (file: File): Promise<Blob> => {
        return new Promise((resolve, reject) => {
            const img = document.createElement("img");
            img.onload = () => {
                const canvas = document.createElement("canvas");
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext("2d");
                if (!ctx) {
                    reject(new Error("Failed to get canvas context"));
                    return;
                }
                ctx.drawImage(img, 0, 0);
                canvas.toBlob(
                    (blob) => {
                        if (blob) {
                            resolve(blob);
                        } else {
                            reject(new Error("Failed to convert to WebP"));
                        }
                    },
                    "image/webp",
                    0.8, // Quality
                );
            };
            img.onerror = () => reject(new Error("Failed to load image"));
            img.src = URL.createObjectURL(file);
        });
    };

    const handleUpload = useCallback(
        async (e: React.ChangeEvent<HTMLInputElement>) => {
            try {
                const file = e.target.files?.[0];
                if (!file) return;

                setIsUploading(true);

                // Convert to WebP
                const webpBlob = await convertToWebP(file);
                const fileName = `${Date.now()}-${file.name.split(".")[0]}.webp`;
                const filePath = `${fileName}`;

                // Upload to Supabase
                const { error: uploadError } = await supabase.storage
                    .from(bucketName)
                    .upload(filePath, webpBlob, {
                        contentType: "image/webp",
                        upsert: true,
                    });

                if (uploadError) {
                    throw uploadError;
                }

                // Get Public URL
                const { data } = supabase.storage.from(bucketName).getPublicUrl(filePath);

                onChange(data.publicUrl);
                toast.success("Image uploaded successfully");
            } catch (error: any) {
                console.error("Upload error:", error);
                toast.error(error.message || "Failed to upload image");
            } finally {
                setIsUploading(false);
                // Reset input
                e.target.value = "";
            }
        },
        [bucketName, onChange, supabase.storage],
    );

    if (value) {
        return (
            <div className={`relative aspect-video w-full max-w-md overflow-hidden rounded-lg border bg-muted ${className}`}>
                <Image
                    src={value}
                    alt="Uploaded image"
                    fill
                    className="object-cover"
                />
                <Button
                    type="button"
                    onClick={onRemove}
                    variant="destructive"
                    size="icon"
                    className="absolute right-2 top-2 h-8 w-8"
                    disabled={disabled}
                >
                    <X className="h-4 w-4" />
                </Button>
            </div>
        );
    }

    return (
        <div className={`flex items-center justify-center w-full max-w-md ${className}`}>
            <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted transition-colors border-muted-foreground/25 hover:border-primary/50">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    {isUploading ? (
                        <>
                            <Loader2 className="w-10 h-10 mb-3 animate-spin text-muted-foreground" />
                            <p className="mb-2 text-sm text-muted-foreground">
                                <span className="font-semibold">Converting & Uploading...</span>
                            </p>
                        </>
                    ) : (
                        <>
                            <ImagePlus className="w-10 h-10 mb-3 text-muted-foreground" />
                            <p className="mb-2 text-sm text-muted-foreground">
                                <span className="font-semibold">Click to upload</span> or drag and drop
                            </p>
                            <p className="text-xs text-muted-foreground">
                                JPG, PNG (Auto-converted to WebP)
                            </p>
                        </>
                    )}
                </div>
                <input
                    type="file"
                    className="hidden"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleUpload}
                    disabled={disabled || isUploading}
                />
            </label>
        </div>
    );
}
