import { test, expect } from "@playwright/test";

// Client sign-up: an Individual/Business selector that adapts Company Name.
test("client sign-up offers Individual/Business and adapts Company Name", async ({ page }) => {
  test.setTimeout(40000);
  await page.goto("/sign-up");
  await page.waitForTimeout(2500);

  await page.getByRole("button", { name: /^client$/i }).click();
  await page.waitForTimeout(500);

  // Selector present; Business is the default → Company Name shown.
  await expect(page.getByRole("button", { name: /^Individual$/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /^Business$/ })).toBeVisible();
  await expect(page.getByText("Company Name")).toBeVisible();

  // Individual → Company Name hidden.
  await page.getByRole("button", { name: /^Individual$/ }).click();
  await page.waitForTimeout(400);
  await expect(page.getByText("Company Name")).toHaveCount(0);
  await page.screenshot({ path: "e2e/screens/signup-client-individual.png", fullPage: true }).catch(() => {});

  // Back to Business → Company Name returns.
  await page.getByRole("button", { name: /^Business$/ }).click();
  await page.waitForTimeout(400);
  await expect(page.getByText("Company Name")).toBeVisible();
});
