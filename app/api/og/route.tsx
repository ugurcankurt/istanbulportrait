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

    // Satori (ImageResponse) KESİNLİKLE .webp formatını desteklemez! (Sadece PNG, JPEG ve SVG).
    // Supabase veya diğer kaynaklardan gelen resimleri (özellikle webp) desteklenen formata sokmak 
    // ve boyutunu optimize etmek için hızlı, ücretsiz bir global cdn proxysi (wsrv.nl) ile
    // on-the-fly .jpg formatına çevirip (1200px genişlikle) öyle indiriyoruz:
    if (imageUrl.startsWith("http")) {
      const optimizedUrl = `https://wsrv.nl/?url=${encodeURIComponent(imageUrl)}&output=jpg&w=1200`;
      
      const imgFetch = await fetch(optimizedUrl);
      if (imgFetch.ok) {
        imageSrc = await imgFetch.arrayBuffer();
      } else {
        console.error(`OG Image Fetch Hatası: ${imageUrl} (${imgFetch.status})`);
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
