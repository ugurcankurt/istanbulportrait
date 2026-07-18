import { NextRequest, NextResponse } from "next/server";
import { getServerUser } from "@/lib/auth-server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getFileStream } from "@/lib/google-drive";
import archiver from "archiver";
import { PassThrough } from "stream";

function nodeStreamToWebStream(nodeStream: NodeJS.ReadableStream): ReadableStream {
  return new ReadableStream({
    start(controller) {
      nodeStream.on('data', (chunk) => controller.enqueue(chunk));
      nodeStream.on('end', () => controller.close());
      nodeStream.on('error', (err) => controller.error(err));
    },
    cancel() {
      if ('destroy' in nodeStream) {
        (nodeStream as any).destroy();
      }
    }
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  try {
    const user = await getServerUser();
    if (!user) return new NextResponse("Unauthorized", { status: 401 });

    const resolvedParams = await params;
    const { bookingId } = resolvedParams;

    const supabase = await createServerSupabaseClient();
    const { data: booking } = await supabase
      .from("bookings")
      .select("id, user_id")
      .eq("id", bookingId)
      .single();

    if (!booking || booking.user_id !== user.id) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    let files;
    let tabName = "raw";
    const contentType = request.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const body = await request.json();
      files = body.files;
      tabName = body.tabName || "raw";
    } else {
      const formData = await request.formData();
      const filesStr = formData.get("files");
      files = JSON.parse(filesStr as string);
      tabName = (formData.get("tabName") as string) || "raw";
    }

    if (!files || !Array.isArray(files) || files.length === 0) {
      return new NextResponse("No files provided", { status: 400 });
    }

    // Level 0 compression because images are already compressed (JPEG/PNG/RAW) 
    // and we want maximum streaming speed
    const archive = archiver("zip", { zlib: { level: 0 } });
    const passThrough = new PassThrough();
    archive.pipe(passThrough);

    const webStream = nodeStreamToWebStream(passThrough);

    // Process files asynchronously
    (async () => {
      try {
        for (const file of files) {
          const { stream } = await getFileStream(file.id);
          archive.append(stream as any, { name: file.name });
        }
        await archive.finalize();
      } catch (err) {
        console.error("Error building zip:", err);
        archive.abort();
      }
    })();

    return new NextResponse(webStream, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="istanbulportrait_${tabName}_photos.zip"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("ZIP creation error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
