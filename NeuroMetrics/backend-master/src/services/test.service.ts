/**
 * Test service layer.
 *
 * Handles business logic for test operations:
 * - Creating tests
 * - Retrieving tests
 * - Updating tests
 * - Deleting tests
 * - Listing tests with pagination and filtering
 */

import prisma from "../db/client.js";

/**
 * Create a new test
 */
export async function createTest(
  title: string,
  userId: number,
  data: {
    description?: string;
    isActive?: boolean;
    duration?: number | null;
    allowNegativeMarking?: boolean;
    allowPartialMarking?: boolean;
    shuffleQuestions?: boolean;
    shuffleOptions?: boolean;
    test_specific_info?: Record<string, any> | null;
  }
) {
  const test = await prisma.test.create({
    data: {
      title,
      createdBy: userId,
      description: data.description,
      isActive: data.isActive ?? true,
      duration: data.duration,
      allowNegativeMarking: data.allowNegativeMarking ?? false,
      allowPartialMarking: data.allowPartialMarking ?? false,
      shuffleQuestions: data.shuffleQuestions ?? false,
      shuffleOptions: data.shuffleOptions ?? false,
      test_specific_info: data.test_specific_info as any,
    },
  });

  return formatTest(test);
}

/**
 * Get test by ID
 */
export async function getTestById(testId: number) {
  const test = await prisma.test.findUnique({
    where: { id: testId },
    include: {
      sections: {
        orderBy: { orderIndex: "asc" },
      },
    },
  });

  if (!test) {
    throw new Error("Test not found");
  }

  return {
    ...formatTest(test),
    sections: test.sections,
  };
}

/**
 * List tests with pagination and filtering
 */
export async function listTests(
  limit: number = 50,
  offset: number = 0,
  active?: boolean
) {
  const where = active !== undefined ? { isActive: active } : {};

  const [tests, total] = await Promise.all([
    prisma.test.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: { createdAt: "desc" },
    }),
    prisma.test.count({ where }),
  ]);

  return {
    items: tests.map(formatTest),
    total,
    limit,
    offset,
  };
}

/**
 * Update test
 */
export async function updateTest(
  testId: number,
  data: {
    title?: string;
    description?: string | null;
    isActive?: boolean;
    duration?: number | null;
    allowNegativeMarking?: boolean;
    allowPartialMarking?: boolean;
    shuffleQuestions?: boolean;
    shuffleOptions?: boolean;
    test_specific_info?: Record<string, any> | null;
  }
) {
  const test = await prisma.test.update({
    where: { id: testId },
    data: {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
      ...(data.duration !== undefined && { duration: data.duration }),
      ...(data.allowNegativeMarking !== undefined && {
        allowNegativeMarking: data.allowNegativeMarking,
      }),
      ...(data.allowPartialMarking !== undefined && {
        allowPartialMarking: data.allowPartialMarking,
      }),
      ...(data.shuffleQuestions !== undefined && {
        shuffleQuestions: data.shuffleQuestions,
      }),
      ...(data.shuffleOptions !== undefined && {
        shuffleOptions: data.shuffleOptions,
      }),
      ...(data.test_specific_info !== undefined && {
        test_specific_info: data.test_specific_info as any,
      }),
    },
  });

  return formatTest(test);
}

/**
 * Delete test
 */
export async function deleteTest(testId: number) {
  await prisma.test.delete({
    where: { id: testId },
  });
}

/**
 * Check if user can modify test (is creator or admin)
 */
export async function canModifyTest(testId: number, userId: number, userType: string): Promise<boolean> {
  if (userType === "admin") {
    return true;
  }

  const test = await prisma.test.findUnique({
    where: { id: testId },
    select: { createdBy: true },
  });

  return test?.createdBy === userId;
}

/**
 * Format test response
 */
function formatTest(test: any) {
  return {
    id: test.id,
    title: test.title,
    description: test.description,
    createdBy: test.createdBy,
    createdAt: test.createdAt,
    isActive: test.isActive,
    duration: test.duration,
    allowNegativeMarking: test.allowNegativeMarking,
    allowPartialMarking: test.allowPartialMarking,
    shuffleQuestions: test.shuffleQuestions,
    shuffleOptions: test.shuffleOptions,
    test_specific_info: test.test_specific_info as Record<string, any> | null,
  };
}
