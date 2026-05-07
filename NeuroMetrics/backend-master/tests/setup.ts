/**
 * Test setup and utilities.
 *
 * Configures:
 * - Database cleanup between tests
 * - Test user creation helpers
 * - Authentication token generation
 */

import "dotenv/config";
import { beforeAll, afterEach, afterAll, vi } from "vitest";
import prisma from "../src/db/client.js";
import * as userService from "../src/services/user.service.js";

/**
 * Clean up database before and after each test
 */
export async function cleanDatabase() {
  try {
    // Delete in correct order due to foreign keys
    await prisma.responseMedia.deleteMany({});
    await prisma.response.deleteMany({});
    await prisma.attempt.deleteMany({});
    await prisma.questionMedia.deleteMany({});
    await prisma.optionMedia.deleteMany({});
    await prisma.option.deleteMany({});
    await prisma.question.deleteMany({});
    await prisma.section.deleteMany({});
    await prisma.test.deleteMany({});
    await prisma.user.deleteMany({});
  } catch (error) {
    console.error("Error cleaning database:", error);
  }
}

/**
 * Generate unique email for tests
 */
function generateUniqueEmail(prefix: string): string {
  return `${prefix}.${Date.now()}.${Math.random().toString(36).slice(2, 9)}@example.com`;
}

/**
 * Create a test user
 */
export async function createTestUser(data?: {
  email?: string;
  name?: string;
  password?: string;
  type?: string;
}) {
  return await userService.registerUser(
    data?.email || generateUniqueEmail("test"),
    data?.name || "Test User",
    data?.password || "password123",
    data?.type || "participant"
  );
}

/**
 * Create admin user
 */
export async function createAdminUser() {
  return await createTestUser({
    email: generateUniqueEmail("admin"),
    name: "Admin User",
    password: "admin123",
    type: "admin",
  });
}

/**
 * Create tester user
 */
export async function createTesterUser() {
  return await createTestUser({
    email: generateUniqueEmail("tester"),
    name: "Tester User",
    password: "tester123",
    type: "tester",
  });
}

/**
 * Generate auth token for user
 */
export async function getAuthToken(user: any): Promise<string> {
  return userService.generateToken(user.id, user.email, user.type);
}

/**
 * Global test setup
 */
beforeAll(async () => {
  // Ensure database is clean before running tests
  await cleanDatabase();
});

/**
 * Clean database after each test
 * Note: Commenting out to prevent race conditions with async test execution.
 * Tests rely on unique email generation and explicit database cleanup in fixtures.
 *
 * afterEach(async () => {
 *   await cleanDatabase();
 * });
 */

/**
 * Global test teardown
 */
afterAll(async () => {
  await prisma.$disconnect();
});
