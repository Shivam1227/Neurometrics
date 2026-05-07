/**
 * Logger utility.
 *
 * Simple logging functions for the application.
 */

export const logger = {
  info: (message: string, data?: any) => {
    console.log(`[INFO] ${message}`, data ? data : "");
  },
  error: (message: string, err?: any) => {
    console.error(`[ERROR] ${message}`, err ? err : "");
  },
  warn: (message: string, data?: any) => {
    console.warn(`[WARN] ${message}`, data ? data : "");
  },
  debug: (message: string, data?: any) => {
    if (process.env.NODE_ENV !== "production") {
      console.log(`[DEBUG] ${message}`, data ? data : "");
    }
  },
};

export default logger;
