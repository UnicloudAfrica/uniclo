import React, { type JSX } from "react";
import { Route, Outlet } from "react-router-dom";
import ObjectStorageProvider from "../contexts/ObjectStorageContext";
import AdminRoute from "./AdminRoute";
import AdminDashboard from "../adminDashboard/pages/AdminDashboard";
import AdminPartners from "../adminDashboard/pages/AdminPartners";
import AdminPartnerCreate from "../adminDashboard/pages/AdminPartnerCreate";
import AdminPartnerDetails from "../adminDashboard/pages/AdminPartnerDetails";
import AdminClients from "../adminDashboard/pages/AdminClients";
import AdminClientCreate from "../adminDashboard/pages/AdminClientCreate";
import AdminClientDetails from "../adminDashboard/pages/AdminClientDetails";
import AdminPayment from "../adminDashboard/pages/adminPayment";
import AdminPaymentDetails from "../adminDashboard/pages/adminPaymentDetails";
import VerifyAdminMail from "../adminDashboard/pages/AdminVerify";
import AdminLogin from "../adminDashboard/pages/AdminSignin";
import AdminPurchasedModules from "../adminDashboard/pages/adminPurchasedModules";
import AdminInventory from "../adminDashboard/pages/adminInventory";
import AdminTax from "../adminDashboard/pages/adminTax";
import AdminUsers from "../adminDashboard/pages/AdminUsers";
import AdminUserCreate from "../adminDashboard/pages/adminUserCreate";
import AdminUserDetails from "../adminDashboard/pages/adminUserDetails";
import AdminUserEdit from "../adminDashboard/pages/adminUserEdit";
import AdminProjects from "../adminDashboard/pages/adminProjects";
import AdminProjectCreate from "../adminDashboard/pages/adminProjectCreate";
import AdminProjectDetails from "../adminDashboard/pages/AdminProjectDetails";

