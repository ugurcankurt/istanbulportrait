"use client";

import { useState, useRef } from "react";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { createClientSupabaseClient } from "@/lib/supabase/client";

interface ImageUploaderProps {
  label: string;
  description?: string;
  value: string | null;
  onChange: (url: string) => void;
  folder?: string;
  bucket?: string;
}

export function WebpImageUploader({
  label,
  description,
  value,
  onChange,
  folder = "logos",
  bucket = "public-assets",
}: ImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClientSupabaseClient();

  const convertToWebp = async (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);

      img.onload = () => {
        const canvas = document.createElement("canvas");
        // Maintain original dimensions
        canvas.width = img.width;
        canvas.height = img.height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Failed to get canvas context"));
          return;
        }

        ctx.drawImage(img, 0, 0);

        // Convert to WebP (quality 0.85)
        canvas.toBlob(
          (blob) => {
            URL.revokeObjectURL(objectUrl);
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error("WebP conversion failed"));
            }
          },
          "image/webp",
          0.85
        );
      };

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("Failed to load image for conversion"));
      };

      img.src = objectUrl;
    });
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file.");
      return;
    }

    setIsUploading(true);

    try {
      // 1. Convert any image to WebP client-side
      const webpBlob = await convertToWebp(file);
      const webpFile = new File(
        [webpBlob], 
        `${file.name.split('.')[0]}-${Date.now()}.webp`, 
        { type: "image/webp" }
      );

      // 2. Upload to Supabase Storage
      const fileName = `${folder}/${webpFile.name}`;
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, webpFile, {
          cacheControl: "3600",
          upsert: true,
          contentType: "image/webp",
        });

      if (error) throw error;

      // 3. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);

      onChange(publicUrl);
      toast.success("Image uploaded and converted to WebP format successfully.");
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(error.message || "Something went wrong during upload.");
    } finally {
      setIsUploading(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="text-sm font-medium">{label}</label>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
      
      <div className="flex items-start gap-4">
        {/* Preview Box */}
        <div className="relative w-24 h-24 border rounded-lg bg-muted flex items-center justify-center overflow-hidden flex-shrink-0 group">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt={label} className="w-full h-full object-contain p-2" />
          ) : (
            <ImageIcon className="w-8 h-8 text-muted-foreground opacity-50" />
          )}

          {value && (
            <button
              onClick={() => onChange("")}
              className="absolute top-1 right-1 bg-background/80 hover:bg-destructive hover:text-destructive-foreground p-1 rounded-full opacity-0 group-hover:opacity-100 transition-all"
              type="button"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Upload Controls */}
        <div className="flex-1 space-y-2">
          <input
            type="file"
            accept="image/*"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileChange}
            disabled={isUploading}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="w-full justify-start"
          >
            {isUploading ? (
              <>
                <Spinner className="w-4 h-4 mr-2 animate-spin" />
                Converting & Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Select Image
              </>
            )}
          </Button>
          <div className="text-[10px] text-muted-foreground bg-muted/30 p-2 rounded border border-dashed">
            * Selected image will be automatically converted to highly optimized .WEBP format before upload.
          </div>
        </div>
      </div>
    </div>
  );
}
