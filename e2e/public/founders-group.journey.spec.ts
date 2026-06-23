import { test, expect } from "@playwright/test";
import { promises as fs } from "node:fs";

/**
 * Input-Gate repeatable `group` field: a logged-in client hits a requirement
 * with a "Founders" group. Continue stays blocked until each founder's required
 * name is filled; adding a 2nd founder re-blocks until its name is filled too.
 * (Setup puts only this requirement on `onboarding`.)
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

test("client is gated by a repeatable founders group", async ({ page }) => {
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
  await expect(gate.getByText("Founder 1")).toBeVisible();

  const cont = gate.getByRole("button", { name: /continue/i });
  await expect(cont).toBeDisabled();

  // Fill founder 1's required name → satisfied (min 1).
  await gate.locator('[data-group="founders"] input[data-field="name"]').first().fill("Ada Founder");
  await expect(cont).toBeEnabled();

  // Add a second founder → its required name is empty → re-blocked.
  await gate.locator('[data-add-group="founders"]').click();
  await expect(gate.getByText("Founder 2")).toBeVisible();
  await expect(cont).toBeDisabled();
  await page.screenshot({ path: "e2e/screens/founders-group-01.png", fullPage: true }).catch(() => {});

  await gate.locator('[data-group="founders"] input[data-field="name"]').nth(1).fill("Bola Director");
  await expect(cont).toBeEnabled();
  await cont.click();
  await expect(gate).toHaveCount(0, { timeout: 12000 });
});
