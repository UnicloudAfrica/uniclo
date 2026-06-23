import { test } from "@playwright/test";
import { promises as fs } from "node:fs";

/**
 * EXHAUSTIVE edge-case audit of the cube-instance CREATION screen, focused on:
 *  - keypair create: is the private key downloaded + the key auto-selected?
 *    and what happens if you CONTINUE without downloading (the key is shown once)?
 *  - public IP (EIP) toggle + its interaction with a PRIVATE network preset
 *  - network preset internal vs external
 *  - validation states (duplicate keypair name, empty name)
 * Captures screenshots + logs observable state for UX judgement.
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

const mkHelpers = (page: import("@playwright/test").Page, failed: string[]) => {
  const shortUrl = (u: string) => u.replace(/^https?:\/\/[^/]+/, "");
  page.on("response", (r) => {
    if (r.status() >= 400 && !/conveythis|\.png|trbn/.test(r.url()))
      failed.push(`${r.status()} ${r.request().method()} ${shortUrl(r.url())}`);
  });
  const step = async (label: string, fn: () => Promise<void>) => {
    try { await fn(); console.log(`OK   :: ${label}`); }
    catch (e) { console.log(`FAIL :: ${label} :: ${(e as Error).message.split("\n")[0].slice(0, 120)}`); }
  };
  const pickSearchable = async (placeholder: RegExp, want?: RegExp): Promise<string> => {
    const trigger = page.locator('button[aria-haspopup="listbox"]').filter({ hasText: placeholder }).first();
    if ((await trigger.count()) === 0) return "(trigger not found)";
    await trigger.click({ timeout: 6000 }).catch(() => {});
    await page.waitForTimeout(600);
    const opts = page.locator('ul[role="listbox"] li button');
    const n = await opts.count();
    const labels: string[] = []; let idx = -1;
    for (let i = 0; i < n; i++) {
      const t = (await opts.nth(i).innerText().catch(() => "")).replace(/\s+/g, " ").trim();
      labels.push(t);
      if (/^Select /i.test(t)) continue;
      if (want && want.test(t) && idx === -1) idx = i;
    }
    if (idx === -1) idx = labels.findIndex((t) => t && !/^Select /i.test(t));
    if (idx === -1) { await page.keyboard.press("Escape").catch(() => {}); return "(no option)"; }
    const picked = labels[idx];
    await opts.nth(idx).click().catch(() => {});
    await page.waitForTimeout(600);
    return picked;
  };
  return { shortUrl, step, pickSearchable };
};

async function login(page: import("@playwright/test").Page, shortUrl: (u: string) => string) {
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
  console.log("LOGIN_URL =", shortUrl(page.url()));
}

test("EDGE: keypair create — download, auto-select, continue-without-download", async ({ page }) => {
  test.setTimeout(220000);
  const failed: string[] = [];
  const { shortUrl, step, pickSearchable } = mkHelpers(page, failed);
  const shot = (n: string) => page.screenshot({ path: `${SHOTS}/edge-kp-${n}.png`, fullPage: true }).catch(() => {});
  let kpResp = "(no keypair POST seen)";
  let downloadedFile = "(no download)";
  page.on("download", (d) => { downloadedFile = d.suggestedFilename(); });
  page.on("response", async (r) => {
    if (/\/key-pairs\b/.test(r.url()) && r.request().method() === "POST") {
      try { const b = (await r.json()) as Record<string, unknown>; kpResp = `status=${r.status()} keys=[${Object.keys(b).join(",")}] has_material=${!!b.material} mat_len=${String(b.material || "").length}`; }
      catch { kpResp = `status=${r.status()} (unparseable)`; }
    }
  });

  await login(page, shortUrl);
  await page.goto("/client-dashboard/cube-instances/provision");
  await page.waitForTimeout(3000);
  await step("workflow", async () => { await page.getByText("Standard Workflow").first().click({ timeout: 8000 }); });
  await step("continue->config", async () => { await page.getByRole("button", { name: /continue to configuration/i }).click({ timeout: 8000 }); });
  await page.waitForTimeout(1500);
  await step("region", async () => { await page.locator(`select:has(option:has-text("Select region"))`).first().selectOption({ index: 1 }, { timeout: 8000 }); });
  await page.waitForTimeout(1500);
  await step("AZ az1", async () => { const s = page.locator(`select:has(option[value="uni-ng-lag-az1"])`).first(); if (await s.count()) await s.selectOption("uni-ng-lag-az1"); });
  await page.waitForTimeout(1500);
  console.log("project:", await pickSearchable(/Select project/i, /E2E Client Project/i));
  await page.waitForTimeout(4000);
  console.log("type:", await pickSearchable(/Select instance type/i, /z2\.medium/i));
  await page.waitForTimeout(1000);

  // ---- KEYPAIR CREATE ----
  await step("switch to create new key pair", async () => { await page.getByText(/create new key pair/i).first().click({ timeout: 6000 }); });
  await page.waitForTimeout(800);
  const kpName = `edge-key-${Date.now()}`;
  await step("enter keypair name", async () => { await page.locator('input[data-focus-key*="keypair_name_create"]').first().fill(kpName, { timeout: 6000 }); });
  await shot("01-before-create");
  await step("click Create key pair", async () => { await page.getByRole("button", { name: /^create key pair$/i }).click({ timeout: 8000 }); });
  // poll up to 60s — the zadara keypair call is slow (~27s) and variable
  const dlBtn = page.getByRole("button", { name: /download private key|^downloaded$/i }).first();
  for (let i = 0; i < 12; i++) { if ((await dlBtn.count()) > 0) break; await page.waitForTimeout(5000); }
  await shot("02-after-create");
  console.log("KP_RESPONSE:", kpResp);
  console.log("AUTO_DOWNLOAD:", downloadedFile);

  // OBSERVE the post-create state
  const hasDownload = (await dlBtn.count()) > 0;
  const downloadLabel = hasDownload ? (await dlBtn.innerText().catch(() => "")) : "(none)";
  const warnAmber = await page.getByText(/Download the private key once/i).count();
  const selectedMsg = await page.getByText(/Key pair is selected for this instance/i).count();
  // is it auto-selected? the section text should reflect the new key name being active
  const sectionText = (await page.locator("body").innerText().catch(() => "")).replace(/\s+/g, " ");
  const nameVisible = sectionText.includes(kpName);
  console.log(`KEYPAIR_STATE: download_button=${hasDownload} label="${downloadLabel}" amber_warning=${warnAmber} selected_msg=${selectedMsg} name_visible=${nameVisible}`);

  // ---- CONTINUE WITHOUT DOWNLOADING (the risky edge) ----
  await step("name instance", async () => { await page.getByPlaceholder("Enter cube-instance name").first().fill(`edge-${Date.now()}`, { timeout: 8000 }); });
  await step("continue->payment (no download)", async () => { await page.getByRole("button", { name: /continue to payment/i }).click({ timeout: 8000 }); });
  await page.waitForTimeout(2500);
  await shot("03-after-continue-no-download");
  const onPayment = /pay|wallet|payment/i.test((await page.locator("body").innerText().catch(() => "")));
  const blockedText = await page.getByText(/download.*before|must download|key.*not.*saved/i).count();
  console.log(`CONTINUE_NO_DOWNLOAD: reached_payment=${onPayment} block_warning=${blockedText}`);
  console.log("=== FAILED (" + failed.length + ") ==="); [...new Set(failed)].slice(0, 10).forEach((f) => console.log("  FR: " + f));
});

test("EDGE: public IP (EIP) + private network preset", async ({ page }) => {
  test.setTimeout(160000);
  const failed: string[] = [];
  const { shortUrl, step } = mkHelpers(page, failed);
  const shot = (n: string) => page.screenshot({ path: `${SHOTS}/edge-ip-${n}.png`, fullPage: true }).catch(() => {});

  await login(page, shortUrl);
  await page.goto("/client-dashboard/cube-instances/provision");
  await page.waitForTimeout(3000);
  await step("workflow", async () => { await page.getByText("Standard Workflow").first().click({ timeout: 8000 }); });
  await step("continue->config", async () => { await page.getByRole("button", { name: /continue to configuration/i }).click({ timeout: 8000 }); });
  await page.waitForTimeout(1500);
  await step("region", async () => { await page.locator(`select:has(option:has-text("Select region"))`).first().selectOption({ index: 1 }, { timeout: 8000 }); });
  await page.waitForTimeout(1500);

  // new project + private preset
  await step("project mode -> new", async () => {
    const sel = page.locator(`select:has(option:has-text("project"))`).first();
    const opts = await sel.locator("option").allInnerTexts();
    const i = opts.findIndex((t) => /create new/i.test(t));
    if (i >= 0) await sel.selectOption({ index: i });
  });
  await page.waitForTimeout(1200);
  await step("AZ az1", async () => { const s = page.locator(`select:has(option[value="uni-ng-lag-az1"])`).first(); if (await s.count()) await s.selectOption("uni-ng-lag-az1"); });
  await page.waitForTimeout(1500);

  // list network preset options
  const presetSel = page.locator(`select:has(option:has-text("network preset"))`).first();
  const presetOpts = (await presetSel.count()) ? await presetSel.locator("option").allInnerTexts() : [];
  console.log("NETWORK_PRESETS =", presetOpts.join(" | "));
  await step("pick Private preset", async () => {
    const i = presetOpts.findIndex((t) => /private/i.test(t));
    if (i >= 0) await presetSel.selectOption({ index: i });
  });
  await page.waitForTimeout(1200);
  await shot("01-private-preset");

  // find the EIP toggle (public IP)
  const eipCheckbox = page.locator('input[type="checkbox"]').filter({ has: page.locator("xpath=..") }).first();
  const eipLabel = page.getByText(/Allocate and attach one Elastic IP/i).first();
  const eipPresent = (await eipLabel.count()) > 0;
  console.log(`EIP_TOGGLE_PRESENT = ${eipPresent}`);
  if (eipPresent) {
    await step("toggle Attach EIP on private preset", async () => {
      await eipLabel.click({ timeout: 5000 }); // clicking the label toggles the checkbox
    });
    await page.waitForTimeout(1000);
    await shot("02-eip-on-private");
    const upgradeWarn = await page.getByText(/upgraded during provisioning|require.*public|private.*upgraded/i).count();
    const warnText = upgradeWarn ? (await page.getByText(/upgraded during provisioning|require.*public/i).first().innerText().catch(() => "")) : "(none)";
    console.log(`EIP_PRIVATE_WARNING: count=${upgradeWarn} text="${warnText.replace(/\s+/g, " ").slice(0, 120)}"`);
  }
  await shot("03-final");
  console.log("=== FAILED (" + failed.length + ") ==="); [...new Set(failed)].slice(0, 10).forEach((f) => console.log("  FR: " + f));
});

test("EDGE: validation gate + storage + quantity", async ({ page }) => {
  test.setTimeout(170000);
  const failed: string[] = [];
  const { shortUrl, step, pickSearchable } = mkHelpers(page, failed);
  const shot = (n: string) => page.screenshot({ path: `${SHOTS}/edge-val-${n}.png`, fullPage: true }).catch(() => {});
  const bodyText = async () => (await page.locator("body").innerText().catch(() => "")).replace(/\s+/g, " ");

  await login(page, shortUrl);
  await page.goto("/client-dashboard/cube-instances/provision");
  await page.waitForTimeout(3000);
  await step("workflow", async () => { await page.getByText("Standard Workflow").first().click({ timeout: 8000 }); });
  await step("continue->config", async () => { await page.getByRole("button", { name: /continue to configuration/i }).click({ timeout: 8000 }); });
  await page.waitForTimeout(1500);
  await step("region", async () => { await page.locator(`select:has(option:has-text("Select region"))`).first().selectOption({ index: 1 }, { timeout: 8000 }); });
  await page.waitForTimeout(1500);
  await step("AZ az1", async () => { const s = page.locator(`select:has(option[value="uni-ng-lag-az1"])`).first(); if (await s.count()) await s.selectOption("uni-ng-lag-az1"); });
  await page.waitForTimeout(1500);
  await step("project", async () => { await pickSearchable(/Select project/i, /E2E Client Project/i); });
  await page.waitForTimeout(3500);

  // 1. VALIDATION: try to continue with NO type/image/keypair/name
  await shot("01-empty");
  await step("continue->payment (empty config)", async () => { await page.getByRole("button", { name: /continue to payment/i }).click({ timeout: 8000 }); });
  await page.waitForTimeout(2000);
  await shot("02-after-empty-continue");
  const t1 = await bodyText();
  const reachedPay1 = /pay with wallet|amount to debit|select.*payment method/i.test(t1);
  console.log(`EMPTY_CONTINUE: reached_payment=${reachedPay1} (false = validation blocked, good)`);

  // 2. fill type+image only, leave keypair+name empty, continue again
  await step("type", async () => { await pickSearchable(/Select instance type/i, /z2\.medium/i); });
  await page.waitForTimeout(1000);
  await step("image", async () => { await pickSearchable(/Select OS image/i); });
  await page.waitForTimeout(800);
  await step("continue->payment (no keypair/name)", async () => { await page.getByRole("button", { name: /continue to payment/i }).click({ timeout: 8000 }); });
  await page.waitForTimeout(1500);
  const reachedPay2 = /pay with wallet|amount to debit|select.*payment method/i.test(await bodyText());
  console.log(`PARTIAL_CONTINUE (no keypair/name): reached_payment=${reachedPay2} (false = blocked, good)`);
  await shot("03-after-partial");

  // 3. STORAGE: add a data volume
  const addVol = page.getByRole("button", { name: /add.*data volume/i }).first();
  const addVolPresent = (await addVol.count()) > 0;
  console.log("ADD_DATA_VOLUME_PRESENT:", addVolPresent);
  if (addVolPresent) { await step("add data volume", async () => { await addVol.click({ timeout: 6000 }); }); await page.waitForTimeout(800); await shot("04-data-volume"); }

  // 4. QUANTITY > 1
  const qty = page.locator('input[type="number"]').first();
  if ((await qty.count()) > 0) { await step("set quantity 3", async () => { await qty.fill("3", { timeout: 5000 }); }); await page.waitForTimeout(800); await shot("05-quantity"); console.log("QUANTITY_INPUT_PRESENT: true"); }
  else console.log("QUANTITY_INPUT_PRESENT: false");

  console.log("=== FAILED (" + failed.length + ") ==="); [...new Set(failed)].slice(0, 10).forEach((f) => console.log("  FR: " + f));
});
