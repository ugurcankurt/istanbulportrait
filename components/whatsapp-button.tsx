"use client";

import { AnimatePresence, motion } from "framer-motion";
import { MessageCircle, Phone, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState, useCallback } from "react";
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
  const [isClicked, setIsClicked] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [tooltipDismissed, setTooltipDismissed] = useState(false);

  // Intersection Observer for scroll-based animation
  const { ref, inView } = useInView({
    threshold: 0.1,
    triggerOnce: true,
    delay: 100,
  });

  // Detect mobile device and initialize tooltip system
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Check if user has already interacted with the button
    const hasInteractedBefore = localStorage.getItem('whatsapp-tooltip-dismissed') === 'true';
    setHasInteracted(hasInteractedBefore);

    // Show tooltip after 2 seconds if user hasn't interacted before
    if (!hasInteractedBefore) {
      const timer = setTimeout(() => {
        setShowTooltip(true);
      }, 2000);

      return () => {
        clearTimeout(timer);
        window.removeEventListener("resize", checkMobile);
      };
    }

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Format phone number for WhatsApp URL (remove + and any spaces/dashes)
  const formattedNumber = phoneNumber.replace(/[^\d]/g, "");

  // Get the pre-written message for the current locale
  const message = encodeURIComponent(t("message"));

  // Create WhatsApp URL
  const whatsappUrl = `https://wa.me/${formattedNumber}?text=${message}`;

  // Animation variants following site standards with proper TypeScript types
  const containerVariants = {
    hidden: {
      opacity: 0,
      y: 20,
      scale: 0.8,
    } as const,
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.8,
        ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number],
        delay: 0.2,
      },
    } as const,
  };

  const buttonVariants = {
    idle: {
      scale: 1,
      y: 0,
    } as const,
    hover: {
      scale: 1.05,
      y: -2,
      transition: {
        type: "spring" as const,
        stiffness: 400,
        damping: 17,
      },
    } as const,
    tap: {
      scale: 0.95,
      y: 0,
      transition: {
        type: "spring" as const,
        stiffness: 600,
        damping: 15,
      },
    } as const,
  };

  const iconVariants = {
    idle: { rotate: 0, scale: 1 } as const,
    hover: {
      rotate: 12,
      scale: 1.1,
      transition: {
        type: "spring" as const,
        stiffness: 400,
        damping: 17,
      },
    } as const,
    tap: {
      rotate: 0,
      scale: 0.9,
      transition: { duration: 0.1 },
    } as const,
  };

  const glowVariants = {
    idle: { opacity: 0, scale: 1 } as const,
    hover: {
      opacity: 0.6,
      scale: 1.2,
      transition: {
        duration: 0.3,
        ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number],
      },
    } as const,
  };

  const tooltipVariants = {
    hidden: {
      opacity: 0,
      y: 10,
      scale: 0.95,
    } as const,
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.2,
        ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number],
      },
    } as const,
  };

  const handleClick = useCallback(() => {
    setIsClicked(true);
    setTimeout(() => setIsClicked(false), 200);

    // Mark as interacted and hide tooltip permanently
    if (!hasInteracted) {
      setHasInteracted(true);
      setShowTooltip(false);
      localStorage.setItem('whatsapp-tooltip-dismissed', 'true');
    }

    // Open WhatsApp in new tab
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  }, [whatsappUrl, hasInteracted]);

  const dismissTooltip = useCallback(() => {
    setShowTooltip(false);
    setTooltipDismissed(true);
    setHasInteracted(true);
    localStorage.setItem('whatsapp-tooltip-dismissed', 'true');
  }, []);

  return (
    <motion.div
      ref={ref}
      variants={containerVariants}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      className={cn(
        "fixed z-50",
        isMobile
          ? "bottom-4 right-4" // Closer to edge on mobile
          : "bottom-6 right-6", // More space on desktop
      )}
    >
      {/* Floating Action Button */}
      <motion.button
        onClick={handleClick}
        onMouseEnter={() => !isMobile && setIsHovered(true)}
        onMouseLeave={() => !isMobile && setIsHovered(false)}
        variants={buttonVariants}
        initial="idle"
        whileHover="hover"
        whileTap="tap"
        className={cn(
          // Base styles with modern glassmorphism
          "group relative flex items-center justify-center",
          "backdrop-blur-md bg-gradient-to-br from-[#25D366]/95 to-[#128C7E]/95",
          "hover:from-[#20BA5A]/98 hover:to-[#0F7A6B]/98",
          "border border-white/20 shadow-lg hover:shadow-2xl",
          "focus:outline-none focus:ring-4 focus:ring-green-400/30 focus:ring-offset-2",
          "transition-all duration-300 ease-out",

          // Responsive sizing with better proportions
          isMobile
            ? "w-14 h-14 rounded-2xl" // Larger on mobile for better touch
            : "w-16 h-16 rounded-3xl", // Even larger on desktop

          className,
        )}
        title={t("tooltip")}
        aria-label={t("tooltip")}
      >
        {/* Main WhatsApp Icon with enhanced styling */}
        <motion.div
          variants={iconVariants}
          initial="idle"
          animate={isHovered ? "hover" : isClicked ? "tap" : "idle"}
          className="relative z-10"
        >
          <MessageCircle
            className={cn(
              "text-white drop-shadow-sm",
              isMobile ? "w-6 h-6" : "w-8 h-8"
            )}
          />
        </motion.div>

        {/* Pulsing ring effect for attention */}
        <AnimatePresence>
          {showTooltip && !hasInteracted && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{
                opacity: [0.3, 0.6, 0.3],
                scale: [1, 1.2, 1],
              }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className={cn(
                "absolute inset-0 rounded-full border-2 border-white/50",
                "pointer-events-none",
                isMobile ? "rounded-2xl" : "rounded-3xl"
              )}
            />
          )}
        </AnimatePresence>

        {/* Ripple effect on click with AnimatePresence */}
        <AnimatePresence>
          {isClicked && (
            <motion.div
              initial={{ opacity: 0.6, scale: 0.8 }}
              animate={{ opacity: 0, scale: 2 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className={cn(
                "absolute inset-0 bg-white/20 pointer-events-none",
                isMobile ? "rounded-xl" : "rounded-2xl",
              )}
            />
          )}
        </AnimatePresence>
      </motion.button>

      {/* Enhanced Tooltip System - works on all devices */}
      <AnimatePresence>
        {/* Hover tooltip for desktop */}
        {!isMobile && isHovered && !showTooltip && (
          <motion.div
            variants={tooltipVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className={cn(
              "absolute bottom-full right-0 mb-3 px-4 py-2.5",
              "bg-white/95 backdrop-blur-md border border-gray-200/50",
              "rounded-2xl text-gray-800 text-sm font-medium whitespace-nowrap",
              "shadow-lg pointer-events-none select-none",
              "dark:bg-gray-800/95 dark:border-gray-700/50 dark:text-white"
            )}
          >
            {t("tooltip")}
            <div className="absolute top-full right-4 w-2 h-2 bg-white/95 dark:bg-gray-800/95 border-r border-b border-gray-200/50 dark:border-gray-700/50 rotate-45 transform translate-y-[-50%]" />
          </motion.div>
        )}

        {/* Persistent notification tooltip */}
        {showTooltip && !hasInteracted && !tooltipDismissed && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className={cn(
              "absolute pointer-events-auto z-50",
              // Responsive positioning
              isMobile
                ? "bottom-full left-1/2 transform -translate-x-1/2 mb-4 max-w-[280px]"
                : "bottom-full right-0 mb-4 max-w-[320px]"
            )}
          >
            <div className={cn(
              "relative px-4 py-3 rounded-2xl",
              "bg-white/98 backdrop-blur-md border border-gray-200/60",
              "shadow-xl shadow-black/5",
              "dark:bg-gray-800/98 dark:border-gray-700/60 dark:shadow-black/20"
            )}>
              {/* Close button */}
              <button
                onClick={dismissTooltip}
                className={cn(
                  "absolute top-2 right-2 p-1 rounded-full",
                  "hover:bg-gray-100 dark:hover:bg-gray-700",
                  "transition-colors duration-200",
                  "focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600"
                )}
                aria-label="Bildirimi kapat"
              >
                <X className="w-3 h-3 text-gray-500 dark:text-gray-400" />
              </button>

              {/* Tooltip content */}
              <div className="pr-6">
                <h4 className={cn(
                  "text-sm font-semibold text-gray-900 dark:text-white",
                  "mb-1"
                )}>
                  📱 {t("notification_title")}
                </h4>
                <p className={cn(
                  "text-xs text-gray-600 dark:text-gray-300",
                  "leading-relaxed"
                )}>
                  {t("notification_message")}
                </p>
              </div>

              {/* Arrow */}
              <div className={cn(
                "absolute w-3 h-3 transform rotate-45",
                "bg-white/98 border-r border-b border-gray-200/60",
                "dark:bg-gray-800/98 dark:border-gray-700/60",
                isMobile
                  ? "top-full left-1/2 -translate-x-1/2 -translate-y-1/2"
                  : "top-full right-6 -translate-y-1/2"
              )} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enhanced ambient glow effect */}
      <motion.div
        variants={glowVariants}
        initial="idle"
        animate={isHovered || showTooltip ? "hover" : "idle"}
        className={cn(
          "absolute inset-0 pointer-events-none -z-10",
          "bg-gradient-radial from-[#25D366]/40 via-[#25D366]/15 to-transparent",
          "blur-2xl",
          isMobile ? "rounded-2xl" : "rounded-3xl",
        )}
      />

      {/* Subtle inner shadow for depth */}
      <div className={cn(
        "absolute inset-0 pointer-events-none",
        "bg-gradient-to-b from-white/10 to-transparent",
        "mix-blend-overlay",
        isMobile ? "rounded-2xl" : "rounded-3xl"
      )} />
    </motion.div>
  );
}

// Alternative compact version with modern enhancements
export function WhatsAppButtonCompact({
  phoneNumber,
  className,
}: WhatsAppButtonProps) {
  const t = useTranslations("whatsapp");
  const formattedNumber = phoneNumber.replace(/[^\d]/g, "");
  const message = encodeURIComponent(t("message"));
  const whatsappUrl = `https://wa.me/${formattedNumber}?text=${message}`;

  const { ref, inView } = useInView({
    threshold: 0.1,
    triggerOnce: true,
    delay: 100,
  });

  const handleClick = useCallback(() => {
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  }, [whatsappUrl]);

  return (
    <motion.button
      ref={ref}
      onClick={handleClick}
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={
        inView
          ? { opacity: 1, scale: 1, y: 0 }
          : { opacity: 0, scale: 0.8, y: 20 }
      }
      whileHover={{
        scale: 1.05,
        y: -2,
        transition: { type: "spring", stiffness: 400, damping: 17 },
      }}
      whileTap={{
        scale: 0.95,
        transition: { type: "spring", stiffness: 600, damping: 15 },
      }}
      transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
      className={cn(
        "fixed bottom-4 right-4 z-50",
        "w-14 h-14 rounded-2xl",
        "backdrop-blur-md bg-gradient-to-br from-[#25D366]/95 to-[#128C7E]/95",
        "hover:from-[#20BA5A]/98 hover:to-[#0F7A6B]/98",
        "border border-white/20 shadow-lg hover:shadow-xl",
        "flex items-center justify-center",
        "focus:outline-none focus:ring-4 focus:ring-green-400/30 focus:ring-offset-2",
        "transition-all duration-300 ease-out",
        className,
      )}
      title={t("tooltip")}
      aria-label={t("tooltip")}
    >
      <Phone className="w-6 h-6 text-white drop-shadow-sm" />
    </motion.button>
  );
}
