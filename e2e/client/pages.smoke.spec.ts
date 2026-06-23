import { test, expect } from "@playwright/test";

/**
 * "Page loads" smoke for the client/end-customer surface (/client-dashboard/*).
 * Each page should render the authenticated client shell (sidebar) without
 * bouncing to login. One test per route so E2E_CHECKLIST can be ticked per page.
 * Param/detail routes (`:id`) are covered by dedicated specs with seeded data.
 */
const ROUTES: Array<[id: string, path: string]> = [
  ["CLI-HOME-02", "/client-dashboard/security/2fa"],
  ["CLI-COMPUTE-01", "/client-dashboard/projects"],
  ["CLI-COMPUTE-02", "/client-dashboard/projects/create"],
  ["CLI-COMPUTE-03", "/client-dashboard/cube-instances"],
  ["CLI-COMPUTE-04", "/client-dashboard/cube-instances/create"],
  ["CLI-COMPUTE-05", "/client-dashboard/cube-instances/provision"],
  ["CLI-COMPUTE-06", "/client-dashboard/templates"],
  ["CLI-COMPUTE-07", "/client-dashboard/databases"],
  ["CLI-COMPUTE-08", "/client-dashboard/databases/create"],
  ["CLI-COMPUTE-10", "/client-dashboard/object-storage"],
  ["CLI-COMPUTE-11", "/client-dashboard/object-storage/purchase"],
  ["CLI-COMPUTE-12", "/client-dashboard/object-storage/create"],
  ["CLI-COMPUTE-14", "/client-dashboard/cloud-accounts"],
  ["CLI-COMPUTE-15", "/client-dashboard/cloud-accounts/create"],
  ["CLI-COMPUTE-17", "/client-dashboard/monitoring"],
  ["CLI-COMPUTE-18", "/client-dashboard/logs"],
  ["CLI-NET-01", "/client-dashboard/infrastructure/key-pairs"],
  ["CLI-NET-02", "/client-dashboard/infrastructure/network-interfaces"],
  ["CLI-NET-03", "/client-dashboard/infrastructure/subnets"],
  ["CLI-NET-04", "/client-dashboard/infrastructure/security-groups"],
  ["CLI-NET-05", "/client-dashboard/infrastructure/security-group-rules"],
  ["CLI-NET-06", "/client-dashboard/infrastructure/elastic-ips"],
  ["CLI-NET-07", "/client-dashboard/infrastructure/nat-gateways"],
  ["CLI-NET-08", "/client-dashboard/infrastructure/route-tables"],
  ["CLI-NET-09", "/client-dashboard/infrastructure/network-acls"],
  ["CLI-NET-10", "/client-dashboard/infrastructure/vpc-peering"],
  ["CLI-NET-11", "/client-dashboard/infrastructure/dns"],
  ["CLI-NET-12", "/client-dashboard/infrastructure/snapshots"],
  ["CLI-NET-13", "/client-dashboard/infrastructure/images"],
  ["CLI-NET-14", "/client-dashboard/infrastructure/autoscaling"],
  ["CLI-SHIELD-01", "/client-dashboard/shield/domains"],
  ["CLI-SHIELD-02", "/client-dashboard/shield/overview"],
  ["CLI-SHIELD-03", "/client-dashboard/shield/firewall"],
  ["CLI-SHIELD-04", "/client-dashboard/shield/attacks"],
  ["CLI-SHIELD-05", "/client-dashboard/shield/attack-map"],
  ["CLI-SHIELD-06", "/client-dashboard/shield/analytics"],
  ["CLI-SHIELD-07", "/client-dashboard/shield/ssl"],
  ["CLI-RES-01", "/client-dashboard/integrations/orbit/vms"],
  ["CLI-RES-02", "/client-dashboard/migrations"],
  ["CLI-RES-03", "/client-dashboard/batch-migrations"],
  ["CLI-RES-04", "/client-dashboard/migration-requests"],
  ["CLI-RES-05", "/client-dashboard/move-my-email"],
  ["CLI-RES-06", "/client-dashboard/image-requests"],
  ["CLI-RES-07", "/client-dashboard/integrations/orbit/buckets/endpoints"],
  ["CLI-RES-08", "/client-dashboard/integrations/orbit/buckets/migrations"],
  ["CLI-RES-09", "/client-dashboard/integrations/orbit/buckets/replications"],
  ["CLI-RES-10", "/client-dashboard/protection"],
  ["CLI-RES-11", "/client-dashboard/database-replication"],
  ["CLI-RES-12", "/client-dashboard/dr-drills"],
  ["CLI-RES-13", "/client-dashboard/serverless-dr"],
  ["CLI-RES-14", "/client-dashboard/ransomware"],
  ["CLI-RES-15", "/client-dashboard/hypervisor"],
  ["CLI-RES-16", "/client-dashboard/agent"],
  ["CLI-DEPLOY-01", "/client-dashboard/flow"],
  ["CLI-BILL-01", "/client-dashboard/pricing-calculator"],
  ["CLI-BILL-02", "/client-dashboard/orders-payments"],
  ["CLI-BILL-03", "/client-dashboard/payment-methods"],
  ["CLI-BILL-04", "/client-dashboard/invoices"],
  ["CLI-BILL-05", "/client-dashboard/domains"],
  ["CLI-BILL-06", "/client-dashboard/billing"],
  ["CLI-DEV-01", "/client-dashboard/developer/api-keys"],
  ["CLI-DEV-02", "/client-dashboard/developer/webhooks"],
  ["CLI-DEV-03", "/client-dashboard/developer/usage"],
  ["CLI-ACCT-01", "/client-dashboard/account-settings"],
  ["CLI-ACCT-02", "/client-dashboard/team"],
  ["CLI-ACCT-03", "/client-dashboard/support"],
  ["CLI-ACCT-04", "/client-dashboard/docs"],
  // --- deploy sub-tabs (quick-win additions) ---
  ["CLI-DEPLOY-02", "/client-dashboard/flow?tab=servers"],
  ["CLI-DEPLOY-03", "/client-dashboard/flow?tab=sites"],
  ["CLI-DEPLOY-04", "/client-dashboard/flow?tab=git-providers"],
  ["CLI-DEPLOY-05", "/client-dashboard/flow?tab=databases"],
  ["CLI-DEPLOY-06", "/client-dashboard/flow/billing"],
];

test.describe("client · page loads", () => {
  for (const [id, path] of ROUTES) {
    test(`${id} loads (${path})`, async ({ page }) => {
      await page.goto(path, { waitUntil: "domcontentloaded" });
      await expect(page).not.toHaveURL(/\/(sign-in|verify-mail)/);
      // Authenticated client shell rendered (account control in header).
      await expect(
        page.getByRole("button", { name: /e2e-client@unicloud\.africa/i }),
      ).toBeVisible();
    });
  }
});
