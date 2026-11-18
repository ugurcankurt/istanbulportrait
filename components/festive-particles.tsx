"use client";

import type { CSSProperties } from "react";
import { usePathname } from "@/i18n/routing";

interface AmbientFlake {
  id: string;
  left: string;
  size: number;
  duration: string;
  delay: string;
  opacity: number;
  driftMid: string;
  driftEnd: string;
  kind: "snow" | "gold";
  hideOnMobile?: boolean;
}

interface SparkleStar {
  id: string;
  top: string;
  left: string;
  size: number;
  duration: string;
  delay: string;
  hideOnMobile?: boolean;
}

const AMBIENT_FLAKES: AmbientFlake[] = [
  {
    id: "af-1",
    left: "4%",
    size: 4,
    duration: "17s",
    delay: "-3s",
    opacity: 0.42,
    driftMid: "16px",
    driftEnd: "-10px",
    kind: "gold",
  },
  {
    id: "af-2",
    left: "11%",
    size: 5,
    duration: "21s",
    delay: "-9s",
    opacity: 0.48,
    driftMid: "-14px",
    driftEnd: "12px",
    kind: "snow",
  },
  {
    id: "af-3",
    left: "18%",
    size: 3,
    duration: "15s",
    delay: "-1s",
    opacity: 0.38,
    driftMid: "12px",
    driftEnd: "-8px",
    kind: "gold",
    hideOnMobile: true,
  },
  {
    id: "af-4",
    left: "26%",
    size: 4,
    duration: "19s",
    delay: "-12s",
    opacity: 0.45,
    driftMid: "-18px",
    driftEnd: "8px",
    kind: "snow",
  },
  {
    id: "af-5",
    left: "33%",
    size: 5,
    duration: "23s",
    delay: "-6s",
    opacity: 0.36,
    driftMid: "18px",
    driftEnd: "-12px",
    kind: "gold",
    hideOnMobile: true,
  },
  {
    id: "af-6",
    left: "41%",
    size: 3,
    duration: "16s",
    delay: "-14s",
    opacity: 0.44,
    driftMid: "-10px",
    driftEnd: "14px",
    kind: "snow",
  },
  {
    id: "af-7",
    left: "49%",
    size: 4,
    duration: "20s",
    delay: "-4s",
    opacity: 0.35,
    driftMid: "14px",
    driftEnd: "-6px",
    kind: "gold",
    hideOnMobile: true,
  },
  {
    id: "af-8",
    left: "57%",
    size: 5,
    duration: "18s",
    delay: "-10s",
    opacity: 0.46,
    driftMid: "-16px",
    driftEnd: "10px",
    kind: "snow",
  },
  {
    id: "af-9",
    left: "66%",
    size: 4,
    duration: "22s",
    delay: "-2s",
    opacity: 0.4,
    driftMid: "12px",
    driftEnd: "-14px",
    kind: "gold",
  },
  {
    id: "af-10",
    left: "74%",
    size: 3,
    duration: "15.5s",
    delay: "-7s",
    opacity: 0.48,
    driftMid: "-12px",
    driftEnd: "10px",
    kind: "snow",
    hideOnMobile: true,
  },
  {
    id: "af-11",
    left: "82%",
    size: 5,
    duration: "20.5s",
    delay: "-13s",
    opacity: 0.38,
    driftMid: "16px",
    driftEnd: "-8px",
    kind: "gold",
  },
  {
    id: "af-12",
    left: "89%",
    size: 4,
    duration: "17.5s",
    delay: "-5s",
    opacity: 0.45,
    driftMid: "-14px",
    driftEnd: "12px",
    kind: "snow",
  },
  {
    id: "af-13",
    left: "95%",
    size: 4,
    duration: "19.5s",
    delay: "-11s",
    opacity: 0.4,
    driftMid: "10px",
    driftEnd: "-10px",
    kind: "gold",
    hideOnMobile: true,
  },
];

const SPARKLE_STARS: SparkleStar[] = [
  {
    id: "sp-1",
    top: "14%",
    left: "7%",
    size: 12,
    duration: "5.2s",
    delay: "0.4s",
  },
  {
    id: "sp-2",
    top: "24%",
    left: "91%",
    size: 14,
    duration: "6.4s",
    delay: "1.8s",
  },
  {
    id: "sp-3",
    top: "52%",
    left: "4%",
    size: 10,
    duration: "4.8s",
    delay: "2.6s",
    hideOnMobile: true,
  },
  {
    id: "sp-4",
    top: "68%",
    left: "94%",
    size: 11,
    duration: "5.8s",
    delay: "0.9s",
    hideOnMobile: true,
  },
];

export function FestiveParticles() {
  const pathname = usePathname();

  // Keep customer dashboard/gallery and checkout flow completely clean
  if (pathname.startsWith("/account") || pathname.startsWith("/checkout")) {
    return null;
  }

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-30 overflow-hidden"
    >
      {AMBIENT_FLAKES.map((flake) => (
        <span
          key={flake.id}
          className={`festive-snowflake absolute top-0 rounded-full ${
            flake.hideOnMobile ? "hidden sm:block" : "block"
          } ${
            flake.kind === "gold"
              ? "bg-[radial-gradient(circle,rgba(212,175,55,0.88)_0%,rgba(212,175,55,0.22)_58%,transparent_100%)] shadow-[0_0_8px_rgba(212,175,55,0.3)]"
              : "bg-[radial-gradient(circle,rgba(255,255,255,0.95)_0%,rgba(224,208,176,0.45)_62%,transparent_100%)] shadow-[0_0_6px_rgba(212,175,55,0.22)] dark:shadow-[0_0_8px_rgba(255,255,255,0.38)]"
          }`}
          style={
            {
              left: flake.left,
              width: `${flake.size}px`,
              height: `${flake.size}px`,
              "--fall-duration": flake.duration,
              "--fall-delay": flake.delay,
              "--flake-opacity": String(flake.opacity),
              "--drift-mid": flake.driftMid,
              "--drift-end": flake.driftEnd,
            } as CSSProperties
          }
        />
      ))}

      {SPARKLE_STARS.map((star) => (
        <svg
          key={star.id}
          viewBox="0 0 24 24"
          fill="currentColor"
          className={`festive-twinkle absolute text-[#c69735]/60 dark:text-[#f3d37a]/75 ${
            star.hideOnMobile ? "hidden md:block" : "block"
          }`}
          style={
            {
              top: star.top,
              left: star.left,
              width: `${star.size}px`,
              height: `${star.size}px`,
              "--twinkle-duration": star.duration,
              "--twinkle-delay": star.delay,
            } as CSSProperties
          }
        >
          <title>Sparkle</title>
          <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" />
        </svg>
      ))}
    </div>
  );
}
