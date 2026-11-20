import { type NextRequest, NextResponse } from "next/server";
import { getServerUser, isServerAdmin } from "@/lib/auth-server";
import { verifyDriveToken } from "@/lib/booking-token";
import { getFileStream } from "@/lib/google-drive";

// Helper to convert Node.js Readable stream to Web ReadableStream
function nodeStreamToWebStream(
  nodeStream: NodeJS.ReadableStream,
): ReadableStream {
  return new ReadableStream({
    start(controller) {
      nodeStream.on("data", (chunk) => controller.enqueue(chunk));
      nodeStream.on("end", () => controller.close());
      nodeStream.on("error", (err) => controller.error(err));
    },
    cancel() {
      if ("destroy" in nodeStream) {
        (nodeStream as any).destroy();
      }
    },
  });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> },
) {
  try {
    const user = await getServerUser();
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const resolvedParams = await params;
    const { fileId } = resolvedParams;
    const bookingId = request.nextUrl.searchParams.get("bookingId");
    const token = request.nextUrl.searchParams.get("token");

    const hasValidToken =
      bookingId !== null &&
      token !== null &&
      verifyDriveToken(user.id, bookingId, fileId, token);

    if (!hasValidToken && !(await isServerAdmin(user.email))) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const { stream, mimeType } = await getFileStream(fileId);
    const webStream = nodeStreamToWebStream(stream);

    return new NextResponse(webStream, {
      headers: {
        "Content-Type": mimeType,
        "Cache-Control": "private, max-age=3600",
        "X-Content-Type-Options": "nosniff",
        "X-Robots-Tag": "noindex, nofollow",
      },
    });
  } catch (error) {
    console.error("Error serving Drive image:", error);
    return new NextResponse("Error fetching image", { status: 500 });
  }
}
