/**
 * User validation schemas using Zod.
 *
 * Includes validators for:
 * - User registration (UserCreate)
 * - Login credentials (AuthRequest)
 * - User updates (UserUpdate)
 */

import { z } from "zod";

export const UserTypeSchema = z.enum(["participant", "tester", "admin"]);

/**
 * Schema for user registration
 */
export const UserCreateSchema = z.object({
  email: z.string().email("Invalid email address"),
  name: z.string().min(1, "Name is required").max(255, "Name too long"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  type: UserTypeSchema.optional().default("participant"),
  user_specific_info: z.record(z.string(), z.any()).nullable().optional(),
});

export type UserCreateRequest = z.infer<typeof UserCreateSchema>;

/**
 * Schema for login
 */
export const AuthRequestSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export type AuthRequest = z.infer<typeof AuthRequestSchema>;

/**
 * Schema for user update (partial)
 */
export const UserUpdateSchema = z.object({
  name: z.string().min(1, "Name is required").max(255, "Name too long").optional(),
  email: z.string().email("Invalid email address").optional(),
  type: UserTypeSchema.optional(),
  user_specific_info: z.record(z.string(), z.any()).nullable().optional(),
});

export type UserUpdateRequest = z.infer<typeof UserUpdateSchema>;
