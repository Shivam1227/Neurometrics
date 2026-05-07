/**
 * Database initialization utilities.
 * 
 * Handles setup tasks like ensuring the admin user exists.
 */

import prisma from "./client.js";
import { hashPassword } from "../services/user.service.js";
import config from "../config/config.js";
import logger from "../utils/logger.js";

/**
 * Ensure the admin user exists.
 * 
 * This function will:
 * 1. Delete the admin user if it exists
 * 2. Create a fresh admin user with credentials from environment variables
 * 
 * This ensures we always have a root admin account available.
 */
export async function ensureAdminUser(): Promise<void> {
  try {
    const adminEmail = config.ADMIN_EMAIL;
    const adminPassword = config.ADMIN_PASSWORD;

    logger.info(`Ensuring admin user exists with email: ${adminEmail}`);

    // Delete existing admin user if it exists
    const existingUser = await prisma.user.findUnique({
      where: { email: adminEmail },
    });

    if (existingUser) {
      logger.info(`Deleting existing user with email: ${adminEmail}`);
      await prisma.user.delete({
        where: { email: adminEmail },
      });
    }

    // Create the admin user
    const hashedPassword = hashPassword(adminPassword);
    
    const adminUser = await prisma.user.create({
      data: {
        email: adminEmail,
        name: "Admin",
        password: hashedPassword,
        type: "admin",
      },
    });

    logger.info(`Admin user created successfully with ID: ${adminUser.id}`);
  } catch (error) {
    logger.error("Failed to ensure admin user:", error);
    throw error;
  }
}

/**
 * Initialize the database (connect and run setup tasks)
 */
export async function initializeDatabase(): Promise<void> {
  try {
    // Test database connection
    await prisma.$connect();
    logger.info("Database connected successfully");

    // Ensure admin user exists
    await ensureAdminUser();

    logger.info("Database initialization complete");
  } catch (error) {
    logger.error("Database initialization failed:", error);
    throw error;
  }
}

