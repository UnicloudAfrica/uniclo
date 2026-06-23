import { test, expect } from "@playwright/test";

/**
 * "Page loads" smoke for the tenant surface (routes live under /dashboard/*).
 * Each page should render the authenticated tenant shell (sidebar) without
 * bouncing to login. One test per route so E2E_CHECKLIST can be ticked per page.
 * Param/detail routes (`:id`) are covered by dedicated specs with seeded data.
 */
const ROUTES: Array<[id: string, path: string]> = [
  ["TEN-HOME-02", "/dashboard/purchased-modules"],
  ["TEN-CS-01", "/dashboard/projects"],
  ["TEN-CS-02", "/dashboard/cube-instances"],
  ["TEN-CS-03", "/dashboard/create-instance"],
  ["TEN-CS-04", "/dashboard/templates"],
  ["TEN-CS-05", "/dashboard/monitoring"],
  ["TEN-CS-06", "/dashboard/object-storage"],
  ["TEN-CS-07", "/dashboard/databases"],
  ["TEN-CS-08", "/dashboard/cloud-accounts"],
  ["TEN-CS-09", "/dashboard/infrastructure/key-pairs"],
  ["TEN-CS-10", "/dashboard/infrastructure/network-interfaces"],
  ["TEN-CS-11", "/dashboard/infrastructure/snapshots"],
  ["TEN-CS-12", "/dashboard/infrastructure/images"],
  ["TEN-NET-01", "/dashboard/infrastructure/subnets"],
  ["TEN-NET-02", "/dashboard/infrastructure/security-groups"],
  ["TEN-NET-03", "/dashboard/infrastructure/network-acls"],
  ["TEN-NET-04", "/dashboard/infrastructure/elastic-ips"],
  ["TEN-NET-05", "/dashboard/infrastructure/nat-gateways"],
  ["TEN-NET-06", "/dashboard/infrastructure/route-tables"],
  ["TEN-NET-07", "/dashboard/infrastructure/vpc-peering"],
  ["TEN-NET-08", "/dashboard/infrastructure/load-balancers"],
  ["TEN-NET-09", "/dashboard/infrastructure/dns"],
  ["TEN-NET-10", "/dashboard/shield/domains"],
  ["TEN-NET-11", "/dashboard/shield/firewall"],
  ["TEN-NET-12", "/dashboard/shield/attacks"],
  ["TEN-NET-13", "/dashboard/shield/attack-map"],
  ["TEN-NET-14", "/dashboard/shield/analytics"],
  ["TEN-NET-15", "/dashboard/shield/ssl"],
  ["TEN-NET-16", "/dashboard/shield/overview"],
  ["TEN-RES-01", "/dashboard/integrations/orbit/vms"],
  ["TEN-RES-02", "/dashboard/migrations"],
  ["TEN-RES-03", "/dashboard/batch-migrations"],
  ["TEN-RES-04", "/dashboard/destinations"],
  ["TEN-RES-05", "/dashboard/protection"],
  ["TEN-RES-06", "/dashboard/database-replication"],
  ["TEN-RES-07", "/dashboard/dr-drills"],
  ["TEN-RES-08", "/dashboard/serverless-dr"],
  ["TEN-RES-09", "/dashboard/ransomware"],
  ["TEN-RES-10", "/dashboard/hypervisor"],
  ["TEN-RES-11", "/dashboard/agent"],
  ["TEN-RES-12", "/dashboard/orbit/calculator"],
  ["TEN-RES-13", "/dashboard/move-my-email"],
  ["TEN-DEPLOY-01", "/dashboard/flow"],
  ["TEN-CUST-01", "/dashboard/clients"],
  ["TEN-CUST-04", "/dashboard/leads"],
  ["TEN-CUST-05", "/dashboard/region-requests"],
  ["TEN-CUST-06", "/dashboard/onboarding"],
  ["TEN-BILL-01", "/dashboard/revenue"],
  ["TEN-BILL-02", "/dashboard/pricing"],
  ["TEN-BILL-03", "/dashboard/pricing-calculator"],
  ["TEN-BILL-04", "/dashboard/invoices"],
  ["TEN-BILL-05", "/dashboard/create-invoice"],
  ["TEN-BILL-06", "/dashboard/quote-invoice"],
  ["TEN-BILL-07", "/dashboard/payment-history"],
  ["TEN-BILL-08", "/dashboard/tax-configurations"],
  ["TEN-BILL-09", "/dashboard/discounts"],
  ["TEN-BILL-10", "/dashboard/coupons"],
  ["TEN-BILL-11", "/dashboard/dunning"],
  ["TEN-BILL-12", "/dashboard/accounting"],
  ["TEN-BILL-13", "/dashboard/billing"],
  ["TEN-BILL-14", "/dashboard/payouts"],
  ["TEN-BILL-15", "/dashboard/poc-trials"],
  ["TEN-INFRA-01", "/dashboard/infrastructure/autoscaling"],
  ["TEN-DEV-01", "/dashboard/developer/api-keys"],
  ["TEN-DEV-02", "/dashboard/developer/webhooks"],
  ["TEN-DEV-03", "/dashboard/developer/usage"],
  ["TEN-DEV-04", "/dashboard/products"],
  ["TEN-SUPP-01", "/dashboard/support"],
  ["TEN-ACC-01", "/dashboard/account"],
  ["TEN-ACC-02", "/dashboard/security/2fa"],
  ["TEN-ACC-03", "/dashboard/security/2fa-policy"],
  ["TEN-DOC-01", "/dashboard/docs"],
  ["TEN-MISC-01", "/dashboard/requests"],
  // --- deploy sub-tabs + create forms (quick-win additions) ---
  ["TEN-DEPLOY-02", "/dashboard/flow?tab=servers"],
  ["TEN-DEPLOY-03", "/dashboard/flow?tab=sites"],
  ["TEN-DEPLOY-04", "/dashboard/flow?tab=git-providers"],
  ["TEN-DEPLOY-05", "/dashboard/flow?tab=databases"],
  ["TEN-DEPLOY-06", "/dashboard/flow/billing"],
  ["TEN-CUST-02", "/dashboard/partners/new"],
  ["TEN-CUST-03", "/dashboard/tenant-users/new"],
];

test.describe("tenant · page loads", () => {
  for (const [id, path] of ROUTES) {
    test(`${id} loads (${path})`, async ({ page }) => {
      await page.goto(path, { waitUntil: "domcontentloaded" });
      await expect(page).not.toHaveURL(/\/(sign-in|verify-mail|tenant-sign-in)/);
      // Authenticated tenant shell rendered (account control in header).
      await expect(
        page.getByRole("button", { name: /e2e-tenant@unicloud\.africa/i }),
      ).toBeVisible();
    });
  }
});
