/**
 * User management endpoints tests.
 *
 * Tests:
 * - GET /users
 * - POST /users
 * - GET /users/:userId
 * - PATCH /users/:userId
 * - DELETE /users/:userId
 */

import { describe, it, expect } from "vitest";
import request from "supertest";
import createApp from "../src/app.js";
import {
  cleanDatabase,
  createTestUser,
  createAdminUser,
  createTesterUser,
  getAuthToken,
} from "./setup.js";

const app = createApp();

describe("User Endpoints", () => {
  describe("GET /users", () => {
    it("should list users with pagination", async () => {
      const tester = await createTesterUser();
      const token = await getAuthToken(tester);

      const response = await request(app)
        .get("/v1/users")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("items");
      expect(response.body).toHaveProperty("total");
      expect(response.body).toHaveProperty("limit");
      expect(response.body).toHaveProperty("offset");
      expect(Array.isArray(response.body.items)).toBe(true);
    });

    it("should fail without authentication", async () => {
      const response = await request(app).get("/v1/users");

      expect(response.status).toBe(401);
    });

    it("should fail with non-tester user", async () => {
      const user = await createTestUser({
        email: "participant@example.com",
        type: "participant",
      });
      const token = await getAuthToken(user);

      const response = await request(app)
        .get("/v1/users")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(403);
    });

    it("should succeed with tester user", async () => {
      const tester = await createTesterUser();
      const token = await getAuthToken(tester);

      const response = await request(app)
        .get("/v1/users")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
    });

    it("should succeed with admin user", async () => {
      const admin = await createAdminUser();
      const token = await getAuthToken(admin);

      const response = await request(app)
        .get("/v1/users")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
    });

    it("should support pagination", async () => {
      const admin = await createAdminUser();
      const token = await getAuthToken(admin);

      // Create additional users with unique emails
      await createTestUser();
      await createTestUser();

      const response = await request(app)
        .get("/v1/users?limit=2&offset=0")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.limit).toBe(2);
      expect(response.body.offset).toBe(0);
    });
  });

  describe("GET /users/:userId", () => {
    it("should get user by ID", async () => {
      const user = await createTestUser();
      const token = await getAuthToken(user);

      const response = await request(app)
        .get(`/v1/users/${user.id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(user.id);
      expect(response.body.email).toBe(user.email);
    });

    it("should fail without authentication", async () => {
      const response = await request(app).get("/v1/users/1");

      expect(response.status).toBe(401);
    });

    it("should return 404 for non-existent user", async () => {
      const user = await createTestUser();
      const token = await getAuthToken(user);

      const response = await request(app)
        .get("/v1/users/9999")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(404);
    });

    it("should fail with invalid user ID", async () => {
      const user = await createTestUser();
      const token = await getAuthToken(user);

      const response = await request(app)
        .get("/v1/users/invalid")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(400);
    });
  });

  describe("PATCH /users/:userId", () => {
    it("should update own profile", async () => {
      const user = await createTestUser();
      const token = await getAuthToken(user);

      const response = await request(app)
        .patch(`/v1/users/${user.id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({
          name: "Updated Name",
        });

      expect(response.status).toBe(200);
      expect(response.body.name).toBe("Updated Name");
    });

    it("should allow admin to update any user", async () => {
      const user = await createTestUser();
      const admin = await createAdminUser();
      const adminToken = await getAuthToken(admin);

      const response = await request(app)
        .patch(`/v1/users/${user.id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          name: "Admin Updated",
        });

      expect(response.status).toBe(200);
      expect(response.body.name).toBe("Admin Updated");
    });

    it("should prevent non-admin from updating other users", async () => {
      const user1 = await createTestUser();
      const user2 = await createTestUser();
      const token = await getAuthToken(user1);

      const response = await request(app)
        .patch(`/v1/users/${user2.id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({
          name: "Unauthorized Update",
        });

      expect(response.status).toBe(403);
    });

    it("should update email", async () => {
      const user = await createTestUser();
      const token = await getAuthToken(user);

      const response = await request(app)
        .patch(`/v1/users/${user.id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({
          email: "newemail@example.com",
        });

      expect(response.status).toBe(200);
      expect(response.body.email).toBe("newemail@example.com");
    });

    it("should fail with invalid email", async () => {
      const user = await createTestUser();
      const token = await getAuthToken(user);

      const response = await request(app)
        .patch(`/v1/users/${user.id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({
          email: "invalid-email",
        });

      expect(response.status).toBe(400);
    });

    it("should fail if email already in use", async () => {
      const user1 = await createTestUser();
      const user2 = await createTestUser();
      const token = await getAuthToken(user1);

      const response = await request(app)
        .patch(`/v1/users/${user1.id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({
          email: user2.email,
        });

      expect(response.status).toBe(409);
    });

    it("should fail without authentication", async () => {
      const response = await request(app)
        .patch("/v1/users/1")
        .send({
          name: "Updated",
        });

      expect(response.status).toBe(401);
    });
  });

  describe("DELETE /users/:userId", () => {
    it("should allow admin to delete user", async () => {
      const user = await createTestUser();
      const admin = await createAdminUser();
      const adminToken = await getAuthToken(admin);

      const response = await request(app)
        .delete(`/v1/users/${user.id}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(204);

      // Verify user is deleted
      const getResponse = await request(app)
        .get(`/v1/users/${user.id}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(getResponse.status).toBe(404);
    });

    it("should prevent non-admin from deleting users", async () => {
      const user1 = await createTestUser();
      const user2 = await createTestUser();
      const token = await getAuthToken(user1);

      const response = await request(app)
        .delete(`/v1/users/${user2.id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(403);
    });

    it("should fail without authentication", async () => {
      const response = await request(app).delete("/v1/users/1");

      expect(response.status).toBe(401);
    });

    it("should return 404 for non-existent user", async () => {
      const admin = await createAdminUser();
      const token = await getAuthToken(admin);

      const response = await request(app)
        .delete("/v1/users/9999")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(404);
    });
  });

  describe("POST /users", () => {
    it("should allow admin to create user", async () => {
      const admin = await createAdminUser();
      const token = await getAuthToken(admin);

      const response = await request(app)
        .post("/v1/users")
        .set("Authorization", `Bearer ${token}`)
        .send({
          email: "newuser@example.com",
          name: "New User",
          password: "password123",
          type: "tester",
        });

      expect(response.status).toBe(201);
      expect(response.body.email).toBe("newuser@example.com");
      expect(response.body.type).toBe("tester");
    });

    it("should prevent non-admin from creating user", async () => {
      const user = await createTestUser();
      const token = await getAuthToken(user);

      const response = await request(app)
        .post("/v1/users")
        .set("Authorization", `Bearer ${token}`)
        .send({
          email: "newuser@example.com",
          name: "New User",
          password: "password123",
        });

      expect(response.status).toBe(403);
    });

    it("should fail without authentication", async () => {
      const response = await request(app)
        .post("/v1/users")
        .send({
          email: "newuser@example.com",
          name: "New User",
          password: "password123",
        });

      expect(response.status).toBe(401);
    });
  });
});
