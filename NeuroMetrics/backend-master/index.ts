import "dotenv/config";
import createApp from "./src/app.js";
import config from "./src/config/config.js";
import logger from "./src/utils/logger.js";
import { initializeDatabase } from "./src/db/init.js";

// Initialize database and start server
async function startServer() {
  try {
    // Initialize database (connect + ensure admin user)
    await initializeDatabase();

    // Create and start Express app
    const app = createApp();
    const PORT = config.PORT;

    app.listen(PORT, () => {
      logger.info(`Server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
