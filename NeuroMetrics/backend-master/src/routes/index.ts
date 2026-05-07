/**
 * Main router.
 *
 * Mounts all feature routers to the application.
 */

import { Router } from "express";
import authRouter from "./auth.js";
import testsRouter from "./tests.js";
import mediaRouter from "./media.js";
import attemptsRouter from "./attempts.js";

const router = Router();

// Mount auth/user routes
router.use(authRouter);

// Mount test/section routes
router.use(testsRouter);

// Mount media routes
router.use(mediaRouter);

// Mount attempt/response/grading/reporting routes
router.use(attemptsRouter);

export default router;
