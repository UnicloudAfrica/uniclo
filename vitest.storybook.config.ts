/**
 * Dedicated vitest config for the Storybook test runner.
 *
 * Kept separate from the main `vitest.config.ts` because the
 * `@storybook/addon-vitest` Vite plugin does eager work on load that
 * conflicts with the unit-test setup. Run with:
 *
 *   npx vitest --config vitest.storybook.config.ts
 *
 * Or via the npm script `test:storybook` (see package.json).
 */
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "node:url";
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import { playwright } from "@vitest/browser-playwright";

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    react(),
    storybookTest({ configDir: path.join(dirname, ".storybook") }),
  ],
  test: {
    name: "storybook",
    browser: {
      enabled: true,
      headless: true,
      provider: playwright({}),
      instances: [{ browser: "chromium" }],
    },
  },
});
