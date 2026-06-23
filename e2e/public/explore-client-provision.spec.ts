import { test, type Locator } from "@playwright/test";
import { promises as fs } from "node:fs";

/**
 * EXPLORATORY: log in as a real client and drive the provisioning wizard like a
 * customer — including the custom SearchableSelect dropdowns — to SEE whether a
 * customer can actually provision, and what the real provider call does.
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

test("EXPLORE: client logs in and provisions", async ({ page }) => {
  test.setTimeout(180000);
  const failed: string[] = [];
  const shortUrl = (u: string) => u.replace(/^https?:\/\/[^/]+/, "");
  page.on("response", (r) => { if (r.status() >= 400 && !/conveythis|\.png|trbn/.test(r.url())) failed.push(`${r.status()} ${r.request().method()} ${shortUrl(r.url())}`); });

  const step = async (label: string, fn: () => Promise<void>) => {
    try { await fn(); console.log(`OK   :: ${label}`); }
    catch (e) { console.log(`FAIL :: ${label} :: ${(e as Error).message.split("\n")[0].slice(0, 120)}`); }
  };
  const shot = (n: string) => page.screenshot({ path: `${SHOTS}/explore-${n}.png`, fullPage: true }).catch(() => {});
  const sel = (opt: string) => page.locator(`select:has(option:has-text(${JSON.stringify(opt)}))`).first();
  const pickNative = async (s: Locator, optional = false) => {
    if ((await s.count()) === 0) { if (optional) return; throw new Error("native select not present"); }
    await s.selectOption({ index: 1 }, { timeout: 8000 });
  };
  // Drive every still-unselected SearchableSelect (button[aria-haspopup=listbox] showing "Select…"),
  // logging each dropdown's option count so empty ones (a real blocker) are visible.
  const pickAllSearchable = async () => {
    for (let pass = 0; pass < 8; pass++) {
      const triggers = page.locator('button[aria-haspopup="listbox"]').filter({ hasText: /Select/i });
      if ((await triggers.count()) === 0) break;
      const t = triggers.first();
      const ph = (await t.innerText().catch(() => "")).replace(/\s+/g, " ").slice(0, 28);
      await t.click({ timeout: 5000 }).catch(() => {});
      await page.waitForTimeout(600);
      const opts = page.locator('ul[role="listbox"] li button');
      const oc = await opts.count();
      let picked = "";
      for (let i = 0; i < oc; i++) {
        const txt = (await opts.nth(i).innerText().catch(() => "")).replace(/\s+/g, " ").trim();
        if (txt && !/^Select /i.test(txt)) { await opts.nth(i).click().catch(() => {}); picked = txt.slice(0, 30); break; }
      }
      console.log(`  SS "${ph}" -> options=${oc}${picked ? ` picked "${picked}"` : " (NO real option — empty/blocked!)"}`);
      if (!picked) { await page.keyboard.press("Escape").catch(() => {}); break; }
      await page.waitForTimeout(700);
    }
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

  // ---- WIZARD ----
  await page.goto("/client-dashboard/cube-instances/provision");
  await page.waitForTimeout(3000);
  await step("workflow: Standard", async () => { await page.getByText("Standard Workflow").first().click({ timeout: 8000 }); });
  await step("continue->config", async () => { await page.getByRole("button", { name: /continue to configuration/i }).click({ timeout: 8000 }); });
  await page.waitForTimeout(1500);
  await step("region (native)", async () => { await pickNative(sel("Select region")); });
  await page.waitForTimeout(3000); // region-dependent fetches
  console.log("--- driving SearchableSelects (project / instance type / OS image) ---");
  await pickAllSearchable(); // project, instance type, OS image, volume, key pair (if any exist)
  // Key pair: if still unselected (fresh Zadara project → empty list), create a new one.
  if (await page.locator('button[aria-haspopup="listbox"]').filter({ hasText: /Select a key pair/i }).count()) {
    await step("keypair: create new", async () => {
      await page.getByText(/create new key pair/i).first().click({ timeout: 6000 });
      await page.waitForTimeout(900);
      const ki = page.locator('input[data-focus-key*="keypair_name"], input[placeholder*="key" i]').first();
      await ki.fill(`zkey${Date.now()}`, { timeout: 6000 });
    });
  }
  await step("name", async () => { await page.getByPlaceholder("Enter cube-instance name").first().fill(`explore-${Date.now()}`, { timeout: 8000 }); });
  await shot("04-config-filled");
  await step("continue->payment", async () => { await page.getByRole("button", { name: /continue to payment/i }).click({ timeout: 8000 }); });
  await page.waitForTimeout(2500);
  await shot("05-payment");
  await step("pay: wallet", async () => { await page.getByRole("button", { name: /pay with wallet/i }).first().click({ timeout: 8000 }); });
  await page.waitForTimeout(4000);
  await shot("06-after-pay");
  await step("confirm provision", async () => { await page.getByRole("button", { name: /confirm.*provision|^provision$/i }).first().click({ timeout: 8000 }); });
  await page.waitForTimeout(9000); // real provider call
  await shot("07-after-provision");
  console.log("FINAL_TEXT =", (await page.locator("main").innerText().catch(() => page.locator("body").innerText())).replace(/\s+/g, " ").slice(0, 600));
  console.log("=== APP FAILED_REQUESTS (" + failed.length + ") ===");
  [...new Set(failed)].slice(0, 25).forEach((f) => console.log("  FR: " + f));
});
