/**
 * Authentication endpoints tests.
 *
 * Tests:
 * - POST /auth/register
 * - POST /auth/login
 */

import { describe, it, expect } from "vitest";
import request from "supertest";
import createApp from "../src/app.js";
import { cleanDatabase, createTestUser, getAuthToken } from "./setup.js";

/**
 * Generate unique email for tests
 */
function generateUniqueEmail(prefix: string): string {
  return `${prefix}.${Date.now()}.${Math.random().toString(36).slice(2, 9)}@example.com`;
}

const app = createApp();

describe("Auth Endpoints", () => {
  describe("POST /auth/register", () => {
    it("should register a new user successfully", async () => {
      const response = await request(app)
        .post("/v1/auth/register")
        .send({
          email: generateUniqueEmail("newuser"),
          name: "New User",
          password: "password123",
          type: "participant",
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("id");
      expect(response.body.name).toBe("New User");
      expect(response.body.type).toBe("participant");
      expect(response.body).not.toHaveProperty("password");
    });

    it("should fail with invalid email", async () => {
      const response = await request(app)
        .post("/v1/auth/register")
        .send({
          email: "invalid-email",
          name: "Test User",
          password: "password123",
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    it("should fail with short password", async () => {
      const response = await request(app)
        .post("/v1/auth/register")
        .send({
          email: generateUniqueEmail("test"),
          name: "Test User",
          password: "123",
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    it("should fail with duplicate email", async () => {
      const email = generateUniqueEmail("duplicate");
      // Create first user
      await createTestUser({ email });

      // Try to create another with same email
      const response = await request(app)
        .post("/v1/auth/register")
        .send({
          email,
          name: "Another User",
          password: "password123",
        });

      expect(response.status).toBe(409);
      expect(response.body.error.message).toContain("already exists");
    });

    it("should set default type to participant", async () => {
      const response = await request(app)
        .post("/v1/auth/register")
        .send({
          email: generateUniqueEmail("user"),
          name: "Test User",
          password: "password123",
        });

      expect(response.status).toBe(201);
      expect(response.body.type).toBe("participant");
    });

    it("should accept user_specific_info", async () => {
      const response = await request(app)
        .post("/v1/auth/register")
        .send({
          email: generateUniqueEmail("user"),
          name: "Test User",
          password: "password123",
          user_specific_info: { organization: "Test Org" },
        });

      expect(response.status).toBe(201);
      expect(response.body.user_specific_info).toEqual({ organization: "Test Org" });
    });
  });

  describe("POST /auth/login", () => {
    it("should login successfully with correct credentials", async () => {
      const user = await createTestUser({
        password: "password123",
      });

      const response = await request(app)
        .post("/v1/auth/login")
        .send({
          email: user.email,
          password: "password123",
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("access_token");
      expect(response.body.token_type).toBe("bearer");
      expect(response.body.user.id).toBe(user.id);
      expect(response.body.user.email).toBe(user.email);
    });

    it("should return valid JWT token", async () => {
      const user = await createTestUser({
        password: "password123",
      });

      const response = await request(app)
        .post("/v1/auth/login")
        .send({
          email: user.email,
          password: "password123",
        });

      expect(response.status).toBe(200);
      const token = response.body.access_token;
      expect(token).toBeTruthy();
      // Token should have 3 parts (header.payload.signature)
      expect(token.split(".").length).toBe(3);
    });

    it("should fail with wrong password", async () => {
      const user = await createTestUser({
        password: "correctpassword",
      });

      const response = await request(app)
        .post("/v1/auth/login")
        .send({
          email: user.email,
          password: "wrongpassword",
        });

      expect(response.status).toBe(401);
      expect(response.body.error.message).toContain("Invalid credentials");
    });

    it("should fail with non-existent user", async () => {
      const response = await request(app)
        .post("/v1/auth/login")
        .send({
          email: "nonexistent@example.com",
          password: "password123",
        });

      expect(response.status).toBe(401);
      expect(response.body.error.message).toContain("Invalid credentials");
    });

    it("should fail with missing email", async () => {
      const response = await request(app)
        .post("/v1/auth/login")
        .send({
          password: "password123",
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    it("should fail with missing password", async () => {
      const response = await request(app)
        .post("/v1/auth/login")
        .send({
          email: "test@example.com",
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });
  });
});
