"use client";

import { Globe } from "lucide-react";
import { useTranslations } from "next-intl";

export function FloatingGlobalBadge() {
  const t = useTranslations("prints");

  // Get the translated text
  const text = t("worldwide_shipping_badge");

  // Repeat the text to fill the circular path completely
  const repeatedText = `${text} • ${text} • ${text} • `;

  return (
    <div className="fixed top-20 sm:top-24 left-2 sm:left-8 z-40 pointer-events-none select-none">
      <div className="relative w-20 h-20 sm:w-28 sm:h-28 flex items-center justify-center">
        {/* Rotating Circular Text */}
        <div className="absolute inset-0 animate-spin-slow">
          <svg
            viewBox="0 0 100 100"
            className="w-full h-full"
            aria-hidden="true"
          >
            <defs>
              <path
                id="circlePath"
                d="M 50, 50 m -35, 0 a 35,35 0 1,1 70,0 a 35,35 0 1,1 -70,0"
              />
            </defs>
            <text className="text-[5.5px] sm:text-[6.5px] font-black fill-primary tracking-[0.28em] uppercase">
              <textPath xlinkHref="#circlePath" startOffset="0%">
                {repeatedText}
              </textPath>
            </text>
          </svg>
        </div>

        {/* Center Globe Icon Container */}
        <div className="bg-primary p-2.5 sm:p-3.5 rounded-full shadow-2xl flex items-center justify-center relative z-10 transition-transform duration-300 hover:scale-110 pointer-events-auto cursor-help">
          <Globe className="w-5 h-5 sm:w-7 sm:h-7 text-white animate-pulse-subtle" />
        </div>
      </div>

      <style jsx global>{`
        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        .animate-spin-slow {
          animation: spin-slow 15s linear infinite;
        }
        @keyframes pulse-subtle {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
        .animate-pulse-subtle {
          animation: pulse-subtle 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
