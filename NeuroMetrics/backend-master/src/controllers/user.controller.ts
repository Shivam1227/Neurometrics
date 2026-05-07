/**
 * User controller - handles auth endpoints.
 *
 * Implements:
 * - POST /auth/register - User registration
 * - POST /auth/login - User login
 * - GET /users - List users
 * - GET /users/:id - Get user by ID
 * - PATCH /users/:id - Update user
 * - DELETE /users/:id - Delete user
 */

import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import * as userService from "../services/user.service.js";
import {
  UserCreateSchema,
  AuthRequestSchema,
  UserUpdateSchema,
} from "../validators/user.validator.js";
import {
  ValidationError,
  ConflictError,
  NotFoundError,
  AuthenticationError,
  asyncHandler,
} from "../middlewares/errorHandler.js";

/**
 * Register a new user
 * POST /auth/register
 */
export const register = asyncHandler(
  async (req: Request, res: Response) => {
    // Validate request
    let validatedData;
    try {
      validatedData = UserCreateSchema.parse(req.body);
    } catch (err) {
      if (err instanceof ZodError) {
        const messages = (err as any).issues
          .map((e: any) => `${e.path.join(".")}: ${e.message}`)
          .join(", ");
        throw new ValidationError("Invalid request body", messages);
      }
      throw err;
    }

    try {
      const user = await userService.registerUser(
        validatedData.email,
        validatedData.name,
        validatedData.password,
        validatedData.type,
        validatedData.user_specific_info
      );

      res.status(201).json({
        id: user.id,
        email: user.email,
        name: user.name,
        type: user.type,
        user_specific_info: user.user_specific_info,
        createdAt: user.createdAt,
      });
    } catch (err) {
      if (err instanceof Error && err.message.includes("already exists")) {
        throw new ConflictError(err.message);
      }
      throw err;
    }
  }
);

/**
 * Login user
 * POST /auth/login
 */
export const login = asyncHandler(
  async (req: Request, res: Response) => {
    // Validate request
    let validatedData;
    try {
      validatedData = AuthRequestSchema.parse(req.body);
    } catch (err) {
      if (err instanceof ZodError) {
        const messages = (err as any).issues
          .map((e: any) => `${e.path.join(".")}: ${e.message}`)
          .join(", ");
        throw new ValidationError("Invalid request body", messages);
      }
      throw err;
    }

    try {
      const authResponse = await userService.loginUser(
        validatedData.email,
        validatedData.password
      );

      res.status(200).json(authResponse);
    } catch (err) {
      if (err instanceof Error && err.message.includes("Invalid credentials")) {
        throw new AuthenticationError(err.message);
      }
      throw err;
    }
  }
);

/**
 * List all users
 * GET /users
 */
export const listUsers = asyncHandler(
  async (req: Request, res: Response) => {
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const offset = parseInt(req.query.offset as string) || 0;

    const result = await userService.listUsers(limit, offset);

    res.status(200).json(result);
  }
);

/**
 * Get user by ID
 * GET /users/:userId
 */
export const getUser = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = parseInt(req.params.userId);

    if (isNaN(userId)) {
      throw new ValidationError("Invalid user ID");
    }

    try {
      const user = await userService.getUserById(userId);
      res.status(200).json(user);
    } catch (err) {
      if (err instanceof Error && err.message.includes("not found")) {
        throw new NotFoundError("User");
      }
      throw err;
    }
  }
);

/**
 * Update user
 * PATCH /users/:userId
 */
export const updateUser = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = parseInt(req.params.userId);

    if (isNaN(userId)) {
      throw new ValidationError("Invalid user ID");
    }

    // Validate request
    let validatedData;
    try {
      validatedData = UserUpdateSchema.parse(req.body);
    } catch (err) {
      if (err instanceof ZodError) {
        const messages = (err as any).issues
          .map((e: any) => `${e.path.join(".")}: ${e.message}`)
          .join(", ");
        throw new ValidationError("Invalid request body", messages);
      }
      throw err;
    }

    try {
      const user = await userService.updateUser(userId, validatedData);
      res.status(200).json(user);
    } catch (err) {
      if (err instanceof Error && err.message.includes("not found")) {
        throw new NotFoundError("User");
      } else if (err instanceof Error && err.message.includes("already in use")) {
        throw new ConflictError(err.message);
      }
      throw err;
    }
  }
);

/**
 * Delete user
 * DELETE /users/:userId
 */
export const deleteUser = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = parseInt(req.params.userId);

    if (isNaN(userId)) {
      throw new ValidationError("Invalid user ID");
    }

    try {
      await userService.deleteUser(userId);
      res.status(204).send();
    } catch (err) {
      if (err instanceof Error && err.message.includes("not found")) {
        throw new NotFoundError("User");
      }
      throw err;
    }
  }
);
