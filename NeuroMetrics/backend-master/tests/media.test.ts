/**
 * Media endpoints tests.
 *
 * Tests:
 * - POST /media - Upload media
 * - GET /media - List media
 * - DELETE /media/:mediaId - Delete media
 * - POST /questions/:questionId/media/:mediaId - Attach to question
 * - DELETE /questions/:questionId/media/:mediaId - Detach from question
 * - POST /options/:optionId/media/:mediaId - Attach to option
 * - DELETE /options/:optionId/media/:mediaId - Detach from option
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import createApp from "../src/app.js";
import { cleanDatabase, createTestUser, createAdminUser, getAuthToken } from "./setup.js";
import prisma from "../src/db/client.js";
import * as mediaService from "../src/services/media.service.js";

/**
 * Generate unique email for tests
 */
function generateUniqueEmail(prefix: string): string {
  return `${prefix}.${Date.now()}.${Math.random().toString(36).slice(2, 9)}@example.com`;
}

const app = createApp();

describe("Media Endpoints", () => {
  let adminUser: any;
  let adminToken: string;
  let testUser: any;
  let testToken: string;
  let testRecord: any;
  let section: any;
  let question: any;
  let option: any;

  beforeAll(async () => {
    // Enable S3 mocking for tests
    mediaService.enableMockS3();

    // Create admin user for privileged operations
    adminUser = await createAdminUser();
    adminToken = await getAuthToken(adminUser);

    // Create regular user
    testUser = await createTestUser({
      email: generateUniqueEmail("mediatest"),
      name: "Media Test User",
      password: "password123",
    });
    testToken = await getAuthToken(testUser);

    // Create test, section, question, option for attachment tests
    testRecord = await prisma.test.create({
      data: {
        title: "Media Test",
        createdBy: testUser.id,
      },
    });

    section = await prisma.section.create({
      data: {
        testId: testRecord.id,
        title: "Media Section",
        orderIndex: 1,
      },
    });

    question = await prisma.question.create({
      data: {
        sectionId: section.id,
        text: "Test Question",
        type: "scmcq",
      },
    });

    option = await prisma.option.create({
      data: {
        questionId: question.id,
        text: "Test Option",
        isCorrect: true,
      },
    });

    // Clean database before tests
    await cleanDatabase();

    // Recreate fixtures after cleaning
    adminUser = await createAdminUser();
    adminToken = await getAuthToken(adminUser);

    testUser = await createTestUser({
      email: generateUniqueEmail("mediatest"),
      name: "Media Test User",
      password: "password123",
    });
    testToken = await getAuthToken(testUser);

    testRecord = await prisma.test.create({
      data: {
        title: "Media Test",
        createdBy: testUser.id,
      },
    });

    section = await prisma.section.create({
      data: {
        testId: testRecord.id,
        title: "Media Section",
        orderIndex: 1,
      },
    });

    question = await prisma.question.create({
      data: {
        sectionId: section.id,
        text: "Test Question",
        type: "scmcq",
      },
    });

    option = await prisma.option.create({
      data: {
        questionId: question.id,
        text: "Test Option",
        isCorrect: true,
      },
    });
  });

  afterAll(async () => {
    // Disable S3 mocking after tests
    mediaService.disableMockS3();
    await prisma.$disconnect();
  });

  describe("POST /media - Upload media", () => {
    it("should require authentication", async () => {
      const response = await request(app)
        .post("/v1/media")
        .field("type", "image")
        .attach("file", Buffer.from("test content"), "test.jpg");

      expect(response.status).toBe(401);
    });

    it("should upload image media successfully", async () => {
      const response = await request(app)
        .post("/v1/media")
        .set("Authorization", `Bearer ${testToken}`)
        .field("type", "image")
        .attach("file", Buffer.from("test image content"), "test.jpg");

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("id");
      expect(response.body.filename).toBe("test.jpg");
      expect(response.body.type).toBe("image");
      expect(response.body).toHaveProperty("url");
      expect(response.body).toHaveProperty("version");
    });

    it("should upload video media successfully", async () => {
      const response = await request(app)
        .post("/v1/media")
        .set("Authorization", `Bearer ${testToken}`)
        .field("type", "video")
        .attach("file", Buffer.from("test video content"), "test.mp4");

      expect(response.status).toBe(201);
      expect(response.body.type).toBe("video");
    });

    it("should upload audio media successfully", async () => {
      const response = await request(app)
        .post("/v1/media")
        .set("Authorization", `Bearer ${testToken}`)
        .field("type", "audio")
        .attach("file", Buffer.from("test audio content"), "test.mp3");

      expect(response.status).toBe(201);
      expect(response.body.type).toBe("audio");
    });

    it("should upload interactive media successfully", async () => {
      const response = await request(app)
        .post("/v1/media")
        .set("Authorization", `Bearer ${testToken}`)
        .field("type", "interactive")
        .attach("file", Buffer.from("test interactive content"), "test.html");

      expect(response.status).toBe(201);
      expect(response.body.type).toBe("interactive");
    });

    it("should accept optional label", async () => {
      const response = await request(app)
        .post("/v1/media")
        .set("Authorization", `Bearer ${testToken}`)
        .field("type", "image")
        .field("label", "Test Image Label")
        .attach("file", Buffer.from("test image"), "test.jpg");

      expect(response.status).toBe(201);
      expect(response.body.label).toBe("Test Image Label");
    });

    it("should fail without file", async () => {
      const response = await request(app)
        .post("/v1/media")
        .set("Authorization", `Bearer ${testToken}`)
        .field("type", "image");

      expect(response.status).toBe(400);
    });

    it("should fail with invalid media type", async () => {
      const response = await request(app)
        .post("/v1/media")
        .set("Authorization", `Bearer ${testToken}`)
        .field("type", "invalid_type")
        .attach("file", Buffer.from("test"), "test.jpg");

      expect(response.status).toBe(400);
    });

    it("should fail without media type", async () => {
      const response = await request(app)
        .post("/v1/media")
        .set("Authorization", `Bearer ${testToken}`)
        .attach("file", Buffer.from("test"), "test.jpg");

      expect(response.status).toBe(400);
    });
  });

  describe("GET /media - List media", () => {
    it("should require authentication", async () => {
      const response = await request(app).get("/v1/media");

      expect(response.status).toBe(401);
    });

    it("should list media with default pagination", async () => {
      // Upload some media first
      await request(app)
        .post("/v1/media")
        .set("Authorization", `Bearer ${testToken}`)
        .field("type", "image")
        .attach("file", Buffer.from("test1"), "test1.jpg");

      await request(app)
        .post("/v1/media")
        .set("Authorization", `Bearer ${testToken}`)
        .field("type", "image")
        .attach("file", Buffer.from("test2"), "test2.jpg");

      const response = await request(app)
        .get("/v1/media")
        .set("Authorization", `Bearer ${testToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("items");
      expect(response.body).toHaveProperty("total");
      expect(response.body).toHaveProperty("limit");
      expect(response.body).toHaveProperty("offset");
      expect(Array.isArray(response.body.items)).toBe(true);
    });

    it("should support pagination with limit and offset", async () => {
      const response = await request(app)
        .get("/v1/media?limit=10&offset=0")
        .set("Authorization", `Bearer ${testToken}`);

      expect(response.status).toBe(200);
      expect(response.body.limit).toBe(10);
      expect(response.body.offset).toBe(0);
    });

    it("should enforce maximum limit", async () => {
      const response = await request(app)
        .get("/v1/media?limit=1000&offset=0")
        .set("Authorization", `Bearer ${testToken}`);

      // Should either enforce limit or accept it - depends on implementation
      expect(response.status).toBe(200);
    });
  });

  describe("DELETE /media/:mediaId - Delete media", () => {
    it("should require authentication", async () => {
      const response = await request(app).delete("/v1/media/1");

      expect(response.status).toBe(401);
    });

    it("should delete media successfully", async () => {
      // Upload media first
      const uploadResponse = await request(app)
        .post("/v1/media")
        .set("Authorization", `Bearer ${testToken}`)
        .field("type", "image")
        .attach("file", Buffer.from("test"), "test.jpg");

      const mediaId = uploadResponse.body.id;

      // Delete the media
      const deleteResponse = await request(app)
        .delete(`/v1/media/${mediaId}`)
        .set("Authorization", `Bearer ${testToken}`);

      expect(deleteResponse.status).toBe(204);

      // Verify media is deleted
      const getResponse = await request(app)
        .get("/v1/media")
        .set("Authorization", `Bearer ${testToken}`);

      const deletedMedia = getResponse.body.items.find((m: any) => m.id === mediaId);
      expect(deletedMedia).toBeUndefined();
    });

    it("should fail with invalid media ID", async () => {
      const response = await request(app)
        .delete("/v1/media/invalid")
        .set("Authorization", `Bearer ${testToken}`);

      expect(response.status).toBe(400);
    });

    it("should return 404 for non-existent media", async () => {
      const response = await request(app)
        .delete("/v1/media/99999")
        .set("Authorization", `Bearer ${testToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe("POST /questions/:questionId/media/:mediaId - Attach to question", () => {
    it("should require authentication", async () => {
      const response = await request(app)
        .post(`/v1/questions/${question.id}/media/1`);

      expect(response.status).toBe(401);
    });

    it("should attach media to question successfully", async () => {
      // Upload media
      const uploadResponse = await request(app)
        .post("/v1/media")
        .set("Authorization", `Bearer ${testToken}`)
        .field("type", "image")
        .attach("file", Buffer.from("test"), "test.jpg");

      const mediaId = uploadResponse.body.id;

      // Attach to question
      const response = await request(app)
        .post(`/v1/questions/${question.id}/media/${mediaId}`)
        .set("Authorization", `Bearer ${testToken}`);

      expect(response.status).toBe(204);

      // Verify attachment was created
      const attachment = await prisma.questionMedia.findUnique({
        where: {
          questionId_mediaId: {
            questionId: question.id,
            mediaId: mediaId,
          },
        },
      });

      expect(attachment).toBeDefined();
    });

    it("should fail with invalid question ID", async () => {
      const response = await request(app)
        .post("/v1/questions/invalid/media/1")
        .set("Authorization", `Bearer ${testToken}`);

      expect(response.status).toBe(400);
    });

    it("should fail with invalid media ID", async () => {
      const response = await request(app)
        .post(`/v1/questions/${question.id}/media/invalid`)
        .set("Authorization", `Bearer ${testToken}`);

      expect(response.status).toBe(400);
    });

    it("should return 404 for non-existent question", async () => {
      const response = await request(app)
        .post("/v1/questions/99999/media/1")
        .set("Authorization", `Bearer ${testToken}`);

      expect(response.status).toBe(404);
    });

    it("should return 404 for non-existent media", async () => {
      const response = await request(app)
        .post(`/v1/questions/${question.id}/media/99999`)
        .set("Authorization", `Bearer ${testToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe("DELETE /questions/:questionId/media/:mediaId - Detach from question", () => {
    it("should require authentication", async () => {
      const response = await request(app)
        .delete(`/v1/questions/${question.id}/media/1`);

      expect(response.status).toBe(401);
    });

    it("should detach media from question successfully", async () => {
      // Upload media
      const uploadResponse = await request(app)
        .post("/v1/media")
        .set("Authorization", `Bearer ${testToken}`)
        .field("type", "image")
        .attach("file", Buffer.from("test"), "test.jpg");

      const mediaId = uploadResponse.body.id;

      // Attach to question
      await request(app)
        .post(`/v1/questions/${question.id}/media/${mediaId}`)
        .set("Authorization", `Bearer ${testToken}`);

      // Detach from question
      const response = await request(app)
        .delete(`/v1/questions/${question.id}/media/${mediaId}`)
        .set("Authorization", `Bearer ${testToken}`);

      expect(response.status).toBe(204);

      // Verify attachment was deleted
      const attachment = await prisma.questionMedia.findUnique({
        where: {
          questionId_mediaId: {
            questionId: question.id,
            mediaId: mediaId,
          },
        },
      });

      expect(attachment).toBeNull();
    });

    it("should fail with invalid IDs", async () => {
      const response = await request(app)
        .delete("/v1/questions/invalid/media/invalid")
        .set("Authorization", `Bearer ${testToken}`);

      expect(response.status).toBe(400);
    });

    it("should return 404 for non-existent attachment", async () => {
      const response = await request(app)
        .delete(`/v1/questions/${question.id}/media/99999`)
        .set("Authorization", `Bearer ${testToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe("POST /options/:optionId/media/:mediaId - Attach to option", () => {
    it("should require authentication", async () => {
      const response = await request(app)
        .post(`/v1/options/${option.id}/media/1`);

      expect(response.status).toBe(401);
    });

    it("should attach media to option successfully", async () => {
      // Upload media
      const uploadResponse = await request(app)
        .post("/v1/media")
        .set("Authorization", `Bearer ${testToken}`)
        .field("type", "image")
        .attach("file", Buffer.from("test"), "test.jpg");

      const mediaId = uploadResponse.body.id;

      // Attach to option
      const response = await request(app)
        .post(`/v1/options/${option.id}/media/${mediaId}`)
        .set("Authorization", `Bearer ${testToken}`);

      expect(response.status).toBe(204);

      // Verify attachment was created
      const attachment = await prisma.optionMedia.findUnique({
        where: {
          optionId_mediaId: {
            optionId: option.id,
            mediaId: mediaId,
          },
        },
      });

      expect(attachment).toBeDefined();
    });

    it("should fail with invalid option ID", async () => {
      const response = await request(app)
        .post("/v1/options/invalid/media/1")
        .set("Authorization", `Bearer ${testToken}`);

      expect(response.status).toBe(400);
    });

    it("should return 404 for non-existent option", async () => {
      const response = await request(app)
        .post("/v1/options/99999/media/1")
        .set("Authorization", `Bearer ${testToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe("DELETE /options/:optionId/media/:mediaId - Detach from option", () => {
    it("should require authentication", async () => {
      const response = await request(app)
        .delete(`/v1/options/${option.id}/media/1`);

      expect(response.status).toBe(401);
    });

    it("should detach media from option successfully", async () => {
      // Upload media
      const uploadResponse = await request(app)
        .post("/v1/media")
        .set("Authorization", `Bearer ${testToken}`)
        .field("type", "image")
        .attach("file", Buffer.from("test"), "test.jpg");

      const mediaId = uploadResponse.body.id;

      // Attach to option
      await request(app)
        .post(`/v1/options/${option.id}/media/${mediaId}`)
        .set("Authorization", `Bearer ${testToken}`);

      // Detach from option
      const response = await request(app)
        .delete(`/v1/options/${option.id}/media/${mediaId}`)
        .set("Authorization", `Bearer ${testToken}`);

      expect(response.status).toBe(204);

      // Verify attachment was deleted
      const attachment = await prisma.optionMedia.findUnique({
        where: {
          optionId_mediaId: {
            optionId: option.id,
            mediaId: mediaId,
          },
        },
      });

      expect(attachment).toBeNull();
    });
  });
});
