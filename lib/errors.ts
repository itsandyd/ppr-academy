/**
 * Error Handling Infrastructure
 * 
 * Provides standardized error classes and utilities for consistent error handling
 * across the application. All custom errors include:
 * - Human-readable error messages
 * - Machine-readable error codes
 * - HTTP status codes
 * - Optional metadata for debugging
 */

export interface ErrorMetadata {
  [key: string]: any;
}

/**
 * Base API Error class
 * All custom errors should extend this class
 */
export class APIError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 500,
    public readonly metadata?: ErrorMetadata
  ) {
    super(message);
    this.name = this.constructor.name;
    
    // Maintains proper stack trace for where error was thrown (V8 only)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      metadata: this.metadata,
    };
  }
}

/**
 * Resource Not Found Error
 * Used when a requested resource doesn't exist
 */
export class NotFoundError extends APIError {
  constructor(resource: string, identifier?: string, metadata?: ErrorMetadata) {
    const message = identifier
      ? `${resource} with identifier '${identifier}' not found`
      : `${resource} not found`;
    super(message, "NOT_FOUND", 404, metadata);
  }
}

/**
 * Unauthorized Error
 * Used when user is not authenticated
 */
export class UnauthorizedError extends APIError {
  constructor(message: string = "Authentication required", metadata?: ErrorMetadata) {
    super(message, "UNAUTHORIZED", 401, metadata);
  }
}

/**
 * Forbidden Error
 * Used when user is authenticated but doesn't have permission
 */
export class ForbiddenError extends APIError {
  constructor(message: string = "Access denied", metadata?: ErrorMetadata) {
    super(message, "FORBIDDEN", 403, metadata);
  }
}

/**
 * Validation Error
 * Used when input validation fails
 */
export class ValidationError extends APIError {
  constructor(message: string, metadata?: ErrorMetadata) {
    super(message, "VALIDATION_ERROR", 400, metadata);
  }
}

/**
 * Conflict Error
 * Used when there's a conflict with existing data (e.g., duplicate purchase)
 */
export class ConflictError extends APIError {
  constructor(message: string, metadata?: ErrorMetadata) {
    super(message, "CONFLICT", 409, metadata);
  }
}

/**
 * Rate Limit Error
 * Used when user exceeds rate limits
 */
export class RateLimitError extends APIError {
  constructor(
    message: string = "Too many requests. Please try again later.",
    metadata?: ErrorMetadata
  ) {
    super(message, "RATE_LIMIT_EXCEEDED", 429, metadata);
  }
}

/**
 * Payment Error
 * Used for payment-related errors
 */
export class PaymentError extends APIError {
  constructor(message: string, metadata?: ErrorMetadata) {
    super(message, "PAYMENT_ERROR", 402, metadata);
  }
}

/**
 * External Service Error
 * Used when external service (Stripe, OpenAI, etc.) fails
 */
export class ExternalServiceError extends APIError {
  constructor(service: string, message: string, metadata?: ErrorMetadata) {
    super(`${service} error: ${message}`, "EXTERNAL_SERVICE_ERROR", 503, metadata);
  }
}

/**
 * Helper function to check if an error is an instance of APIError
 */
export function isAPIError(error: unknown): error is APIError {
  return error instanceof APIError;
}

/**
 * Format error for client response
 * Sanitizes error information to avoid leaking sensitive data
 */
export function formatErrorResponse(error: unknown) {
  if (isAPIError(error)) {
    return {
      error: {
        message: error.message,
        code: error.code,
        statusCode: error.statusCode,
        ...(process.env.NODE_ENV === 'development' && { 
          metadata: error.metadata,
          stack: error.stack 
        })
      }
    };
  }

  // For unknown errors, return a generic message
  return {
    error: {
      message: "An unexpected error occurred",
      code: "INTERNAL_SERVER_ERROR",
      statusCode: 500,
      ...(process.env.NODE_ENV === 'development' && {
        originalError: error instanceof Error ? error.message : String(error)
      })
    }
  };
}

/**
 * Error handler for Convex mutations/queries
 * Wraps async handlers and provides consistent error handling
 */
export function withErrorHandling<T extends (...args: any[]) => Promise<any>>(
  handler: T
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await handler(...args);
    } catch (error) {
      // Log the error
      console.error('Error in handler:', error);
      
      // Re-throw API errors as-is
      if (isAPIError(error)) {
        throw error;
      }

      // Convert unknown errors to generic API errors
      const message = error instanceof Error ? error.message : "Unknown error";
      throw new APIError(message, "INTERNAL_SERVER_ERROR", 500);
    }
  }) as T;
}


