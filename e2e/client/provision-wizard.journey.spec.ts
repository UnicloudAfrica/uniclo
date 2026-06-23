import { test, expect, type Locator, type Page } from "@playwright/test";

/**
 * DEEP journey: a client provisions a Cube instance through the full wizard and
 * pays from their seeded wallet (sandbox credit — no external gateway, no real
 * money). Uses the default "Use existing project" / "Use existing key pair"
 * paths against the seeded client project + key pair.
 *
 * This is the most complex flow in the app; selectors key off each select's
 * placeholder option (and the seeded project/keypair names), since the form's
 * labels aren't htmlFor-linked.
 */
const selectWithOption = (page: Page, optionText: string): Locator =>
  page.locator(`select:has(option:has-text(${JSON.stringify(optionText)}))`).first();

async function pickFirstReal(select: Locator) {
  await expect(select).toBeEnabled({ timeout: 20000 });
  await expect
    .poll(async () => select.locator("option").count(), { timeout: 20000 })
    .toBeGreaterThan(1);
  await select.selectOption({ index: 1 });
}

test("client provisions an instance and pays from wallet", async ({ page }) => {
  test.setTimeout(180000);
  const name = `e2e-cube-${Date.now()}`;

  await page.goto("/client-dashboard/cube-instances/provision");

  // --- Step 1: workflow ---
  await page.getByText("Standard Workflow").first().click();
  const country = selectWithOption(page, "Select country");
  if (await country.count()) await pickFirstReal(country).catch(() => {});
  await page.getByRole("button", { name: /continue to configuration/i }).click();

  // --- Step 2: configuration (existing project + existing key pair = defaults) ---
  await pickFirstReal(selectWithOption(page, "Select region"));
  const az = selectWithOption(page, "Select availability zone");
  if (await az.count()) await az.selectOption("uni-ng-lag-az1").catch(() => {});
  await pickFirstReal(selectWithOption(page, "E2E Client Project")); // seeded project
  await pickFirstReal(selectWithOption(page, "Select instance type"));
  await pickFirstReal(selectWithOption(page, "Select OS image"));
  await pickFirstReal(selectWithOption(page, "Select volume type"));
  await pickFirstReal(selectWithOption(page, "e2e-client-key")); // seeded key pair
  await page.getByPlaceholder("Enter cube-instance name").first().fill(name);
  await page.getByRole("button", { name: /continue to payment/i }).click();

  // --- Step 3: pay from the seeded wallet (no gateway, no real money) ---
  await page.getByRole("button", { name: /wallet/i }).click();
  await expect(
    page.getByText(/payment verified|payment.*success|paid/i).first(),
  ).toBeVisible({ timeout: 30000 });

  // --- Step 4: review -> provision ---
  await page.getByRole("button", { name: /confirm.*provision/i }).click();

  // --- Step 5: success ---
  await expect(
    page.getByText(/being provisioned|provision.*success|success/i).first(),
  ).toBeVisible({ timeout: 40000 });
});
