/**
 * Section validation schemas using Zod.
 *
 * Includes validators for:
 * - Section creation (SectionCreate)
 * - Section updates (SectionUpdate)
 */

import { z } from "zod";

/**
 * Schema for section creation
 */
export const SectionCreateSchema = z.object({
  title: z.string().min(1, "Title is required").max(255, "Title too long"),
  description: z.string().max(1000, "Description too long").optional(),
  orderIndex: z.number().int().nonnegative("Order index must be non-negative"),
  duration: z.number().int().positive("Duration must be positive").nullable().optional(),
  config: z.any().nullable().optional(),
});

export type SectionCreateRequest = z.infer<typeof SectionCreateSchema>;

/**
 * Schema for section updates (partial)
 */
export const SectionUpdateSchema = z.object({
  title: z.string().min(1, "Title is required").max(255, "Title too long").optional(),
  description: z.string().max(1000, "Description too long").nullable().optional(),
  orderIndex: z.number().int().nonnegative("Order index must be non-negative").optional(),
  duration: z.number().int().positive("Duration must be positive").nullable().optional(),
  config: z.any().nullable().optional(),
});

export type SectionUpdateRequest = z.infer<typeof SectionUpdateSchema>;
