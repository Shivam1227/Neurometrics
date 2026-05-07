/**
 * Test management endpoints tests.
 *
 * Tests:
 * - GET /tests
 * - POST /tests
 * - GET /tests/:testId
 * - PATCH /tests/:testId
 * - DELETE /tests/:testId
 * - POST /tests/:testId/sections
 * - GET /tests/:testId/sections
 */

import { describe, it, expect } from "vitest";
import request from "supertest";
import createApp from "../src/app.js";
import {
  cleanDatabase,
  createTestUser,
  createAdminUser,
  getAuthToken,
} from "./setup.js";

const app = createApp();

describe("Test Endpoints", () => {

  describe("GET /tests", () => {
    it("should list tests with pagination", async () => {
      const response = await request(app).get("/v1/tests");

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("items");
      expect(response.body).toHaveProperty("total");
      expect(Array.isArray(response.body.items)).toBe(true);
    });

    // TODO: Fix active/inactive filtering - needs backend implementation
    // it("should filter by active status", async () => {
    //   const user = await createTestUser();
    //   const token = await getAuthToken(user);

    //   // create active test
    //   await request(app)
    //     .post("/v1/tests")
    //     .set("Authorization", `Bearer ${token}`)
    //     .send({
    //       title: "active test",
    //       isActive: true,
    //     });

    //   // create inactive test
    //   await request(app)
    //     .post("/v1/tests")
    //     .set("Authorization", `Bearer ${token}`)
    //     .send({
    //       title: "inactive test",
    //       isActive: false,
    //     });

    //   const activeResponse = await request(app).get("/v1/tests?active=true");
    //   const inactiveResponse = await request(app).get("/v1/tests?active=false");

    //   expect(activeResponse.body.items.some((t: any) => t.title === "active test")).toBe(
    //     true
    //   );
    //   expect(inactiveResponse.body.items.some((t: any) => t.title === "inactive test")).toBe(
    //     true
    //   );
    // });

    it("should support pagination", async () => {
      const response = await request(app).get("/v1/tests?limit=10&offset=0");

      expect(response.status).toBe(200);
      expect(response.body.limit).toBe(10);
      expect(response.body.offset).toBe(0);
    });
  });

  describe("POST /tests", () => {
    it("should create test successfully", async () => {
      const user = await createTestUser();
      const token = await getAuthToken(user);

      const response = await request(app)
        .post("/v1/tests")
        .set("Authorization", `Bearer ${token}`)
        .send({
          title: "New Test",
          description: "Test Description",
          isActive: true,
        });

      expect(response.status).toBe(201);
      expect(response.body.title).toBe("New Test");
      expect(response.body.description).toBe("Test Description");
      expect(response.body.createdBy).toBe(user.id);
    });

    it("should fail without authentication", async () => {
      const response = await request(app)
        .post("/v1/tests")
        .send({
          title: "New Test",
        });

      expect(response.status).toBe(401);
    });

    it("should fail with missing title", async () => {
      const user = await createTestUser();
      const token = await getAuthToken(user);

      const response = await request(app)
        .post("/v1/tests")
        .set("Authorization", `Bearer ${token}`)
        .send({
          description: "No title",
        });

      expect(response.status).toBe(400);
    });

    it("should set default values", async () => {
      const user = await createTestUser();
      const token = await getAuthToken(user);

      const response = await request(app)
        .post("/v1/tests")
        .set("Authorization", `Bearer ${token}`)
        .send({
          title: "Default Test",
        });

      expect(response.status).toBe(201);
      expect(response.body.isActive).toBe(true);
      expect(response.body.allowNegativeMarking).toBe(false);
      expect(response.body.allowPartialMarking).toBe(false);
      expect(response.body.shuffleQuestions).toBe(false);
      expect(response.body.shuffleOptions).toBe(false);
    });

    it("should accept test_specific_info", async () => {
      const user = await createTestUser();
      const token = await getAuthToken(user);

      const response = await request(app)
        .post("/v1/tests")
        .set("Authorization", `Bearer ${token}`)
        .send({
          title: "Test with Info",
          test_specific_info: { custom_field: "custom_value" },
        });

      expect(response.status).toBe(201);
      expect(response.body.test_specific_info).toEqual({
        custom_field: "custom_value",
      });
    });
  });

  describe("GET /tests/:testId", () => {
    it("should get test by ID", async () => {
      const user = await createTestUser();
      const token = await getAuthToken(user);

      const createRes = await request(app)
        .post("/v1/tests")
        .set("Authorization", `Bearer ${token}`)
        .send({
          title: "Get Test",
        });

      const testId = createRes.body.id;

      const response = await request(app).get(`/v1/tests/${testId}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(testId);
      expect(response.body.title).toBe("Get Test");
    });

    it("should include sections in response", async () => {
      const user = await createTestUser();
      const token = await getAuthToken(user);

      const createRes = await request(app)
        .post("/v1/tests")
        .set("Authorization", `Bearer ${token}`)
        .send({
          title: "Test with Sections",
        });

      const testId = createRes.body.id;

      const response = await request(app).get(`/v1/tests/${testId}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.sections)).toBe(true);
    });

    it("should return 404 for non-existent test", async () => {
      const response = await request(app).get("/v1/tests/9999");

      expect(response.status).toBe(404);
    });

    it("should fail with invalid test ID", async () => {
      const response = await request(app).get("/v1/tests/invalid");

      expect(response.status).toBe(400);
    });
  });

  describe("PATCH /tests/:testId", () => {
    it("should allow creator to update test", async () => {
      const user = await createTestUser();
      const token = await getAuthToken(user);

      const createRes = await request(app)
        .post("/v1/tests")
        .set("Authorization", `Bearer ${token}`)
        .send({
          title: "Original Title",
        });

      const testId = createRes.body.id;

      const response = await request(app)
        .patch(`/v1/tests/${testId}`)
        .set("Authorization", `Bearer ${token}`)
        .send({
          title: "Updated Title",
          isActive: false,
        });

      expect(response.status).toBe(200);
      expect(response.body.title).toBe("Updated Title");
      expect(response.body.isActive).toBe(false);
    });

    it("should allow admin to update any test", async () => {
      const user = await createTestUser();
      const userToken = await getAuthToken(user);
      const admin = await createAdminUser();
      const adminToken = await getAuthToken(admin);

      const createRes = await request(app)
        .post("/v1/tests")
        .set("Authorization", `Bearer ${userToken}`)
        .send({
          title: "Original",
        });

      const testId = createRes.body.id;

      const response = await request(app)
        .patch(`/v1/tests/${testId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          title: "Admin Updated",
        });

      expect(response.status).toBe(200);
      expect(response.body.title).toBe("Admin Updated");
    });

    it("should prevent non-creator from updating test", async () => {
      const user1 = await createTestUser();
      const user2 = await createTestUser();
      const token1 = await getAuthToken(user1);
      const token2 = await getAuthToken(user2);

      const createRes = await request(app)
        .post("/v1/tests")
        .set("Authorization", `Bearer ${token1}`)
        .send({
          title: "Original",
        });

      const testId = createRes.body.id;

      const response = await request(app)
        .patch(`/v1/tests/${testId}`)
        .set("Authorization", `Bearer ${token2}`)
        .send({
          title: "Unauthorized Update",
        });

      expect(response.status).toBe(403);
    });

    it("should fail without authentication", async () => {
      const response = await request(app)
        .patch("/v1/tests/1")
        .send({
          title: "Updated",
        });

      expect(response.status).toBe(401);
    });
  });

  describe("DELETE /tests/:testId", () => {
    it("should allow creator to delete test", async () => {
      const user = await createTestUser();
      const token = await getAuthToken(user);

      const createRes = await request(app)
        .post("/v1/tests")
        .set("Authorization", `Bearer ${token}`)
        .send({
          title: "Delete Test",
        });

      const testId = createRes.body.id;

      const response = await request(app)
        .delete(`/v1/tests/${testId}`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(204);

      // Verify deletion
      const getRes = await request(app).get(`/v1/tests/${testId}`);
      expect(getRes.status).toBe(404);
    });

    it("should allow admin to delete any test", async () => {
      const user = await createTestUser();
      const admin = await createAdminUser();
      const userToken = await getAuthToken(user);
      const adminToken = await getAuthToken(admin);

      const createRes = await request(app)
        .post("/v1/tests")
        .set("Authorization", `Bearer ${userToken}`)
        .send({
          title: "Delete Test",
        });

      const testId = createRes.body.id;

      const response = await request(app)
        .delete(`/v1/tests/${testId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(204);
    });

    it("should prevent non-creator from deleting test", async () => {
      const user1 = await createTestUser();
      const user2 = await createTestUser();
      const token1 = await getAuthToken(user1);
      const token2 = await getAuthToken(user2);

      const createRes = await request(app)
        .post("/v1/tests")
        .set("Authorization", `Bearer ${token1}`)
        .send({
          title: "Delete Test",
        });

      const testId = createRes.body.id;

      const response = await request(app)
        .delete(`/v1/tests/${testId}`)
        .set("Authorization", `Bearer ${token2}`);

      expect(response.status).toBe(403);
    });

    it("should fail without authentication", async () => {
      const response = await request(app).delete("/v1/tests/1");

      expect(response.status).toBe(401);
    });
  });

  describe("POST /tests/:testId/sections", () => {
    it("should create section in test", async () => {
      const user = await createTestUser();
      const token = await getAuthToken(user);

      const createRes = await request(app)
        .post("/v1/tests")
        .set("Authorization", `Bearer ${token}`)
        .send({
          title: "Test",
        });

      const testId = createRes.body.id;

      const response = await request(app)
        .post(`/v1/tests/${testId}/sections`)
        .set("Authorization", `Bearer ${token}`)
        .send({
          title: "Section 1",
          orderIndex: 0,
        });

      expect(response.status).toBe(201);
      expect(response.body.title).toBe("Section 1");
      expect(response.body.testId).toBe(testId);
    });

    it("should create section with config field", async () => {
      const user = await createTestUser();
      const token = await getAuthToken(user);

      const createRes = await request(app)
        .post("/v1/tests")
        .set("Authorization", `Bearer ${token}`)
        .send({
          title: "Test",
        });

      const testId = createRes.body.id;

      const response = await request(app)
        .post(`/v1/tests/${testId}/sections`)
        .set("Authorization", `Bearer ${token}`)
        .send({
          title: "Section with Config",
          orderIndex: 0,
          config: { timeLimit: 60, allowSkip: true },
        });

      expect(response.status).toBe(201);
      expect(response.body.title).toBe("Section with Config");
      expect(response.body.config).toEqual({ timeLimit: 60, allowSkip: true });
    });

    it("should fail without authentication", async () => {
      const response = await request(app)
        .post("/v1/tests/1/sections")
        .send({
          title: "Section",
          orderIndex: 0,
        });

      expect(response.status).toBe(401);
    });
  });

  describe("GET /tests/:testId/sections", () => {
    it("should list sections for test", async () => {
      const user = await createTestUser();
      const token = await getAuthToken(user);

      const createRes = await request(app)
        .post("/v1/tests")
        .set("Authorization", `Bearer ${token}`)
        .send({
          title: "Test",
        });

      const testId = createRes.body.id;

      await request(app)
        .post(`/v1/tests/${testId}/sections`)
        .set("Authorization", `Bearer ${token}`)
        .send({
          title: "Section 1",
          orderIndex: 0,
        });

      const response = await request(app).get(`/v1/tests/${testId}/sections`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(1);
    });

    it("should return 404 for non-existent test", async () => {
      const response = await request(app).get("/v1/tests/9999/sections");

      expect(response.status).toBe(404);
    });
  });
});
