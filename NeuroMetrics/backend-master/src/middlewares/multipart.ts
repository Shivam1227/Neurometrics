/**
 * Multipart form data middleware for file uploads.
 *
 * Parses multipart/form-data requests and attaches file to req.file.
 */

import type { Request, Response, NextFunction } from "express";
import type { Readable } from "stream";
import Busboy from "busboy";

export interface UploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
}

/**
 * Middleware to handle multipart form data file uploads.
 * Stores file in req.file property.
 */
export const multipart =
  (fieldName = "file", maxFileSize = 50 * 1024 * 1024) =>
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.is("multipart/form-data")) {
      return next();
    }

    try {
      const bb = Busboy({
        headers: req.headers,
        limits: { fileSize: maxFileSize },
      });

      let fileReceived = false;
      let fileBuffer = Buffer.alloc(0);
      let fileName = "";
      let mimeType = "";
      const fields: Record<string, string> = {};

      bb.on("file", (fieldname: string, file: Readable, info: any) => {
        if (fieldname === fieldName && !fileReceived) {
          fileReceived = true;
          fileName = info.filename;
          mimeType = info.mimeType;

          file.on("data", (data: Buffer) => {
            fileBuffer = Buffer.concat([fileBuffer, data]);
          });

          file.on("error", (err: Error) => {
            res.status(413).json({
              error: {
                message: "File too large",
                statusCode: 413,
              },
            });
          });
        } else {
          // Ignore files not matching the expected field name
          file.resume();
        }
      });

      bb.on("field", (fieldname: string, val: string) => {
        // Collect all fields
        fields[fieldname] = val;
      });

      bb.on("close", () => {
        // Set req.body with collected fields
        req.body = { ...fields, ...req.body };

        if (fileReceived) {
          (req as any).file = {
            fieldname: fieldName,
            originalname: fileName,
            encoding: "",
            mimetype: mimeType,
            buffer: fileBuffer,
            size: fileBuffer.length,
          };
        }
        next();
      });

      bb.on("error", () => {
        res.status(400).json({
          error: {
            message: "Invalid multipart data",
            statusCode: 400,
          },
        });
      });

      req.pipe(bb);
    } catch (err) {
      next(err);
    }
  };
