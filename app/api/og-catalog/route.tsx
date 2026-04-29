import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const title = searchParams.get("title") || "Photography Package";
    const image = searchParams.get("image");
    const rating = searchParams.get("rating") || "4.9";
    const reviews = searchParams.get("reviews") || "124";
    const location = searchParams.get("location") || "Türkiye";

    if (!image) {
      return new Response("Missing image URL", { status: 400 });
    }

    let targetUrl = image;
    // Format to JPG via wsrv.nl and resize to 1080x1080 (1:1 ratio for Advantage+ Catalog)
    targetUrl = `https://wsrv.nl/?url=${encodeURIComponent(image)}&output=jpg&w=1080&h=1080&fit=cover`;

    let imageSrc: any = targetUrl;
    
    // Fetch image as arrayBuffer for Satori
    if (targetUrl.startsWith("http")) {
      const imgFetch = await fetch(targetUrl);
      if (imgFetch.ok) {
        imageSrc = await imgFetch.arrayBuffer();
      } else {
        console.error(`OG Catalog Image Fetch Hatası: ${targetUrl} (${imgFetch.status})`);
      }
    }

    return new ImageResponse(
      (
        <div
          style={{
            display: "flex",
            width: "100%",
            height: "100%",
            flexDirection: "column",
            position: "relative",
            fontFamily: "sans-serif",
            backgroundColor: "#fff",
          }}
        >
          {/* Background Image Container */}
          <div style={{ display: "flex", width: "100%", height: "100%", position: "absolute", top: 0, left: 0 }}>
             {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageSrc}
              alt="Package Image"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          </div>

          {/* Decorative Bottom Gradient for Contrast (optional, but makes card pop) */}
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: "40%",
              background: "linear-gradient(to top, rgba(0,0,0,0.6), rgba(0,0,0,0))",
              display: "flex",
            }}
          />

          {/* GetYourGuide Style White Floating Card */}
          <div
            style={{
              position: "absolute",
              bottom: "40px",
              left: "40px",
              right: "40px",
              display: "flex",
              flexDirection: "column",
              backgroundColor: "#fff",
              borderRadius: "16px",
              padding: "40px",
              boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
            }}
          >
            {/* Top row: Location & Rating */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", marginBottom: "20px" }}>
              <span style={{ fontSize: "36px", fontWeight: 700, color: "#333", textTransform: "uppercase", letterSpacing: "1px" }}>
                {location}
              </span>
              <div style={{ display: "flex", alignItems: "center" }}>
                 {/* Star Icon */}
                 <span style={{ fontSize: "40px", color: "#6e1d2c", marginRight: "12px", marginBottom: "4px" }}>★</span>
                 <span style={{ fontSize: "40px", fontWeight: 700, color: "#444" }}>{rating}</span>
                 <span style={{ fontSize: "36px", color: "#999", marginLeft: "12px" }}>({reviews})</span>
              </div>
            </div>
            
            {/* Package Title */}
            <div style={{ 
                fontSize: "56px", 
                fontWeight: 800, 
                color: "#222", 
                lineHeight: 1.1,
                display: "flex",
                flexWrap: "wrap",
                letterSpacing: "-1px"
            }}>
              {title.length > 55 ? title.substring(0, 52) + "..." : title}
            </div>
          </div>
        </div>
      ),
      {
        width: 1080,
        height: 1080,
      }
    );
  } catch (e: any) {
    console.error(`Failed to generate OG Catalog image`, e.message);
    return new Response("Failed to generate OG Catalog image", { status: 500 });
  }
}
