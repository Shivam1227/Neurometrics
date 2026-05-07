/**
 * Question validation schemas using Zod.
 *
 * Includes validators for:
 * - Question creation (QuestionCreate)
 * - Question updates (QuestionUpdate)
 */

import { z } from "zod";

/**
 * Schema for question creation
 */
export const QuestionCreateSchema = z.object({
  text: z.string().min(1, "Question text is required").max(5000, "Question text too long"),
  type: z.enum(["scmcq", "mcmcq", "numerical", "text", "file_upload"]),
  ans: z.string().optional().nullable(),
  maxScore: z.number().positive("Max score must be positive").default(1),
  negativeScore: z.number().nonnegative("Negative score cannot be negative").default(0),
  partialMarking: z.boolean().default(false),
  config: z.any().nullable().optional(),
});

export type QuestionCreateRequest = z.infer<typeof QuestionCreateSchema>;

/**
 * Schema for question updates (partial)
 */
export const QuestionUpdateSchema = z.object({
  text: z.string().min(1, "Question text is required").max(5000, "Question text too long").optional(),
  type: z.enum(["scmcq", "mcmcq", "numerical", "text", "file_upload"]).optional(),
  ans: z.string().optional().nullable(),
  maxScore: z.number().positive("Max score must be positive").optional(),
  negativeScore: z.number().nonnegative("Negative score cannot be negative").optional(),
  partialMarking: z.boolean().optional(),
  config: z.any().nullable().optional(),
});

export type QuestionUpdateRequest = z.infer<typeof QuestionUpdateSchema>;
