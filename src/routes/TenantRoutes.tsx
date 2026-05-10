import { lazy, Suspense, type JSX } from "react";
import { Route, Navigate, Outlet } from "react-router-dom";
import ObjectStorageProvider from "../contexts/ObjectStorageContext";
import TenantRoute from "./TenantRoute";
import TenantDashboardLayout from "../tenantDashboard/components/TenantDashboardLayout";
import Dashboard from "../dashboard/pages/dashboard";
import TenantTwoFactorEnroll from "../dashboard/pages/TenantTwoFactorEnroll";
const TenantTwoFactorSettings = lazy(() => import("../dashboard/pages/TenantTwoFactorSettings"));
const TenantTwoFactorManage = lazy(() => import("../dashboard/pages/TenantTwoFactorManage"));

import PurchasedModules from "../dashboard/pages/purchasedModules";
import PaymentHistory from "../dashboard/pages/paymentHistory";
import SupportTicket from "../dashboard/pages/supportTicket";
import ClientsOverview from "../dashboard/pages/clientsOverview";
import Requests from "../dashboard/pages/requests";
import Project from "../dashboard/pages/ProjectMain";
import DashboardProjectCreate from "../dashboard/pages/ProjectCreate";
import ProjectDetails from "../dashboard/pages/ProjectDetails";
import TenantAccountSettings from "../dashboard/pages/AccountSettings";
import DashboardTaxConfigurations from "../dashboard/pages/taxConfiguration";
import Products from "../dashboard/pages/products";
const TenantDeveloperPortal = lazy(() => import("../tenantDashboard/pages/DeveloperPortal"));
const TenantPricingCalculator = lazy(() => import("../tenantDashboard/pages/TenantPricingCalculator"));
// `TenantPricingOverrides` + `TenantPricingEditList` retired — the
// unified PricingShell at /dashboard/pricing replaces both. Legacy
// routes redirect to the new home (see Routes block below).
// Unified tenant pricing shell — same single-page layout the admin
// uses, with role="tenant" so each pane shows the override column.
import PricingShell from "../adminDashboard/pages/pricing/PricingShell";
const TenantCreateInvoice = lazy(() => import("../tenantDashboard/pages/TenantCreateInvoice"));
import DashboardInstances from "../dashboard/pages/Instances";
import InstanceDetails from "../dashboard/pages/InstanceDetails";
import TenantTicketDetail from "../dashboard/pages/TenantTicketDetail";

