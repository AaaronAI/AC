import { z } from "zod";

// Environment validation — fail fast with a clear message rather than at first query.
const EnvSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required (e.g. file:./dev.db)"),
  SESSION_SECRET: z
    .string()
    .min(16, "SESSION_SECRET must be at least 16 characters")
    .default("dev-only-secret-change-me"),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

export const env = EnvSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
  SESSION_SECRET: process.env.SESSION_SECRET,
  NODE_ENV: process.env.NODE_ENV,
});

// Enforce a real secret when actually serving production traffic (next build sets
// NODE_ENV=production too, so the build phase itself is exempt).
if (
  env.NODE_ENV === "production" &&
  process.env.NEXT_PHASE !== "phase-production-build" &&
  env.SESSION_SECRET === "dev-only-secret-change-me"
) {
  throw new Error("SESSION_SECRET must be set to a real secret in production");
}
