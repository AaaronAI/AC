import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
  test: {
    include: ["tests/**/*.test.ts"],
    globalSetup: ["tests/global-setup.ts"],
    setupFiles: ["tests/setup-env.ts"],
    // DB-backed tests share one SQLite file; keep them in a single worker.
    pool: "forks",
    maxWorkers: 1,
    fileParallelism: false,
  },
});
