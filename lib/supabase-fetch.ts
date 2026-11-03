/**
 * Resilient fetch wrapper with automatic retry for Vercel Serverless / Node.js 22.
 * Resolves stale TCP socket errors (undici "fetch failed" / ECONNRESET).
 */
export const fetchWithRetry: typeof fetch = async (input, init) => {
  let attempts = 0;
  const maxAttempts = 2;
  while (attempts < maxAttempts) {
    try {
      return await fetch(input, init);
    } catch (err: any) {
      attempts++;
      if (attempts >= maxAttempts) throw err;
      // Stale socket or transient network glitch in serverless: wait 120ms and retry with clean socket
      await new Promise((r) => setTimeout(r, 120));
    }
  }
  return fetch(input, init);
};
