/**
 * Section controller - handles section endpoints.
 *
 * Implements:
 * - GET /sections/:sectionId - Get section by ID
 * - PATCH /sections/:sectionId - Update section
 * - DELETE /sections/:sectionId - Delete section
 */

import type { Request, Response } from "express";
import { ZodError } from "zod";
import * as sectionService from "../services/section.service.js";
import * as testService from "../services/test.service.js";
import {
  SectionUpdateSchema,
} from "../validators/section.validator.js";
import {
  ValidationError,
  NotFoundError,
  AuthorizationError,
  asyncHandler,
} from "../middlewares/errorHandler.js";

/**
 * Get section by ID
 * GET /sections/:sectionId
 */
export const getSection = asyncHandler(
  async (req: Request, res: Response) => {
    const sectionId = parseInt(req.params.sectionId);

    if (isNaN(sectionId)) {
      throw new ValidationError("Invalid section ID");
    }

    try {
      const section = await sectionService.getSectionById(sectionId);
      res.status(200).json(section);
    } catch (err) {
      if (err instanceof Error && err.message.includes("not found")) {
        throw new NotFoundError("Section");
      }
      throw err;
    }
  }
);

/**
 * Update section
 * PATCH /sections/:sectionId
 */
export const updateSection = asyncHandler(
  async (req: Request, res: Response) => {
    const sectionId = parseInt(req.params.sectionId);

    if (isNaN(sectionId)) {
      throw new ValidationError("Invalid section ID");
    }

    // Validate request
    let validatedData;
    try {
      validatedData = SectionUpdateSchema.parse(req.body);
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
      const section = await sectionService.updateSection(sectionId, validatedData);
      res.status(200).json(section);
    } catch (err) {
      if (err instanceof Error && err.message.includes("not found")) {
        throw new NotFoundError("Section");
      }
      throw err;
    }
  }
);

/**
 * Delete section
 * DELETE /sections/:sectionId
 */
export const deleteSection = asyncHandler(
  async (req: Request, res: Response) => {
    const sectionId = parseInt(req.params.sectionId);

    if (isNaN(sectionId)) {
      throw new ValidationError("Invalid section ID");
    }

    try {
      await sectionService.deleteSection(sectionId);
      res.status(204).send();
    } catch (err) {
      if (err instanceof Error && err.message.includes("not found")) {
        throw new NotFoundError("Section");
      }
      throw err;
    }
  }
);
