/**
 * Media routes.
 *
 * Routes:
 * - POST /media - Upload media (protected) - returns presigned URL
 * - GET /media - List media (protected)
 * - GET /media/:mediaId/download - Download media presigned URL (protected)
 * - DELETE /media/:mediaId - Delete media (protected)
 * - POST /questions/:questionId/media/:mediaId - Attach to question (protected)
 * - DELETE /questions/:questionId/media/:mediaId - Detach from question (protected)
 * - POST /options/:optionId/media/:mediaId - Attach to option (protected)
 * - DELETE /options/:optionId/media/:mediaId - Detach from option (protected)
 */

import { Router } from "express";
import * as mediaController from "../controllers/media.controller.js";
import { authenticate } from "../middlewares/auth.js";

export const mediaRouter = Router();

// Protected media routes
mediaRouter.post("/media", authenticate, mediaController.uploadMedia);
mediaRouter.get("/media", authenticate, mediaController.listMedia);
mediaRouter.get("/media/:mediaId/download", authenticate, mediaController.downloadMedia);
mediaRouter.delete("/media/:mediaId", authenticate, mediaController.deleteMedia);

// Media attachment routes
mediaRouter.post("/questions/:questionId/media/:mediaId", authenticate, mediaController.attachToQuestion);
mediaRouter.delete("/questions/:questionId/media/:mediaId", authenticate, mediaController.detachFromQuestion);
mediaRouter.post("/options/:optionId/media/:mediaId", authenticate, mediaController.attachToOption);
mediaRouter.delete("/options/:optionId/media/:mediaId", authenticate, mediaController.detachFromOption);

export default mediaRouter;
