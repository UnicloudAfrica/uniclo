import { test, expect, type Locator } from "@playwright/test";
import { promises as fs } from "node:fs";

/**
 * Item 2 (#31): a SUB-TENANT (partner) logs in and adds a client.
 * Logs in inline as the seeded sub-tenant (e2e-subtenant), then creates a client
 * through /dashboard/clients/new with real Mono KYC (RC 0000000 = "Neem"),
 * mirroring the proven tenant client-create flow. Confirms a sub-tenant has the
 * same client-management capability as its parent. No storageState (e2e/public)
 * so the inline login starts from a clean session.
 */
const API_LOG = "/Users/mac_1/Documents/GitHub/unicloud/api/storage/logs/laravel.log";
const SUBTENANT = "e2e-subtenant@unicloud.africa";
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
async function pickFirst(select: Locator) {
  await expect(select).toBeEnabled({ timeout: 15000 });
  await expect.poll(async () => select.locator("option").count(), { timeout: 15000 }).toBeGreaterThan(1);
  await select.selectOption({ index: 1 });
}

test("sub-tenant logs in and adds a client", async ({ page }) => {
  test.setTimeout(150000);
  const shot = (n: string) => page.screenshot({ path: `${SHOTS}/subtenant-${n}.png`, fullPage: true }).catch(() => {});
  const email = `e2e-subclient-${Date.now()}@example.com`;

  // ---- LOGIN as the sub-tenant ----
  const before = (await fs.stat(API_LOG).catch(() => ({ size: 0 }))).size;
  await page.goto("/sign-in");
  await page.getByPlaceholder("Enter email address").fill(SUBTENANT);
  await page.getByPlaceholder("Enter password").fill("password");
  await page.getByRole("button", { name: /^login$/i }).click();
  await page.waitForURL(/verify-mail/, { timeout: 20000 }).catch(() => {});
  const otp = await readOtpAfter(before);
  await page.locator("input").first().click().catch(() => {});
  await page.keyboard.type(otp, { delay: 50 });
  await page.waitForURL((u) => !/verify-mail/.test(u.pathname), { timeout: 20000 }).catch(() => {});
  console.log("SUBTENANT_LOGIN_URL =", page.url().replace(/^https?:\/\/[^/]+/, ""));
  await shot("01-dashboard");

  // ---- ADD CLIENT (real Mono KYC: RC 0000000 = "Neem") ----
  await page.goto("/dashboard/clients/new");
  await page.locator("#first_name").fill("E2E");
  await page.locator("#last_name").fill("SubClient");
  await page.locator("#email").fill(email);
  await page.locator("#phone").fill("+2348012345678");
  await page.locator("#password").fill("Str0ng!Passw0rd9");
  await page.locator("#password_confirmation").fill("Str0ng!Passw0rd9");
  await pickFirst(page.locator("#country_id"));
  await pickFirst(page.locator("#state_id"));
  const cityId = page.locator("#city_id");
  if (await cityId.count()) { await pickFirst(cityId).catch(() => {}); } else { await page.locator("#city").fill("Lagos").catch(() => {}); }
  await page.locator("#address").fill("1 Test Street");
  await page.locator("#zip_code").fill("100001");
  await page.locator("#business_name").fill(`Neem Sub ${Date.now()}`);
  await page.locator("#registration_number").fill("0000000");
  const companyType = page.locator("#company_type");
  if (await companyType.count()) await pickFirst(companyType).catch(() => {});
  const industry = page.locator("#industry");
  if (await industry.count()) await pickFirst(industry).catch(() => {});

  const verifyDone = page.waitForResponse(
    (r) => r.url().includes("business-verifications") && r.request().method() === "POST",
    { timeout: 30000 },
  );
  await page.getByRole("button", { name: /verify business/i }).click();
  const verifyResp = await verifyDone;
  console.log("SUBCLIENT_VERIFY_STATUS", verifyResp.status());
  await page.waitForTimeout(2500);
  await shot("02-verified");

  const submitDone = page.waitForResponse(
    (r) => /\/clients\b/i.test(r.url()) && r.request().method() === "POST",
    { timeout: 25000 },
  );
  await page.getByRole("button", { name: /^add client/i }).click();
  const submitResp = await submitDone;
  console.log("SUBCLIENT_SUBMIT_STATUS", submitResp.status());
  console.log("SUBCLIENT_SUBMIT_BODY", (await submitResp.text()).slice(0, 400));
  await shot("03-result");
  await expect(
    page.getByText(/added successfully|client added|created successfully/i).first(),
  ).toBeVisible({ timeout: 25000 });
});
