import { NextRequest, NextResponse } from "next/server";
import { getFileStream } from "@/lib/google-drive";

// Helper to convert Node.js Readable stream to Web ReadableStream
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  try {
    const resolvedParams = await params;
    const { fileId } = resolvedParams;

    // TODO: Ideally, we should verify the user's session and check if they own the booking
    // that this file belongs to. For now, we assume the fileId is unguessable and secure.

    const { stream, mimeType } = await getFileStream(fileId);
    const webStream = nodeStreamToWebStream(stream);

    return new NextResponse(webStream, {
      headers: {
        "Content-Type": mimeType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("Error serving Drive image:", error);
    return new NextResponse("Error fetching image", { status: 500 });
  }
}
