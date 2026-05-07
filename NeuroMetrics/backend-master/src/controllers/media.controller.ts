/**
 * Media controller - handles media endpoints.
 *
 * Implements:
 * - POST /media - Upload media file
 * - GET /media - List media
 * - DELETE /media/:mediaId - Delete media
 * - POST /questions/:questionId/media/:mediaId - Attach to question
 * - DELETE /questions/:questionId/media/:mediaId - Detach from question
 * - POST /options/:optionId/media/:mediaId - Attach to option
 * - DELETE /options/:optionId/media/:mediaId - Detach from option
 */

import type { Request, Response } from "express";
import { z } from "zod";
import * as mediaService from "../services/media.service.js";
import {
  ValidationError,
  NotFoundError,
  asyncHandler,
} from "../middlewares/errorHandler.js";
import { MediaUploadSchema, MediaListSchema } from "../validators/media.validator.js";

/**
 * Upload media file
 * POST /media
 *
 * Returns presigned URL for client to upload directly to S3
 */
export const uploadMedia = asyncHandler(
  async (req: Request, res: Response) => {
    // Validate request
    let validatedData;
    try {
      validatedData = MediaUploadSchema.parse(req.body);
    } catch (err) {
      if (err instanceof z.ZodError) {
        const fieldErrors = err.issues.map((issue: any) => `${issue.path.join(".")}: ${issue.message}`);
        throw new ValidationError("Invalid media upload request", fieldErrors.join(", "));
      }
      throw err;
    }

    try {
      const mediaData = await mediaService.uploadMedia(
        req.file?.originalname || `media_${Date.now()}`,
        validatedData.type,
        validatedData.label
      );

      // Return presigned URL for client to use
      res.status(201).json({
        ...mediaService.formatMediaResponse(mediaData, mediaData.presignedUrl),
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to generate presigned URL";
      throw new ValidationError(errorMessage);
    }
  }
);

/**
 * List media
 * GET /media
 */
export const listMedia = asyncHandler(
  async (req: Request, res: Response) => {
    // Validate pagination
    let validatedParams;
    try {
      validatedParams = MediaListSchema.parse(req.query);
    } catch (err) {
      if (err instanceof z.ZodError) {
        const fieldErrors = err.issues.map((issue: any) => `${issue.path.join(".")}: ${issue.message}`);
        throw new ValidationError("Invalid pagination parameters", fieldErrors.join(", "));
      }
      throw err;
    }

    const result = await mediaService.listMedia(
      validatedParams.limit,
      validatedParams.offset
    );

    res.status(200).json({
      items: result.items.map((m: any) => mediaService.formatMediaResponse(m)),
      total: result.total,
      limit: result.limit,
      offset: result.offset,
    });
  }
);

/**
 * Delete media
 * DELETE /media/:mediaId
 */
export const deleteMedia = asyncHandler(
  async (req: Request, res: Response) => {
    const mediaId = parseInt(req.params.mediaId);

    if (isNaN(mediaId)) {
      throw new ValidationError("Invalid media ID");
    }

    try {
      await mediaService.deleteMedia(mediaId);
      res.status(204).send();
    } catch (err) {
      if (err instanceof Error && err.message.includes("not found")) {
        throw new NotFoundError("Media");
      }
      throw err;
    }
  }
);

/**
 * Download media - get presigned URL
 * GET /media/:mediaId/download
 */
export const downloadMedia = asyncHandler(
  async (req: Request, res: Response) => {
    const mediaId = parseInt(req.params.mediaId);

    if (isNaN(mediaId)) {
      throw new ValidationError("Invalid media ID");
    }

    try {
      const presignedUrl = await mediaService.getDownloadPresignedUrl(mediaId);
      res.status(200).json({
        presignedUrl,
        expiresIn: 300, // 5 minutes
      });
    } catch (err) {
      if (err instanceof Error && err.message.includes("not found")) {
        throw new NotFoundError("Media");
      }
      throw err;
    }
  }
);

/**
 * Attach media to question
 * POST /questions/:questionId/media/:mediaId
 */
export const attachToQuestion = asyncHandler(
  async (req: Request, res: Response) => {
    const questionId = parseInt(req.params.questionId);
    const mediaId = parseInt(req.params.mediaId);

    if (isNaN(questionId) || isNaN(mediaId)) {
      throw new ValidationError("Invalid question or media ID");
    }

    try {
      await mediaService.attachToQuestion(questionId, mediaId);
      res.status(204).send();
    } catch (err) {
      if (err instanceof Error && err.message.includes("not found")) {
        const resource = err.message.includes("Question")
          ? "Question"
          : "Media";
        throw new NotFoundError(resource);
      }
      throw err;
    }
  }
);

/**
 * Detach media from question
 * DELETE /questions/:questionId/media/:mediaId
 */
export const detachFromQuestion = asyncHandler(
  async (req: Request, res: Response) => {
    const questionId = parseInt(req.params.questionId);
    const mediaId = parseInt(req.params.mediaId);

    if (isNaN(questionId) || isNaN(mediaId)) {
      throw new ValidationError("Invalid question or media ID");
    }

    try {
      await mediaService.detachFromQuestion(questionId, mediaId);
      res.status(204).send();
    } catch (err) {
      if (err instanceof Error && err.message.includes("not found")) {
        throw new NotFoundError("Media attachment");
      }
      throw err;
    }
  }
);

/**
 * Attach media to option
 * POST /options/:optionId/media/:mediaId
 */
export const attachToOption = asyncHandler(
  async (req: Request, res: Response) => {
    const optionId = parseInt(req.params.optionId);
    const mediaId = parseInt(req.params.mediaId);

    if (isNaN(optionId) || isNaN(mediaId)) {
      throw new ValidationError("Invalid option or media ID");
    }

    try {
      await mediaService.attachToOption(optionId, mediaId);
      res.status(204).send();
    } catch (err) {
      if (err instanceof Error && err.message.includes("not found")) {
        const resource = err.message.includes("Option") ? "Option" : "Media";
        throw new NotFoundError(resource);
      }
      throw err;
    }
  }
);

/**
 * Detach media from option
 * DELETE /options/:optionId/media/:mediaId
 */
export const detachFromOption = asyncHandler(
  async (req: Request, res: Response) => {
    const optionId = parseInt(req.params.optionId);
    const mediaId = parseInt(req.params.mediaId);

    if (isNaN(optionId) || isNaN(mediaId)) {
      throw new ValidationError("Invalid option or media ID");
    }

    try {
      await mediaService.detachFromOption(optionId, mediaId);
      res.status(204).send();
    } catch (err) {
      if (err instanceof Error && err.message.includes("not found")) {
        throw new NotFoundError("Media attachment");
      }
      throw err;
    }
  }
);
