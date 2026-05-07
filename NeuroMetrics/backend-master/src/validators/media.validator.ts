/**
 * Media validation schemas using Zod.
 *
 * Validates:
 * - Media upload metadata
 * - Media attachment operations
 */

import { z } from "zod";

/**
 * Media file type enum
 */
export const MediaFileTypeSchema = z.enum([
  "image",
  "video",
  "audio",
  "interactive",
]);

/**
 * Schema for media upload metadata
 */
export const MediaUploadSchema = z.object({
  type: MediaFileTypeSchema,
  label: z.string().optional(),
});

export type MediaUploadInput = z.infer<typeof MediaUploadSchema>;

/**
 * Schema for attaching media to question
 */
export const AttachToQuestionSchema = z.object({
  questionId: z.coerce.number().int().positive(),
  mediaId: z.coerce.number().int().positive(),
});

export type AttachToQuestionInput = z.infer<typeof AttachToQuestionSchema>;

/**
 * Schema for attaching media to option
 */
export const AttachToOptionSchema = z.object({
  optionId: z.coerce.number().int().positive(),
  mediaId: z.coerce.number().int().positive(),
});

export type AttachToOptionInput = z.infer<typeof AttachToOptionSchema>;

/**
 * Schema for listing media with pagination
 */
export const MediaListSchema = z.object({
  limit: z.coerce.number().int().positive().default(50),
  offset: z.coerce.number().int().nonnegative().default(0),
});

export type MediaListInput = z.infer<typeof MediaListSchema>;
