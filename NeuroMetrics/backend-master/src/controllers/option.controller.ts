/**
 * Option controller - handles option endpoints.
 *
 * Implements:
 * - POST /questions/:questionId/options - Create option
 * - GET /questions/:questionId/options - List options
 * - PATCH /options/:optionId - Update option
 * - DELETE /options/:optionId - Delete option
 */

import type { Request, Response } from "express";
import { ZodError } from "zod";
import * as optionService from "../services/option.service.js";
import {
  OptionCreateSchema,
  OptionUpdateSchema,
} from "../validators/option.validator.js";
import {
  ValidationError,
  NotFoundError,
  asyncHandler,
} from "../middlewares/errorHandler.js";

/**
 * Create option for question
 * POST /questions/:questionId/options
 */
export const createOption = asyncHandler(
  async (req: Request, res: Response) => {
    const questionId = parseInt(req.params.questionId);

    if (isNaN(questionId)) {
      throw new ValidationError("Invalid question ID");
    }

    // Validate request
    let validatedData;
    try {
      validatedData = OptionCreateSchema.parse(req.body);
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
      const option = await optionService.createOption(questionId, {
        text: validatedData.text,
        isCorrect: validatedData.isCorrect,
        weight: validatedData.weight,
        config: validatedData.config,
      });

      res.status(201).json(option);
    } catch (err) {
      if (err instanceof Error && err.message.includes("not found")) {
        throw new NotFoundError("Question");
      }
      throw err;
    }
  }
);

/**
 * List options for question
 * GET /questions/:questionId/options
 */
export const listOptions = asyncHandler(
  async (req: Request, res: Response) => {
    const questionId = parseInt(req.params.questionId);

    if (isNaN(questionId)) {
      throw new ValidationError("Invalid question ID");
    }

    try {
      const options = await optionService.listOptionsByQuestion(questionId);
      res.status(200).json(options);
    } catch (err) {
      if (err instanceof Error && err.message.includes("not found")) {
        throw new NotFoundError("Question");
      }
      throw err;
    }
  }
);

/**
 * Update option
 * PATCH /options/:optionId
 */
export const updateOption = asyncHandler(
  async (req: Request, res: Response) => {
    const optionId = parseInt(req.params.optionId);

    if (isNaN(optionId)) {
      throw new ValidationError("Invalid option ID");
    }

    // Validate request
    let validatedData;
    try {
      validatedData = OptionUpdateSchema.parse(req.body);
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
      const option = await optionService.updateOption(optionId, validatedData);
      res.status(200).json(option);
    } catch (err) {
      if (err instanceof Error && err.message.includes("not found")) {
        throw new NotFoundError("Option");
      }
      throw err;
    }
  }
);

/**
 * Delete option
 * DELETE /options/:optionId
 */
export const deleteOption = asyncHandler(
  async (req: Request, res: Response) => {
    const optionId = parseInt(req.params.optionId);

    if (isNaN(optionId)) {
      throw new ValidationError("Invalid option ID");
    }

    try {
      await optionService.deleteOption(optionId);
      res.status(204).send();
    } catch (err) {
      if (err instanceof Error && err.message.includes("not found")) {
        throw new NotFoundError("Option");
      }
      throw err;
    }
  }
);
