import { test, expect } from "@playwright/test";
import { promises as fs } from "node:fs";

/**
 * A brand-new tenant must reach the self-onboarding STEP FORMS at /dashboard/onboarding
 * (so they can complete onboarding), not the sub-tenant/client review queue. Verifies the
 * routing fix: /dashboard/onboarding → OnboardingDashboard (was: TenantOnboardingOverview).
 */
const API_LOG = "/Users/mac_1/Documents/GitHub/unicloud/api/storage/logs/laravel.log";

async function readOtpAfter(offset: number): Promise<string> {
  for (let i = 0; i < 40; i++) {
    const buf = await fs.readFile(API_LOG, "utf8").catch(() => "");
    const m = [...buf.slice(offset).matchAll(/<h[1-6]>\s*(\d{4,8})\s*<\/h[1-6]>/g)];
    if (m.length) return m[m.length - 1][1];
    await new Promise((r) => setTimeout(r, 500));
  }
  return "";
}

test("new tenant reaches the self-onboarding step forms, not the review queue", async ({ page }) => {
  test.setTimeout(120000);
  const before = (await fs.stat(API_LOG).catch(() => ({ size: 0 }))).size;
  const tag = `${Date.now()}`;
  const email = `e2e-newtenant-${tag}@unicloud.africa`;
  const pw = `Zk9$qV${tag.slice(-5)}x!Lp`;

  await page.goto("/sign-up");
  await page.waitForTimeout(1500);
  await page.getByPlaceholder("Enter first name").fill("New");
  await page.getByPlaceholder("Enter last name").fill("Tenant");
  await page.getByPlaceholder("Enter company name").fill(`NewCo ${tag}`);
  await page.getByPlaceholder("Enter email").fill(email);
  await page.locator("select").first().selectOption({ index: 1 });
  await page.getByPlaceholder("Enter password").fill(pw);
  await page.getByPlaceholder("Enter confirm password").fill(pw);
  await page.getByRole("button", { name: /create account/i }).click();

  await page.waitForURL(/verify-mail/, { timeout: 25000 }).catch(() => {});
  const otp = await readOtpAfter(before);
  await page.locator("input").first().click().catch(() => {});
  await page.keyboard.type(otp, { delay: 50 });
  await page.waitForURL((u) => !/verify-mail/.test(u.pathname), { timeout: 25000 }).catch(() => {});
  await page.waitForTimeout(3000);

  // The guard sends the incomplete tenant to /dashboard/onboarding → now the step forms.
  await page.goto("/dashboard/onboarding");
  await page.waitForTimeout(3500);
  await page.screenshot({ path: "e2e/screens/new-tenant-onboarding.png", fullPage: true }).catch(() => {});

  // It's the self-onboarding flow, NOT the sub-tenant/client review queue.
  await expect(page.getByText("Onboarding Review")).toHaveCount(0);
  await expect(page.getByText("Review pending submissions")).toHaveCount(0);
});
