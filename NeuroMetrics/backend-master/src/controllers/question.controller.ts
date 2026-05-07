/**
 * Question controller - handles question endpoints.
 *
 * Implements:
 * - POST /sections/:sectionId/questions - Create question
 * - GET /sections/:sectionId/questions - List questions
 * - GET /questions/:questionId - Get question by ID
 * - PATCH /questions/:questionId - Update question
 * - DELETE /questions/:questionId - Delete question
 */

import type { Request, Response } from "express";
import { ZodError } from "zod";
import * as questionService from "../services/question.service.js";
import {
  QuestionCreateSchema,
  QuestionUpdateSchema,
} from "../validators/question.validator.js";
import {
  ValidationError,
  NotFoundError,
  asyncHandler,
} from "../middlewares/errorHandler.js";

/**
 * Create question in section
 * POST /sections/:sectionId/questions
 */
export const createQuestion = asyncHandler(
  async (req: Request, res: Response) => {
    const sectionId = parseInt(req.params.sectionId);

    if (isNaN(sectionId)) {
      throw new ValidationError("Invalid section ID");
    }

    // Validate request
    let validatedData;
    try {
      validatedData = QuestionCreateSchema.parse(req.body);
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
      const question = await questionService.createQuestion(
        sectionId,
        validatedData.text,
        validatedData.type,
        {
          ans: validatedData.ans,
          maxScore: validatedData.maxScore,
          negativeScore: validatedData.negativeScore,
          partialMarking: validatedData.partialMarking,
          config: validatedData.config,
        }
      );

      res.status(201).json(question);
    } catch (err) {
      if (err instanceof Error && err.message.includes("not found")) {
        throw new NotFoundError("Section");
      }
      throw err;
    }
  }
);

/**
 * List questions in section
 * GET /sections/:sectionId/questions
 */
export const listQuestions = asyncHandler(
  async (req: Request, res: Response) => {
    const sectionId = parseInt(req.params.sectionId);

    if (isNaN(sectionId)) {
      throw new ValidationError("Invalid section ID");
    }

    try {
      const questions = await questionService.listQuestionsBySection(sectionId);
      res.status(200).json(questions);
    } catch (err) {
      if (err instanceof Error && err.message.includes("not found")) {
        throw new NotFoundError("Section");
      }
      throw err;
    }
  }
);

/**
 * Get question by ID
 * GET /questions/:questionId
 */
export const getQuestion = asyncHandler(
  async (req: Request, res: Response) => {
    const questionId = parseInt(req.params.questionId);

    if (isNaN(questionId)) {
      throw new ValidationError("Invalid question ID");
    }

    try {
      const question = await questionService.getQuestionById(questionId);
      res.status(200).json(question);
    } catch (err) {
      if (err instanceof Error && err.message.includes("not found")) {
        throw new NotFoundError("Question");
      }
      throw err;
    }
  }
);

/**
 * Update question
 * PATCH /questions/:questionId
 */
export const updateQuestion = asyncHandler(
  async (req: Request, res: Response) => {
    const questionId = parseInt(req.params.questionId);

    if (isNaN(questionId)) {
      throw new ValidationError("Invalid question ID");
    }

    // Validate request
    let validatedData;
    try {
      validatedData = QuestionUpdateSchema.parse(req.body);
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
      const question = await questionService.updateQuestion(questionId, validatedData);
      res.status(200).json(question);
    } catch (err) {
      if (err instanceof Error && err.message.includes("not found")) {
        throw new NotFoundError("Question");
      }
      throw err;
    }
  }
);

/**
 * Delete question
 * DELETE /questions/:questionId
 */
export const deleteQuestion = asyncHandler(
  async (req: Request, res: Response) => {
    const questionId = parseInt(req.params.questionId);

    if (isNaN(questionId)) {
      throw new ValidationError("Invalid question ID");
    }

    try {
      await questionService.deleteQuestion(questionId);
      res.status(204).send();
    } catch (err) {
      if (err instanceof Error && err.message.includes("not found")) {
        throw new NotFoundError("Question");
      }
      throw err;
    }
  }
);
