/**
 * Client- and Server-safe Web Crypto hashing helpers for Meta Conversions API & Advanced Matching.
 * Kept isolated from server-only service modules so client components never pull supabaseAdmin/next/cache.
 */

export async function hashCustomerData(value: string): Promise<string> {
  if (!value) return "";

  const normalized = value.toLowerCase().trim();

  if (
    !normalized ||
    normalized === "undefined" ||
    normalized === "null" ||
    normalized === "none"
  ) {
    return "";
  }

  const msgUint8 = new TextEncoder().encode(normalized);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function hashPhoneNumber(phone: string): Promise<string> {
  if (!phone) return "";

  const trimmed = phone.trim();
  let digitsOnly = trimmed.replace(/\D/g, "");

  if (!digitsOnly || digitsOnly.length < 7) return "";

  if (trimmed.startsWith("+")) {
    // E.164 — country code already present
  } else if (digitsOnly.startsWith("00")) {
    digitsOnly = digitsOnly.slice(2);
  } else if (digitsOnly.startsWith("0")) {
    // Local Turkish format (05xx...) — drop trunk prefix, add country code
    digitsOnly = `90${digitsOnly.slice(1)}`;
  } else if (digitsOnly.length === 10) {
    // National number without country code (Turkey)
    digitsOnly = `90${digitsOnly}`;
  }

  return await hashCustomerData(digitsOnly);
}
