import type { CSSProperties } from "react";

interface BokehOrb {
  id: string;
  className: string;
  style: CSSProperties;
}

interface HeroFlake {
  id: string;
  left: string;
  size: number;
  duration: string;
  delay: string;
  opacity: number;
  driftMid: string;
  driftEnd: string;
  variant: "snow" | "gold";
}

const BOKEH_ORBS: BokehOrb[] = [
  {
    id: "orb-1",
    className:
      "top-[12%] left-[8%] w-44 h-44 sm:w-64 sm:h-64 bg-[radial-gradient(circle,rgba(232,195,112,0.22)_0%,rgba(212,175,55,0.06)_50%,transparent_72%)] blur-2xl",
    style: {
      "--bokeh-min": "0.28",
      "--bokeh-max": "0.55",
      "--bokeh-duration": "11s",
      "--bokeh-delay": "0s",
      "--bokeh-x": "16px",
      "--bokeh-y": "-18px",
    } as CSSProperties,
  },
  {
    id: "orb-2",
    className:
      "top-[18%] right-[12%] w-36 h-36 sm:w-52 sm:h-52 bg-[radial-gradient(circle,rgba(244,217,140,0.24)_0%,rgba(212,175,55,0.05)_55%,transparent_75%)] blur-xl",
    style: {
      "--bokeh-min": "0.22",
      "--bokeh-max": "0.5",
      "--bokeh-duration": "9s",
      "--bokeh-delay": "2s",
      "--bokeh-x": "-14px",
      "--bokeh-y": "14px",
    } as CSSProperties,
  },
  {
    id: "orb-3",
    className:
      "bottom-[18%] right-[24%] w-48 h-48 sm:w-72 sm:h-72 bg-[radial-gradient(circle,rgba(212,175,55,0.18)_0%,rgba(159,18,57,0.06)_52%,transparent_74%)] blur-2xl",
    style: {
      "--bokeh-min": "0.25",
      "--bokeh-max": "0.48",
      "--bokeh-duration": "13s",
      "--bokeh-delay": "1.2s",
      "--bokeh-x": "18px",
      "--bokeh-y": "-12px",
    } as CSSProperties,
  },
  {
    id: "orb-4",
    className:
      "top-[48%] left-[42%] w-28 h-28 sm:w-40 sm:h-40 bg-[radial-gradient(circle,rgba(255,244,214,0.2)_0%,rgba(212,175,55,0.04)_55%,transparent_75%)] blur-xl",
    style: {
      "--bokeh-min": "0.18",
      "--bokeh-max": "0.42",
      "--bokeh-duration": "10s",
      "--bokeh-delay": "3.4s",
      "--bokeh-x": "-12px",
      "--bokeh-y": "-16px",
    } as CSSProperties,
  },
  {
    id: "orb-5",
    className:
      "bottom-[10%] left-[14%] w-32 h-32 sm:w-48 sm:h-48 bg-[radial-gradient(circle,rgba(159,18,57,0.18)_0%,rgba(212,175,55,0.05)_55%,transparent_75%)] blur-2xl",
    style: {
      "--bokeh-min": "0.2",
      "--bokeh-max": "0.4",
      "--bokeh-duration": "12s",
      "--bokeh-delay": "0.8s",
      "--bokeh-x": "10px",
      "--bokeh-y": "-10px",
    } as CSSProperties,
  },
];

const HERO_FLAKES: HeroFlake[] = [
  {
    id: "hf-1",
    left: "6%",
    size: 4,
    duration: "13s",
    delay: "-2s",
    opacity: 0.65,
    driftMid: "16px",
    driftEnd: "-8px",
    variant: "snow",
  },
  {
    id: "hf-2",
    left: "14%",
    size: 6,
    duration: "17s",
    delay: "-7s",
    opacity: 0.55,
    driftMid: "-14px",
    driftEnd: "10px",
    variant: "gold",
  },
  {
    id: "hf-3",
    left: "23%",
    size: 3,
    duration: "11s",
    delay: "-4s",
    opacity: 0.7,
    driftMid: "12px",
    driftEnd: "-6px",
    variant: "snow",
  },
  {
    id: "hf-4",
    left: "34%",
    size: 5,
    duration: "15s",
    delay: "-9s",
    opacity: 0.45,
    driftMid: "-18px",
    driftEnd: "12px",
    variant: "gold",
  },
  {
    id: "hf-5",
    left: "45%",
    size: 4,
    duration: "14s",
    delay: "-1s",
    opacity: 0.6,
    driftMid: "14px",
    driftEnd: "-10px",
    variant: "snow",
  },
  {
    id: "hf-6",
    left: "56%",
    size: 6,
    duration: "18s",
    delay: "-11s",
    opacity: 0.5,
    driftMid: "-12px",
    driftEnd: "8px",
    variant: "gold",
  },
  {
    id: "hf-7",
    left: "64%",
    size: 3,
    duration: "12s",
    delay: "-5s",
    opacity: 0.68,
    driftMid: "18px",
    driftEnd: "-6px",
    variant: "snow",
  },
  {
    id: "hf-8",
    left: "74%",
    size: 5,
    duration: "16s",
    delay: "-3s",
    opacity: 0.52,
    driftMid: "-15px",
    driftEnd: "14px",
    variant: "gold",
  },
  {
    id: "hf-9",
    left: "82%",
    size: 4,
    duration: "13.5s",
    delay: "-8s",
    opacity: 0.65,
    driftMid: "10px",
    driftEnd: "-12px",
    variant: "snow",
  },
  {
    id: "hf-10",
    left: "91%",
    size: 5,
    duration: "15.5s",
    delay: "-6s",
    opacity: 0.58,
    driftMid: "-14px",
    driftEnd: "8px",
    variant: "gold",
  },
];

export function FestiveHeroBokeh() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-[2] overflow-hidden"
    >
      {/* Warm velvet & champagne gold corner vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(212,175,55,0.14),transparent_55%),radial-gradient(ellipse_at_bottom_left,rgba(136,19,55,0.18),transparent_55%)]" />

      {/* Out-of-focus bokeh orbs */}
      {BOKEH_ORBS.map((orb) => (
        <span
          key={orb.id}
          className={`festive-bokeh absolute rounded-full ${orb.className}`}
          style={orb.style}
        />
      ))}

      {/* Gentle hero snow & gold shimmer motes */}
      {HERO_FLAKES.map((flake) => (
        <span
          key={flake.id}
          className={`festive-snowflake absolute top-0 rounded-full ${
            flake.variant === "gold"
              ? "bg-[radial-gradient(circle,rgba(248,224,142,0.95)_0%,rgba(212,175,55,0.28)_60%,transparent_100%)] shadow-[0_0_10px_rgba(248,224,142,0.45)]"
              : "bg-[radial-gradient(circle,rgba(255,255,255,0.95)_0%,rgba(255,255,255,0.25)_65%,transparent_100%)] shadow-[0_0_8px_rgba(255,255,255,0.35)]"
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

      {/* Subtle champagne gold hairline at hero base */}
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#d4af37]/45 to-transparent" />
    </div>
  );
}
