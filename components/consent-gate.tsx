"use client";

import { type ConsentChoice, useConsent } from "@/contexts/consent-context";

interface ConsentGateProps {
  consent: Exclude<ConsentChoice, null>;
  children: React.ReactNode;
}

/**
 * ConsentGate component - Only renders children if user has given required consent
 * This ensures GDPR compliance by preventing tracking scripts from loading without consent
 */
export function ConsentGate({ consent, children }: ConsentGateProps) {
  const { consent: userConsent, isLoading } = useConsent();

  // Don't render while loading to prevent flash of content
  if (isLoading) {
    return null;
  }

  // Only render if user gave required consent
  if (userConsent === consent) {
    return <>{children}</>;
  }

  // No consent or wrong consent level - don't render tracking scripts
  return null;
}
