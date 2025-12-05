"use client";

import { AnimatePresence, motion } from "framer-motion";
import { MessageCircle, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { useInView } from "react-intersection-observer";
import { cn } from "@/lib/utils";

interface WhatsAppButtonProps {
  phoneNumber: string;
  className?: string;
}

export function WhatsAppButton({
  phoneNumber,
  className,
}: WhatsAppButtonProps) {
  const t = useTranslations("whatsapp");
  const [isHovered, setIsHovered] = useState(false);
  const [showBubble, setShowBubble] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Intersection Observer for scroll-based animation
  const { ref, inView } = useInView({
    threshold: 0.1,
    triggerOnce: true,
    delay: 100,
  });

  // Detect mobile device and mount
  useEffect(() => {
    setMounted(true);
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);

    // Show chat bubble after delay
    const timer = setTimeout(() => {
      setShowBubble(true);
    }, 3000);

    return () => {
      window.removeEventListener("resize", checkMobile);
      clearTimeout(timer);
    };
  }, []);

  const formattedNumber = phoneNumber.replace(/[^\d]/g, "");
  const message = encodeURIComponent(t("message"));
  const whatsappUrl = `https://wa.me/${formattedNumber}?text=${message}`;

  const handleClick = useCallback(() => {
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
    setShowBubble(false);
  }, [whatsappUrl]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 0.5 }}
      dir="ltr"
      className={cn(
        "fixed z-50 flex flex-col items-end gap-4",
        mounted && isMobile ? "bottom-4 right-4" : "bottom-8 right-8",
        className,
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Chat Bubble Notification */}
      <AnimatePresence>
        {(showBubble || isHovered) && (
          <motion.div
            initial={{ opacity: 0, x: 20, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.8 }}
            className={cn(
              "bg-popover text-popover-foreground",
              "px-4 py-3 rounded-2xl rounded-tr-sm shadow-xl border border-border",
              "flex items-start gap-3 max-w-[280px]",
              "origin-bottom-right",
            )}
          >
            <div className="relative shrink-0">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                <MessageCircle size={20} fill="currentColor" />
              </div>
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-background rounded-full"></span>
            </div>
            <div
              className="flex-1 min-w-0 text-left rtl:text-right"
              dir={t("direction") === "rtl" ? "rtl" : "ltr"}
            >
              <p className="text-sm font-semibold mb-0.5">
                {t("notification_title")}
              </p>
              <p className="text-xs text-muted-foreground leading-snug">
                {t("notification_message")}
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowBubble(false);
              }}
              className="text-muted-foreground hover:text-foreground"
            >
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Button */}
      <motion.button
        onClick={handleClick}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="relative group"
      >
        {/* Pulse Effect */}
        <span className="absolute inset-0 rounded-full bg-[#25D366] opacity-20 animate-ping duration-[2000ms]"></span>

        {/* Button Container */}
        <div
          className={cn(
            "relative flex items-center justify-center rounded-full shadow-lg transition-all duration-300",
            "bg-[#25D366] hover:bg-[#20ba5a]",
            mounted && isMobile ? "w-14 h-14" : "w-16 h-16",
          )}
        >
          <MessageCircle
            className={cn(
              "text-white fill-white",
              mounted && isMobile ? "w-7 h-7" : "w-8 h-8",
            )}
          />

          {/* Notification Badge */}
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-background">
            1
          </span>
        </div>
      </motion.button>
    </motion.div>
  );
}

export function WhatsAppButtonCompact({
  phoneNumber,
  className,
}: WhatsAppButtonProps) {
  return <WhatsAppButton phoneNumber={phoneNumber} className={className} />;
}
