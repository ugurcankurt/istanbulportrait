import { NextRequest, NextResponse } from "next/server";
import { getServerUser } from "@/lib/auth-server";
import { createServerSupabaseClient, createServerSupabaseAdminClient } from "@/lib/supabase/server";
import { createDriveFolder, moveFilesToFolder } from "@/lib/google-drive";
import { extractPhotosCount } from "@/lib/features-parser";

export async function POST(
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
    const body = await request.json();
    const { fileIds } = body as { fileIds: string[] };

    if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
      return NextResponse.json({ error: "No files selected" }, { status: 400 });
    }

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

    if (!booking.drive_folder_id) {
      return NextResponse.json({ error: "No drive folder linked" }, { status: 400 });
    }

    if (booking.selection_status === "completed") {
      return NextResponse.json({ error: "Selection already completed" }, { status: 400 });
    }

    // 2. Validate max selections
    let maxSelections = 15;
    if (booking.package_id) {
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(booking.package_id);
      const { data: pkgData } = await supabase.from("packages").select("features").eq(isUUID ? "id" : "slug", booking.package_id).single();
      const featuresObj = (pkgData as any)?.features || {};
      const featuresList = featuresObj.en || featuresObj.tr || featuresObj.ru || featuresObj.ar || Object.values(featuresObj)[0];
      if (Array.isArray(featuresList) && featuresList.length > 0) {
        maxSelections = extractPhotosCount(featuresList);
      }
    }

    if (fileIds.length > maxSelections) {
      return NextResponse.json({ error: `Cannot select more than ${maxSelections} photos` }, { status: 400 });
    }

    // 3. Create the "edited" folder inside the main booking folder
    const editedFolder = await createDriveFolder("edited", booking.drive_folder_id);

    // 4. Move files to the new folder
    await moveFilesToFolder(fileIds, editedFolder.id!, booking.drive_folder_id);

    // 5. Update booking status
    const adminSupabase = await createServerSupabaseAdminClient();
    const { error: updateError } = await adminSupabase
      .from("bookings")
      .update({ selection_status: "completed" })
      .eq("id", bookingId);

    if (updateError) {
      console.error("Failed to update booking selection_status:", updateError);
      // Even if DB update fails, the files were moved, so we shouldn't fail the request completely
    }

    // 6. Send Email Notification to Admin
    try {
      const { settingsService } = await import("@/lib/settings-service");
      const { sendAdminSelectionNotificationEmail } = await import("@/lib/resend");
      const settings = await settingsService.getSettings();
      await sendAdminSelectionNotificationEmail(booking, fileIds.length, settings);
    } catch (emailError) {
      console.error("Failed to send admin selection notification email:", emailError);
    }

    return NextResponse.json({ success: true, message: "Files successfully moved for editing." });
  } catch (error: any) {
    console.error("Gallery selection error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to submit selections" },
      { status: 500 }
    );
  }
}
