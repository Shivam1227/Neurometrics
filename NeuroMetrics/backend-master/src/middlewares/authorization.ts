/**
 * Authorization middleware for role-based access control.
 *
 * Provides middleware functions to check user roles:
 * - requireAdmin - Only allows users with admin role
 * - requireTesterOrAdmin - Allows tester and admin roles
 * - requireSelfOrAdmin - Allows user to modify themselves or admin can modify anyone
 */

import type { Request, Response, NextFunction } from "express";
import { AuthorizationError, asyncHandler } from "./errorHandler.js";

/**
 * Require admin role
 */
export const requireAdmin = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AuthorizationError("User not authenticated");
    }

    // Extract user type from token payload
    // The user type should be included in the JWT payload
    const userType = (req.user as any).type;

    if (userType !== "admin") {
      throw new AuthorizationError("Admin role required");
    }

    next();
  }
);

/**
 * Require tester or admin role
 */
export const requireTesterOrAdmin = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AuthorizationError("User not authenticated");
    }

    const userType = (req.user as any).type;

    if (userType !== "tester" && userType !== "admin") {
      throw new AuthorizationError("Tester or admin role required");
    }

    next();
  }
);

/**
 * Require user to be modifying themselves OR be admin
 */
export const requireSelfOrAdmin = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AuthorizationError("User not authenticated");
    }

    const userType = (req.user as any).type;
    const userId = parseInt(req.params.userId);
    const tokenUserId = parseInt((req.user as any).sub);

    if (userType !== "admin" && tokenUserId !== userId) {
      throw new AuthorizationError(
        "You can only modify your own profile or be an admin"
      );
    }

    next();
  }
);
