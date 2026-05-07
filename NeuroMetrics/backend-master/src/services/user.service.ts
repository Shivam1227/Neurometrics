/**
 * User service layer.
 *
 * Handles business logic for user operations:
 * - Creating/registering users
 * - Authenticating users (password verification)
 * - JWT token generation
 * - Fetching user data
 */

import prisma from "../db/client.js";
import { sign } from "jsonwebtoken";
import config from "../config/config.js";
import type { TokenPayload } from "../types/jwt.js";

// Use dynamic import for crypto (works in Bun)
const crypto = await import("crypto");

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: {
    id: number;
    email: string;
    name: string;
    type: string;
    user_specific_info: Record<string, any> | null;
    createdAt: Date;
  };
}

/**
 * Hash a password using PBKDF2 (sync)
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(32);
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, "sha256");
  return salt.toString("hex") + ":" + hash.toString("hex");
}

/**
 * Verify a password against a stored hash (sync)
 */
export function verifyPassword(password: string, hash: string): boolean {
  const [salt, storedHash] = hash.split(":");
  const hashOfInput = crypto.pbkdf2Sync(
    password,
    Buffer.from(salt, "hex"),
    100000,
    64,
    "sha256"
  );
  return hashOfInput.toString("hex") === storedHash;
}

/**
 * Generate a JWT token for the user
 */
export function generateToken(userId: number, email: string, userType: string): string {
  const payload: TokenPayload = {
    sub: userId.toString(),
    email,
    type: userType,
  };

  return sign(payload, config.JWT_SECRET, {
    expiresIn: config.JWT_EXPIRES_IN,
  } as any);
}

/**
 * Register a new user
 */
export async function registerUser(
  email: string,
  name: string,
  password: string,
  type: string = "participant",
  user_specific_info: Record<string, any> | null = null
) {
  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new Error("User with this email already exists");
  }

  // Hash password
  const hashedPassword = hashPassword(password);

  // Create user
  const user = await prisma.user.create({
    data: {
      email,
      name,
      password: hashedPassword,
      type: type as any,
      user_specific_info: user_specific_info as any,
    },
  });

  return user;
}

/**
 * Login user (authenticate with email and password)
 */
export async function loginUser(
  email: string,
  password: string
): Promise<AuthResponse> {
  // Find user
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new Error("Invalid credentials");
  }

  // Verify password
  if (!user.password || !verifyPassword(password, user.password)) {
    throw new Error("Invalid credentials");
  }

  // Generate token
  const token = generateToken(user.id, user.email, user.type);

  return {
    access_token: token,
    token_type: "bearer",
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      type: user.type,
      user_specific_info: user.user_specific_info as Record<string, any> | null,
      createdAt: user.createdAt,
    },
  };
}

/**
 * Get user by ID
 */
export async function getUserById(userId: number) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error("User not found");
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    type: user.type,
    user_specific_info: user.user_specific_info as Record<string, any> | null,
    createdAt: user.createdAt,
  };
}

/**
 * List users (with pagination)
 */
export async function listUsers(limit: number = 50, offset: number = 0) {
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      take: limit,
      skip: offset,
      select: {
        id: true,
        email: true,
        name: true,
        type: true,
        user_specific_info: true,
        createdAt: true,
      },
    }),
    prisma.user.count(),
  ]);

  return {
    items: users.map((u) => ({
      ...u,
      user_specific_info: u.user_specific_info as Record<string, any> | null,
    })),
    total,
    limit,
    offset,
  };
}

/**
 * Update user
 */
export async function updateUser(
  userId: number,
  data: {
    name?: string;
    email?: string;
    type?: string;
    user_specific_info?: Record<string, any> | null;
  }
) {
  // Check if email is being updated and already exists
  if (data.email) {
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser && existingUser.id !== userId) {
      throw new Error("Email already in use");
    }
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.email !== undefined && { email: data.email }),
      ...(data.type !== undefined && { type: data.type as any }),
      ...(data.user_specific_info !== undefined && {
        user_specific_info: data.user_specific_info as any,
      }),
    },
  });

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    type: user.type,
    user_specific_info: user.user_specific_info as Record<string, any> | null,
    createdAt: user.createdAt,
  };
}

/**
 * Delete user
 */
export async function deleteUser(userId: number) {
  await prisma.user.delete({
    where: { id: userId },
  });
}
