/**
 * Question service layer.
 *
 * Handles business logic for question operations:
 * - Creating questions within sections
 * - Retrieving questions
 * - Updating questions
 * - Deleting questions
 * - Listing questions for a section
 */

import prisma from "../db/client.js";

/**
 * Create a new question within a section
 */
export async function createQuestion(
  sectionId: number,
  text: string,
  type: string,
  data: {
    ans?: string | null;
    maxScore?: number;
    negativeScore?: number;
    partialMarking?: boolean;
    config?: Record<string, any> | null;
  }
) {
  // Verify section exists
  const section = await prisma.section.findUnique({
    where: { id: sectionId },
  });

  if (!section) {
    throw new Error("Section not found");
  }

  const question = await prisma.question.create({
    data: {
      sectionId,
      text,
      type: type as any,
      ans: data.ans,
      maxScore: data.maxScore || 1,
      negativeScore: data.negativeScore || 0,
      partialMarking: data.partialMarking ?? false,
      config: data.config,
    },
  });

  return formatQuestion(question);
}

/**
 * Get question by ID
 */
export async function getQuestionById(questionId: number) {
  const question = await prisma.question.findUnique({
    where: { id: questionId },
    include: {
      options: true,
      mediaLinks: {
        include: { media: true },
      },
    },
  });

  if (!question) {
    throw new Error("Question not found");
  }

  return formatQuestionWithRelations(question);
}

/**
 * List questions for a section
 */
export async function listQuestionsBySection(sectionId: number) {
  // Verify section exists
  const section = await prisma.section.findUnique({
    where: { id: sectionId },
  });

  if (!section) {
    throw new Error("Section not found");
  }

  const questions = await prisma.question.findMany({
    where: { sectionId },
    include: {
      options: true,
      mediaLinks: {
        include: { media: true },
      },
    },
  });

  return questions.map(formatQuestionWithRelations);
}

/**
 * Update question
 */
export async function updateQuestion(
  questionId: number,
  data: {
    text?: string;
    type?: string;
    ans?: string | null;
    maxScore?: number;
    negativeScore?: number;
    partialMarking?: boolean;
    config?: Record<string, any> | null;
  }
) {
  const question = await prisma.question.update({
    where: { id: questionId },
    data: {
      ...(data.text !== undefined && { text: data.text }),
      ...(data.type !== undefined && { type: data.type as any }),
      ...(data.ans !== undefined && { ans: data.ans }),
      ...(data.maxScore !== undefined && { maxScore: data.maxScore }),
      ...(data.negativeScore !== undefined && { negativeScore: data.negativeScore }),
      ...(data.partialMarking !== undefined && { partialMarking: data.partialMarking }),
      ...(data.config !== undefined && { config: data.config }),
    },
  });

  return formatQuestion(question);
}

/**
 * Delete question
 */
export async function deleteQuestion(questionId: number) {
  await prisma.question.delete({
    where: { id: questionId },
  });
}

/**
 * Get section ID for a question (for authorization checks)
 */
export async function getSectionIdForQuestion(questionId: number): Promise<number> {
  const question = await prisma.question.findUnique({
    where: { id: questionId },
    select: { sectionId: true },
  });

  if (!question) {
    throw new Error("Question not found");
  }

  return question.sectionId;
}

/**
 * Format question response
 */
function formatQuestion(question: any) {
  return {
    id: question.id,
    sectionId: question.sectionId,
    text: question.text,
    type: question.type,
    ans: question.ans,
    maxScore: Number(question.maxScore),
    negativeScore: Number(question.negativeScore),
    partialMarking: question.partialMarking,
    config: question.config,
    createdAt: question.createdAt,
  };
}

/**
 * Format question response with relations
 */
function formatQuestionWithRelations(question: any) {
  return {
    id: question.id,
    sectionId: question.sectionId,
    text: question.text,
    type: question.type,
    ans: question.ans,
    maxScore: Number(question.maxScore),
    negativeScore: Number(question.negativeScore),
    partialMarking: question.partialMarking,
    config: question.config,
    createdAt: question.createdAt,
    options: question.options.map((opt: any) => ({
      id: opt.id,
      questionId: opt.questionId,
      text: opt.text,
      isCorrect: opt.isCorrect,
      weight: Number(opt.weight),
      config: opt.config,
    })),
    media: question.mediaLinks.map((link: any) => ({
      id: link.media.id,
      filename: link.media.filename,
      label: link.media.label,
      type: link.media.type,
      url: link.media.url,
      version: link.media.version,
    })),
  };
}
