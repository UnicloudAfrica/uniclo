import { test } from "@playwright/test";
import { promises as fs } from "node:fs";

/** UX edge case: the creation screen at a phone viewport (responsive). */
const API_LOG = "/Users/mac_1/Documents/GitHub/unicloud/api/storage/logs/laravel.log";
const SHOTS = "e2e/screens";

async function readOtpAfter(offset: number): Promise<string> {
  for (let i = 0; i < 40; i++) {
    const buf = await fs.readFile(API_LOG, "utf8").catch(() => "");
    const m = [...buf.slice(offset).matchAll(/<h3>\s*(\d{4,8})\s*<\/h3>/g)];
    if (m.length) return m[m.length - 1][1];
    await new Promise((r) => setTimeout(r, 500));
  }
  return "";
}

test.use({ viewport: { width: 390, height: 844 } }); // iPhone 14-ish

test("UX: creation screen on mobile", async ({ page }) => {
  test.setTimeout(120000);
  const shot = (n: string) => page.screenshot({ path: `${SHOTS}/mobile-${n}.png`, fullPage: true }).catch(() => {});
  const before = (await fs.stat(API_LOG).catch(() => ({ size: 0 }))).size;
  await page.goto("/sign-in");
  await page.getByPlaceholder("Enter email address").fill("e2e-client@unicloud.africa");
  await page.getByPlaceholder("Enter password").fill("password");
  await page.getByRole("button", { name: /^login$/i }).click();
  await page.waitForURL(/verify-mail/, { timeout: 20000 }).catch(() => {});
  const otp = await readOtpAfter(before);
  await page.locator("input").first().click().catch(() => {});
  await page.keyboard.type(otp, { delay: 50 });
  await page.waitForURL((u) => !/verify-mail/.test(u.pathname), { timeout: 20000 }).catch(() => {});

  await page.goto("/client-dashboard/cube-instances/provision");
  await page.waitForTimeout(3000);
  await shot("01-workflow");
  await page.getByText("Standard Workflow").first().click({ timeout: 8000 }).catch(() => {});
  await page.getByRole("button", { name: /continue to configuration/i }).click({ timeout: 8000 }).catch(() => {});
  await page.waitForTimeout(2000);
  await shot("02-config");
  // check for horizontal overflow (a common mobile bug)
  const overflow = await page.evaluate(() => ({
    docWidth: document.documentElement.scrollWidth,
    viewWidth: window.innerWidth,
    overflowing: document.documentElement.scrollWidth > window.innerWidth + 2,
  }));
  console.log("MOBILE_OVERFLOW =", JSON.stringify(overflow));
});
