/**
 * Attempt service layer.
 *
 * Handles business logic for attempt operations:
 * - Starting attempts
 * - Retrieving attempts
 * - Listing attempts with pagination
 * - Submitting attempts
 * - Managing responses
 * - Auto-grading
 * - Manual grading
 * - Generating score reports
 */

import prisma from "../db/client.js";
import type { ATTEMPT_STATUS } from "@prisma/client";

/**
 * Start a new attempt for a user on a test
 */
export async function startAttempt(testId: number, userId: number) {
  // Verify test exists
  const test = await prisma.test.findUnique({
    where: { id: testId },
  });

  if (!test) {
    throw new Error("Test not found");
  }

  const attempt = await prisma.attempt.create({
    data: {
      testId,
      userId,
      status: "in_progress",
    },
  });

  return formatAttempt(attempt);
}

/**
 * Get attempt by ID with responses
 */
export async function getAttemptById(attemptId: number) {
  const attempt = await prisma.attempt.findUnique({
    where: { id: attemptId },
    include: {
      responses: {
        include: {
          question: true,
        },
      },
    },
  });

  if (!attempt) {
    throw new Error("Attempt not found");
  }

  return {
    ...formatAttempt(attempt),
    responses: attempt.responses.map(formatResponse),
  };
}

/**
 * List attempts with pagination
 */
export async function listAttempts(
  limit: number = 50,
  offset: number = 0,
  userId?: number
) {
  const where = userId ? { userId } : {};

  const [attempts, total] = await Promise.all([
    prisma.attempt.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: { startedAt: "desc" },
    }),
    prisma.attempt.count({ where }),
  ]);

  return {
    items: attempts.map(formatAttempt),
    total,
    limit,
    offset,
  };
}

/**
 * Submit an attempt (finalize it)
 */
export async function submitAttempt(attemptId: number, submitTime?: Date) {
  const attempt = await prisma.attempt.findUnique({
    where: { id: attemptId },
  });

  if (!attempt) {
    throw new Error("Attempt not found");
  }

  const updated = await prisma.attempt.update({
    where: { id: attemptId },
    data: {
      status: "submitted",
      submittedAt: submitTime || new Date(),
    },
  });

  return formatAttempt(updated);
}

/**
 * Create or update a response for a question in an attempt
 */
export async function submitResponse(
  attemptId: number,
  questionId: number,
  data: {
    selectedOptionIds?: number[] | null;
    answerText?: string | null;
    score?: number | null;
  }
) {
  // Verify attempt and question exist
  const [attempt, question] = await Promise.all([
    prisma.attempt.findUnique({ where: { id: attemptId } }),
    prisma.question.findUnique({ where: { id: questionId } }),
  ]);

  if (!attempt) {
    throw new Error("Attempt not found");
  }

  if (!question) {
    throw new Error("Question not found");
  }

  // Upsert response
  const response = await prisma.response.upsert({
    where: {
      attemptId_questionId: {
        attemptId,
        questionId,
      },
    },
    create: {
      attemptId,
      questionId,
      selectedOptionIds: data.selectedOptionIds || [],
      answerText: data.answerText || null,
      score: data.score ? parseFloat(data.score.toString()) : null,
      evaluated: false,
    },
    update: {
      selectedOptionIds: data.selectedOptionIds || [],
      answerText: data.answerText || null,
      score: data.score ? parseFloat(data.score.toString()) : null,
    },
  });

  return formatResponse(response);
}

/**
 * Get a response by ID
 */
export async function getResponseById(responseId: number) {
  const response = await prisma.response.findUnique({
    where: { id: responseId },
    include: {
      question: {
        include: {
          options: true,
        },
      },
    },
  });

  if (!response) {
    throw new Error("Response not found");
  }

  return formatResponse(response);
}

/**
 * List responses with filtering
 */
export async function listResponses(
  limit: number = 50,
  offset: number = 0,
  attemptId?: number,
  questionId?: number
) {
  const where: any = {};
  if (attemptId) where.attemptId = attemptId;
  if (questionId) where.questionId = questionId;

  const [responses, total] = await Promise.all([
    prisma.response.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: { id: "asc" },
      include: {
        question: true,
      },
    }),
    prisma.response.count({ where }),
  ]);

  return {
    items: responses.map(formatResponse),
    total,
    limit,
    offset,
  };
}

/**
 * Manually grade a response (evaluator provides score)
 */
export async function gradeResponse(
  responseId: number,
  score: number,
  comment?: string
) {
  const response = await prisma.response.findUnique({
    where: { id: responseId },
  });

  if (!response) {
    throw new Error("Response not found");
  }

  const updated = await prisma.response.update({
    where: { id: responseId },
    data: {
      score: parseFloat(score.toString()),
      evaluated: true,
    },
  });

  return formatResponse(updated);
}

/**
 * Auto-grade an attempt (evaluate server-side evaluable questions)
 */
