"use server";

import { createHash } from "node:crypto";
import { createServerAdminClient } from "@/lib/auth-server";

/**
 * Hashes a string using SHA-256 for privacy
 * @param input - String to hash
 * @returns Hashed string
 */
function hashString(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

/**
 * Logs a consent event to Supabase for GDPR compliance audit trail
 * @param consent - User's consent choice
 * @param userAgent - Browser user agent string
 * @param ipAddress - User's IP address (will be hashed)
 * @returns Success status
 */
export async function logConsentEvent(
  consent: "accepted_all" | "essential_only",
  userAgent?: string,
  ipAddress?: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createServerAdminClient();

    // Hash IP address for privacy (GDPR requirement)
    const hashedIp = ipAddress ? hashString(ipAddress) : null;

    // Use hashed IP as identifier, or generate a random one if not available
    const userIdentifier = hashedIp || hashString(Date.now().toString());

    const { error } = await supabase.from("consent_logs").insert({
      user_identifier: userIdentifier,
      consent_choice: consent,
      consent_version: "1.0", // Update this when consent policy changes
      user_agent: userAgent || null,
      ip_address: hashedIp,
    });

    if (error) {
      console.error("Error logging consent event:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Unexpected error logging consent:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Gets consent logs for a specific user identifier (admin only)
 * @param userIdentifier - Hashed user identifier
 * @returns Array of consent logs
 */
export async function getConsentLogs(userIdentifier: string) {
  try {
    const supabase = await createServerAdminClient();

    const { data, error } = await supabase
      .from("consent_logs")
      .select("*")
      .eq("user_identifier", userIdentifier)
      .order("timestamp", { ascending: false });

    if (error) {
      console.error("Error fetching consent logs:", error);
      return { success: false, error: error.message, data: null };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Unexpected error fetching consent logs:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      data: null,
    };
  }
}
