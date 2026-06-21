import { test, expect } from "@playwright/test";

test("tenant dashboard loads for an authenticated tenant", async ({ page }) => {
  await page.goto("/tenant-dashboard");

  // Session is valid: we are not bounced back to the login flow.
  await expect(page).not.toHaveURL(/\/(sign-in|verify-mail)/);
  await expect(page.locator("body")).toBeVisible();
});
