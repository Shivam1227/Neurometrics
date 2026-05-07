/**
 * Media service layer.
 *
 * Handles business logic for media operations:
 * - Uploading media files to S3
 * - Downloading/retrieving media
 * - Listing media
 * - Attaching media to questions and options
 * - Detaching media from questions and options
 */

import prisma from "../db/client.js";
import {
  s3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  generateMediaKey,
  generateMediaUrl,
  getBucketName,
  generateUploadPresignedUrl,
  generateDownloadPresignedUrl,
} from "../db/s3.js";
import type { MEDIA_FILE } from "@prisma/client";

// Allow mocking S3 in tests
let mockS3Enabled = false;

export function enableMockS3() {
  mockS3Enabled = true;
}

export function disableMockS3() {
  mockS3Enabled = false;
}

/**
 * Upload media file to S3 - returns presigned URL for client to use
 * Client uploads directly to S3 using the presigned URL
 */
export async function uploadMedia(
  filename: string,
  fileType: MEDIA_FILE,
  label?: string
): Promise<any> {
  // Create media record in database
  const media = await prisma.media.create({
    data: {
      filename,
      label,
      type: fileType,
    },
  });

  try {
    // Generate S3 key
    const objectKey = generateMediaKey(filename, media.id);
    const contentType = getContentType(fileType);

    // Generate presigned URL for upload (5 minutes)
    const presignedUrl = await generateUploadPresignedUrl(objectKey, contentType);

    // Update media record with version (key) but not URL yet
    // The URL will be set once the client uploads via presigned URL
    const updatedMedia = await prisma.media.update({
      where: { id: media.id },
      data: {
        version: objectKey,
      },
    });

    return {
      ...updatedMedia,
      presignedUrl, // Return presigned URL for client to upload
    };
  } catch (error) {
    // Delete media record if presigned URL generation fails
    await prisma.media.delete({
      where: { id: media.id },
    });
    throw error;
  }
}

/**
 * Get download presigned URL for a media file
 */
export async function getDownloadPresignedUrl(mediaId: number): Promise<string> {
  const media = await prisma.media.findUnique({
    where: { id: mediaId },
  });

  if (!media) {
    throw new Error("Media not found");
  }

  if (!media.version) {
    throw new Error("Media file not yet uploaded");
  }

  // Generate presigned URL for download (5 minutes)
  const presignedUrl = await generateDownloadPresignedUrl(media.version);
  return presignedUrl;
}

/**
 * Delete media file from S3 and database
 */
export async function deleteMedia(mediaId: number): Promise<void> {
  const media = await prisma.media.findUnique({
    where: { id: mediaId },
  });

  if (!media) {
    throw new Error("Media not found");
  }

  // Delete from S3 if version (key) exists (skip if mocked)
  if (media.version && !mockS3Enabled) {
    const command = new DeleteObjectCommand({
      Bucket: getBucketName(),
      Key: media.version,
    });
    await s3Client.send(command);
  }

  // Delete from database
  await prisma.media.delete({
    where: { id: mediaId },
  });
}

/**
 * Get media by ID
 */
export async function getMediaById(mediaId: number): Promise<any> {
  const media = await prisma.media.findUnique({
    where: { id: mediaId },
  });

  if (!media) {
    throw new Error("Media not found");
  }

  return media;
}

/**
 * List media with pagination
 */
export async function listMedia(
  limit: number = 50,
  offset: number = 0
): Promise<{ items: any[]; total: number; limit: number; offset: number }> {
  const [items, total] = await Promise.all([
    prisma.media.findMany({
      take: limit,
      skip: offset,
      orderBy: { id: "desc" },
    }),
    prisma.media.count(),
  ]);

  return { items, total, limit, offset };
}

/**
 * Attach media to question
 */
export async function attachToQuestion(
  questionId: number,
  mediaId: number
): Promise<void> {
  // Verify question exists
  const question = await prisma.question.findUnique({
    where: { id: questionId },
  });

  if (!question) {
    throw new Error("Question not found");
  }

  // Verify media exists
  const media = await prisma.media.findUnique({
    where: { id: mediaId },
  });

  if (!media) {
    throw new Error("Media not found");
  }

  // Create link
  await prisma.questionMedia.create({
    data: {
      questionId,
      mediaId,
    },
  });
}

/**
 * Detach media from question
 */
export async function detachFromQuestion(
  questionId: number,
  mediaId: number
): Promise<void> {
  await prisma.questionMedia.delete({
    where: {
      questionId_mediaId: {
        questionId,
        mediaId,
      },
    },
  });
}

/**
 * Attach media to option
 */
export async function attachToOption(
  optionId: number,
  mediaId: number
): Promise<void> {
  // Verify option exists
  const option = await prisma.option.findUnique({
    where: { id: optionId },
  });

  if (!option) {
    throw new Error("Option not found");
  }

  // Verify media exists
  const media = await prisma.media.findUnique({
    where: { id: mediaId },
  });

  if (!media) {
    throw new Error("Media not found");
  }

  // Create link
  await prisma.optionMedia.create({
    data: {
      optionId,
      mediaId,
    },
  });
}

/**
 * Detach media from option
 */
export async function detachFromOption(
  optionId: number,
  mediaId: number
): Promise<void> {
  await prisma.optionMedia.delete({
    where: {
      optionId_mediaId: {
        optionId,
        mediaId,
      },
    },
  });
}

/**
 * Get content type based on media file type
 */
function getContentType(fileType: MEDIA_FILE): string {
  const contentTypes: Record<MEDIA_FILE, string> = {
    image: "image/jpeg",
    video: "video/mp4",
    audio: "audio/mpeg",
    interactive: "application/json",
  };
  return contentTypes[fileType] || "application/octet-stream";
}

/**
 * Confirm media file upload - called after client uploads via presigned URL
 * Sets the final URL for the media file
 */
export async function confirmMediaUpload(mediaId: number): Promise<any> {
  const media = await prisma.media.findUnique({
    where: { id: mediaId },
  });

  if (!media) {
    throw new Error("Media not found");
  }

  if (!media.version) {
    throw new Error("Media file key not found");
  }

  // Generate final URL
  const url = generateMediaUrl(media.version);

  // Update media record with URL
  const updatedMedia = await prisma.media.update({
    where: { id: mediaId },
    data: {
      url,
    },
  });

  return formatMediaResponse(updatedMedia);
}
export function formatMediaResponse(media: any, presignedUrl?: string): any {
  return {
    id: media.id,
    filename: media.filename,
    label: media.label,
    type: media.type,
    url: media.url,
    version: media.version,
    ...(presignedUrl && { presignedUrl }),
  };
}
