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
    const location = searchParams.get("location") || "Istanbul, Türkiye";

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
            backgroundColor: "#000",
          }}
        >
          {/* Background Image */}
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

          {/* Luxury Inner Border */}
          <div style={{
            position: "absolute",
            top: "24px",
            left: "24px",
            right: "24px",
            bottom: "24px",
            border: "1px solid rgba(255,255,255,0.3)",
            display: "flex",
          }} />

          {/* Top Center Branding */}
          <div style={{
            position: "absolute",
            top: "60px",
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
          }}>
            <span style={{
              fontSize: "20px",
              fontWeight: 400,
              color: "rgba(255,255,255,0.9)",
              textTransform: "uppercase",
              letterSpacing: "12px",
              textShadow: "0 4px 12px rgba(0,0,0,0.8)",
            }}>
              Istanbul Portrait
            </span>
          </div>

          {/* Dark Premium Gradient at the bottom */}
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: "60%",
              background: "linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.7) 40%, rgba(0,0,0,0) 100%)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-end",
              padding: "60px",
              paddingBottom: "70px",
            }}
          >
            {/* Top row: Location & Rating */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", marginBottom: "20px" }}>
              <span style={{ 
                fontSize: "28px", 
                fontWeight: 400, 
                color: "rgba(255,255,255,0.8)", 
                textTransform: "uppercase", 
                letterSpacing: "6px" 
              }}>
                {location}
              </span>
              <div style={{ display: "flex", alignItems: "center" }}>
                 <svg width="28" height="28" viewBox="0 0 24 24" fill="#D4AF37" style={{ marginRight: "12px", marginBottom: "4px" }}>
                   <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                 </svg>
                 <span style={{ fontSize: "32px", fontWeight: 300, color: "#fff" }}>{rating}</span>
                 <span style={{ fontSize: "24px", color: "rgba(255,255,255,0.5)", marginLeft: "12px", fontWeight: 300 }}>({reviews})</span>
              </div>
            </div>
            
            {/* Package Title */}
            <div style={{ 
                fontSize: "64px", 
                fontWeight: 300, 
                color: "#fff", 
                lineHeight: 1.1,
                display: "flex",
                flexWrap: "wrap",
                letterSpacing: "-0.5px",
                textShadow: "0 2px 10px rgba(0,0,0,0.5)",
            }}>
              {title.length > 55 ? title.substring(0, 52) + "..." : title}
            </div>

            {/* Subtle Divider */}
            <div style={{
              width: "60px",
              height: "2px",
              backgroundColor: "#D4AF37",
              marginTop: "40px",
            }} />
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
