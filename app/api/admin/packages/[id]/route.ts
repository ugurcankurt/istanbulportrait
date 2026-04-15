import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { packagesService } from "@/lib/packages-service";
import { createClient } from "@supabase/supabase-js";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    // First fetch the package to capture its storage objects
    const pkg = await packagesService.getPackageById(id);

    if (pkg) {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_KEY!
      );

      const pathsToDelete: string[] = [];

      const preparePath = (url: string | null) => {
        if (!url) return null;
        const parts = url.split('/packages/');
        return parts.length > 1 ? parts[1] : null;
      };

      const coverPath = preparePath(pkg.cover_image);
      if (coverPath) pathsToDelete.push(coverPath);
      
      if (pkg.gallery_images && pkg.gallery_images.length > 0) {
        pkg.gallery_images.forEach(img => {
          const p = preparePath(img);
          if (p) pathsToDelete.push(p);
        });
      }

      if (pathsToDelete.length > 0) {
        // Delete the files securely as Administrator
        const { error } = await supabase.storage.from("packages").remove(pathsToDelete);
        if (error) {
          console.error("Error removing storage objects:", error);
        }
      }
    }

    // Use the backend packages service which uses SERVICE ROLE key to delete DB record
    const success = await packagesService.deletePackage(id);

    if (!success) {
      return NextResponse.json(
        { error: "Failed to delete package from database" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, message: "Package deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting package API:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete package" },
      { status: 500 },
    );
  }
}
