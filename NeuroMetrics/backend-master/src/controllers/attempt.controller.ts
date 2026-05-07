/**
 * Attempt controller - handles attempt, response, grading and reporting endpoints.
 *
 * Implements:
 * - POST /attempts - Start attempt
 * - GET /attempts - List user attempts
 * - GET /attempts/:attemptId - Get attempt with responses
 * - POST /attempts/:attemptId - Submit attempt
 * - POST /responses - Submit response
 * - GET /responses - List responses
 * - GET /responses/:responseId - Get response
 * - PATCH /responses/:responseId - Evaluate response (manual grading)
 * - POST /grading/auto - Auto-grade attempt
 * - POST /grading/manual - Manual grade response
 * - GET /reports/attempt/:attemptId/score - Get score report
 */

import type { Request, Response } from "express";
import { ZodError } from "zod";
import * as attemptService from "../services/attempt.service.js";
import {
  AttemptStartSchema,
  ResponseSubmitSchema,
  EvaluationRequestSchema,
  AutoGradingRequestSchema,
  AttemptSubmitSchema,
} from "../validators/attempt.validator.js";
import {
  ValidationError,
  NotFoundError,
  asyncHandler,
} from "../middlewares/errorHandler.js";

/**
 * Start an attempt
 * POST /attempts
 */
export const startAttempt = asyncHandler(async (req: Request, res: Response) => {
  // Validate request
  let validatedData;
  try {
    validatedData = AttemptStartSchema.parse(req.body);
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
    const attempt = await attemptService.startAttempt(
      validatedData.testId,
      userId
    );

    res.status(201).json(attempt);
  } catch (err) {
    if (err instanceof Error && err.message.includes("not found")) {
      throw new NotFoundError("Test");
    }
    throw err;
  }
});

/**
 * List user attempts
 * GET /attempts
 */
export const listAttempts = asyncHandler(async (req: Request, res: Response) => {
  const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
  const offset = parseInt(req.query.offset as string) || 0;
  const user_id = req.query.user_id
    ? parseInt(req.query.user_id as string)
    : undefined;

  const result = await attemptService.listAttempts(limit, offset, user_id);

  res.status(200).json(result);
});

/**
 * Get attempt by ID
 * GET /attempts/:attemptId
 */
export const getAttempt = asyncHandler(async (req: Request, res: Response) => {
  const attemptId = parseInt(req.params.attemptId);

  if (isNaN(attemptId)) {
    throw new ValidationError("Invalid attempt ID");
  }

  try {
    const attempt = await attemptService.getAttemptById(attemptId);
    res.status(200).json(attempt);
  } catch (err) {
    if (err instanceof Error && err.message.includes("not found")) {
      throw new NotFoundError("Attempt");
    }
    throw err;
  }
});

/**
 * Submit attempt
 * POST /attempts/:attemptId
 */
export const submitAttempt = asyncHandler(
  async (req: Request, res: Response) => {
    const attemptId = parseInt(req.params.attemptId);

    if (isNaN(attemptId)) {
      throw new ValidationError("Invalid attempt ID");
    }

    // Validate request
    let validatedData;
    try {
      validatedData = AttemptSubmitSchema.parse(req.body || {});
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
      const submitTime = validatedData.submit_time
        ? new Date(validatedData.submit_time)
        : undefined;
      const attempt = await attemptService.submitAttempt(
        attemptId,
        submitTime
      );

      res.status(200).json(attempt);
    } catch (err) {
      if (err instanceof Error && err.message.includes("not found")) {
        throw new NotFoundError("Attempt");
      }
      throw err;
    }
  }
);

/**
 * Submit response
 * POST /responses
 */
