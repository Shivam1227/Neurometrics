/**
 * Option service layer.
 *
 * Handles business logic for option operations:
 * - Creating options for questions
 * - Retrieving options
 * - Updating options
 * - Deleting options
 * - Listing options for a question
 */

import prisma from "../db/client.js";

/**
 * Create a new option for a question
 */
export async function createOption(
  questionId: number,
  data: {
    text?: string | null;
    isCorrect?: boolean;
    weight?: number;
    config?: Record<string, any> | null;
  }
) {
  // Verify question exists
  const question = await prisma.question.findUnique({
    where: { id: questionId },
  });

  if (!question) {
    throw new Error("Question not found");
  }

  const option = await prisma.option.create({
    data: {
      questionId,
      text: data.text,
      isCorrect: data.isCorrect ?? false,
      weight: data.weight ?? 0,
      config: data.config,
    },
  });

  return formatOption(option);
}

/**
 * Get option by ID
 */
export async function getOptionById(optionId: number) {
  const option = await prisma.option.findUnique({
    where: { id: optionId },
    include: {
      mediaLinks: {
        include: { media: true },
      },
    },
  });

  if (!option) {
    throw new Error("Option not found");
  }

  return formatOptionWithRelations(option);
}

/**
 * List options for a question
 */
export async function listOptionsByQuestion(questionId: number) {
  // Verify question exists
  const question = await prisma.question.findUnique({
    where: { id: questionId },
  });

  if (!question) {
    throw new Error("Question not found");
  }

  const options = await prisma.option.findMany({
    where: { questionId },
    include: {
      mediaLinks: {
        include: { media: true },
      },
    },
  });

  return options.map(formatOptionWithRelations);
}

/**
 * Update option
 */
export async function updateOption(
  optionId: number,
  data: {
    text?: string | null;
    isCorrect?: boolean;
    weight?: number;
    config?: Record<string, any> | null;
  }
) {
  const option = await prisma.option.update({
    where: { id: optionId },
    data: {
      ...(data.text !== undefined && { text: data.text }),
      ...(data.isCorrect !== undefined && { isCorrect: data.isCorrect }),
      ...(data.weight !== undefined && { weight: data.weight }),
      ...(data.config !== undefined && { config: data.config }),
    },
  });

  return formatOption(option);
}

/**
 * Delete option
 */
export async function deleteOption(optionId: number) {
  await prisma.option.delete({
    where: { id: optionId },
  });
}

/**
 * Get question ID for an option (for authorization checks)
 */
export async function getQuestionIdForOption(optionId: number): Promise<number> {
  const option = await prisma.option.findUnique({
    where: { id: optionId },
    select: { questionId: true },
  });

  if (!option) {
    throw new Error("Option not found");
  }

  return option.questionId;
}

/**
 * Format option response
 */
function formatOption(option: any) {
  return {
    id: option.id,
    questionId: option.questionId,
    text: option.text,
    isCorrect: option.isCorrect,
    weight: Number(option.weight),
    config: option.config,
  };
}

/**
 * Format option response with relations
 */
function formatOptionWithRelations(option: any) {
  return {
    id: option.id,
    questionId: option.questionId,
    text: option.text,
    isCorrect: option.isCorrect,
    weight: Number(option.weight),
    config: option.config,
    media: option.mediaLinks.map((link: any) => ({
      id: link.media.id,
      filename: link.media.filename,
      label: link.media.label,
      type: link.media.type,
      url: link.media.url,
      version: link.media.version,
    })),
  };
}
