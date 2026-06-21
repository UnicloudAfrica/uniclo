import { test, expect } from "@playwright/test";

test("client dashboard loads for an authenticated client", async ({ page }) => {
  await page.goto("/client-dashboard");

  // Session is valid: we are not bounced back to the login flow.
  await expect(page).not.toHaveURL(/\/(sign-in|verify-mail)/);
  await expect(page.locator("body")).toBeVisible();
});