import TenantQuoteCalculator from "../dashboard/pages/TenantQuoteCalculator";
import DashboardObjectStorage from "../dashboard/pages/objectStorage";
import TenantObjectStorageCreate from "../dashboard/pages/objectStorageCreate";
import TenantObjectStoragePurchase from "../dashboard/pages/objectStoragePurchase";
const TenantObjectStorageDetail = lazy(() => import("../tenantDashboard/pages/TenantObjectStorageDetail"));
import DashboardLeads from "../dashboard/pages/leads";
import DashboardLeadCreate from "../dashboard/pages/leadCreate";
import DashboardLeadDetails from "../dashboard/pages/leadDetails";
import PartnersAndClientsPage from "../dashboard/pages/clients";
import NewPartnerPage from "../dashboard/pages/partners/NewPartner";
import PartnerDetailsPage from "../dashboard/pages/partners/PartnerDetails";
import EditPartnerPage from "../dashboard/pages/partners/EditPartner";
import NewClientPage from "../dashboard/pages/clients/NewClient";
import ClientDetailsPage from "../dashboard/pages/clients/ClientDetails";
import EditClientPage from "../dashboard/pages/clients/EditClient";
import InviteTenantUserPage from "../dashboard/pages/tenantUsers/NewTenantUser";
import TenantUserDetailsPage from "../dashboard/pages/tenantUsers/TenantUserDetails";
import EditTenantUserPage from "../dashboard/pages/tenantUsers/EditTenantUser";
const TenantOnboardingOverview = lazy(() => import("../tenantDashboard/pages/TenantOnboardingOverview"));
const RegionRequests = lazy(() => import("../tenantDashboard/pages/RegionRequests"));
const RegionRequestDetail = lazy(() => import("../tenantDashboard/pages/RegionRequestDetail"));
const NewRegionRequest = lazy(() => import("../tenantDashboard/pages/NewRegionRequest"));
const RevenueDashboard = lazy(() => import("../tenantDashboard/pages/RevenueDashboard"));
const TenantProvisioningWizard = lazy(() => import("../tenantDashboard/pages/TenantProvisioningWizard"));
const TenantTemplates = lazy(() => import("../tenantDashboard/pages/TenantTemplates"));
import TenantManagedDatabases from "../dashboard/pages/TenantManagedDatabases";
import TenantCloudAccounts from "../dashboard/pages/TenantCloudAccounts";
import TenantCloudAccountCreate from "../dashboard/pages/TenantCloudAccountCreate";
import TenantCloudAccountDetail from "../dashboard/pages/TenantCloudAccountDetail";
const TenantMonitoring = lazy(() => import("../tenantDashboard/pages/TenantMonitoring"));
const TenantFlow = lazy(() => import("../tenantDashboard/pages/TenantFlow"));
const TenantFlowBilling = lazy(() => import("../tenantDashboard/pages/TenantFlowBilling"));
const TenantMigrationCalculator = lazy(() => import("../tenantDashboard/pages/TenantMigrationCalculator"));
// FR-043 — Orbit source-VM endpoints (tenant variant)
const TenantVmEndpoints = lazy(() => import("../dashboard/pages/integrations/orbit/TenantVmEndpoints"));
const TenantVmEndpointNew = lazy(() => import("../dashboard/pages/integrations/orbit/TenantVmEndpointNew"));
const TenantVmEndpointDetail = lazy(() => import("../dashboard/pages/integrations/orbit/TenantVmEndpointDetail"));
import TenantDatabaseCreate from "../dashboard/pages/TenantDatabaseCreate";
import TenantDatabaseDetail from "../dashboard/pages/TenantDatabaseDetail";
const TenantDiscountManager = lazy(() => import("../tenantDashboard/pages/TenantDiscountManager"));
const TenantPayoutsPage = lazy(() => import("../tenantDashboard/pages/TenantPayoutsPage"));
const TenantBillingSettings = lazy(() => import("../tenantDashboard/pages/TenantBillingSettings"));
const TenantPocTrials = lazy(() => import("../tenantDashboard/pages/TenantPocTrials"));
import TenantProtection from "../dashboard/pages/TenantProtection";
import TenantMigrations from "../dashboard/pages/TenantMigrations";
import TenantMigrationWizard from "../dashboard/pages/TenantMigrationWizard";
import TenantBatchMigrations from "../dashboard/pages/TenantBatchMigrations";
import TenantBatchMigrationWizard from "../dashboard/pages/TenantBatchMigrationWizard";
import TenantBatchMigrationDetail from "../dashboard/pages/TenantBatchMigrationDetail";
import TenantDestinations from "../dashboard/pages/TenantDestinations";
const TenantDestinationNew = lazy(() => import("../dashboard/pages/TenantDestinationNew"));
import TenantServerlessDr from "../dashboard/pages/TenantServerlessDr";
const TenantServerlessDrNew = lazy(() => import("../dashboard/pages/TenantServerlessDrNew"));
import TenantAgent from "../dashboard/pages/TenantAgent";
import TenantDrDrills from "../dashboard/pages/TenantDrDrills";
import TenantHypervisor from "../dashboard/pages/TenantHypervisor";
import TenantDatabaseReplication from "../dashboard/pages/TenantDatabaseReplication";
import TenantRansomware from "../dashboard/pages/TenantRansomware";
const TenantShieldDomains = lazy(() => import("../dashboard/pages/TenantShieldDomains"));
const TenantShieldDomainDetail = lazy(() => import("../dashboard/pages/TenantShieldDomainDetail"));
const TenantInvoices = lazy(() => import("../dashboard/pages/TenantInvoices"));
const TenantInvoiceDetail = lazy(() => import("../dashboard/pages/TenantInvoiceDetail"));
const TenantAccounting = lazy(() => import("../dashboard/pages/TenantAccounting"));
const TenantShieldOverview = lazy(() => import("../dashboard/pages/TenantShieldOverview"));
const TenantShieldAttackMap = lazy(() => import("../dashboard/pages/TenantShieldAttackMap"));
const TenantShieldFirewall = lazy(() => import("../dashboard/pages/TenantShieldFirewall"));
const TenantShieldAttacks = lazy(() => import("../dashboard/pages/TenantShieldAttacks"));
const TenantShieldAnalytics = lazy(() => import("../dashboard/pages/TenantShieldAnalytics"));
const TenantShieldSsl = lazy(() => import("../dashboard/pages/TenantShieldSsl"));
// Infrastructure pages — lazy-loaded so the barrel doesn't pull every
// VPC/ACL/load-balancer page into the initial tenant bundle.
const TenantKeyPairs = lazy(() => import("../tenantDashboard/pages/infrastructure/TenantKeyPairs"));
const TenantNetworkInterfaces = lazy(() => import("../tenantDashboard/pages/infrastructure/TenantNetworkInterfaces"));
const TenantSubnets = lazy(() => import("../tenantDashboard/pages/infrastructure/TenantSubnets"));
const TenantSecurityGroups = lazy(() => import("../tenantDashboard/pages/infrastructure/TenantSecurityGroups"));
const TenantElasticIps = lazy(() => import("../tenantDashboard/pages/infrastructure/TenantElasticIps"));
const TenantNatGateways = lazy(() => import("../tenantDashboard/pages/infrastructure/TenantNatGateways"));
const TenantRouteTables = lazy(() => import("../tenantDashboard/pages/infrastructure/TenantRouteTables"));
const TenantNetworkAcls = lazy(() => import("../tenantDashboard/pages/infrastructure/TenantNetworkAcls"));
const TenantVpcPeering = lazy(() => import("../tenantDashboard/pages/infrastructure/TenantVpcPeering"));
const TenantSecurityGroupRules = lazy(() => import("../tenantDashboard/pages/infrastructure/TenantSecurityGroupRules"));
const TenantNetworkAclRules = lazy(() => import("../tenantDashboard/pages/infrastructure/TenantNetworkAclRules"));
const TenantLoadBalancers = lazy(() => import("../tenantDashboard/pages/infrastructure/TenantLoadBalancers"));
const LoadBalancerWizard = lazy(() => import("../tenantDashboard/pages/infrastructure/LoadBalancerWizard"));
const TenantLoadBalancerDetail = lazy(() => import("../tenantDashboard/pages/infrastructure/TenantLoadBalancerDetail"));
const TenantDnsManagement = lazy(() => import("../tenantDashboard/pages/infrastructure/TenantDnsManagement"));
const TenantSnapshots = lazy(() => import("../tenantDashboard/pages/infrastructure/TenantSnapshots"));
const TenantImages = lazy(() => import("../tenantDashboard/pages/infrastructure/TenantImages"));
const TenantAutoScaling = lazy(() => import("../tenantDashboard/pages/infrastructure/TenantAutoScaling"));
const LaunchConfigurationWizard = lazy(() => import("../tenantDashboard/pages/infrastructure/LaunchConfigurationWizard"));
const AutoScalingGroupWizard = lazy(() => import("../tenantDashboard/pages/infrastructure/AutoScalingGroupWizard"));

