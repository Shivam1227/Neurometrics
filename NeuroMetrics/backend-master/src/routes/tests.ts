/**
 * Tests and sections routes.
 *
 * Routes:
 * - GET /tests - List tests
 * - POST /tests - Create test (protected)
 * - GET /tests/:testId - Get test
 * - PATCH /tests/:testId - Update test (protected, creator/admin)
 * - DELETE /tests/:testId - Delete test (protected, creator/admin)
 * - POST /tests/:testId/sections - Create section (protected, creator/admin)
 * - GET /tests/:testId/sections - List sections
 * - GET /sections/:sectionId - Get section
 * - PATCH /sections/:sectionId - Update section (protected, creator/admin)
 * - DELETE /sections/:sectionId - Delete section (protected, creator/admin)
 * - POST /sections/:sectionId/questions - Create question (protected, creator/admin)
 * - GET /sections/:sectionId/questions - List questions
 * - GET /questions/:questionId - Get question
 * - PATCH /questions/:questionId - Update question (protected, creator/admin)
 * - DELETE /questions/:questionId - Delete question (protected, creator/admin)
 * - POST /questions/:questionId/options - Create option (protected, creator/admin)
 * - GET /questions/:questionId/options - List options
 * - PATCH /options/:optionId - Update option (protected, creator/admin)
 * - DELETE /options/:optionId - Delete option (protected, creator/admin)
 */

import { Router } from "express";
import * as testController from "../controllers/test.controller.js";
import * as sectionController from "../controllers/section.controller.js";
import * as questionController from "../controllers/question.controller.js";
import * as optionController from "../controllers/option.controller.js";
import { authenticate } from "../middlewares/auth.js";
import {
  requireTestModifyPermission,
  requireSectionModifyPermission,
  requireQuestionModifyPermission,
  requireOptionModifyPermission,
} from "../middlewares/testAuthorization.js";

export const testsRouter = Router();

// Public test routes
testsRouter.get("/tests", testController.listTests);
testsRouter.get("/tests/:testId", testController.getTest);

// Protected test routes
testsRouter.post("/tests", authenticate, testController.createTest);
testsRouter.patch(
  "/tests/:testId",
  authenticate,
  requireTestModifyPermission,
  testController.updateTest
);
testsRouter.delete(
  "/tests/:testId",
  authenticate,
  requireTestModifyPermission,
  testController.deleteTest
);

// Protected section routes within test
testsRouter.post(
  "/tests/:testId/sections",
  authenticate,
  requireTestModifyPermission,
  testController.createSection
);
testsRouter.get("/tests/:testId/sections", testController.listSections);

// Public section routes
testsRouter.get("/sections/:sectionId", sectionController.getSection);

// Protected section modification routes
testsRouter.patch(
  "/sections/:sectionId",
  authenticate,
  requireSectionModifyPermission,
  sectionController.updateSection
);
testsRouter.delete(
  "/sections/:sectionId",
  authenticate,
  requireSectionModifyPermission,
  sectionController.deleteSection
);

// Protected question routes within section
testsRouter.post(
  "/sections/:sectionId/questions",
  authenticate,
  requireSectionModifyPermission,
  questionController.createQuestion
);
testsRouter.get("/sections/:sectionId/questions", questionController.listQuestions);

// Public question routes
testsRouter.get("/questions/:questionId", questionController.getQuestion);

// Protected question modification routes
testsRouter.patch(
  "/questions/:questionId",
  authenticate,
  requireQuestionModifyPermission,
  questionController.updateQuestion
);
testsRouter.delete(
  "/questions/:questionId",
  authenticate,
  requireQuestionModifyPermission,
  questionController.deleteQuestion
);

// Protected option routes within question
testsRouter.post(
  "/questions/:questionId/options",
  authenticate,
  requireQuestionModifyPermission,
  optionController.createOption
);
testsRouter.get("/questions/:questionId/options", optionController.listOptions);

// Protected option modification routes
testsRouter.patch(
  "/options/:optionId",
  authenticate,
  requireOptionModifyPermission,
  optionController.updateOption
);
testsRouter.delete(
  "/options/:optionId",
  authenticate,
  requireOptionModifyPermission,
  optionController.deleteOption
);

export default testsRouter;
