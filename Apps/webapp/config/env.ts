import { z } from "zod";

const envSchema = z.object({
  // ── API ──────────────────────────────────────────────────────────────────
  NEXT_PUBLIC_API_BASE_URL: z.string().url().default("https://api.stayhub.com/api/v1"),

  // ── App environment ──────────────────────────────────────────────────────
  NEXT_PUBLIC_APP_ENV: z.enum(["local", "development", "staging", "production"]).default("development"),
  NEXT_PUBLIC_ENABLE_DEBUG_LOGS: z.enum(["true", "false"]).default("false"),

  // ── HMAC request signing ─────────────────────────────────────────────────
  // Must match APP_SECRET on the backend. Empty string disables signing.
  NEXT_PUBLIC_APP_SECRET: z.string().default(""),

  // ── Firebase (client SDK) ────────────────────────────────────────────────
  // All values come from .env.local — never hardcode these.
  NEXT_PUBLIC_FIREBASE_API_KEY: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_APP_ID: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: z.string().default(""),
});

const parsedEnv = envSchema.safeParse({
  NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
  NEXT_PUBLIC_APP_ENV: process.env.NEXT_PUBLIC_APP_ENV,
  NEXT_PUBLIC_ENABLE_DEBUG_LOGS: process.env.NEXT_PUBLIC_ENABLE_DEBUG_LOGS,
  NEXT_PUBLIC_APP_SECRET: process.env.NEXT_PUBLIC_APP_SECRET,
  NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
});

if (!parsedEnv.success) {
  throw new Error(`Invalid environment configuration: ${parsedEnv.error.message}`);
}

const env = parsedEnv.data;

// ── App ──────────────────────────────────────────────────────────────────────
export const API_BASE_URL = env.NEXT_PUBLIC_API_BASE_URL.replace(/\/+$/, "");
export const APP_ENV = env.NEXT_PUBLIC_APP_ENV;
export const ENABLE_DEBUG_LOGS = env.NEXT_PUBLIC_ENABLE_DEBUG_LOGS === "true";
export const APP_SECRET = env.NEXT_PUBLIC_APP_SECRET;

// ── Firebase ─────────────────────────────────────────────────────────────────
export const FIREBASE_CONFIG = {
  apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || undefined,
} as const;
