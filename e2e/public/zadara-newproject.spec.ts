import { test, type Locator } from "@playwright/test";
import { promises as fs } from "node:fs";

/**
 * EDGE CASE: client provisions in "Create new project" mode (vs selecting an
 * existing project). Here the project, its VPC, and the keypair are all created
 * DURING provisioning — so it exercises both "new project" and "keypair created
 * while the instance is provisioning". Uses z2.medium so the VM can actually run.
 */
const API_LOG = "/Users/mac_1/Documents/GitHub/unicloud/api/storage/logs/laravel.log";
const CLIENT = "e2e-client@unicloud.africa";
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

test("client provisions in NEW PROJECT mode", async ({ page }) => {
  test.setTimeout(220000);
  const failed: string[] = [];
  const shortUrl = (u: string) => u.replace(/^https?:\/\/[^/]+/, "");
  page.on("response", (r) => {
    if (r.status() >= 400 && !/conveythis|\.png|trbn/.test(r.url()))
      failed.push(`${r.status()} ${r.request().method()} ${shortUrl(r.url())}`);
  });
  const step = async (label: string, fn: () => Promise<void>) => {
    try { await fn(); console.log(`OK   :: ${label}`); }
    catch (e) { console.log(`FAIL :: ${label} :: ${(e as Error).message.split("\n")[0].slice(0, 140)}`); }
  };
  const shot = (n: string) => page.screenshot({ path: `${SHOTS}/newproj-${n}.png`, fullPage: true }).catch(() => {});
  const pickSearchable = async (placeholder: RegExp, want?: RegExp): Promise<string> => {
    const trigger = page.locator('button[aria-haspopup="listbox"]').filter({ hasText: placeholder }).first();
    if ((await trigger.count()) === 0) return "(trigger not found)";
    await trigger.click({ timeout: 6000 }).catch(() => {});
    await page.waitForTimeout(700);
    const opts = page.locator('ul[role="listbox"] li button');
    const n = await opts.count();
    const labels: string[] = [];
    let idx = -1;
    for (let i = 0; i < n; i++) {
      const t = (await opts.nth(i).innerText().catch(() => "")).replace(/\s+/g, " ").trim();
      labels.push(t);
      if (/^Select /i.test(t)) continue;
      if (want && want.test(t) && idx === -1) idx = i;
    }
    if (idx === -1) idx = labels.findIndex((t) => t && !/^Select /i.test(t));
    if (idx === -1) { await page.keyboard.press("Escape").catch(() => {}); return `(no real option; saw: ${labels.join(" | ").slice(0, 100)})`; }
    const picked = labels[idx];
    await opts.nth(idx).click().catch(() => {});
    await page.waitForTimeout(700);
    return picked;
  };

  // ---- LOGIN ----
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
  console.log("LOGIN_URL =", shortUrl(page.url()), "OTP =", otp || "(none)");

  // ---- WIZARD: new project ----
  await page.goto("/client-dashboard/cube-instances/provision");
  await page.waitForTimeout(3000);
  await step("workflow", async () => { await page.getByText("Standard Workflow").first().click({ timeout: 8000 }); });
  await step("continue->config", async () => { await page.getByRole("button", { name: /continue to configuration/i }).click({ timeout: 8000 }); });
  await page.waitForTimeout(1500);
  await step("region", async () => { await page.locator(`select:has(option:has-text("Select region"))`).first().selectOption({ index: 1 }, { timeout: 8000 }); });
  await page.waitForTimeout(2000);

  // Project mode -> Create new project
  await step("project mode -> new", async () => {
    const sel = page.locator(`select:has(option:has-text("project")), select:has(option:has-text("Project"))`).first();
    if (await sel.count()) {
      await sel.selectOption({ label: /create new/i as unknown as string }).catch(async () => {
        // fall back: pick the option whose text matches "create new"
        const opts = await sel.locator("option").allInnerTexts();
        const newIdx = opts.findIndex((t) => /create new/i.test(t));
        if (newIdx >= 0) await sel.selectOption({ index: newIdx });
      });
    }
  });
  await page.waitForTimeout(1500);
  await shot("01-project-mode");

  // AZ picker — KEY: does it even render for a client in new-project mode?
  await step("AZ -> zadara az1", async () => {
    const nativeAz = page.locator(`select:has(option[value="uni-ng-lag-az1"]), select:has(option:has-text("availability zone"))`).first();
    if (await nativeAz.count()) { await nativeAz.selectOption("uni-ng-lag-az1", { timeout: 5000 }); console.log("   AZ: native select OK"); return; }
    const ss = await pickSearchable(/availability zone/i, /az1|zone 1/i);
    console.log("   AZ via searchable:", ss);
  });
  await page.waitForTimeout(2500);

  await step("project name", async () => { await page.getByPlaceholder(/project name/i).first().fill(`np-${Date.now()}`, { timeout: 6000 }); });
  // network preset (if a select is present)
  await step("network preset", async () => {
    const sel = page.locator(`select:has(option:has-text("Select network preset"))`).first();
    if (await sel.count()) await sel.selectOption({ index: 1 });
  });
  await page.waitForTimeout(1500);

  console.log("type:", await pickSearchable(/Select instance type/i, /z2\.medium/i));
  await page.waitForTimeout(1000);
  console.log("image:", await pickSearchable(/Select OS image/i));
  console.log("volume:", await pickSearchable(/Select volume type/i));
  await page.waitForTimeout(800);

  // new-project keypair: optional name (created at provision time)
  await step("keypair name (optional)", async () => {
    const ki = page.locator('input[data-focus-key*="keypair_name"]').first();
    if (await ki.count()) await ki.fill(`npk${Date.now()}`, { timeout: 5000 });
  });
  await step("name", async () => { await page.getByPlaceholder("Enter cube-instance name").first().fill(`newproj-${Date.now()}`, { timeout: 8000 }); });
  await shot("02-config");
  await step("continue->payment", async () => { await page.getByRole("button", { name: /continue to payment/i }).click({ timeout: 8000 }); });
  await page.waitForTimeout(2500);
  await shot("03-payment");
  await step("pay: select wallet", async () => { await page.getByRole("button", { name: /pay with wallet/i }).first().click({ timeout: 8000 }); });
  await page.waitForTimeout(1500);
  await step("pay: enter PIN", async () => { await page.locator('input[type="password"][inputmode="numeric"], input[placeholder="••••"]').first().fill("1234", { timeout: 6000 }); });
  await page.waitForTimeout(500);
  await step("pay: finalize", async () => { await page.getByRole("button", { name: /from wallet/i }).first().click({ timeout: 8000 }); });
  await page.waitForTimeout(8000);
  await shot("04-after-pay");
  const confirmBtn = page.getByRole("button", { name: /confirm.*provision|^provision$/i }).first();
  if (await confirmBtn.count()) await step("confirm provision", async () => { await confirmBtn.click({ timeout: 8000 }); });
  await page.waitForTimeout(6000);
  await shot("05-final");
  console.log("FINAL_TEXT =", (await page.locator("main").innerText().catch(() => page.locator("body").innerText())).replace(/\s+/g, " ").slice(0, 400));
  console.log("=== FAILED_REQUESTS (" + failed.length + ") ===");
  [...new Set(failed)].slice(0, 15).forEach((f) => console.log("  FR: " + f));
});
