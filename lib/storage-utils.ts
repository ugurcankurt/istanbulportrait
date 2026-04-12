import { supabaseAuth } from "@/lib/auth";

export const getSupabaseStorageClient = () => {
  return supabaseAuth;
};

export const PACKAGES_BUCKET = "packages";
export const LOCATIONS_BUCKET = "locations";

/**
 * Compresses an image to be under maxKb and converts it to WebP format.
 * Done entirely on the client side using HTMLCanvasElement.
 */
export async function compressAndConvertToWebp(
  file: File,
  maxKb: number = 150,
  maxWidth: number = 1920
): Promise<File> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      return reject(new Error("Compression must be done on the client side"));
    }

    const img = new Image();
    img.src = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(img.src);

      let width = img.width;
      let height = img.height;

      // Maintain aspect ratio while sizing down if wider than maxWidth
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        return reject(new Error("Could not get canvas context"));
      }

      // Fill background (in case of transparent PNGs to avoid black backgrounds)
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      // Attempt compression loop to achieve target size constraints
      let quality = 0.9;
      const targeBytes = maxKb * 1024;
      const minQuality = 0.1;

      const attemptCompression = () => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              return reject(new Error("Compression resulted in empty blob"));
            }

            if (blob.size > targeBytes && quality > minQuality) {
              quality -= 0.1; // Decrease quality by 10%
              attemptCompression();
            } else {
              // Found acceptable size or reached minimum quality!
              // Standardize file name
              const originalName = file.name.split(".")[0];
              const safeName = originalName.replace(/[^a-z0-9]/gi, "_").toLowerCase();
              const newFile = new File([blob], `${safeName}.webp`, {
                type: "image/webp",
                lastModified: Date.now(),
              });
              resolve(newFile);
            }
          },
          "image/webp",
          quality
        );
      };

      attemptCompression();
    };

    img.onerror = () => reject(new Error("Failed to load image for compression"));
  });
}

/**
 * Uploads an image for a package to Supabase Storage.
 *
 * @param slug The package slug (folder name)
 * @param file The File object to upload
 * @param bucket (Optional) The Supabase storage bucket names
 * @returns Object indicating success and public URL of the uploaded image
 */
export async function uploadPackageImage(
  slug: string,
  file: File,
  bucket: string = PACKAGES_BUCKET
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const supabase = getSupabaseStorageClient();
    
    // Optimize the image client-side first
    const optimizedFile = await compressAndConvertToWebp(file, 150);
    
    // Use an epoch + normalized name to avoid caching artifacts
    const uniqueFileName = `${Date.now()}_${optimizedFile.name}`;
    const filePath = `${slug}/${uniqueFileName}`;

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, optimizedFile, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) throw error;

    // Retrieve public URL
    const { data: publicUrlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return { success: true, url: publicUrlData.publicUrl };
  } catch (err: any) {
    console.error("Storage upload error:", err);
    return { success: false, error: err.message || "Failed to upload image" };
  }
}

/**
 * Extracts relative path correctly for Supabase Storage delete function
 * Uses the URL of an image stored in our bucket to extract its object path
 */
export async function deletePackageImage(
  publicUrl: string,
  bucket: string = PACKAGES_BUCKET
): Promise<boolean> {
  if (!publicUrl) return true;

  try {
    const supabase = getSupabaseStorageClient();
    
    // Example format: .../storage/v1/object/public/packages/essential/170020_file.webp
    // We just want "essential/170020_file.webp"
    const bucketToken = `/${bucket}/`;
    const splitUrl = publicUrl.split(bucketToken);
    
    if (splitUrl.length < 2) {
      console.warn("Could not parse file path from URL:", publicUrl);
      return false; // Could not parse
    }

    const objectPath = splitUrl[1];

    const { error } = await supabase.storage.from(bucket).remove([objectPath]);
    if (error) {
       console.error("Storage remove error:", error);
       return false;
    }

    return true;
  } catch (err) {
    console.error("Failed deleting image:", err);
    return false;
  }
}

/**
 * Convenience wrappers for Locations
 */
export async function uploadLocationImage(
  slug: string,
  file: File
): Promise<{ success: boolean; url?: string; error?: string }> {
  // Allow slightly larger sizes for locations (e.g. 200kb vs 150kb)
  try {
    const supabase = getSupabaseStorageClient();
    const optimizedFile = await compressAndConvertToWebp(file, 200);
    const uniqueFileName = `${Date.now()}_${optimizedFile.name}`;
    const filePath = `${slug}/${uniqueFileName}`;

    const { data, error } = await supabase.storage
      .from(LOCATIONS_BUCKET)
      .upload(filePath, optimizedFile, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) throw error;

    const { data: publicUrlData } = supabase.storage
      .from(LOCATIONS_BUCKET)
      .getPublicUrl(data.path);

    return { success: true, url: publicUrlData.publicUrl };
  } catch (err: any) {
    console.error("Storage upload error:", err);
    return { success: false, error: err.message || "Failed to upload location image" };
  }
}

export async function deleteLocationImage(publicUrl: string): Promise<boolean> {
  return deletePackageImage(publicUrl, LOCATIONS_BUCKET);
}
