"use client";

import { createContext, useContext, useEffect, useState } from "react";
import {
  type ConsentData,
  clearConsentCookie,
  getConsentCookie,
  setConsentCookie,
} from "@/app/actions/consent";
import { logConsentEvent } from "@/app/actions/log-consent";

export type ConsentChoice = "accepted_all" | "essential_only" | null;

interface ConsentContextType {
  consent: ConsentChoice;
  setConsent: (choice: ConsentChoice) => Promise<void>;
  isLoading: boolean;
}

const ConsentContext = createContext<ConsentContextType | undefined>(undefined);

export function ConsentProvider({ children }: { children: React.ReactNode }) {
  const [consent, setConsentState] = useState<ConsentChoice>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load consent from httpOnly cookie on mount
  useEffect(() => {
    async function loadConsent() {
      try {
        const consentData = await getConsentCookie();

        if (consentData) {
          setConsentState(consentData.consent);
        }
      } catch (error) {
        console.error("Error loading consent:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadConsent();
  }, []);

  // Save to httpOnly cookie when changed
  const setConsent = async (choice: ConsentChoice) => {
    setConsentState(choice);

    try {
      if (choice) {
        // Set the httpOnly cookie via Server Action
        await setConsentCookie(choice);

        // Log consent event for GDPR audit trail
        const userAgent =
          typeof navigator !== "undefined" ? navigator.userAgent : undefined;
        const logResult = await logConsentEvent(choice, userAgent);

        if (!logResult.success) {
          console.warn("Failed to log consent event:", logResult.error);
          // Don't block consent flow if logging fails
        }

        // Update Google Analytics consent mode
        if (typeof window !== "undefined" && window.gtag) {
          if (choice === "accepted_all") {
            window.gtag("consent", "update", {
              analytics_storage: "granted",
              ad_storage: "granted",
              ad_user_data: "granted",
              ad_personalization: "granted",
            });
          } else if (choice === "essential_only") {
            window.gtag("consent", "update", {
              analytics_storage: "granted",
              ad_storage: "denied",
              ad_user_data: "denied",
              ad_personalization: "denied",
            });
          }
        }
      } else {
        // Clear the cookie if consent is withdrawn
        await clearConsentCookie();

        // Deny all tracking
        if (typeof window !== "undefined" && window.gtag) {
          window.gtag("consent", "update", {
            analytics_storage: "denied",
            ad_storage: "denied",
            ad_user_data: "denied",
            ad_personalization: "denied",
          });
        }
      }
    } catch (error) {
      console.error("Error setting consent:", error);
    }
  };

  return (
    <ConsentContext.Provider value={{ consent, setConsent, isLoading }}>
      {children}
    </ConsentContext.Provider>
  );
}

export function useConsent() {
  const context = useContext(ConsentContext);
  if (!context) {
    throw new Error("useConsent must be used within ConsentProvider");
  }
  return context;
}
