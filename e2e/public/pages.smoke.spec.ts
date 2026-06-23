import { test, expect } from "@playwright/test";

/**
 * "Page loads" smoke for public / unauthenticated pages. Runs in the `public`
 * project (no storageState), so these render without a session. Each should show
 * its form/heading without erroring. One test per route for per-page checklist ticks.
 */
const ROUTES: Array<[id: string, path: string]> = [
  ["PUB-AUTH-02", "/sign-up"],
  ["PUB-AUTH-03", "/forgot-password"],
  ["PUB-AUTH-04", "/reset-password"],
  ["PUB-TENANT-01", "/tenant-sign-in"],
  ["PUB-TENANT-02", "/tenant-sign-up"],
  ["PUB-TOOL-01", "/cost-explorer"],
];

test.describe("public · page loads", () => {
  for (const [id, path] of ROUTES) {
    test(`${id} loads (${path})`, async ({ page }) => {
      await page.goto(path, { waitUntil: "domcontentloaded" });
      // Rendered without crashing — a form control / interactive element shows.
      await expect(page.locator("input, button").first()).toBeVisible();
    });
  }
});
