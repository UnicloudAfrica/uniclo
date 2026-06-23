import { test, expect } from "@playwright/test";
import { promises as fs } from "node:fs";

/**
 * Input-Gate `verification` field: a logged-in client hits a country-aware
 * identity-verification requirement. The field label is resolved from the
 * subject's country (NG business → "CAC / RC Number"); the gate blocks until the
 * id is entered, then clears. (Setup puts only this requirement on `onboarding`.)
 */
const API_LOG = "/Users/mac_1/Documents/GitHub/unicloud/api/storage/logs/laravel.log";
const CLIENT = "e2e-client@unicloud.africa";

async function readOtpAfter(offset: number): Promise<string> {
  for (let i = 0; i < 40; i++) {
    const buf = await fs.readFile(API_LOG, "utf8").catch(() => "");
    const m = [...buf.slice(offset).matchAll(/<h3>\s*(\d{4,8})\s*<\/h3>/g)];
    if (m.length) return m[m.length - 1][1];
    await new Promise((r) => setTimeout(r, 500));
  }
  return "";
}

test("client is gated by a country-aware verification requirement", async ({ page }) => {
  test.setTimeout(120000);
  const before = (await fs.stat(API_LOG).catch(() => ({ size: 0 }))).size;
  await page.goto("/sign-in");
  await page.getByPlaceholder("Enter email address").fill(CLIENT);
  await page.getByPlaceholder("Enter password").fill("password");
  await page.getByRole("button", { name: /^login$/i }).click();
  await page.waitForURL(/verify-mail/, { timeout: 20000 }).catch(() => {});
  const otp = await readOtpAfter(before);
  await page.locator("input").first().click().catch(() => {});
  await page.keyboard.type(otp, { delay: 50 });
  await page.waitForURL((u) => !/verify-mail/.test(u.pathname), { timeout: 20000 }).catch(() => {});

  await page.goto("/client-dashboard");
  await page.waitForTimeout(3000);

  const gate = page.locator('[data-testid="requirement-gate"]');
  await expect(gate).toBeVisible({ timeout: 12000 });
  // Country-aware label resolved from the subject's country (NG business → CAC).
  await expect(gate.getByText(/CAC \/ RC Number/i)).toBeVisible();
  await page.screenshot({ path: "e2e/screens/verification-gate-01.png", fullPage: true }).catch(() => {});

  const cont = gate.getByRole("button", { name: /continue/i });
  await expect(cont).toBeDisabled();
  await gate.locator('input[data-field="id"]').fill("0000000");
  await expect(cont).toBeEnabled();
  await cont.click();
  await expect(gate).toHaveCount(0, { timeout: 12000 });
});
