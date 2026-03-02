import { useCallback } from "react";

interface IndexNowOptions {
  action?: "updated" | "deleted";
  immediate?: boolean;
}

interface IndexNowResponse {
  success: boolean;
  message?: string;
  submittedUrls?: number;
  error?: string;
}

export function useIndexNow() {
  const submitUrls = useCallback(
    async (
      urls: string | string[],
      options: IndexNowOptions = {},
    ): Promise<IndexNowResponse> => {
      try {
        // Normalize URLs to array
        const urlArray = Array.isArray(urls) ? urls : [urls];

        // Validate URLs
        const validUrls = urlArray.filter((url) => {
          try {
            new URL(url);
            return url.startsWith("https://istanbulportrait.com");
          } catch {
            return false;
          }
        });

        if (validUrls.length === 0) {
          return {
            success: false,
            error: "No valid URLs provided",
          };
        }

        // Submit to our IndexNow API endpoint
        const response = await fetch("/api/indexnow", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            urls: validUrls,
            action: options.action || "updated",
          }),
        });

        const result = await response.json();

        return result;
      } catch (error) {
        // IndexNow submission error
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },
    [],
  );

  // Convenience methods for common use cases
  const notifyBookingCreated = useCallback(
    async (bookingId: string) => {
      const urls = [
        "https://istanbulportrait.com/en",
        "https://istanbulportrait.com/ar",
        "https://istanbulportrait.com/ru",
        "https://istanbulportrait.com/es",
      ];

      return submitUrls(urls, { action: "updated" });
    },
    [submitUrls],
  );

  const notifyPackageUpdated = useCallback(
    async (packageId?: string) => {
      const urls = [
        "https://istanbulportrait.com/en/packages",
        "https://istanbulportrait.com/ar/hazm",
        "https://istanbulportrait.com/ru/pakety",
        "https://istanbulportrait.com/es/paquetes",
      ];

      return submitUrls(urls, { action: "updated" });
    },
    [submitUrls],
  );

  const notifyContentUpdated = useCallback(
    async (path: string) => {
      const baseUrl = "https://istanbulportrait.com";
      const locales = ["en", "ar", "ru", "es"];

      // Map paths based on routing configuration
      const pathMappings: Record<string, Record<string, string>> = {
        "/packages": {
          en: "/packages",
          ar: "/hazm",
          ru: "/pakety",
          es: "/paquetes",
        },
        "/about": {
          en: "/about",
          ar: "/hawl",
          ru: "/o-nas",
          es: "/acerca",
        },
        "/contact": {
          en: "/contact",
          ar: "/ittisal",
          ru: "/kontakt",
          es: "/contacto",
        },
        "/checkout": {
          en: "/checkout",
          ar: "/dafa",
          ru: "/oplata",
          es: "/pago",
        },
      };

      const mapping = pathMappings[path];
      const urls = mapping
        ? locales.map((locale) => `${baseUrl}/${locale}${mapping[locale]}`)
        : locales.map((locale) => `${baseUrl}/${locale}${path}`);

      return submitUrls(urls, { action: "updated" });
    },
    [submitUrls],
  );

  const notifyPageDeleted = useCallback(
    async (urls: string | string[]) => {
      return submitUrls(urls, { action: "deleted" });
    },
    [submitUrls],
  );

  return {
    submitUrls,
    notifyBookingCreated,
    notifyPackageUpdated,
    notifyContentUpdated,
    notifyPageDeleted,
  };
}
