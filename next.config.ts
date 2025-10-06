import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  // ========================================
  // VERCEL OPTIMIZATION
  // ========================================
  output: "standalone", // Vercel için optimize edilmiş Docker image

  // ========================================
  // IMAGE OPTIMIZATION (Vercel CDN)
  // ========================================
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "plus.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "istanbulportrait.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "hare-media-cdn.tripadvisor.com",
      },
      {
        protocol: "https",
        hostname: "media-cdn.tripadvisor.com",
      },
    ],
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 86400, // 24 hours (Vercel CDN cache)
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    // Optimized device sizes (Vercel recommendation: 6-8 sizes)
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    // Optimized icon sizes
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    unoptimized: false,
  },

  // ========================================
  // NEXT.JS 15.5 EXPERIMENTAL FEATURES
  // ========================================
  experimental: {
    // Turbopack production builds (5x faster on Vercel)
    turbo: {
      rules: {
        "*.svg": {
          loaders: ["@svgr/webpack"],
          as: "*.js",
        },
      },
    },
    // Type-safe routing (compile-time route validation)
    typedRoutes: true,
    // CSS optimization (smaller bundles)
    optimizeCss: true,
    // Package import optimization (tree-shaking)
    optimizePackageImports: [
      "lucide-react",
      "@radix-ui/react-icons",
      "framer-motion",
      "recharts",
      "react-markdown",
      "rehype-highlight",
      "remark-gfm",
      "@supabase/supabase-js",
      "@supabase/ssr",
      "date-fns",
    ],
  },

  // ========================================
  // PERFORMANCE & SECURITY
  // ========================================
  compress: true, // Vercel Gzip/Brotli compression
  poweredByHeader: false, // Hide X-Powered-By header
  generateEtags: true, // Enable ETags for caching
  reactStrictMode: true, // React 19 best practices

  // Production compiler optimizations
  ...(process.env.NODE_ENV === "production" && {
    compiler: {
      removeConsole: {
        exclude: ["error", "warn"],
      },
    },
  }),

  // ========================================
  // HEADERS (Managed in vercel.json)
  // ========================================
  // Note: Headers are primarily configured in vercel.json
  // These are fallback headers for local development
  async headers() {
    return [
      {
        source: "/_next/static/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
