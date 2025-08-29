"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { MessageCircle, Phone } from "lucide-react";
import { useState, useEffect } from "react";
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
  
  // Intersection Observer for scroll-based animation
  const { ref, inView } = useInView({
    threshold: 0.1,
    triggerOnce: true,
    delay: 100,
  });

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
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
      }
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
        damping: 17 
      }
    } as const,
    tap: { 
      scale: 0.95,
      y: 0,
      transition: { 
        type: "spring" as const, 
        stiffness: 600, 
        damping: 15 
      }
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
        damping: 17 
      }
    } as const,
    tap: { 
      rotate: 0, 
      scale: 0.9,
      transition: { duration: 0.1 }
    } as const,
  };

  const glowVariants = {
    idle: { opacity: 0, scale: 1 } as const,
    hover: { 
      opacity: 0.6, 
      scale: 1.2,
      transition: { 
        duration: 0.3,
        ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number]
      }
    } as const,
  };

  const tooltipVariants = {
    hidden: { 
      opacity: 0, 
      y: 10, 
      scale: 0.95 
    } as const,
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { 
        duration: 0.2,
        ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number]
      }
    } as const,
  };

  const handleClick = () => {
    setIsClicked(true);
    setTimeout(() => setIsClicked(false), 200);
    
    // Open WhatsApp in new tab
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  };

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
          : "bottom-6 right-6"  // More space on desktop
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
          // Base styles with modern squircle shape
          "group relative flex items-center justify-center",
          "shadow-lg hover:shadow-2xl",
          "focus:outline-none focus:ring-4 focus:ring-green-400/30",
          
          // Responsive sizing
          isMobile 
            ? "w-12 h-12 rounded-xl" // Smaller on mobile
            : "w-14 h-14 rounded-2xl", // Larger on desktop
          
          // WhatsApp brand colors with gradient
          "bg-gradient-to-br from-[#25D366] to-[#128C7E]",
          "hover:from-[#20BA5A] hover:to-[#0F7A6B]",
          
          className
        )}
        title={t("tooltip")}
        aria-label={t("tooltip")}
      >
        {/* Main WhatsApp Icon with Framer Motion */}
        <motion.div
          variants={iconVariants}
          initial="idle"
          animate={isHovered ? "hover" : isClicked ? "tap" : "idle"}
        >
          <MessageCircle 
            className={cn(
              "text-white",
              isMobile ? "w-5 h-5" : "w-7 h-7"
            )} 
          />
        </motion.div>
        
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
                isMobile ? "rounded-xl" : "rounded-2xl"
              )}
            />
          )}
        </AnimatePresence>
      </motion.button>

      {/* Tooltip with Framer Motion - only on desktop */}
      <AnimatePresence>
        {!isMobile && isHovered && (
          <motion.div
            variants={tooltipVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className={cn(
              "absolute bottom-full right-0 mb-2 px-3 py-2",
              "bg-[#20BA5A] backdrop-blur-lg border border-white/20",
              "rounded-xl text-white text-sm font-medium whitespace-nowrap",
              "shadow-lg pointer-events-none select-none"
            )}
          >
            {t("tooltip")}
            
            {/* Tooltip arrow */}
            <div className="absolute top-full right-4 w-2 h-2 bg-white/10 border-r border-b border-white/20 rotate-45 transform translate-y-[-50%]" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ambient glow effect with Framer Motion */}
      <motion.div 
        variants={glowVariants}
        initial="idle"
        animate={isHovered ? "hover" : "idle"}
        className={cn(
          "absolute inset-0 pointer-events-none",
          "bg-gradient-radial from-[#25D366]/30 via-[#25D366]/10 to-transparent",
          "blur-xl",
          isMobile ? "rounded-xl" : "rounded-2xl"
        )}
      />
    </motion.div>
  );
}

// Alternative compact version with Framer Motion
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

  const handleClick = () => {
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <motion.button
      ref={ref}
      onClick={handleClick}
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={inView ? { opacity: 1, scale: 1, y: 0 } : { opacity: 0, scale: 0.8, y: 20 }}
      whileHover={{ 
        scale: 1.05, 
        y: -2,
        transition: { type: "spring", stiffness: 400, damping: 17 }
      }}
      whileTap={{ 
        scale: 0.95,
        transition: { type: "spring", stiffness: 600, damping: 15 }
      }}
      transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
      className={cn(
        "fixed bottom-4 right-4 z-50",
        "w-12 h-12 rounded-xl",
        "bg-[#25D366] hover:bg-[#20BA5A]",
        "shadow-lg hover:shadow-xl",
        "flex items-center justify-center",
        "focus:outline-none focus:ring-2 focus:ring-green-400/50",
        className
      )}
      title={t("tooltip")}
      aria-label={t("tooltip")}
    >
      <Phone className="w-5 h-5 text-white" />
    </motion.button>
  );
}