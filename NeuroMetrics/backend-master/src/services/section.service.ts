/**
 * Section service layer.
 *
 * Handles business logic for section operations:
 * - Creating sections within tests
 * - Retrieving sections
 * - Updating sections
 * - Deleting sections
 * - Listing sections for a test
 */

import prisma from "../db/client.js";

/**
 * Create a new section within a test
 */
export async function createSection(
  testId: number,
  title: string,
  orderIndex: number,
  data: {
    description?: string;
    duration?: number | null;
    config?: Record<string, any> | null;
  }
) {
  // Verify test exists
  const test = await prisma.test.findUnique({
    where: { id: testId },
  });

  if (!test) {
    throw new Error("Test not found");
  }

  const section = await prisma.section.create({
    data: {
      testId,
      title,
      orderIndex,
      description: data.description,
      duration: data.duration,
      config: data.config,
    },
  });

  return formatSection(section);
}

/**
 * Get section by ID
 */
export async function getSectionById(sectionId: number) {
  const section = await prisma.section.findUnique({
    where: { id: sectionId },
  });

  if (!section) {
    throw new Error("Section not found");
  }

  return formatSection(section);
}

/**
 * List sections for a test
 */
export async function listSectionsByTest(testId: number) {
  // Verify test exists
  const test = await prisma.test.findUnique({
    where: { id: testId },
  });

  if (!test) {
    throw new Error("Test not found");
  }

  const sections = await prisma.section.findMany({
    where: { testId },
    orderBy: { orderIndex: "asc" },
  });

  return sections.map(formatSection);
}

/**
 * Update section
 */
export async function updateSection(
  sectionId: number,
  data: {
    title?: string;
    description?: string | null;
    orderIndex?: number;
    duration?: number | null;
    config?: Record<string, any> | null;
  }
) {
  const section = await prisma.section.update({
    where: { id: sectionId },
    data: {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.orderIndex !== undefined && { orderIndex: data.orderIndex }),
      ...(data.duration !== undefined && { duration: data.duration }),
      ...(data.config !== undefined && { config: data.config }),
    },
  });

  return formatSection(section);
}

/**
 * Delete section
 */
export async function deleteSection(sectionId: number) {
  await prisma.section.delete({
    where: { id: sectionId },
  });
}

/**
 * Get test ID for a section (for authorization checks)
 */
export async function getTestIdForSection(sectionId: number): Promise<number> {
  const section = await prisma.section.findUnique({
    where: { id: sectionId },
    select: { testId: true },
  });

  if (!section) {
    throw new Error("Section not found");
  }

  return section.testId;
}

/**
 * Format section response
 */
function formatSection(section: any) {
  return {
    id: section.id,
    testId: section.testId,
    title: section.title,
    description: section.description,
    orderIndex: section.orderIndex,
    duration: section.duration,
    config: section.config,
    createdAt: section.createdAt,
  };
}
