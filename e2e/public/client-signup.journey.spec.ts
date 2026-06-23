import { test, expect } from "@playwright/test";
import { promises as fs } from "node:fs";

/**
 * Item 2 (#32b): CLIENT self-registration via /sign-up (DashboardSignUpV2).
 * Clicks the "Client" role tab, then fills the BUSINESS account form (the public
 * signup hardcodes account_type=business — individual is not offered here) with
 * CAC verification (Mono RC 0000000 = "Neem"), then OTP.
 *
 * NOTE: this creates a CENTRAL, tenantless client — the public signup is not
 * tenant-domain-scoped (no tenant_id in the payload, no tenancy middleware on the
 * register route). Tenant-domain client onboarding is a separate, unbuilt feature.
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

test("client self-registers (business) through /sign-up", async ({ page }) => {
  test.setTimeout(120000);
  const shot = (n: string) => page.screenshot({ path: `${SHOTS}/client-signup-${n}.png`, fullPage: true }).catch(() => {});
  const email = `e2e-newclient-${Date.now()}@example.com`;

  const before = (await fs.stat(API_LOG).catch(() => ({ size: 0 }))).size;
  await page.goto("/sign-up");
  await page.waitForTimeout(1500);
  await page.getByRole("button", { name: /^client$/i }).click({ timeout: 8000 }).catch(() => {}); // role tab
  await page.waitForTimeout(500);
  await shot("01-form");

  // Business details (required before verification). Business Type = 1st form select.
  await page.getByPlaceholder("Enter first name").fill("E2E", { timeout: 8000 }).catch(() => {});
  await page.getByPlaceholder("Enter last name").fill("NewClient", { timeout: 8000 }).catch(() => {});
  await page.getByPlaceholder("Enter company name").fill(`Neem E2E ${Date.now()}`, { timeout: 8000 }).catch(() => {});
  await page.locator("form select").first().selectOption({ index: 1 }, { timeout: 8000 }).catch(() => {});
  await page.getByPlaceholder("e.g., RC123456").fill("0000000", { timeout: 8000 }).catch(() => {});

  // CAC verification (real Mono, RC 0000000 = "Neem").
  const verifyDone = page
    .waitForResponse((r) => r.url().includes("business-verifications") && r.request().method() === "POST", { timeout: 30000 })
    .catch(() => null);
  await page.getByRole("button", { name: /verify business/i }).click({ timeout: 8000 }).catch(() => {});
  const vr = await verifyDone;
  if (vr) console.log("CLIENT_VERIFY_STATUS", vr.status());
  await page.waitForTimeout(2500);
  await shot("02-verified");

  // Remaining account fields. Country = the select with the "Select country" option.
  await page.getByPlaceholder("Enter email").fill(email, { timeout: 8000 }).catch(() => {});
  await page.locator('select:has(option:has-text("Select country"))').first().selectOption({ index: 1 }, { timeout: 8000 }).catch(() => {});
  await page.getByPlaceholder("Enter password").fill("Str0ng!Passw0rd9", { timeout: 8000 }).catch(() => {});
  await page.getByPlaceholder("Enter confirm password").fill("Str0ng!Passw0rd9", { timeout: 8000 }).catch(() => {});
  await shot("03-filled");

  const submitDone = page
    .waitForResponse((r) => r.request().method() === "POST" && /\/business\/auth\/register/i.test(r.url()), { timeout: 30000 })
    .catch(() => null);
  await page.locator('button[type="submit"]').click({ timeout: 8000 }).catch(() => {});
  const sr = await submitDone;
  if (sr) {
    console.log("CLIENT_SIGNUP_STATUS", sr.status());
    console.log("CLIENT_SIGNUP_BODY", (await sr.text().catch(() => "")).slice(0, 300));
  }
  await page.waitForURL(/verify-mail/, { timeout: 20000 }).catch(() => {});
  await shot("04-verify");

  const otp = await readOtpAfter(before);
  console.log("CLIENT_SIGNUP_OTP", otp || "(none)");
  await page.locator("input").first().click().catch(() => {});
  await page.keyboard.type(otp, { delay: 50 });
  await page.waitForURL((u) => !/verify-mail/.test(u.pathname), { timeout: 20000 }).catch(() => {});
  await shot("05-done");
  console.log("FINAL_URL", page.url().replace(/^https?:\/\/[^/]+/, ""));

  // Gate: register accepted (200) and OTP verification landed on a dashboard.
  expect(sr?.status()).toBe(200);
  expect(page.url()).toMatch(/dashboard/);
});
