import { test } from "@playwright/test";
import { promises as fs } from "node:fs";

/** MATRIX: tenant (provider actor) provisions a zadara z2.medium via the shared
 * wizard, driven to the payment step (no VM created). Confirms the shared card +
 * my AZ/flavor fixes work in the tenant context. */
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

test("MATRIX: tenant provisions a zadara z2.medium to payment", async ({ page }) => {
  test.setTimeout(190000);
  const failed: string[] = [];
  const shortUrl = (u: string) => u.replace(/^https?:\/\/[^/]+/, "");
  page.on("response", (r) => { if (r.status() >= 400 && !/conveythis|\.png|trbn/.test(r.url())) failed.push(`${r.status()} ${shortUrl(r.url())}`); });
  const step = async (label: string, fn: () => Promise<void>) => { try { await fn(); console.log(`OK   :: ${label}`); } catch (e) { console.log(`FAIL :: ${label} :: ${(e as Error).message.split("\n")[0].slice(0, 110)}`); } };
  const shot = (n: string) => page.screenshot({ path: `${SHOTS}/tenant-${n}.png`, fullPage: true }).catch(() => {});
  const pickSearchable = async (placeholder: RegExp, want?: RegExp): Promise<string> => {
    const trigger = page.locator('button[aria-haspopup="listbox"]').filter({ hasText: placeholder }).first();
    if ((await trigger.count()) === 0) return "(no trigger)";
    await trigger.click({ timeout: 6000 }).catch(() => {});
    await page.waitForTimeout(600);
    const opts = page.locator('ul[role="listbox"] li button');
    const n = await opts.count(); const labels: string[] = []; let idx = -1;
    for (let i = 0; i < n; i++) { const t = (await opts.nth(i).innerText().catch(() => "")).replace(/\s+/g, " ").trim(); labels.push(t); if (/^Select /i.test(t)) continue; if (want && want.test(t) && idx === -1) idx = i; }
    if (idx === -1) idx = labels.findIndex((t) => t && !/^Select /i.test(t));
    if (idx === -1) { await page.keyboard.press("Escape").catch(() => {}); return "(no option)"; }
    const picked = labels[idx]; await opts.nth(idx).click().catch(() => {}); await page.waitForTimeout(600); return picked;
  };

  const before = (await fs.stat(API_LOG).catch(() => ({ size: 0 }))).size;
  await page.goto("/sign-in");
  await page.getByPlaceholder("Enter email address").fill("e2e-tenant@unicloud.africa");
  await page.getByPlaceholder("Enter password").fill("password");
  await page.getByRole("button", { name: /^login$/i }).click();
  await page.waitForURL(/verify-mail/, { timeout: 20000 }).catch(() => {});
  const otp = await readOtpAfter(before);
  await page.locator("input").first().click().catch(() => {});
  await page.keyboard.type(otp, { delay: 50 });
  await page.waitForURL((u) => !/verify-mail/.test(u.pathname), { timeout: 20000 }).catch(() => {});
  console.log("LOGIN_URL =", shortUrl(page.url()));

  await page.goto("/dashboard/create-instance");
  await page.waitForTimeout(3500);
  await shot("01-wizard");
  await step("workflow (if present)", async () => { const w = page.getByText(/standard workflow/i).first(); if (await w.count()) await w.click({ timeout: 5000 }); });
  await step("continue->config (if present)", async () => { const b = page.getByRole("button", { name: /continue to configuration/i }).first(); if (await b.count()) await b.click({ timeout: 6000 }); });
  await page.waitForTimeout(1500);
  await step("region", async () => { const r = page.locator(`select:has(option:has-text("Select region"))`).first(); if (await r.count()) await r.selectOption({ index: 1 }); });
  await page.waitForTimeout(1500);
  await step("project mode -> new", async () => { const sel = page.locator(`select:has(option:has-text("project"))`).first(); if (await sel.count()) { const opts = await sel.locator("option").allInnerTexts(); const i = opts.findIndex((t) => /create new/i.test(t)); if (i >= 0) await sel.selectOption({ index: i }); } });
  await page.waitForTimeout(1200);
  await step("AZ az1", async () => { const s = page.locator(`select:has(option[value="uni-ng-lag-az1"])`).first(); if (await s.count()) await s.selectOption("uni-ng-lag-az1"); });
  await page.waitForTimeout(1800);
  await step("project name", async () => { const pn = page.getByPlaceholder(/project name/i).first(); if (await pn.count()) await pn.fill(`tn-${Date.now()}`); });
  await step("network preset", async () => { const sel = page.locator(`select:has(option:has-text("network preset"))`).first(); if (await sel.count()) await sel.selectOption({ index: 2 }); });
  await page.waitForTimeout(1200);
  console.log("type:", await pickSearchable(/Select instance type/i, /z2\.medium/i));
  await page.waitForTimeout(1000);
  console.log("image:", await pickSearchable(/Select OS image/i));
  await page.waitForTimeout(600);
  await step("name", async () => { const n = page.getByPlaceholder(/cube-instance name|instance name/i).first(); if (await n.count()) await n.fill(`tenant-${Date.now()}`); });
  await shot("02-config");
  await step("continue->payment", async () => { const b = page.getByRole("button", { name: /continue to payment/i }).first(); if (await b.count()) await b.click({ timeout: 8000 }); });
  await page.waitForTimeout(2500);
  await shot("03-payment");
  const t = (await page.locator("body").innerText().catch(() => "")).replace(/\s+/g, " ");
  console.log("REACHED_PAYMENT =", /pay with wallet|amount to debit|payment method|order summary/i.test(t));
  console.log("=== FAILED (" + failed.length + ") ==="); [...new Set(failed)].slice(0, 10).forEach((f) => console.log("  FR: " + f));
});
