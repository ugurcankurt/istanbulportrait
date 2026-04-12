"use client";

import { usePathname } from "@/i18n/routing";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useInView } from "react-intersection-observer";
import { cn } from "@/lib/utils";

interface WhatsAppButtonProps {
  phoneNumber: string;
  className?: string;
}

const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.148-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

export function WhatsAppButton({
  phoneNumber,
  className,
}: WhatsAppButtonProps) {
  const t = useTranslations("whatsapp");
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const isMobile = useIsMobile();

  // Check if we are on the packages page (Photography Packages)
  const isPackagesPage = (pathname as string) === "/packages" || (pathname as string).startsWith("/packages/");

  // Intersection Observer for scroll-based animation
  const { ref, inView } = useInView({
    threshold: 0.1,
    triggerOnce: true,
    delay: 100,
  });

  // Handle 4-second minimization on mobile
  useEffect(() => {
    if (mounted && isMobile) {
      if (isPackagesPage) {
        setIsMinimized(true);
        return;
      }

      if (!showNotification) {
        const timer = setTimeout(() => {
          setIsMinimized(true);
        }, 4000);
        return () => clearTimeout(timer);
      }
    }
  }, [mounted, isMobile, showNotification, isPackagesPage]);

  // Check for first-time visitor
  useEffect(() => {
    // If on packages page, skip the greeting notification
    if (isPackagesPage) return;

    const hasSeenGreeting = localStorage.getItem("hasSeenWhatsAppGreeting");
    if (!hasSeenGreeting) {
      const timer = setTimeout(() => {
        setShowNotification(true);
        setIsTyping(true);
        // Turn off typing after 1.8 seconds
        setTimeout(() => setIsTyping(false), 1800);
      }, 3000); // Show notification after 3 seconds
      return () => clearTimeout(timer);
    }
  }, [isPackagesPage]);

  const dismissNotification = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setShowNotification(false);
    localStorage.setItem("hasSeenWhatsAppGreeting", "true");
  };

  // Auto-dismiss on scroll or click anywhere
  useEffect(() => {
    if (!showNotification) return;

    const handleInteraction = () => {
      // Small check to ensure we only dismiss if it's currently showing
      setShowNotification(false);
      localStorage.setItem("hasSeenWhatsAppGreeting", "true");
    };

    // Add listeners after a slight delay to prevent immediate dismissal 
    // if the user is currently scrolling when it pops up
    const timer = setTimeout(() => {
      window.addEventListener("scroll", handleInteraction, { passive: true });
      window.addEventListener("mousedown", handleInteraction);
      window.addEventListener("touchstart", handleInteraction, { passive: true });
    }, 1000);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("scroll", handleInteraction);
      window.removeEventListener("mousedown", handleInteraction);
      window.removeEventListener("touchstart", handleInteraction);
    };
  }, [showNotification]);

  // Detect mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle visibility animation when in view
  useEffect(() => {
    if (inView) {
      setIsVisible(true);
    }
  }, [inView]);

  const formattedNumber = phoneNumber.replace(/[^\d]/g, "");
  const message = encodeURIComponent(t("message"));
  const whatsappUrl = `https://wa.me/${formattedNumber}?text=${message}`;

  return (
    <div
      ref={ref}
      dir="ltr"
      className={cn(
        "fixed z-50 flex flex-col items-end gap-3 transition-all duration-700 ease-in-out",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10",
        mounted && isMobile
          ? isMinimized
            ? "bottom-36 right-0"
            : "bottom-4 right-4"
          : "bottom-8 right-8",
        className,
      )}
    >
      {/* First-time visitor notification popover */}
      {showNotification && (
        <div className="absolute bottom-full right-0 mb-4 w-60 sm:w-72 bg-popover/95 backdrop-blur-md border shadow-2xl rounded-2xl p-4 animate-in fade-in slide-in-from-bottom-4 zoom-in-95 duration-500 origin-bottom-right">
          <button
            onClick={dismissNotification}
            className="absolute top-2 right-2 p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-full transition-colors"
            aria-label={t("close_notification")}
          >
            <X className="w-3.5 h-3.5" />
          </button>

          {isTyping ? (
            <div className="flex items-center gap-1 py-1 px-1">
              <div className="w-1.5 h-1.5 bg-success rounded-full animate-bounce [animation-delay:-0.3s]" />
              <div className="w-1.5 h-1.5 bg-success rounded-full animate-bounce [animation-delay:-0.15s]" />
              <div className="w-1.5 h-1.5 bg-success rounded-full animate-bounce" />
              <span className="text-xs text-muted-foreground ml-2 font-medium">Typing...</span>
            </div>
          ) : (
            <div className="pr-4 animate-in fade-in slide-in-from-left-2 duration-300">
              <p className="font-bold text-foreground text-sm sm:text-base tracking-tight">
                {t("notification_title")}
              </p>
              <p className="text-muted-foreground text-xs sm:text-sm mt-1 leading-relaxed font-medium">
                {t("notification_message")}
              </p>
            </div>
          )}

          {/* Tail pointer element pointing to WhatsApp button */}
          <div className="absolute -bottom-2 right-6 w-4 h-4 bg-popover/95 border-b border-r transform rotate-45 translate-y-[1px]" />
        </div>
      )}

      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          "relative group transition-all duration-500 ease-out active:scale-95",
          isMinimized && mounted && isMobile ? "translate-x-0" : ""
        )}
        aria-label={t("tooltip")}
        onClick={() => {
          dismissNotification();
          const eventId = typeof crypto !== "undefined" ? crypto.randomUUID() : undefined;

          if (typeof window !== "undefined" && window.fbq) {
            window.fbq("track", "Contact", {
              content_name: "WhatsApp",
              content_category: "Photography Inquiry",
            }, eventId ? { eventID: eventId } : undefined);
          }
            if (typeof window !== "undefined" && window.gtag) {
              window.gtag("event", "contact", {
                event_category: "Engagement",
                event_label: "WhatsApp",
              });

              // Google Ads Direct Conversion for 2026
              const adsId = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID;
              if (adsId) {
                window.gtag("event", "conversion", {
                  send_to: `${adsId}/contact`, // Contact label
                  value: 5.0, // Assign a minor value to WhatsApp leads
                  currency: "EUR",
                });
              }
            }
            fetch("/api/facebook/conversions", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                event_name: "Contact",
                event_id: eventId,
                package_id: "general",
                custom_data: { contact_method: "WhatsApp" },
              }),
            }).catch(() => { });
          }}
      >
        <div
          className={cn(
            "relative flex items-center justify-center shadow-lg transition-all duration-500 overflow-hidden",
            "bg-gradient-to-br from-[#25D366] to-[#128C7E]",
            !isMinimized && "group-hover:scale-110",
            mounted && isMobile
              ? isMinimized
                ? "w-12 h-[60px] rounded-l-2xl rounded-r-none"
                : "w-14 h-14 rounded-full"
              : "w-16 h-16 rounded-full",
          )}
        >
          {/* Glassmorphism shine effect */}
          <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-transparent pointer-events-none" />

          <WhatsAppIcon
            className={cn(
              "text-white z-10 drop-shadow-md transition-transform duration-500",
              mounted && isMobile
                ? isMinimized
                  ? "w-6 h-6"
                  : "w-7 h-7"
                : "w-8 h-8",
            )}
          />
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

