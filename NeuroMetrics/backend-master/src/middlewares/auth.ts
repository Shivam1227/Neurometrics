/**
 * JWT authentication middleware.
 *
 * Validates incoming JWT bearer tokens and attaches the decoded payload
 * to the request object for downstream handlers.
 *
 * Usage:
 *   - Apply to protected routes
 *   - Throws AuthenticationError if token is missing, invalid, or expired
 */

import type { Request, Response, NextFunction } from "express";
import { verify } from "jsonwebtoken";
import config from "../config/config.js";
import {
  AuthenticationError,
  asyncHandler,
} from "./errorHandler.js";
import type { TokenPayload } from "../types/jwt.js";

/**
 * Extract and validate JWT from Authorization header
 */
function extractToken(authHeader: string | undefined): string {
  if (!authHeader) {
    throw new AuthenticationError("Missing authorization header");
  }

  const parts = authHeader.split(" ");

  if (parts.length !== 2) {
    throw new AuthenticationError("Invalid authorization header format");
  }

  const [scheme, token] = parts;

  if (scheme.toLowerCase() !== "bearer") {
    throw new AuthenticationError("Invalid authentication scheme");
  }

  return token;
}

/**
 * Middleware to verify JWT token
 */
export const authenticate = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction) => {
    const token = extractToken(req.headers.authorization);

    try {
      const payload = verify(token, config.JWT_SECRET) as TokenPayload;
      req.user = payload;
      next();
    } catch (err) {
      if (err instanceof Error) {
        if (err.name === "TokenExpiredError") {
          throw new AuthenticationError("Token has expired");
        } else if (err.name === "JsonWebTokenError") {
          throw new AuthenticationError("Invalid token");
        }
      }
      throw new AuthenticationError("Token verification failed");
    }
  }
);

/**
 * Optional authentication middleware
 * Attaches user if valid token provided, otherwise continues without user
 */
export const authenticateOptional = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return next();
    }

    try {
      const token = extractToken(authHeader);
      const payload = verify(token, config.JWT_SECRET) as TokenPayload;
      req.user = payload;
    } catch (err) {
      // Ignore errors in optional auth, just continue without user
    }

    next();
  }
);
