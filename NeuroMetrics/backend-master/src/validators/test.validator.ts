/**
 * Test validation schemas using Zod.
 *
 * Includes validators for:
 * - Test creation (TestCreate)
 * - Test updates (TestUpdate)
 */

import { z } from "zod";

/**
 * Schema for test creation
 */
export const TestCreateSchema = z.object({
  title: z.string().min(1, "Title is required").max(255, "Title too long"),
  description: z.string().max(1000, "Description too long").optional(),
  isActive: z.boolean().default(true).optional(),
  duration: z.number().int().positive("Duration must be positive").nullable().optional(),
  allowNegativeMarking: z.boolean().default(false).optional(),
  allowPartialMarking: z.boolean().default(false).optional(),
  shuffleQuestions: z.boolean().default(false).optional(),
  shuffleOptions: z.boolean().default(false).optional(),
  test_specific_info: z.record(z.string(), z.any()).nullable().optional(),
});

export type TestCreateRequest = z.infer<typeof TestCreateSchema>;

/**
 * Schema for test updates (partial)
 */
export const TestUpdateSchema = z.object({
  title: z.string().min(1, "Title is required").max(255, "Title too long").optional(),
  description: z.string().max(1000, "Description too long").nullable().optional(),
  isActive: z.boolean().optional(),
  duration: z.number().int().positive("Duration must be positive").nullable().optional(),
  allowNegativeMarking: z.boolean().optional(),
  allowPartialMarking: z.boolean().optional(),
  shuffleQuestions: z.boolean().optional(),
  shuffleOptions: z.boolean().optional(),
  test_specific_info: z.record(z.string(), z.any()).nullable().optional(),
});

export type TestUpdateRequest = z.infer<typeof TestUpdateSchema>;
