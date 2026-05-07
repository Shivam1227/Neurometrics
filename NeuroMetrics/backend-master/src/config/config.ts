/**
 * Type-safe configuration loader.
 *
 * Reads environment variables, applies basic validation/defaults and exports
 * a frozen `config` object for application use.
 */

export interface S3Config {
  endpoint: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
}

export interface AppConfig {
  NODE_ENV: "development" | "test" | "production";
  PORT: number;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string; // e.g. '1h', '7d'
  DATABASE_URL?: string;
  s3: S3Config;
  ADMIN_EMAIL: string;
  ADMIN_PASSWORD: string;
}

function required(name: string, val: string | undefined): string {
  if (!val) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return val;
}

const NODE_ENV = (process.env.NODE_ENV as AppConfig["NODE_ENV"]) ||
  "development";
const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
const JWT_SECRET = required("JWT_SECRET", process.env.JWT_SECRET);
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1h";
const DATABASE_URL = process.env.DATABASE_URL;

// S3/MinIO Configuration
const S3_ENDPOINT = process.env.S3_ENDPOINT || "http://localhost:9000";
const S3_ACCESS_KEY_ID = process.env.S3_ACCESS_KEY_ID || "minioadmin";
const S3_SECRET_ACCESS_KEY =
  process.env.S3_SECRET_ACCESS_KEY || "minioadmin";
const S3_BUCKET = process.env.S3_BUCKET || "alz";

// Admin User Configuration
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@example.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "123456";

const config: AppConfig = Object.freeze({
  NODE_ENV,
  PORT,
  JWT_SECRET,
  JWT_EXPIRES_IN,
  DATABASE_URL,
  s3: {
    endpoint: S3_ENDPOINT,
    accessKeyId: S3_ACCESS_KEY_ID,
    secretAccessKey: S3_SECRET_ACCESS_KEY,
    bucket: S3_BUCKET,
  },
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
});

export default config;
