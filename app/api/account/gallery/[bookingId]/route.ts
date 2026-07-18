import { NextRequest, NextResponse } from "next/server";
import { getServerUser } from "@/lib/auth-server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { listFilesInFolder, getGalleryFilesGrouped } from "@/lib/google-drive";
import { extractPhotosCount } from "@/lib/features-parser";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  try {
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    const { bookingId } = resolvedParams;
    const supabase = await createServerSupabaseClient();

    // 1. Verify the booking belongs to the current user
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", bookingId)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (booking.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Determine max selections based on the package features
    let maxSelections = 15; // default fallback
    
    if (booking.package_id) {
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(booking.package_id);
      const { data: pkgData } = await supabase.from("packages").select("features").eq(isUUID ? "id" : "slug", booking.package_id).single();
      
      const featuresObj = (pkgData as any)?.features || {};
      const featuresList = featuresObj.en || featuresObj.tr || featuresObj.ru || featuresObj.ar || Object.values(featuresObj)[0];
      
      if (Array.isArray(featuresList) && featuresList.length > 0) {
        maxSelections = extractPhotosCount(featuresList);
      }
    }

    if (!booking.drive_folder_id) {
      return NextResponse.json({ 
        files: [], 
        maxSelections, 
        selectionStatus: booking.selection_status || "pending" 
      }); 
    }

    // 2. Fetch files from Google Drive (grouped by folder)
    const groupedFiles = await getGalleryFilesGrouped(booking.drive_folder_id);

    // 3. Format the response to use our proxy route for secure viewing
    const formatFiles = (filesArray: any[]) => filesArray.map((file) => {
      let previewUrl = `/api/drive/image/${file.id}`;
      let thumbnailUrl = `/api/drive/image/${file.id}`;
      
      if (file.thumbnailLink) {
        const baseLink = file.thumbnailLink.split('=')[0];
        previewUrl = `/api/drive/proxy?url=${encodeURIComponent(`${baseLink}=w1200`)}`;
        thumbnailUrl = `/api/drive/proxy?url=${encodeURIComponent(`${baseLink}=s200`)}`;
      }

      return {
        id: file.id,
        name: file.name,
        mimeType: file.mimeType,
        thumbnail: thumbnailUrl,
        url: previewUrl,
        downloadUrl: `/api/drive/image/${file.id}`,
        metadata: file.imageMediaMetadata,
      };
    });

    return NextResponse.json({
      success: true,
      files: formatFiles(groupedFiles.raw),
      selectedFiles: formatFiles(groupedFiles.selected),
      finalFiles: formatFiles(groupedFiles.final),
      maxSelections,
      selectionStatus: booking.selection_status || "pending"
    });
  } catch (error) {
    console.error("Gallery fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch gallery" },
      { status: 500 }
    );
  }
}
