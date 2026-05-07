/**
 * Attempt validation schemas using Zod.
 *
 * Includes validators for:
 * - Attempt start (AttemptStartRequest)
 * - Response submission (ResponseSubmit)
 * - Response evaluation (EvaluationRequest)
 */

import { z } from "zod";

/**
 * Schema for starting an attempt
 */
export const AttemptStartSchema = z.object({
  testId: z.number().int().positive("Test ID must be a positive integer"),
});

export type AttemptStartRequest = z.infer<typeof AttemptStartSchema>;

/**
 * Schema for submitting a response
 */
export const ResponseSubmitSchema = z.object({
  attemptId: z.number().int().positive("Attempt ID must be a positive integer"),
  questionId: z.number().int().positive("Question ID must be a positive integer"),
  selectedOptionIds: z.array(z.number().int().positive()).optional().nullable(),
  answerText: z.string().optional().nullable(),
  score: z.number().optional().nullable(),
});

export type ResponseSubmitRequest = z.infer<typeof ResponseSubmitSchema>;

/**
 * Schema for evaluating a response (manual grading)
 */
export const EvaluationRequestSchema = z.object({
  responseId: z.number().int().positive("Response ID must be a positive integer"),
  score: z.number().min(0, "Score cannot be negative"),
  comment: z.string().optional(),
});

export type EvaluationRequest = z.infer<typeof EvaluationRequestSchema>;

/**
 * Schema for auto-grading request
 */
export const AutoGradingRequestSchema = z.object({
  attempt_id: z.number().int().positive("Attempt ID must be a positive integer"),
});

export type AutoGradingRequest = z.infer<typeof AutoGradingRequestSchema>;

/**
 * Schema for submit attempt request
 */
export const AttemptSubmitSchema = z.object({
  submit_time: z.string().datetime().optional(),
});

export type AttemptSubmitRequest = z.infer<typeof AttemptSubmitSchema>;
