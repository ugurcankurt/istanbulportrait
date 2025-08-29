import type { ApiError, DatabaseError } from "./supabase";

export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = "INTERNAL_ERROR",
    isOperational: boolean = true,
  ) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.name = "AppError";

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, _details?: unknown) {
    super(message, 400, "VALIDATION_ERROR");
    this.name = "ValidationError";
  }
}

export class RateLimitError extends AppError {
  constructor(_retryAfter: number) {
    super(
      "Too many requests. Please try again later.",
      429,
      "RATE_LIMIT_EXCEEDED",
    );
    this.name = "RateLimitError";
  }
}

export class PaymentError extends AppError {
  constructor(message: string, code?: string) {
    super(message, 402, code || "PAYMENT_FAILED");
    this.name = "PaymentError";
  }
}

export class DatabaseConnectionError extends AppError {
  constructor(_originalError?: unknown) {
    super(
      "Database connection failed. Please try again later.",
      503,
      "DATABASE_ERROR",
    );
    this.name = "DatabaseConnectionError";
  }
}

export function handleSupabaseError(error: unknown): DatabaseError {
  if (error && typeof error === "object" && "message" in error) {
    const supabaseError = error as {
      message: string;
      code?: string;
      details?: string;
    };
    return {
      message: supabaseError.message || "Database operation failed",
      code: supabaseError.code,
      details: supabaseError.details,
    };
  }

  return {
    message: "Unknown database error occurred",
    code: "UNKNOWN_ERROR",
  };
}

export function createApiError(
  error: AppError | Error | unknown,
  isDevelopment: boolean = false,
): ApiError {
  if (error instanceof AppError) {
    return {
      error: error.message,
      code: error.statusCode,
      details: isDevelopment ? error.stack : undefined,
    };
  }

  if (error instanceof Error) {
    return {
      error: isDevelopment ? error.message : "Internal server error",
      code: 500,
      details: isDevelopment ? error.stack : undefined,
    };
  }

  return {
    error: "An unexpected error occurred",
    code: 500,
    details: isDevelopment ? String(error) : undefined,
  };
}

export function sanitizeErrorForProduction(error: unknown): string {
  // Never expose sensitive information in production
  const _safeMessages = [
    "Invalid request data",
    "Resource not found",
    "Authentication required",
    "Permission denied",
    "Service temporarily unavailable",
    "Invalid payment information",
    "Booking not found",
    "Package not available",
  ];

  if (error instanceof AppError && error.isOperational) {
    return error.message;
  }

  // Return generic message for unexpected errors
  return "An error occurred while processing your request";
}

export function logError(
  error: unknown,
  context?: Record<string, unknown>,
): void {
  const timestamp = new Date().toISOString();
  const errorInfo = {
    timestamp,
    error:
      error instanceof Error
        ? {
            name: error.name,
            message: error.message,
            stack: error.stack,
          }
        : error,
    context,
  };

  if (process.env.NODE_ENV === "development") {
    console.error("🚨 Error:", errorInfo);
  } else {
    // In production, only log essential info
    console.error("Error occurred:", {
      timestamp,
      message: error instanceof Error ? error.message : "Unknown error",
      context: context?.type || "unknown",
    });
  }
}
