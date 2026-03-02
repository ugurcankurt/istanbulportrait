"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useInView } from "react-intersection-observer";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface WhatsAppButtonProps {
  phoneNumber: string;
  className?: string;
}

export function WhatsAppButton({
  phoneNumber,
  className,
}: WhatsAppButtonProps) {
  const t = useTranslations("whatsapp");
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Intersection Observer for scroll-based animation
  const { ref, inView } = useInView({
    threshold: 0.1,
    triggerOnce: true,
    delay: 100,
  });

  // Detect mobile device and mount
  useEffect(() => {
    setMounted(true);
    const checkMobile = () => setIsMobile(window.innerWidth < 768);

    let timeoutId: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(checkMobile, 100);
    };

    checkMobile();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(timeoutId);
    };
  }, []);

  // Handle visibility animation when in view
  useEffect(() => {
    if (inView) {
      setIsVisible(true);
    }
  }, [inView]);

  const formattedNumber = phoneNumber.replace(/[^\d]/g, "");
  // Using the "message" translation key from whatsapp locale file
  const message = encodeURIComponent(t("message"));
  const whatsappUrl = `https://wa.me/${formattedNumber}?text=${message}`;

  return (
    <div
      ref={ref}
      dir="ltr"
      className={cn(
        "fixed z-50 flex flex-col items-end gap-4 transition-all duration-500",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5",
        mounted && isMobile ? "bottom-4 right-4" : "bottom-8 right-8",
        className,
      )}
    >
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="relative group hover:scale-105 active:scale-95 transition-transform duration-200 block"
        aria-label={t("tooltip")}
      >
        <div
          className={cn(
            "relative flex items-center justify-center rounded-full shadow-lg transition-all duration-300 bg-[#25D366] hover:brightness-110",
            mounted && isMobile ? "w-14 h-14" : "w-16 h-16",
          )}
        >
          <Image
            src="/whatsapp-logo.svg"
            alt="WhatsApp"
            width={mounted && isMobile ? 32 : 36}
            height={mounted && isMobile ? 32 : 36}
            className="text-white"
          />
          {/* Notification Badge */}
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-background">
            1
          </span>
        </div>
      </a>
    </div>
  );
}

export function WhatsAppButtonCompact({
  phoneNumber,
  className,
}: WhatsAppButtonProps) {
  return <WhatsAppButton phoneNumber={phoneNumber} className={className} />;
}

