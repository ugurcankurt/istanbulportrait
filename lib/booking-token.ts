import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Server-only HMAC-SHA256 scoped access tokens to prevent unauthenticated IDOR
 * on draft booking hydration, checkout confirmation pages, and private Drive streams.
 */

function getSigningSecret(): string {
  const secret =
    process.env.BOOKING_TOKEN_SECRET ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!secret) {
    throw new Error(
      "Missing server signing secret (BOOKING_TOKEN_SECRET or SUPABASE_SERVICE_KEY)",
    );
  }

  return secret;
}

function signPayload(scope: string, expUnixSec: number): string {
  const secret = getSigningSecret();
  const data = `${scope}:${expUnixSec}`;
  const sig = createHmac("sha256", secret).update(data).digest("base64url");
  return `${expUnixSec}.${sig}`;
}

function verifyPayload(scope: string, token?: string | null): boolean {
  if (!token || typeof token !== "string") return false;
  const dotIdx = token.indexOf(".");
  if (dotIdx <= 0) return false;

  const expStr = token.slice(0, dotIdx);
  const sig = token.slice(dotIdx + 1);
  if (!sig || !/^\d+$/.test(expStr)) return false;

  const expUnixSec = Number.parseInt(expStr, 10);
  if (!Number.isFinite(expUnixSec) || Date.now() / 1000 > expUnixSec) {
    return false;
  }

  try {
    const secret = getSigningSecret();
    const expectedSig = createHmac("sha256", secret)
      .update(`${scope}:${expUnixSec}`)
      .digest("base64url");

    const sigBuf = Buffer.from(sig, "utf8");
    const expectedBuf = Buffer.from(expectedSig, "utf8");
    if (sigBuf.length !== expectedBuf.length) return false;
    return timingSafeEqual(sigBuf, expectedBuf);
  } catch {
    return false;
  }
}

export function signBookingToken(
  bookingId: string,
  purpose: "draft" | "success",
  ttlSeconds = purpose === "draft" ? 7 * 24 * 60 * 60 : 24 * 60 * 60,
): string {
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
  return signPayload(`booking:${purpose}:${bookingId}`, exp);
}

export function verifyBookingToken(
  bookingId: string,
  purpose: "draft" | "success",
  token?: string | null,
): boolean {
  if (!bookingId) return false;
  return verifyPayload(`booking:${purpose}:${bookingId}`, token);
}

export function signDriveToken(
  userId: string,
  bookingId: string,
  target: string,
  ttlSeconds = 6 * 60 * 60,
): string {
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
  return signPayload(`drive:${userId}:${bookingId}:${target}`, exp);
}

export function verifyDriveToken(
  userId: string,
  bookingId: string,
  target: string,
  token?: string | null,
): boolean {
  if (!userId || !bookingId || !target) return false;
  return verifyPayload(`drive:${userId}:${bookingId}:${target}`, token);
}
