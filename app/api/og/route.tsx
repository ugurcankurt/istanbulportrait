import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const imageUrl = searchParams.get("image");

    if (!imageUrl) {
      return new Response("Missing image URL", { status: 400 });
    }

    let imageSrc: any = imageUrl;
    let targetUrl = imageUrl;

    // Satori (ImageResponse) .webp formatını desteklemediği için, sadece .webp uzantılı 
    // Supabase görsellerini anında JPG'ye çeviren aracı pipe (wsrv) kullanıyoruz.
    if (imageUrl.toLowerCase().includes('.webp')) {
      targetUrl = `https://wsrv.nl/?url=${encodeURIComponent(imageUrl)}&output=jpg&w=1200`;
    }

    if (targetUrl.startsWith("http")) {
      const imgFetch = await fetch(targetUrl);
      if (imgFetch.ok) {
        imageSrc = await imgFetch.arrayBuffer();
      } else {
        console.error(`OG Image Fetch Hatası: ${targetUrl} (${imgFetch.status})`);
      }
    }

    return new ImageResponse(
      (
        <div
          style={{
            display: "flex",
            width: "100%",
            height: "100%",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#000",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageSrc}
            alt="OG Image"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (e: any) {
    console.error(`Failed to generate OG image`, e.message);
    return new Response("Failed to generate OG image", { status: 500 });
  }
}
