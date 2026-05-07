/**
 * Global error handling middleware.
 *
 * Catches errors thrown by route handlers and middleware,
 * and returns standardized error responses.
 */

import type { Request, Response, NextFunction } from "express";

export interface ApiError extends Error {
  statusCode?: number;
  details?: string;
}

export class AppError extends Error implements ApiError {
  statusCode: number;
  details?: string;

  constructor(
    message: string,
    statusCode: number = 500,
    details?: string
  ) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Validation error for request body/params validation
 */
export class ValidationError extends AppError {
  constructor(message: string, details?: string) {
    super(message, 400, details);
  }
}

/**
 * Authentication error for invalid credentials
 */
export class AuthenticationError extends AppError {
  constructor(message: string = "Authentication failed") {
    super(message, 401);
  }
}

/**
 * Authorization error for insufficient permissions
 */
export class AuthorizationError extends AppError {
  constructor(message: string = "Insufficient permissions") {
    super(message, 403);
  }
}

/**
 * Not found error for missing resources
 */
export class NotFoundError extends AppError {
  constructor(resource: string = "Resource") {
    super(`${resource} not found`, 404);
  }
}

/**
 * Conflict error for duplicate resources
 */
export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409);
  }
}

/**
 * Error handler middleware
 */
export const errorHandler = (
  err: Error | ApiError,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  // Log error
  console.error("Error:", err);

  // Default error response
  let statusCode = 500;
  let message = "Internal server error";
  let details: string | undefined;

  // Handle custom app errors
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    details = err.details;
  } else if (err instanceof Error) {
    // Handle known errors
    if (err.message.includes("not found")) {
      statusCode = 404;
      message = err.message;
    } else if (err.message.includes("already exists")) {
      statusCode = 409;
      message = err.message;
    } else if (err.message.includes("Invalid credentials")) {
      statusCode = 401;
      message = err.message;
    } else {
      message = err.message;
    }
  }

  res.status(statusCode).json({
    error: {
      message,
      details,
      statusCode,
    },
  });
};

/**
 * Async route handler wrapper to catch errors
 */
export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
