import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

export const runtime = "nodejs";

const SUPABASE_STORAGE_BASE = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? `${process.env.NEXT_PUBLIC_SUPABASE_URL.replace(/\/$/, "")}/storage/v1/object/public`
  : "https://xfntnamwfnqjgqmyxwfz.supabase.co/storage/v1/object/public";

const ALLOWED_IMAGE_HOSTS = new Set<string>([
  "istanbulportrait.com",
  "www.istanbulportrait.com",
  "xfntnamwfnqjgqmyxwfz.supabase.co",
  ...(process.env.NEXT_PUBLIC_SUPABASE_URL
    ? [new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname]
    : []),
]);

function resolveAllowedOgImageUrl(raw: string): string | null {
  if (raw.startsWith("/storage/")) {
    const rel = raw.slice("/storage/".length);
    if (!rel || rel.includes("..") || rel.includes("\\")) return null;
    return `${SUPABASE_STORAGE_BASE}/${rel}`;
  }
  try {
    const parsed = new URL(raw);
    if (parsed.protocol !== "https:") return null;
    if (!ALLOWED_IMAGE_HOSTS.has(parsed.hostname)) return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const rawImageUrl = searchParams.get("image");

    if (!rawImageUrl) {
      return new Response("Missing image URL", { status: 400 });
    }

    const imageUrl = resolveAllowedOgImageUrl(rawImageUrl);
    if (!imageUrl) {
      return new Response("Invalid or disallowed image URL", { status: 400 });
    }

    let imageSrc: ArrayBuffer;
    let targetUrl = imageUrl;

    // Satori (ImageResponse) .webp formatını desteklemediği için, sadece .webp uzantılı
    // Supabase görsellerini anında JPG'ye çeviren aracı pipe (wsrv) kullanıyoruz.
    if (imageUrl.toLowerCase().includes(".webp")) {
      targetUrl = `https://wsrv.nl/?url=${encodeURIComponent(imageUrl)}&output=jpg&w=1200`;
    }

    const imgFetch = await fetch(targetUrl);
    if (!imgFetch.ok) {
      console.error(`OG Image Fetch Hatası: ${targetUrl} (${imgFetch.status})`);
      return new Response("Failed to load OG image source", { status: 404 });
    }
    imageSrc = await imgFetch.arrayBuffer();

    // Load custom font to avoid Satori's default font rendering bugs
    const fontPath = join(
      process.cwd(),
      "public",
      "fonts",
      "Inter-Regular.ttf",
    );
    const fontBuffer = readFileSync(fontPath);
    const fontData = Uint8Array.from(fontBuffer).buffer;

    const arabicFontPath = join(
      process.cwd(),
      "public",
      "fonts",
      "NotoSansArabic-Regular.ttf",
    );
    const arabicFontBuffer = readFileSync(arabicFontPath);
    const arabicFontData = Uint8Array.from(arabicFontBuffer).buffer;

    return new ImageResponse(
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#000",
          fontFamily: '"Inter", "Noto Sans Arabic"',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageSrc as unknown as string}
          alt="OG Image"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      </div>,
      {
        width: 1200,
        height: 630,
        fonts: [
          {
            name: "Inter",
            data: fontData,
            style: "normal",
            weight: 400,
          },
          {
            name: "Noto Sans Arabic",
            data: arabicFontData,
            style: "normal",
            weight: 400,
          },
        ],
      },
    );
  } catch (e: any) {
    console.error(`Failed to generate OG image`, e.message);
    return new Response("Failed to generate OG image", { status: 500 });
  }
}
