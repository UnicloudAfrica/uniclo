import { test, expect } from "@playwright/test";
import { promises as fs } from "node:fs";

/**
 * Thin Input-Gate slice: a logged-in client hits the dynamic "Terms consent"
 * requirement gate, cannot proceed until they accept, then it clears. Proves the
 * server-defined requirement → FE gate → submit → cleared loop end-to-end.
 * (Run resets the e2e-client's submission first so the gate is outstanding.)
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

test("client is gated by the dynamic Terms consent requirement", async ({ page }) => {
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

  // Gate is visible + blocking.
  const gate = page.locator('[data-testid="requirement-gate"]');
  await expect(gate).toBeVisible({ timeout: 12000 });
  await page.screenshot({ path: "e2e/screens/consent-gate-01-blocked.png", fullPage: true }).catch(() => {});

  // Continue is disabled until consent is ticked.
  const cont = gate.getByRole("button", { name: /continue/i });
  await expect(cont).toBeDisabled();

  // Tick consent → enabled → submit → gate clears.
  await gate.locator('input[data-field="terms"]').check();
  await expect(cont).toBeEnabled();
  await cont.click();
  await expect(gate).toHaveCount(0, { timeout: 12000 });
  await page.screenshot({ path: "e2e/screens/consent-gate-02-cleared.png", fullPage: true }).catch(() => {});
});