export async function autoGradeAttempt(attemptId: number) {
  const attempt = await prisma.attempt.findUnique({
    where: { id: attemptId },
    include: {
      responses: {
        include: {
          question: {
            include: {
              options: true,
            },
          },
        },
      },
      test: true,
    },
  });

  if (!attempt) {
    throw new Error("Attempt not found");
  }

  let gradedCount = 0;
  let totalScore = 0;

  // Grade each response
  for (const response of attempt.responses) {
    const { question } = response;
    let score = 0;
    let canAutoGrade = false;

    // Auto-grade based on question type
    if (question.type === "scmcq" || question.type === "mcmcq") {
      canAutoGrade = true;
      const selectedIds = response.selectedOptionIds || [];

      if (question.type === "scmcq") {
        // Single choice MCQ - check if exactly one option selected and it's correct
        const correctOption = question.options.find((opt) => opt.isCorrect);
        if (selectedIds.length === 1 && selectedIds[0] === correctOption?.id) {
          score = Number(question.maxScore);
        } else if (selectedIds.length > 0) {
          score = Number(question.negativeScore);
        }
      } else if (question.type === "mcmcq") {
        // Multiple choice MCQ - use partial marking with weights
        let correctCount = 0;
        let incorrectCount = 0;

        for (const optionId of selectedIds) {
          const option = question.options.find((opt) => opt.id === optionId);
          if (option?.isCorrect) {
            correctCount++;
          } else {
            incorrectCount++;
          }
        }

        // Check all correct options are selected
        const allCorrectCount = question.options.filter(
          (opt) => opt.isCorrect
        ).length;

        if (attempt.test.allowPartialMarking && question.partialMarking) {
          // Partial marking with weights
          for (const optionId of selectedIds) {
            const option = question.options.find((opt) => opt.id === optionId);
            if (option?.isCorrect) {
              score += Number(option.weight) * Number(question.maxScore);
            }
          }
        } else {
          // All or nothing
          if (
            correctCount === allCorrectCount &&
            incorrectCount === 0 &&
            selectedIds.length === allCorrectCount
          ) {
            score = Number(question.maxScore);
          } else if (selectedIds.length > 0) {
            score = Number(question.negativeScore);
          }
        }
      }

      // Update response score
      await prisma.response.update({
        where: { id: response.id },
        data: {
          score: score,
          evaluated: true,
        },
      });

      gradedCount++;
      totalScore += score;
    } else if (question.type === "numerical") {
      // Numerical answer
      canAutoGrade = true;
      const userAnswer = response.answerText;
      const correctAnswer = question.ans;

      if (userAnswer && correctAnswer) {
        try {
          const userNum = parseFloat(userAnswer);
          const correctNum = parseFloat(correctAnswer);

          if (userNum === correctNum) {
            score = Number(question.maxScore);
          } else {
            score = Number(question.negativeScore);
          }

          await prisma.response.update({
            where: { id: response.id },
            data: {
              score: score,
              evaluated: true,
            },
          });

          gradedCount++;
          totalScore += score;
        } catch {
          // Invalid numerical values, skip auto-grading
        }
      }
    }
  }

  // Update attempt total score and status if all auto-gradable responses are graded
  const allResponses = await prisma.response.findMany({
    where: { attemptId },
    include: {
      question: true,
    },
  });

  const unevaluatedCount = allResponses.filter(
    (r) => !r.evaluated
  ).length;

  const updatedAttempt = await prisma.attempt.update({
    where: { id: attemptId },
    data: {
      totalScore: parseFloat(totalScore.toString()),
      status:
        unevaluatedCount === 0
          ? ("graded" as ATTEMPT_STATUS)
          : ("submitted" as ATTEMPT_STATUS),
    },
  });

  return {
    attempt: formatAttempt(updatedAttempt),
    graded_responses_count: gradedCount,
  };
}

/**
 * Get score report for an attempt
 */
export async function getAttemptScoreReport(attemptId: number) {
  const attempt = await prisma.attempt.findUnique({
    where: { id: attemptId },
    include: {
      responses: {
        include: {
          question: true,
        },
      },
    },
  });

  if (!attempt) {
    throw new Error("Attempt not found");
  }

  // Calculate total score
  let totalScore = 0;
  for (const response of attempt.responses) {
    if (response.score !== null) {
      totalScore += Number(response.score);
    }
  }

  return {
    attempt: formatAttempt(attempt),
    responses: attempt.responses.map(formatResponse),
    total_score: totalScore,
  };
}

/**
 * Format attempt response
 */
function formatAttempt(attempt: any): any {
  return {
    id: attempt.id,
    testId: attempt.testId,
    userId: attempt.userId,
    startedAt: attempt.startedAt,
    submittedAt: attempt.submittedAt,
    totalScore: attempt.totalScore ? Number(attempt.totalScore) : null,
    status: attempt.status,
  };
}

/**
 * Format response object
 */
function formatResponse(response: any): any {
  return {
    id: response.id,
    attemptId: response.attemptId,
    questionId: response.questionId,
    selectedOptionIds: response.selectedOptionIds || [],
    answerText: response.answerText,
    score: response.score ? Number(response.score) : null,
    evaluated: response.evaluated,
  };
}
