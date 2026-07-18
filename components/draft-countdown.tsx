"use client";

import { useEffect, useState } from "react";
import { Timer } from "lucide-react";
import { cn } from "@/lib/utils";

interface DraftCountdownProps {
  addedAt: string;
  onExpire: () => void;
  className?: string;
  label?: string;
}

export function DraftCountdown({ addedAt, onExpire, className, label = "We'll hold your spot for [TIME] minutes." }: DraftCountdownProps) {
  const [timeLeft, setTimeLeft] = useState<number>(10 * 60);
  const [isExpired, setIsExpired] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const calculateTimeLeft = () => {
      const addedTime = new Date(addedAt).getTime();
      const expirationTime = addedTime + 10 * 60 * 1000; // 10 minutes
      const now = Date.now();
      return Math.max(0, Math.floor((expirationTime - now) / 1000));
    };

    const initialTimeLeft = calculateTimeLeft();
    setTimeLeft(initialTimeLeft);

    if (initialTimeLeft <= 0 && !isExpired) {
      setIsExpired(true);
      onExpire();
      return;
    }

    const interval = setInterval(() => {
      const remaining = calculateTimeLeft();
      setTimeLeft(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        if (!isExpired) {
          setIsExpired(true);
          onExpire();
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [addedAt, onExpire, isExpired]);

  if (!mounted || isExpired || timeLeft <= 0) {
    return null;
  }

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeString = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

  // Split label to bold the [TIME] part
  const renderLabel = () => {
    if (!label.includes("[TIME]")) {
      return <span>{label} {timeString}</span>;
    }
    const parts = label.split("[TIME]");
    return (
      <>
        {parts[0]}
        <span className="font-bold">{timeString}</span>
        {parts[1]}
      </>
    );
  };

  return (
    <div className={cn(
      "flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors duration-500",
      "bg-[#FFF0F3] border-[#FFE4E4] text-[#1B1B1B]",
      className
    )}>
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-full bg-white/80 flex items-center justify-center shadow-sm">
          <Timer className="w-5 h-5 text-[#E11D48]" />
        </div>
        <span className="text-sm font-medium leading-tight">
          {renderLabel()}
        </span>
      </div>
    </div>
  );
}
