/**
 * Section management endpoints tests.
 *
 * Tests:
 * - GET /sections/:sectionId
 * - PATCH /sections/:sectionId
 * - DELETE /sections/:sectionId
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

describe("Section Endpoints", () => {
  /**
   * Helper to create a test and section
   */
  async function createTestWithSection(token: string) {
    const testRes = await request(app)
      .post("/v1/tests")
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "Test",
      });

    const testId = testRes.body.id;

    const sectionRes = await request(app)
      .post(`/v1/tests/${testId}/sections`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "Section 1",
        orderIndex: 0,
      });

    return {
      testId,
      sectionId: sectionRes.body.id,
      section: sectionRes.body,
    };
  }

  describe("GET /sections/:sectionId", () => {
    it("should get section by ID", async () => {
      const user = await createTestUser();
      const token = await getAuthToken(user);
      const { sectionId } = await createTestWithSection(token);

      const response = await request(app).get(`/v1/sections/${sectionId}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(sectionId);
      expect(response.body.title).toBe("Section 1");
    });

    it("should return 404 for non-existent section", async () => {
      const response = await request(app).get("/v1/sections/9999");

      expect(response.status).toBe(404);
    });

    it("should fail with invalid section ID", async () => {
      const response = await request(app).get("/v1/sections/invalid");

      expect(response.status).toBe(400);
    });
  });

  describe("PATCH /sections/:sectionId", () => {
    it("should allow creator to update section", async () => {
      const user = await createTestUser();
      const token = await getAuthToken(user);
      const { sectionId } = await createTestWithSection(token);

      const response = await request(app)
        .patch(`/v1/sections/${sectionId}`)
        .set("Authorization", `Bearer ${token}`)
        .send({
          title: "Updated Section",
          description: "New description",
        });

      expect(response.status).toBe(200);
      expect(response.body.title).toBe("Updated Section");
      expect(response.body.description).toBe("New description");
    });

    it("should allow updating config field", async () => {
      const user = await createTestUser();
      const token = await getAuthToken(user);
      const { sectionId } = await createTestWithSection(token);

      const response = await request(app)
        .patch(`/v1/sections/${sectionId}`)
        .set("Authorization", `Bearer ${token}`)
        .send({
          config: { customField: "customValue", count: 42 },
        });

      expect(response.status).toBe(200);
      expect(response.body.config).toEqual({ customField: "customValue", count: 42 });
    });

    it("should update orderIndex", async () => {
      const user = await createTestUser();
      const token = await getAuthToken(user);
      const { sectionId } = await createTestWithSection(token);

      const response = await request(app)
        .patch(`/v1/sections/${sectionId}`)
        .set("Authorization", `Bearer ${token}`)
        .send({
          orderIndex: 5,
        });

      expect(response.status).toBe(200);
      expect(response.body.orderIndex).toBe(5);
    });

    it("should allow admin to update any section", async () => {
      const user = await createTestUser();
      const userToken = await getAuthToken(user);
      const admin = await createAdminUser();
      const adminToken = await getAuthToken(admin);

      const { sectionId } = await createTestWithSection(userToken);

      const response = await request(app)
        .patch(`/v1/sections/${sectionId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          title: "Admin Updated",
        });

      expect(response.status).toBe(200);
      expect(response.body.title).toBe("Admin Updated");
    });

    it("should prevent non-creator from updating section", async () => {
      const user1 = await createTestUser();
      const user2 = await createTestUser();
      const token1 = await getAuthToken(user1);
      const token2 = await getAuthToken(user2);

      const { sectionId } = await createTestWithSection(token1);

      const response = await request(app)
        .patch(`/v1/sections/${sectionId}`)
        .set("Authorization", `Bearer ${token2}`)
        .send({
          title: "Unauthorized Update",
        });

      expect(response.status).toBe(403);
    });

    it("should fail without authentication", async () => {
      const user = await createTestUser();
      const token = await getAuthToken(user);
      const { sectionId } = await createTestWithSection(token);

      const response = await request(app)
        .patch(`/v1/sections/${sectionId}`)
        .send({
          title: "Updated",
        });

      expect(response.status).toBe(401);
    });

    it("should fail with invalid data", async () => {
      const user = await createTestUser();
      const token = await getAuthToken(user);
      const { sectionId } = await createTestWithSection(token);

      const response = await request(app)
        .patch(`/v1/sections/${sectionId}`)
        .set("Authorization", `Bearer ${token}`)
        .send({
          orderIndex: -1, // Invalid
        });

      expect(response.status).toBe(400);
    });
  });

  describe("DELETE /sections/:sectionId", () => {
    it("should allow creator to delete section", async () => {
      const user = await createTestUser();
      const token = await getAuthToken(user);
      const { sectionId } = await createTestWithSection(token);

      const response = await request(app)
        .delete(`/v1/sections/${sectionId}`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(204);

      // Verify deletion
      const getRes = await request(app).get(`/v1/sections/${sectionId}`);
      expect(getRes.status).toBe(404);
    });

    it("should allow admin to delete any section", async () => {
      const user = await createTestUser();
      const userToken = await getAuthToken(user);
      const admin = await createAdminUser();
      const adminToken = await getAuthToken(admin);

      const { sectionId } = await createTestWithSection(userToken);

      const response = await request(app)
        .delete(`/v1/sections/${sectionId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(204);
    });

    it("should prevent non-creator from deleting section", async () => {
      const user1 = await createTestUser();
      const user2 = await createTestUser();
      const token1 = await getAuthToken(user1);
      const token2 = await getAuthToken(user2);

      const { sectionId } = await createTestWithSection(token1);

      const response = await request(app)
        .delete(`/v1/sections/${sectionId}`)
        .set("Authorization", `Bearer ${token2}`);

      expect(response.status).toBe(403);
    });

    it("should fail without authentication", async () => {
      const user = await createTestUser();
      const token = await getAuthToken(user);
      const { sectionId } = await createTestWithSection(token);

      const response = await request(app).delete(`/v1/sections/${sectionId}`);

      expect(response.status).toBe(401);
    });

    it("should return 404 for non-existent section", async () => {
      const user = await createTestUser();
      const token = await getAuthToken(user);

      const response = await request(app)
        .delete("/v1/sections/9999")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(404);
    });
  });
});
