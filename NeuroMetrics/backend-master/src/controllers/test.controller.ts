/**
 * Test controller - handles test endpoints.
 *
 * Implements:
 * - GET /tests - List tests
 * - POST /tests - Create test
 * - GET /tests/:testId - Get test by ID
 * - PATCH /tests/:testId - Update test
 * - DELETE /tests/:testId - Delete test
 * - POST /tests/:testId/sections - Create section
 * - GET /tests/:testId/sections - List sections
 */

import type { Request, Response } from "express";
import { ZodError } from "zod";
import * as testService from "../services/test.service.js";
import * as sectionService from "../services/section.service.js";
import {
  TestCreateSchema,
  TestUpdateSchema,
} from "../validators/test.validator.js";
import {
  SectionCreateSchema,
} from "../validators/section.validator.js";
import {
  ValidationError,
  NotFoundError,
  asyncHandler,
} from "../middlewares/errorHandler.js";

/**
 * List tests
 * GET /tests
 */
export const listTests = asyncHandler(async (req: Request, res: Response) => {
  const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
  const offset = parseInt(req.query.offset as string) || 0;
  const active = req.query.active ? req.query.active === "true" : undefined;

  const result = await testService.listTests(limit, offset, active);

  res.status(200).json(result);
});

/**
 * Create test
 * POST /tests
 */
export const createTest = asyncHandler(async (req: Request, res: Response) => {
  // Validate request
  let validatedData;
  try {
    validatedData = TestCreateSchema.parse(req.body);
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
    const userId = parseInt((req.user as any).sub);
    const test = await testService.createTest(validatedData.title, userId, {
      description: validatedData.description,
      isActive: validatedData.isActive,
      duration: validatedData.duration,
      allowNegativeMarking: validatedData.allowNegativeMarking,
      allowPartialMarking: validatedData.allowPartialMarking,
      shuffleQuestions: validatedData.shuffleQuestions,
      shuffleOptions: validatedData.shuffleOptions,
      test_specific_info: validatedData.test_specific_info,
    });

    res.status(201).json(test);
  } catch (err) {
    throw err;
  }
});

/**
 * Get test by ID
 * GET /tests/:testId
 */
export const getTest = asyncHandler(async (req: Request, res: Response) => {
  const testId = parseInt(req.params.testId);

  if (isNaN(testId)) {
    throw new ValidationError("Invalid test ID");
  }

  try {
    const test = await testService.getTestById(testId);
    res.status(200).json(test);
  } catch (err) {
    if (err instanceof Error && err.message.includes("not found")) {
      throw new NotFoundError("Test");
    }
    throw err;
  }
});

/**
 * Update test
 * PATCH /tests/:testId
 */
export const updateTest = asyncHandler(async (req: Request, res: Response) => {
  const testId = parseInt(req.params.testId);

  if (isNaN(testId)) {
    throw new ValidationError("Invalid test ID");
  }

  // Validate request
  let validatedData;
  try {
    validatedData = TestUpdateSchema.parse(req.body);
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
    const test = await testService.updateTest(testId, validatedData);
    res.status(200).json(test);
  } catch (err) {
    if (err instanceof Error && err.message.includes("not found")) {
      throw new NotFoundError("Test");
    }
    throw err;
  }
});

/**
 * Delete test
 * DELETE /tests/:testId
 */
export const deleteTest = asyncHandler(async (req: Request, res: Response) => {
  const testId = parseInt(req.params.testId);

  if (isNaN(testId)) {
    throw new ValidationError("Invalid test ID");
  }

  try {
    await testService.deleteTest(testId);
    res.status(204).send();
  } catch (err) {
    if (err instanceof Error && err.message.includes("not found")) {
      throw new NotFoundError("Test");
    }
    throw err;
  }
});

/**
 * Create section
 * POST /tests/:testId/sections
 */
export const createSection = asyncHandler(
  async (req: Request, res: Response) => {
    const testId = parseInt(req.params.testId);

    if (isNaN(testId)) {
      throw new ValidationError("Invalid test ID");
    }

    // Validate request
    let validatedData;
    try {
      validatedData = SectionCreateSchema.parse(req.body);
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
      const section = await sectionService.createSection(
        testId,
        validatedData.title,
        validatedData.orderIndex,
        {
          description: validatedData.description,
          duration: validatedData.duration,
          config: validatedData.config,
        }
      );

      res.status(201).json(section);
    } catch (err) {
      if (err instanceof Error && err.message.includes("not found")) {
        throw new NotFoundError("Test");
      }
      throw err;
    }
  }
);

/**
 * List sections
 * GET /tests/:testId/sections
 */
export const listSections = asyncHandler(
  async (req: Request, res: Response) => {
    const testId = parseInt(req.params.testId);

    if (isNaN(testId)) {
      throw new ValidationError("Invalid test ID");
    }

    try {
      const sections = await sectionService.listSectionsByTest(testId);
      res.status(200).json(sections);
    } catch (err) {
      if (err instanceof Error && err.message.includes("not found")) {
        throw new NotFoundError("Test");
      }
      throw err;
    }
  }
);
