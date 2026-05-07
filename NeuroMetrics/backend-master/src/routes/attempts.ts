/**
 * Attempts, responses, grading and reporting routes.
 *
 * Routes:
 * - POST /attempts - Start attempt (protected)
 * - GET /attempts - List attempts (protected)
 * - GET /attempts/:attemptId - Get attempt (protected)
 * - POST /attempts/:attemptId - Submit attempt (protected)
 * - POST /responses - Submit response (protected)
 * - GET /responses - List responses (protected)
 * - GET /responses/:responseId - Get response (protected)
 * - PATCH /responses/:responseId - Evaluate response (protected, evaluator/admin)
 * - POST /grading/auto - Auto-grade attempt (protected, admin/tester)
 * - POST /grading/manual - Manual grade response (protected, evaluator/admin)
 * - GET /reports/attempt/:attemptId/score - Get score report (protected)
 */

import { Router } from "express";
import * as attemptController from "../controllers/attempt.controller.js";
import { authenticate } from "../middlewares/auth.js";
import {
  requireTesterOrAdmin,
} from "../middlewares/authorization.js";

export const attemptsRouter = Router();

// Protected attempt routes
attemptsRouter.post("/attempts", authenticate, attemptController.startAttempt);
attemptsRouter.get("/attempts", authenticate, attemptController.listAttempts);
attemptsRouter.get("/attempts/:attemptId", authenticate, attemptController.getAttempt);
attemptsRouter.post("/attempts/:attemptId", authenticate, attemptController.submitAttempt);

// Protected response routes
attemptsRouter.post("/responses", authenticate, attemptController.submitResponse);
attemptsRouter.get("/responses", authenticate, attemptController.listResponses);
attemptsRouter.get("/responses/:responseId", authenticate, attemptController.getResponse);
attemptsRouter.patch("/responses/:responseId", authenticate, attemptController.evaluateResponse);

// Protected grading routes
attemptsRouter.post("/grading/auto", authenticate, requireTesterOrAdmin, attemptController.autoGradeAttempt);
attemptsRouter.post("/grading/manual", authenticate, requireTesterOrAdmin, attemptController.manualGradeResponse);

// Protected reporting routes
attemptsRouter.get("/reports/attempt/:attemptId/score", authenticate, attemptController.getAttemptScoreReport);

export default attemptsRouter;
