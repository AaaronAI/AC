import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  fullyParallel: false,
  workers: 1, // flows mutate the shared seeded database in sequence
  use: {
    baseURL: "http://localhost:3105",
    // The remote build environment pre-installs Chromium here.
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_PATH
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH }
      : undefined,
  },
  webServer: {
    command: "npm run db:seed && npm run start -- -p 3105",
    url: "http://localhost:3105",
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      // e2e runs the production server; give it a non-default session secret.
      SESSION_SECRET: "e2e-only-session-secret-not-for-prod",
    },
  },
});