import TenantDocsLayout from "../tenantDashboard/pages/docs/TenantDocsLayout";
const TenantDocPage = lazy(() => import("../tenantDashboard/pages/docs/TenantDocPage"));
const ObjectStorageRouteProvider = (): JSX.Element => (
  <ObjectStorageProvider>
    <div className="object-storage-theme">
      <Outlet />
    </div>
  </ObjectStorageProvider>
);

const TenantRoutes = (): JSX.Element => (
  <>
    {/* 2FA enrollment — sits OUTSIDE TenantRoute because the api
        interceptor redirects authenticated-but-not-yet-enrolled tenant
        users here when their tenant has force_2fa enabled. */}
    <Route path="/tenant-2fa-enroll" element={<TenantTwoFactorEnroll />} />
    <Route element={<TenantRoute />}>
      <Route element={<TenantDashboardLayout />}>
        {/* Home */}
        <Route path="/dashboard" element={<Dashboard />} />

        <Route path="/dashboard/purchased-modules" element={<PurchasedModules />} />

        {/* Customer Management */}
        <Route path="/dashboard/clients" element={<PartnersAndClientsPage />} />
        <Route path="/dashboard/clients/overview" element={<ClientsOverview />} />
        <Route path="/dashboard/clients/new" element={<NewClientPage />} />
        <Route path="/dashboard/clients/:clientId" element={<ClientDetailsPage />} />
        <Route path="/dashboard/clients/:clientId/edit" element={<EditClientPage />} />
        <Route path="/dashboard/partners/new" element={<NewPartnerPage />} />
        <Route path="/dashboard/partners/:partnerId" element={<PartnerDetailsPage />} />
        <Route path="/dashboard/partners/:partnerId/edit" element={<EditPartnerPage />} />
        <Route path="/dashboard/tenant-users/new" element={<InviteTenantUserPage />} />
        <Route path="/dashboard/tenant-users/:userId" element={<TenantUserDetailsPage />} />
        <Route path="/dashboard/tenant-users/:userId/edit" element={<EditTenantUserPage />} />
        <Route path="/dashboard/leads" element={<DashboardLeads />} />
        <Route path="/dashboard/leads/create" element={<DashboardLeadCreate />} />
        <Route path="/dashboard/leads/details" element={<DashboardLeadDetails />} />
        <Route
          path="/dashboard/admin-users"
          element={<Navigate to="/dashboard/clients?tab=users" replace />}
        />

        {/* Infrastructure */}
        <Route path="/dashboard/projects" element={<Project />} />
        <Route path="/dashboard/projects/create" element={<DashboardProjectCreate />} />
        <Route path="/dashboard/projects/details" element={<ProjectDetails />} />
        <Route path="/dashboard/cube-instances" element={<DashboardInstances />} />
        <Route path="/dashboard/cube-instances/details" element={<InstanceDetails />} />
        <Route path="/dashboard/create-instance" element={<TenantProvisioningWizard />} />
        <Route path="/dashboard/templates" element={<TenantTemplates />} />

        <Route path="/dashboard/monitoring" element={<TenantMonitoring />} />
        <Route path="/dashboard/flow" element={<TenantFlow />} />
        <Route path="/dashboard/flow/billing" element={<TenantFlowBilling />} />
        <Route path="/dashboard/databases" element={<TenantManagedDatabases />} />
        <Route path="/dashboard/databases/create" element={<TenantDatabaseCreate />} />
        <Route path="/dashboard/databases/:identifier" element={<TenantDatabaseDetail />} />

        <Route path="/dashboard/cloud-accounts" element={<TenantCloudAccounts />} />
        <Route path="/dashboard/cloud-accounts/create" element={<TenantCloudAccountCreate />} />
        <Route path="/dashboard/cloud-accounts/:accountId" element={<TenantCloudAccountDetail />} />

        <Route path="/dashboard/orbit/calculator" element={<TenantMigrationCalculator />} />
        <Route path="/dashboard/anycloudflow/calculator" element={<Navigate to="/dashboard/orbit/calculator" replace />} />
        {/* FR-043 — source-VM endpoints + assessment.
            Order: list → /new → /:id (specific routes before catch-all). */}
        <Route path="/dashboard/integrations/orbit/vms" element={<TenantVmEndpoints />} />
        <Route path="/dashboard/integrations/orbit/vms/new" element={<TenantVmEndpointNew />} />
        <Route path="/dashboard/integrations/orbit/vms/:id" element={<TenantVmEndpointDetail />} />
        <Route path="/dashboard/protection" element={<TenantProtection />} />
        <Route path="/dashboard/dr-drills" element={<TenantDrDrills />} />
        <Route path="/dashboard/hypervisor" element={<TenantHypervisor />} />
        <Route path="/dashboard/database-replication" element={<TenantDatabaseReplication />} />
        <Route path="/dashboard/ransomware" element={<TenantRansomware />} />

        <Route path="/dashboard/migrations" element={<TenantMigrations />} />
        <Route path="/dashboard/migrations/new" element={<TenantMigrationWizard />} />
        <Route path="/dashboard/batch-migrations" element={<TenantBatchMigrations />} />
        <Route path="/dashboard/batch-migrations/new" element={<TenantBatchMigrationWizard />} />
        <Route path="/dashboard/batch-migrations/:identifier" element={<TenantBatchMigrationDetail />} />
        <Route path="/dashboard/destinations" element={<TenantDestinations />} />
        {/* /new must precede any /:id sibling — RES-162 wizard route */}
        <Route path="/dashboard/destinations/new" element={<TenantDestinationNew />} />
        <Route path="/dashboard/serverless-dr" element={<TenantServerlessDr />} />
        <Route path="/dashboard/serverless-dr/new" element={<TenantServerlessDrNew />} />

        <Route path="/dashboard/shield/domains" element={<Suspense fallback={null}><TenantShieldDomains /></Suspense>} />
        <Route path="/dashboard/shield/domains/:domainId" element={<Suspense fallback={null}><TenantShieldDomainDetail /></Suspense>} />
        <Route path="/dashboard/invoices" element={<Suspense fallback={null}><TenantInvoices /></Suspense>} />
        <Route path="/dashboard/invoices/:invoiceId" element={<Suspense fallback={null}><TenantInvoiceDetail /></Suspense>} />
        <Route path="/dashboard/accounting" element={<Suspense fallback={null}><TenantAccounting /></Suspense>} />
        <Route path="/dashboard/shield/overview" element={<Suspense fallback={null}><TenantShieldOverview /></Suspense>} />
        <Route path="/dashboard/shield/attack-map" element={<Suspense fallback={null}><TenantShieldAttackMap /></Suspense>} />
        <Route path="/dashboard/shield/firewall" element={<Suspense fallback={null}><TenantShieldFirewall /></Suspense>} />
        <Route path="/dashboard/shield/attacks" element={<Suspense fallback={null}><TenantShieldAttacks /></Suspense>} />
        <Route path="/dashboard/shield/analytics" element={<Suspense fallback={null}><TenantShieldAnalytics /></Suspense>} />
        <Route path="/dashboard/shield/ssl" element={<Suspense fallback={null}><TenantShieldSsl /></Suspense>} />
        <Route path="/dashboard/agent" element={<TenantAgent />} />

        <Route element={<ObjectStorageRouteProvider />}>
          <Route path="/dashboard/object-storage" element={<DashboardObjectStorage />} />
          <Route path="/dashboard/object-storage/create" element={<TenantObjectStorageCreate />} />
          <Route
            path="/dashboard/object-storage/purchase"
            element={<TenantObjectStoragePurchase />}
          />
          <Route
            path="/dashboard/object-storage/:accountId"
            element={<TenantObjectStorageDetail />}
          />
        </Route>
        <Route path="/dashboard/requests" element={<Requests />} />

        {/* VPC Infrastructure */}
        <Route path="/dashboard/infrastructure/key-pairs" element={<TenantKeyPairs />} />
        <Route
          path="/dashboard/infrastructure/network-interfaces"
          element={<TenantNetworkInterfaces />}
        />
        <Route path="/dashboard/infrastructure/subnets" element={<TenantSubnets />} />
        <Route
          path="/dashboard/infrastructure/security-groups"
          element={<TenantSecurityGroups />}
        />
        <Route
          path="/dashboard/infrastructure/security-group-rules"
          element={<TenantSecurityGroupRules />}
        />
        <Route path="/dashboard/infrastructure/elastic-ips" element={<TenantElasticIps />} />
        <Route path="/dashboard/infrastructure/nat-gateways" element={<TenantNatGateways />} />
        <Route path="/dashboard/infrastructure/route-tables" element={<TenantRouteTables />} />
        <Route path="/dashboard/infrastructure/network-acls" element={<TenantNetworkAcls />} />
        <Route
          path="/dashboard/infrastructure/network-acl-rules"
          element={<TenantNetworkAclRules />}
        />
        <Route path="/dashboard/infrastructure/vpc-peering" element={<TenantVpcPeering />} />
        <Route path="/dashboard/infrastructure/load-balancers" element={<TenantLoadBalancers />} />
        <Route
          path="/dashboard/infrastructure/load-balancers/:lbId"
          element={<TenantLoadBalancerDetail />}
        />
        <Route path="/dashboard/infrastructure/dns" element={<TenantDnsManagement />} />
        <Route
          path="/dashboard/infrastructure/load-balancers/create"
          element={<LoadBalancerWizard />}
        />
        <Route
          path="/dashboard/infrastructure/load-balancers/create"
          element={<LoadBalancerWizard />}
        />
        <Route path="/dashboard/infrastructure/snapshots" element={<TenantSnapshots />} />
        <Route path="/dashboard/infrastructure/images" element={<TenantImages />} />
        <Route path="/dashboard/infrastructure/autoscaling" element={<TenantAutoScaling />} />
        <Route
          path="/dashboard/infrastructure/autoscaling/create-config"
          element={<LaunchConfigurationWizard />}
        />
        <Route
          path="/dashboard/infrastructure/autoscaling/create-group"
          element={<AutoScalingGroupWizard />}
        />

        {/* Regional */}
        <Route path="/dashboard/region-requests" element={<RegionRequests />} />
        <Route path="/dashboard/region-requests/new" element={<NewRegionRequest />} />
        <Route path="/dashboard/region-requests/:id" element={<RegionRequestDetail />} />
        <Route path="/dashboard/onboarding" element={<TenantOnboardingOverview />} />

        {/* Billing & Revenue */}
        <Route path="/dashboard/revenue" element={<RevenueDashboard />} />
        {/*
          Unified tenant pricing shell — left menu lists every priceable
          product (catalog SKUs, third-party services, pay-as-you-go);
          right pane shows the platform default + the tenant's override
          inline. Same component the admin uses, with role="tenant".
        */}
        <Route path="/dashboard/pricing" element={<PricingShell role="tenant" />} />
        {/*
         * Legacy /dashboard/pricing-overrides UI is superseded by the
         * unified pricing shell above. Redirect any deep links so old
         * bookmarks/email-CTAs land on the new home instead of 404'ing.
         * The legacy lazy imports are intentionally removed to keep the
         * initial bundle lean.
         */}
        <Route
          path="/dashboard/pricing-overrides"
          element={<Navigate to="/dashboard/pricing" replace />}
        />
        <Route
          path="/dashboard/pricing-overrides/edit-list"
          element={<Navigate to="/dashboard/pricing" replace />}
        />
        <Route path="/dashboard/pricing-calculator" element={<TenantPricingCalculator />} />
        <Route path="/dashboard/create-invoice" element={<TenantCreateInvoice />} />
        {/* Quote+Invoice convergence — alias path for the unified wizard. */}
        <Route
          path="/dashboard/billing/new"
          element={<Navigate to="/dashboard/create-invoice" replace />}
        />
        <Route path="/dashboard/quote-invoice" element={<TenantQuoteCalculator />} />
        <Route path="/dashboard/payment-history" element={<PaymentHistory />} />
        <Route path="/dashboard/tax-configurations" element={<DashboardTaxConfigurations />} />
        <Route path="/dashboard/discounts" element={<TenantDiscountManager />} />
        <Route path="/dashboard/payouts" element={<TenantPayoutsPage />} />
        <Route path="/dashboard/billing" element={<TenantBillingSettings />} />
        <Route path="/dashboard/poc-trials" element={<TenantPocTrials />} />

        {/* Standalone */}
        <Route path="/dashboard/products" element={<Products />} />
        <Route path="/dashboard/developer/*" element={<TenantDeveloperPortal />} />
        <Route path="/dashboard/support" element={<SupportTicket />} />
        <Route path="/dashboard/support/:id" element={<TenantTicketDetail />} />
        <Route path="/dashboard/account" element={<TenantAccountSettings />} />
        <Route
          path="/dashboard/security/2fa-policy"
          element={
            <Suspense fallback={null}>
              <TenantTwoFactorSettings />
            </Suspense>
          }
        />
        <Route
          path="/dashboard/security/2fa"
          element={
            <Suspense fallback={null}>
              <TenantTwoFactorManage />
            </Suspense>
          }
        />
        {/* Legacy redirects */}
        <Route path="/tenant-dashboard/*" element={<Navigate to="/dashboard" replace />} />
        <Route
          path="/dashboard/account-settings"
          element={<Navigate to="/dashboard/account" replace />}
        />
        <Route path="/dashboard/settings" element={<Navigate to="/dashboard/account" replace />} />
        <Route
          path="/dashboard/support-ticket"
          element={<Navigate to="/dashboard/support" replace />}
        />

        {/* Documentation */}
        <Route path="/dashboard/docs" element={<TenantDocsLayout />}>
          <Route index element={<TenantDocPage />} />
          <Route path=":slug" element={<TenantDocPage />} />
        </Route>
      </Route>
    </Route>
  </>
);

export default TenantRoutes;
