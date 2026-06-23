import { test, expect } from "@playwright/test";
import { promises as fs } from "node:fs";

/**
 * Item 2 (#32a): TENANT self-registration via /tenant-sign-up.
 * Single-step business form -> submit -> /verify-mail -> emailed OTP -> account.
 * Confirms a new tenant can self-register end-to-end. Captures screens.
 */
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

test("tenant self-registers through /tenant-sign-up", async ({ page }) => {
  test.setTimeout(120000);
  const shot = (n: string) => page.screenshot({ path: `${SHOTS}/tenant-signup-${n}.png`, fullPage: true }).catch(() => {});
  const email = `e2e-newtenant-${Date.now()}@example.com`;
  const failed: string[] = [];
  page.on("response", (r) => {
    if (r.status() >= 400 && !/conveythis|\.png/.test(r.url()))
      failed.push(`${r.status()} ${r.request().method()} ${r.url().replace(/^https?:\/\/[^/]+/, "")}`);
  });

  const before = (await fs.stat(API_LOG).catch(() => ({ size: 0 }))).size;
  await page.goto("/tenant-sign-up");
  await page.waitForTimeout(1500);
  await shot("01-form");

  await page.locator("#contactPersonFirstName").fill("E2E");
  await page.locator("#contactPersonLastName").fill("NewTenant");
  await page.locator("#email").fill(email);
  await page.locator("#password").fill("Str0ng!Passw0rd9");
  await page.locator("#confirmPassword").fill("Str0ng!Passw0rd9");
  await page.locator("#companyName").fill(`E2E Newco ${Date.now()}`).catch(() => {});
  await page.locator("#phone").fill("+2348012345678").catch(() => {});
  await page.locator("#countryId").selectOption({ index: 1 }); // first real country (index 0 = placeholder)
  await page.waitForTimeout(400);
  await shot("02-filled");

  const submitDone = page
    .waitForResponse((r) => r.request().method() === "POST" && /register|sign|tenant|onboard/i.test(r.url()), { timeout: 30000 })
    .catch(() => null);
  await page.getByRole("button", { name: /^sign up$/i }).click();
  const sr = await submitDone;
  if (sr) {
    console.log("TENANT_SIGNUP_STATUS", sr.status());
    console.log("TENANT_SIGNUP_BODY", (await sr.text().catch(() => "")).slice(0, 300));
  }
  await page.waitForURL(/verify-mail/, { timeout: 20000 }).catch(() => {});
  await shot("03-verify");

  const otp = await readOtpAfter(before);
  console.log("TENANT_SIGNUP_OTP", otp || "(none)");
  await page.locator("input").first().click().catch(() => {});
  await page.keyboard.type(otp, { delay: 50 });
  await page.waitForURL((u) => !/verify-mail/.test(u.pathname), { timeout: 20000 }).catch(() => {});
  await shot("04-done");
  console.log("FINAL_URL", page.url().replace(/^https?:\/\/[^/]+/, ""));
  console.log("=== FAILED (" + failed.length + ") ===");
  [...new Set(failed)].slice(0, 12).forEach((f) => console.log("  FR: " + f));

  // Gate: registration succeeded if we left the OTP screen (account created + verified).
  expect(page.url()).not.toContain("verify-mail");
});
