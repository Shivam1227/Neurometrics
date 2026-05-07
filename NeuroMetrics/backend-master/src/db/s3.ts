/**
 * S3/MinIO client configuration
 *
 * Initializes AWS SDK S3 client for MinIO-compatible storage
 */

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import config from "../config/config.js";

/**
 * Initialize S3 client for MinIO
 */
export const s3Client = new S3Client({
  region: "us-east-1", // MinIO default region
  endpoint: config.s3.endpoint,
  credentials: {
    accessKeyId: config.s3.accessKeyId,
    secretAccessKey: config.s3.secretAccessKey,
  },
  forcePathStyle: true, // Required for MinIO
});

/**
 * S3 commands for common operations
 */
export {
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
};

/**
 * Get S3 bucket name
 */
export function getBucketName(): string {
  return config.s3.bucket;
}

/**
 * Generate S3 object key for media
 */
export function generateMediaKey(filename: string, mediaId: number): string {
  const timestamp = Date.now();
  const extension = filename.split(".").pop() || "bin";
  return `media/${mediaId}/${timestamp}.${extension}`;
}

/**
 * Generate public URL for S3 object
 */
export function generateMediaUrl(objectKey: string): string {
  return `${config.s3.endpoint}/${config.s3.bucket}/${objectKey}`;
}

/**
 * Generate presigned URL for uploading to S3 (PUT)
 * Valid for 5 minutes
 */
export async function generateUploadPresignedUrl(
  objectKey: string,
  contentType: string
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: getBucketName(),
    Key: objectKey,
    ContentType: contentType,
  });

  const url = await getSignedUrl(s3Client, command, { expiresIn: 300 }); // 5 minutes
  return url;
}

/**
 * Generate presigned URL for downloading from S3 (GET)
 * Valid for 5 minutes
 */
export async function generateDownloadPresignedUrl(
  objectKey: string
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: getBucketName(),
    Key: objectKey,
  });

  const url = await getSignedUrl(s3Client, command, { expiresIn: 300 }); // 5 minutes
  return url;
}
