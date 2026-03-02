"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        {/* We need to wrap with NextIntlClientProvider because global-error replaces the root layout */}
        {/* Note: In a real global error scenario, we might not have access to messages or locale, 
            so we might want to fallback to English or hardcoded strings if this fails. 
            For now, we'll try to use the component which relies on intl. */}
        <div className="flex min-h-screen flex-col items-center justify-center">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold">Something went wrong!</h1>
            <p className="text-muted-foreground">Global Error caught.</p>
            <button
              type="button"
              onClick={() => reset()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
