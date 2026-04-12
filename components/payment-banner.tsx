"use client";

import { Calendar, Package } from "lucide-react";
import { useEffect, useState } from "react";

interface RecentBooking {
  firstName: string;
  packageId: string;
  bookingDate: string;
  createdAt: string;
}

const packageLabels: Record<string, string> = {
  essential: "Essential",
  premium: "Premium",
  luxury: "Luxury",
  rooftop: "Rooftop",
};

export function PaymentBanner() {
  const [bookings, setBookings] = useState<RecentBooking[]>([]);

  useEffect(() => {
    fetch("/api/recent-bookings")
      .then((res) => res.json())
      .then((data) => {
        if (data.bookings && data.bookings.length > 0) {
          setBookings(data.bookings);
        }
      })
      .catch((error) => {
        console.error("Error fetching bookings:", error);
      });
  }, []);

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const getTimeAgo = (createdAt: string) => {
    const now = new Date();
    const created = new Date(createdAt);
    const diffMs = now.getTime() - created.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return "just now";
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatDate(createdAt);
  };

  // Don't render if no bookings
  if (bookings.length === 0) {
    return null;
  }

  return (
    <div className="bg-primary/5 border-b border-primary/10 overflow-hidden">
      <div className="w-full py-1.5 px-4 sm:px-6 lg:px-8">
        <div className="relative flex overflow-hidden">
          {/* First set of bookings */}
          <div className="animate-marquee flex gap-6 md:gap-8 whitespace-nowrap shrink-0">
            {bookings.map((booking, index) => (
              <div
                key={`set1-${index}`}
                className="inline-flex items-center gap-2 text-xs sm:text-sm text-muted-foreground"
              >
                <span className="text-primary">✨</span>
                <span className="font-semibold text-foreground">
                  {booking.firstName}
                </span>
                <span className="text-muted-foreground">booked</span>
                <span className="inline-flex items-center gap-1 font-medium text-primary">
                  <Package className="w-3 h-3" />
                  {packageLabels[booking.packageId] || booking.packageId}
                </span>
                <span className="inline-flex items-center gap-1 text-muted-foreground">
                  <Calendar className="w-3 h-3" />
                  {formatDate(booking.bookingDate)}
                </span>
                <span className="text-xs text-muted-foreground/60">
                  ({getTimeAgo(booking.createdAt)})
                </span>
              </div>
            ))}
          </div>
          {/* Second set of bookings (duplicate for seamless loop) */}
          <div className="animate-marquee flex gap-6 md:gap-8 whitespace-nowrap shrink-0">
            {bookings.map((booking, index) => (
              <div
                key={`set2-${index}`}
                className="inline-flex items-center gap-2 text-xs sm:text-sm text-muted-foreground"
              >
                <span className="text-primary">✨</span>
                <span className="font-semibold text-foreground">
                  {booking.firstName}
                </span>
                <span className="text-muted-foreground">booked</span>
                <span className="inline-flex items-center gap-1 font-medium text-primary">
                  <Package className="w-3 h-3" />
                  {packageLabels[booking.packageId] || booking.packageId}
                </span>
                <span className="inline-flex items-center gap-1 text-muted-foreground">
                  <Calendar className="w-3 h-3" />
                  {formatDate(booking.bookingDate)}
                </span>
                <span className="text-xs text-muted-foreground/60">
                  ({getTimeAgo(booking.createdAt)})
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-100%);
          }
        }

        .animate-marquee {
          animation: marquee 60s linear infinite;
        }

        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}