export const submitResponse = asyncHandler(
  async (req: Request, res: Response) => {
    // Validate request
    let validatedData;
    try {
      validatedData = ResponseSubmitSchema.parse(req.body);
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
      const response = await attemptService.submitResponse(
        validatedData.attemptId,
        validatedData.questionId,
        {
          selectedOptionIds: validatedData.selectedOptionIds,
          answerText: validatedData.answerText,
          score: validatedData.score,
        }
      );

      res.status(201).json(response);
    } catch (err) {
      if (err instanceof Error && err.message.includes("not found")) {
        throw new NotFoundError(
          err.message.includes("Attempt") ? "Attempt" : "Question"
        );
      }
      throw err;
    }
  }
);

/**
 * List responses
 * GET /responses
 */
export const listResponses = asyncHandler(
  async (req: Request, res: Response) => {
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const offset = parseInt(req.query.offset as string) || 0;
    const attempt_id = req.query.attempt_id
      ? parseInt(req.query.attempt_id as string)
      : undefined;
    const question_id = req.query.question_id
      ? parseInt(req.query.question_id as string)
      : undefined;

    const result = await attemptService.listResponses(
      limit,
      offset,
      attempt_id,
      question_id
    );

    res.status(200).json(result);
  }
);

/**
 * Get response by ID
 * GET /responses/:responseId
 */
export const getResponse = asyncHandler(async (req: Request, res: Response) => {
  const responseId = parseInt(req.params.responseId);

  if (isNaN(responseId)) {
    throw new ValidationError("Invalid response ID");
  }

  try {
    const response = await attemptService.getResponseById(responseId);
    res.status(200).json(response);
  } catch (err) {
    if (err instanceof Error && err.message.includes("not found")) {
      throw new NotFoundError("Response");
    }
    throw err;
  }
});

/**
 * Evaluate response (manual grading)
 * PATCH /responses/:responseId
 */
export const evaluateResponse = asyncHandler(
  async (req: Request, res: Response) => {
    const responseId = parseInt(req.params.responseId);

    if (isNaN(responseId)) {
      throw new ValidationError("Invalid response ID");
    }

    // Validate request
    let validatedData;
    try {
      validatedData = EvaluationRequestSchema.parse(req.body);
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
      const response = await attemptService.gradeResponse(
        validatedData.responseId,
        validatedData.score,
        validatedData.comment
      );

      res.status(200).json(response);
    } catch (err) {
      if (err instanceof Error && err.message.includes("not found")) {
        throw new NotFoundError("Response");
      }
      throw err;
    }
  }
);

/**
 * Auto-grade attempt
 * POST /grading/auto
 */
export const autoGradeAttempt = asyncHandler(
  async (req: Request, res: Response) => {
    // Validate request
    let validatedData;
    try {
      validatedData = AutoGradingRequestSchema.parse(req.body);
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
      const result = await attemptService.autoGradeAttempt(
        validatedData.attempt_id
      );

      res.status(200).json(result);
    } catch (err) {
      if (err instanceof Error && err.message.includes("not found")) {
        throw new NotFoundError("Attempt");
      }
      throw err;
    }
  }
);

/**
 * Manual grade response
 * POST /grading/manual
 */
export const manualGradeResponse = asyncHandler(
  async (req: Request, res: Response) => {
    // Validate request
    let validatedData;
    try {
      validatedData = EvaluationRequestSchema.parse(req.body);
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
      const response = await attemptService.gradeResponse(
        validatedData.responseId,
        validatedData.score,
        validatedData.comment
      );

      res.status(200).json(response);
    } catch (err) {
      if (err instanceof Error && err.message.includes("not found")) {
        throw new NotFoundError("Response");
      }
      throw err;
    }
  }
);

/**
 * Get score report for attempt
 * GET /reports/attempt/:attemptId/score
 */
export const getAttemptScoreReport = asyncHandler(
  async (req: Request, res: Response) => {
    const attemptId = parseInt(req.params.attemptId);

    if (isNaN(attemptId)) {
      throw new ValidationError("Invalid attempt ID");
    }

    try {
      const report = await attemptService.getAttemptScoreReport(attemptId);

      res.status(200).json(report);
    } catch (err) {
      if (err instanceof Error && err.message.includes("not found")) {
        throw new NotFoundError("Attempt");
      }
      throw err;
    }
  }
);
