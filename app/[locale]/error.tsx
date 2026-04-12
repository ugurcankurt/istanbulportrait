"use client";

import { useEffect } from "react";
import { ErrorContent } from "@/components/error-content";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return <ErrorContent error={error} reset={reset} />;
}
