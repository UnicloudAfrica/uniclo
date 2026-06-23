import { defineConfig, devices } from "@playwright/test";

/**
 * E2E config. Assumes the full stack is running:
 *   - API:  cd ../api && composer dev        (http://localhost:8000, MAIL_MAILER=log)
 *   - Web:  npm run dev                        (http://localhost:3000)
 *   - Seed: cd ../api && php artisan db:seed --class="Database\\Seeders\\E2eSeeder"
 *
 * Auth: e2e/auth.setup.ts logs each audience in via the real login + OTP flow,
 * reading the OTP from the API log, and saves a storageState per role.
 */
const BASE_URL = process.env.E2E_BASE_URL ?? "http://localhost:3000";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  timeout: 60_000,
  expect: { timeout: 15_000 },
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    { name: "setup", testMatch: /auth\.setup\.ts/ },
    {
      name: "admin",
      testMatch: /admin\/.*\.spec\.ts/,
      use: { ...devices["Desktop Chrome"], storageState: "e2e/.auth/admin.json" },
      dependencies: ["setup"],
    },
    {
      name: "tenant",
      testMatch: /tenant\/.*\.spec\.ts/,
      use: { ...devices["Desktop Chrome"], storageState: "e2e/.auth/tenant.json" },
      dependencies: ["setup"],
    },
    {
      name: "client",
      testMatch: /client\/.*\.spec\.ts/,
      use: { ...devices["Desktop Chrome"], storageState: "e2e/.auth/client.json" },
      dependencies: ["setup"],
    },
    {
      // Public/unauthenticated pages — no storageState, no setup dependency.
      name: "public",
      testMatch: /public\/.*\.spec\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