import AdminOnboardingSettings from "../adminDashboard/pages/adminOnboardingSettings";
import AdminLeads from "../adminDashboard/pages/adminLeads";
import AdminLeadCreate from "../adminDashboard/pages/adminLeadCreate";
import AdminLeadDetails from "../adminDashboard/pages/adminLeadDetails";
import AdminRegion from "../adminDashboard/pages/adminRegion";
import AdminPricing from "../adminDashboard/pages/adminPricing";
import AdminProducts from "../adminDashboard/pages/AdminProducts";
import AdminProductFamilies from "../adminDashboard/pages/AdminProductFamilies";
import AdminProductCreate from "../adminDashboard/pages/AdminProductCreate";
import AdminPricingCreate from "../adminDashboard/pages/AdminPricingCreate";
import AdminPricingEdit from "../adminDashboard/pages/AdminPricingEdit";
import AdminTemplates from "../adminDashboard/pages/AdminTemplates";
import CreateInvoice from "../adminDashboard/pages/CreateInvoice";
import AdminPricingCalculator from "../adminDashboard/pages/AdminPricingCalculator";
import AdminInfrastructureSetup from "../adminDashboard/pages/adminInfrastructureSetup";
import AdminObjectStorage from "../adminDashboard/pages/adminObjectStorage";
import AdminObjectStorageCreate from "../adminDashboard/pages/adminObjectStorageCreate";
import AdminObjectStorageDetail from "../adminDashboard/pages/AdminObjectStorageDetail";
import AdminCreateInstance from "../adminDashboard/pages/AdminCreateInstance";
import EnhancedProfileSettings from "../adminDashboard/pages/EnhancedProfileSettings";
import AdminInstances from "../adminDashboard/pages/AdminInstances";
import AdminInstancesDetails from "../adminDashboard/pages/adminInstancesDetails";
import RegionApprovals from "../adminDashboard/pages/RegionApprovals";
import RegionApprovalDetail from "../adminDashboard/pages/RegionApprovalDetail";
import RegionApprovalEdit from "../adminDashboard/pages/RegionApprovalEdit";
import RegionApprovalCreate from "../adminDashboard/pages/RegionApprovalCreate";
import RegionCreate from "../adminDashboard/pages/RegionCreate";
import RegionDetail from "../adminDashboard/pages/RegionDetail";
import RegionEdit from "../adminDashboard/pages/RegionEdit";
import AdminOnboardingReview from "../adminDashboard/pages/AdminOnboardingReview";
import AdminProviderDiscovery from "../adminDashboard/pages/AdminProviderDiscovery";
import AdminDocsLayout from "../adminDashboard/pages/docs/AdminDocsLayout";
import AdminDocPage from "../adminDashboard/pages/docs/AdminDocPage";
import DocEditor from "../docs/renderer/DocEditor";
import AdminSubscriptionPlans from "../adminDashboard/pages/AdminSubscriptionPlans";
import WalletDashboard from "../adminDashboard/pages/WalletDashboard";
import SettlementsDashboard from "../adminDashboard/pages/SettlementsDashboard";
import PayoutsDashboard from "../adminDashboard/pages/PayoutsDashboard";
import AnalyticsDashboard from "../adminDashboard/pages/AnalyticsDashboard";
import AdminDeveloperPortal from "../adminDashboard/pages/AdminDeveloperPortal";
import AdminBridgeClients from "../adminDashboard/pages/AdminBridgeClients";
import TicketsDashboard from "../adminDashboard/pages/TicketsDashboard";
import AdminTicketDetail from "../adminDashboard/pages/AdminTicketDetail";
import AdminManagedDatabases from "../adminDashboard/pages/AdminManagedDatabases";
import AdminMonitoring from "../adminDashboard/pages/AdminMonitoring";
import AdminPaymentSplits from "../adminDashboard/pages/AdminPaymentSplits";
import AdminMigrationCalculator from "../adminDashboard/pages/AdminMigrationCalculator";
import AdminAcfFastTrack from "../adminDashboard/pages/AdminAcfFastTrack";
import AdminAcfDirectProvision from "../adminDashboard/pages/AdminAcfDirectProvision";
import AdminDatabaseCreate from "../adminDashboard/pages/AdminDatabaseCreate";
import AdminDatabaseDetail from "../adminDashboard/pages/AdminDatabaseDetail";
import AdminProtection from "../adminDashboard/pages/AdminProtection";
import AdminMigrations from "../adminDashboard/pages/AdminMigrations";
import AdminMigrationWizard from "../adminDashboard/pages/AdminMigrationWizard";
import AdminBatchMigrations from "../adminDashboard/pages/AdminBatchMigrations";
import AdminBatchMigrationWizard from "../adminDashboard/pages/AdminBatchMigrationWizard";
import AdminBatchMigrationDetail from "../adminDashboard/pages/AdminBatchMigrationDetail";
import AdminDestinations from "../adminDashboard/pages/AdminDestinations";
import AdminServerlessDr from "../adminDashboard/pages/AdminServerlessDr";
import AdminAgent from "../adminDashboard/pages/AdminAgent";
import AdminPocTrials from "../adminDashboard/pages/AdminPocTrials";
import AdminDrDrills from "../adminDashboard/pages/AdminDrDrills";
import AdminHypervisor from "../adminDashboard/pages/AdminHypervisor";
import AdminDatabaseReplication from "../adminDashboard/pages/AdminDatabaseReplication";
import AdminRansomware from "../adminDashboard/pages/AdminRansomware";
import AdminShieldDomains from "../adminDashboard/pages/AdminShieldDomains";
import AdminShieldDomainDetail from "../adminDashboard/pages/AdminShieldDomainDetail";
import AdminShieldOverview from "../adminDashboard/pages/AdminShieldOverview";
import AdminShieldAttackMap from "../adminDashboard/pages/AdminShieldAttackMap";
import AdminShieldFirewall from "../adminDashboard/pages/AdminShieldFirewall";
import AdminShieldAttacks from "../adminDashboard/pages/AdminShieldAttacks";
import AdminShieldAnalytics from "../adminDashboard/pages/AdminShieldAnalytics";
import AdminShieldSsl from "../adminDashboard/pages/AdminShieldSsl";
import AdminCloudAccounts from "../adminDashboard/pages/AdminCloudAccounts";
import AdminCloudAccountCreate from "../adminDashboard/pages/AdminCloudAccountCreate";
import AdminCloudAccountDetail from "../adminDashboard/pages/AdminCloudAccountDetail";
import IntegrationPartnerPayoutsDashboard from "../adminDashboard/pages/IntegrationPartnerPayoutsDashboard";
import IntegrationPartnerLedgerDashboard from "../adminDashboard/pages/IntegrationPartnerLedgerDashboard";
import AdminFlow from "../adminDashboard/pages/AdminFlow";
import AdminFlowDashboard from "../adminDashboard/pages/AdminFlowDashboard";

