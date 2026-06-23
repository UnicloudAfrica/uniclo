import { test, expect } from "@playwright/test";

/**
 * Admin audit view: open a form's submissions page and confirm the submitter +
 * status render — proving the immutable audit trail surfaces in the UI. The
 * requirement id of a seeded form-with-submission is passed via E2E_REQ_ID.
 */
test("admin reviews a form's submissions", async ({ page }) => {
  test.setTimeout(60000);
  const rid = process.env.E2E_REQ_ID;
  test.skip(!rid, "E2E_REQ_ID not set");

  await page.goto(`/admin-dashboard/requirements/${rid}/submissions`);
  await page.waitForTimeout(3000);

  // The audit row: who submitted + the status.
  await expect(page.getByText("E2E Client").first()).toBeVisible({ timeout: 12000 });
  await expect(page.getByText(/submitted/i).first()).toBeVisible();
  await page.screenshot({ path: "e2e/screens/adminsubs-01.png", fullPage: true }).catch(() => {});
});