// Infrastructure Pages
import {
  AdminNatGateways,
  AdminElasticIps,
  AdminSecurityGroups,
  AdminSecurityGroupRules,
  AdminSubnets,
  AdminRouteTables,
  AdminNetworkAcls,
  AdminNetworkAclRules,
  AdminVpcPeering,
  AdminKeyPairs,
  AdminNetworkInterfaces,
  AdminVpcs,
  AdminInternetGateways,
  AdminLoadBalancers,
  AdminDnsManagement,
  AdminSnapshots,
  AdminImages,
  AdminAutoScaling,
} from "../adminDashboard/pages/infrastructure";
import AdminKeyPairCreate from "../adminDashboard/pages/infrastructure/AdminKeyPairCreate";

const ObjectStorageRouteProvider = (): JSX.Element => (
  <ObjectStorageProvider>
    <div className="object-storage-theme">
      <Outlet />
    </div>
  </ObjectStorageProvider>
);

const AdminRoutes = (): React.JSX.Element => {
  return (
    <>
      {/* Public admin routes (no auth guard) */}
      <Route path="/admin-signin" element={<AdminLogin />} />
      <Route path="/verify-admin-mail" element={<VerifyAdminMail />} />

      {/* Protected admin routes */}
      <Route element={<AdminRoute />}>
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/admin-dashboard/admin-users" element={<AdminUsers />} />
        <Route path="/admin-dashboard/admin-users/create" element={<AdminUserCreate />} />
        <Route path="/admin-dashboard/admin-users/:adminId" element={<AdminUserDetails />} />
        <Route path="/admin-dashboard/admin-users/:adminId/edit" element={<AdminUserEdit />} />
        <Route path="/admin-dashboard/admins" element={<AdminUsers />} />
        <Route path="/admin-dashboard/partners" element={<AdminPartners />} />
        <Route path="/admin-dashboard/partners/create" element={<AdminPartnerCreate />} />
        <Route path="/admin-dashboard/partners/details" element={<AdminPartnerDetails />} />
        <Route path="/admin-dashboard/clients" element={<AdminClients />} />
        <Route path="/admin-dashboard/clients/create" element={<AdminClientCreate />} />
        <Route path="/admin-dashboard/clients/details" element={<AdminClientDetails />} />
        <Route path="/admin-dashboard/purchased-modules" element={<AdminPurchasedModules />} />
        <Route path="/admin-dashboard/payment" element={<AdminPayment />} />
        <Route path="/admin-dashboard/payment/:transactionId" element={<AdminPaymentDetails />} />
        <Route path="/admin-dashboard/products" element={<AdminProducts />} />
        <Route path="/admin-dashboard/products/add" element={<AdminProductCreate />} />
        <Route path="/admin-dashboard/product-families" element={<AdminProductFamilies />} />
        <Route path="/admin-dashboard/templates" element={<AdminTemplates />} />
        <Route
          path="/admin-dashboard/colocation"
          element={<AdminPricing initialTab="colocation" />}
        />
        <Route path="/admin-dashboard/inventory" element={<AdminInventory />} />
        <Route path="/admin-dashboard/projects" element={<AdminProjects />} />
        <Route path="/admin-dashboard/projects/create" element={<AdminProjectCreate />} />
        <Route path="/admin-dashboard/leads" element={<AdminLeads />} />
        <Route path="/admin-dashboard/leads/create" element={<AdminLeadCreate />} />
        <Route path="/admin-dashboard/regions" element={<AdminRegion />} />
        <Route path="/admin-dashboard/regions/create" element={<RegionCreate />} />
        <Route path="/admin-dashboard/regions/:id" element={<RegionDetail />} />
        <Route path="/admin-dashboard/regions/:id/edit" element={<RegionEdit />} />
        <Route path="/admin-dashboard/region-approvals" element={<RegionApprovals />} />
        <Route path="/admin-dashboard/onboarding-review" element={<AdminOnboardingReview />} />
        <Route path="/admin-dashboard/onboarding-settings" element={<AdminOnboardingSettings />} />
        <Route path="/admin-dashboard/region-approvals/create" element={<RegionApprovalCreate />} />
        <Route path="/admin-dashboard/region-approvals/:id" element={<RegionApprovalDetail />} />
        <Route path="/admin-dashboard/region-approvals/:id/edit" element={<RegionApprovalEdit />} />
        <Route path="/admin-dashboard/leads/details" element={<AdminLeadDetails />} />
        <Route path="/admin-dashboard/projects/details" element={<AdminProjectDetails />} />
        <Route
          path="/admin-dashboard/infrastructure-setup"
          element={<AdminInfrastructureSetup />}
        />

        <Route path="/admin-dashboard/create-instance" element={<AdminCreateInstance />} />
        <Route path="/admin-dashboard/key-pairs" element={<AdminKeyPairs />} />
        <Route path="/admin-dashboard/pricing" element={<AdminPricing />} />
        <Route path="/admin-dashboard/pricing/add" element={<AdminPricingCreate />} />
        <Route path="/admin-dashboard/pricing/edit" element={<AdminPricingEdit />} />

        <Route path="/admin-dashboard/pricing-calculator" element={<AdminPricingCalculator />} />
        <Route path="/admin-dashboard/create-invoice" element={<CreateInvoice />} />

        <Route path="/admin-dashboard/account" element={<EnhancedProfileSettings />} />
        <Route path="/admin-dashboard/cube-instances" element={<AdminInstances />} />
        <Route path="/admin-dashboard/cube-instances/details" element={<AdminInstancesDetails />} />

        <Route path="/admin-dashboard/monitoring" element={<AdminMonitoring />} />
        <Route path="/admin-dashboard/databases" element={<AdminManagedDatabases />} />
        <Route path="/admin-dashboard/databases/create" element={<AdminDatabaseCreate />} />
        <Route path="/admin-dashboard/databases/:identifier" element={<AdminDatabaseDetail />} />

        <Route path="/admin-dashboard/cloud-accounts" element={<AdminCloudAccounts />} />
        <Route path="/admin-dashboard/cloud-accounts/create" element={<AdminCloudAccountCreate />} />
        <Route path="/admin-dashboard/cloud-accounts/:accountId" element={<AdminCloudAccountDetail />} />

        <Route path="/admin-dashboard/protection" element={<AdminProtection />} />
        <Route path="/admin-dashboard/dr-drills" element={<AdminDrDrills />} />
        <Route path="/admin-dashboard/hypervisor" element={<AdminHypervisor />} />
        <Route path="/admin-dashboard/database-replication" element={<AdminDatabaseReplication />} />
        <Route path="/admin-dashboard/ransomware" element={<AdminRansomware />} />

        <Route path="/admin-dashboard/migrations" element={<AdminMigrations />} />
        <Route path="/admin-dashboard/migrations/new" element={<AdminMigrationWizard />} />
        <Route path="/admin-dashboard/batch-migrations" element={<AdminBatchMigrations />} />
        <Route path="/admin-dashboard/batch-migrations/new" element={<AdminBatchMigrationWizard />} />
        <Route path="/admin-dashboard/batch-migrations/:identifier" element={<AdminBatchMigrationDetail />} />
        <Route path="/admin-dashboard/destinations" element={<AdminDestinations />} />

        <Route path="/admin-dashboard/shield/domains" element={<AdminShieldDomains />} />
        <Route path="/admin-dashboard/shield/domains/:domainId" element={<AdminShieldDomainDetail />} />
        <Route path="/admin-dashboard/shield/overview" element={<AdminShieldOverview />} />
        <Route path="/admin-dashboard/shield/attack-map" element={<AdminShieldAttackMap />} />
        <Route path="/admin-dashboard/shield/firewall" element={<AdminShieldFirewall />} />
        <Route path="/admin-dashboard/anycloudflow/calculator" element={<AdminMigrationCalculator />} />
        <Route path="/admin-dashboard/anycloudflow/fast-track" element={<AdminAcfFastTrack />} />
        <Route path="/admin-dashboard/anycloudflow/direct-provision" element={<AdminAcfDirectProvision />} />
        <Route path="/admin-dashboard/shield/attacks" element={<AdminShieldAttacks />} />
        <Route path="/admin-dashboard/shield/analytics" element={<AdminShieldAnalytics />} />
        <Route path="/admin-dashboard/shield/ssl" element={<AdminShieldSsl />} />
        <Route path="/admin-dashboard/serverless-dr" element={<AdminServerlessDr />} />
        <Route path="/admin-dashboard/agent" element={<AdminAgent />} />

        <Route element={<ObjectStorageRouteProvider />}>
          <Route path="/admin-dashboard/object-storage" element={<AdminObjectStorage />} />
          <Route
            path="/admin-dashboard/object-storage/create"
            element={<AdminObjectStorageCreate />}
          />
          <Route
            path="/admin-dashboard/object-storage/:accountId"
            element={<AdminObjectStorageDetail />}
          />
          <Route
            path="/admin-dashboard/object-storage/:accountId/buckets/:bucketName/*"
            element={<AdminObjectStorageDetail />}
          />
        </Route>
        <Route path="/admin-dashboard/tax-configuration" element={<AdminTax />} />
        <Route path="/admin-dashboard/subscription-plans" element={<AdminSubscriptionPlans />} />
        <Route path="/admin-dashboard/wallet" element={<WalletDashboard />} />
        <Route path="/admin-dashboard/payment-splits" element={<AdminPaymentSplits />} />
        <Route path="/admin-dashboard/settlements" element={<SettlementsDashboard />} />
        <Route path="/admin-dashboard/payouts" element={<PayoutsDashboard />} />
        <Route path="/admin-dashboard/integration-partner-payouts" element={<IntegrationPartnerPayoutsDashboard />} />
        <Route path="/admin-dashboard/integration-partner-payouts/ledger" element={<IntegrationPartnerLedgerDashboard />} />
        <Route path="/admin-dashboard/poc-trials" element={<AdminPocTrials />} />
        <Route path="/admin-dashboard/analytics" element={<AnalyticsDashboard />} />
        <Route path="/admin-dashboard/developer/*" element={<AdminDeveloperPortal />} />
        <Route path="/admin-dashboard/bridge-clients" element={<AdminBridgeClients />} />
        <Route path="/admin-dashboard/tickets" element={<TicketsDashboard />} />
        <Route path="/admin-dashboard/tickets/:id" element={<AdminTicketDetail />} />

        {/* Infrastructure Management */}
        <Route path="/admin-dashboard/infrastructure/nat-gateways" element={<AdminNatGateways />} />
        <Route path="/admin-dashboard/infrastructure/elastic-ips" element={<AdminElasticIps />} />
        <Route
          path="/admin-dashboard/infrastructure/security-groups"
          element={<AdminSecurityGroups />}
        />
        <Route
          path="/admin-dashboard/infrastructure/security-group-rules"
          element={<AdminSecurityGroupRules />}
        />
        <Route path="/admin-dashboard/infrastructure/subnets" element={<AdminSubnets />} />
        <Route path="/admin-dashboard/infrastructure/route-tables" element={<AdminRouteTables />} />
        <Route path="/admin-dashboard/infrastructure/network-acls" element={<AdminNetworkAcls />} />
        <Route
          path="/admin-dashboard/infrastructure/network-acl-rules"
          element={<AdminNetworkAclRules />}
        />
        <Route path="/admin-dashboard/infrastructure/vpc-peering" element={<AdminVpcPeering />} />
        <Route
          path="/admin-dashboard/infrastructure/load-balancers"
          element={<AdminLoadBalancers />}
        />
        <Route path="/admin-dashboard/key-pairs" element={<AdminKeyPairs />} />
        <Route path="/admin-dashboard/key-pairs/create" element={<AdminKeyPairCreate />} />
        <Route path="/admin-dashboard/infrastructure/key-pairs" element={<AdminKeyPairs />} />
        <Route
          path="/admin-dashboard/infrastructure/network-interfaces"
          element={<AdminNetworkInterfaces />}
        />
        <Route path="/admin-dashboard/infrastructure/vpcs" element={<AdminVpcs />} />
        <Route
          path="/admin-dashboard/infrastructure/internet-gateways"
          element={<AdminInternetGateways />}
        />
        <Route path="/admin-dashboard/infrastructure/dns" element={<AdminDnsManagement />} />
        <Route path="/admin-dashboard/infrastructure/snapshots" element={<AdminSnapshots />} />
        <Route path="/admin-dashboard/infrastructure/images" element={<AdminImages />} />
        <Route path="/admin-dashboard/infrastructure/autoscaling" element={<AdminAutoScaling />} />

        {/* UniCloudFlow */}
        <Route path="/admin-dashboard/flow" element={<AdminFlow />} />
        <Route path="/admin-dashboard/flow-dashboard" element={<AdminFlowDashboard />} />

        {/* Provider Discovery */}
        <Route
          path="/admin-dashboard/provider-discovery"
          element={<AdminProviderDiscovery />}
        />

        {/* Documentation */}
        <Route path="/admin-dashboard/docs" element={<AdminDocsLayout />}>
          <Route index element={<AdminDocPage />} />
          <Route path="edit" element={<DocEditor />} />
          <Route path=":slug" element={<AdminDocPage />} />
        </Route>
      </Route>
    </>
  );
};

export default AdminRoutes;
