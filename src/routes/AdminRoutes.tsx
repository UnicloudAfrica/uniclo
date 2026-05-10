import { lazy, Suspense, type JSX } from "react";
import { Route, Outlet, Navigate } from "react-router-dom";
import ObjectStorageProvider from "../contexts/ObjectStorageContext";
import AdminRoute from "./AdminRoute";
const AdminDashboard = lazy(() => import("../adminDashboard/pages/AdminDashboard"));
const AdminPartners = lazy(() => import("../adminDashboard/pages/AdminPartners"));
const AdminPartnerCreate = lazy(() => import("../adminDashboard/pages/AdminPartnerCreate"));
const AdminPartnerDetails = lazy(() => import("../adminDashboard/pages/AdminPartnerDetails"));
const AdminClients = lazy(() => import("../adminDashboard/pages/AdminClients"));
const AdminClientCreate = lazy(() => import("../adminDashboard/pages/AdminClientCreate"));
const AdminClientDetails = lazy(() => import("../adminDashboard/pages/AdminClientDetails"));
const AdminPayment = lazy(() => import("../adminDashboard/pages/adminPayment"));
const AdminPaymentDetails = lazy(() => import("../adminDashboard/pages/adminPaymentDetails"));
import VerifyAdminMail from "../adminDashboard/pages/AdminVerify";
import AdminLogin from "../adminDashboard/pages/AdminSignin";
import AdminTwoFactorEnroll from "../adminDashboard/pages/AdminTwoFactorEnroll";
const AdminTwoFactorSettings = lazy(() => import("../adminDashboard/pages/AdminTwoFactorSettings"));
const AdminTwoFactorManage = lazy(() => import("../adminDashboard/pages/AdminTwoFactorManage"));
const AdminPurchasedModules = lazy(() => import("../adminDashboard/pages/adminPurchasedModules"));
const AdminInventory = lazy(() => import("../adminDashboard/pages/adminInventory"));
const AdminTax = lazy(() => import("../adminDashboard/pages/adminTax"));
const AdminUsers = lazy(() => import("../adminDashboard/pages/AdminUsers"));
const AdminUserCreate = lazy(() => import("../adminDashboard/pages/adminUserCreate"));
const AdminUserDetails = lazy(() => import("../adminDashboard/pages/adminUserDetails"));
const AdminUserEdit = lazy(() => import("../adminDashboard/pages/adminUserEdit"));
const AdminProjects = lazy(() => import("../adminDashboard/pages/adminProjects"));
const AdminProjectCreate = lazy(() => import("../adminDashboard/pages/adminProjectCreate"));
const AdminProjectDetails = lazy(() => import("../adminDashboard/pages/AdminProjectDetails"));
const AdminOnboardingSettings = lazy(() => import("../adminDashboard/pages/adminOnboardingSettings"));
const AdminLeads = lazy(() => import("../adminDashboard/pages/adminLeads"));
const AdminLeadCreate = lazy(() => import("../adminDashboard/pages/adminLeadCreate"));
const AdminLeadDetails = lazy(() => import("../adminDashboard/pages/adminLeadDetails"));
const AdminRegion = lazy(() => import("../adminDashboard/pages/adminRegion"));
const AdminPricing = lazy(() => import("../adminDashboard/pages/adminPricing"));
const AdminProducts = lazy(() => import("../adminDashboard/pages/AdminProducts"));
const AdminProductFamilies = lazy(() => import("../adminDashboard/pages/AdminProductFamilies"));
const AdminCatalogCreate = lazy(() => import("../adminDashboard/pages/AdminCatalogCreate"));
// Unified pricing shell — replaces the legacy hub + per-track screens
// (AdminFlowPlanPricing / AdminShieldPricing / AdminMeteredPricing /
// AdminPricingHub). The legacy URLs still resolve via redirects below
// so deep links don't break.
const PricingShell = lazy(() => import("../adminDashboard/pages/pricing/PricingShell"));
const AdminPricingEdit = lazy(() => import("../adminDashboard/pages/AdminPricingEdit"));
const AdminTemplates = lazy(() => import("../adminDashboard/pages/AdminTemplates"));
const CreateInvoice = lazy(() => import("../adminDashboard/pages/CreateInvoice"));
const AdminPricingCalculator = lazy(() => import("../adminDashboard/pages/AdminPricingCalculator"));
const AdminProviderUnitCosts = lazy(() => import("../adminDashboard/pages/AdminProviderUnitCosts"));
const AdminPublishedFxRates = lazy(() => import("../adminDashboard/pages/AdminPublishedFxRates"));
const AdminPricingLocalizations = lazy(() => import("../adminDashboard/pages/AdminPricingLocalizations"));
const AdminInfrastructureSetup = lazy(() => import("../adminDashboard/pages/adminInfrastructureSetup"));
const AdminObjectStorage = lazy(() => import("../adminDashboard/pages/adminObjectStorage"));
const AdminObjectStorageCreate = lazy(() => import("../adminDashboard/pages/adminObjectStorageCreate"));
const AdminObjectStorageDetail = lazy(() => import("../adminDashboard/pages/AdminObjectStorageDetail"));
const AdminCreateInstance = lazy(() => import("../adminDashboard/pages/AdminCreateInstance"));
const EnhancedProfileSettings = lazy(() => import("../adminDashboard/pages/EnhancedProfileSettings"));
const AdminInstances = lazy(() => import("../adminDashboard/pages/AdminInstances"));
const AdminInstancesDetails = lazy(() => import("../adminDashboard/pages/adminInstancesDetails"));
const RegionApprovals = lazy(() => import("../adminDashboard/pages/RegionApprovals"));
const RegionApprovalDetail = lazy(() => import("../adminDashboard/pages/RegionApprovalDetail"));
const RegionApprovalEdit = lazy(() => import("../adminDashboard/pages/RegionApprovalEdit"));
const RegionApprovalCreate = lazy(() => import("../adminDashboard/pages/RegionApprovalCreate"));
const RegionCreate = lazy(() => import("../adminDashboard/pages/RegionCreate"));
const RegionDetail = lazy(() => import("../adminDashboard/pages/RegionDetail"));
const RegionEdit = lazy(() => import("../adminDashboard/pages/RegionEdit"));
const AdminOnboardingReview = lazy(() => import("../adminDashboard/pages/AdminOnboardingReview"));
const AdminProviderDiscovery = lazy(() => import("../adminDashboard/pages/AdminProviderDiscovery"));
import AdminDocsLayout from "../adminDashboard/pages/docs/AdminDocsLayout";
const AdminDocPage = lazy(() => import("../adminDashboard/pages/docs/AdminDocPage"));
import DocEditor from "../docs/renderer/DocEditor";
const AdminSubscriptionPlans = lazy(() => import("../adminDashboard/pages/AdminSubscriptionPlans"));
const WalletDashboard = lazy(() => import("../adminDashboard/pages/WalletDashboard"));
const SettlementsDashboard = lazy(() => import("../adminDashboard/pages/SettlementsDashboard"));
const PayoutsDashboard = lazy(() => import("../adminDashboard/pages/PayoutsDashboard"));
const AnalyticsDashboard = lazy(() => import("../adminDashboard/pages/AnalyticsDashboard"));
const AdminDeveloperPortal = lazy(() => import("../adminDashboard/pages/AdminDeveloperPortal"));
const AdminBridgeClients = lazy(() => import("../adminDashboard/pages/AdminBridgeClients"));
const TicketsDashboard = lazy(() => import("../adminDashboard/pages/TicketsDashboard"));
const AdminTicketDetail = lazy(() => import("../adminDashboard/pages/AdminTicketDetail"));
const AdminManagedDatabases = lazy(() => import("../adminDashboard/pages/AdminManagedDatabases"));
const AdminMonitoring = lazy(() => import("../adminDashboard/pages/AdminMonitoring"));
const AdminNocDashboard = lazy(() => import("../adminDashboard/pages/AdminNocDashboard"));
const AdminNocRegionDetail = lazy(() => import("../adminDashboard/pages/AdminNocRegionDetail"));
const AdminNocTopology = lazy(() => import("../adminDashboard/pages/AdminNocTopology"));
const AdminNocGrafanaDocs = lazy(() => import("../adminDashboard/pages/AdminNocGrafanaDocs"));
const AdminUiPlayground = lazy(() => import("../adminDashboard/pages/AdminUiPlayground"));
const AdminPaymentSplits = lazy(() => import("../adminDashboard/pages/AdminPaymentSplits"));
const AdminMigrationCalculator = lazy(() => import("../adminDashboard/pages/AdminMigrationCalculator"));
const AdminAcfFastTrack = lazy(() => import("../adminDashboard/pages/AdminAcfFastTrack"));
const AdminAcfDirectProvision = lazy(() => import("../adminDashboard/pages/AdminAcfDirectProvision"));
const AdminDatabaseCreate = lazy(() => import("../adminDashboard/pages/AdminDatabaseCreate"));
const AdminDatabaseDetail = lazy(() => import("../adminDashboard/pages/AdminDatabaseDetail"));
const AdminProtection = lazy(() => import("../adminDashboard/pages/AdminProtection"));
const AdminMigrations = lazy(() => import("../adminDashboard/pages/AdminMigrations"));
const AdminMigrationWizard = lazy(() => import("../adminDashboard/pages/AdminMigrationWizard"));
const AdminBatchMigrations = lazy(() => import("../adminDashboard/pages/AdminBatchMigrations"));
const AdminBatchMigrationWizard = lazy(() => import("../adminDashboard/pages/AdminBatchMigrationWizard"));
const AdminBatchMigrationDetail = lazy(() => import("../adminDashboard/pages/AdminBatchMigrationDetail"));
const AdminFailedJobs = lazy(() => import("../adminDashboard/pages/AdminFailedJobs"));
const AdminImageRequests = lazy(() => import("../adminDashboard/pages/AdminImageRequests"));
const AdminLoadBalancers = lazy(() => import("../adminDashboard/pages/AdminLoadBalancers"));
const AdminDnsZones = lazy(() => import("../adminDashboard/pages/AdminDnsZones"));
const AdminDestinations = lazy(() => import("../adminDashboard/pages/AdminDestinations"));
const AdminDestinationNew = lazy(() => import("../adminDashboard/pages/AdminDestinationNew"));
const AdminServerlessDr = lazy(() => import("../adminDashboard/pages/AdminServerlessDr"));
const AdminServerlessDrNew = lazy(() => import("../adminDashboard/pages/AdminServerlessDrNew"));
const AdminAgent = lazy(() => import("../adminDashboard/pages/AdminAgent"));
const AdminPocTrials = lazy(() => import("../adminDashboard/pages/AdminPocTrials"));
const AdminDrDrills = lazy(() => import("../adminDashboard/pages/AdminDrDrills"));
const AdminHypervisor = lazy(() => import("../adminDashboard/pages/AdminHypervisor"));
const AdminDatabaseReplication = lazy(() => import("../adminDashboard/pages/AdminDatabaseReplication"));
const AdminRansomware = lazy(() => import("../adminDashboard/pages/AdminRansomware"));
const AdminExchangeRates = lazy(() => import("../adminDashboard/pages/AdminExchangeRates"));
const AdminAccounting = lazy(() => import("../adminDashboard/pages/AdminAccounting"));
const AdminShieldDomains = lazy(() => import("../adminDashboard/pages/AdminShieldDomains"));
const AdminShieldDomainDetail = lazy(() => import("../adminDashboard/pages/AdminShieldDomainDetail"));
const AdminInvoices = lazy(() => import("../adminDashboard/pages/AdminInvoices"));
const AdminInvoiceDetail = lazy(() => import("../adminDashboard/pages/AdminInvoiceDetail"));
const AdminShieldOverview = lazy(() => import("../adminDashboard/pages/AdminShieldOverview"));
const AdminShieldAttackMap = lazy(() => import("../adminDashboard/pages/AdminShieldAttackMap"));
const AdminShieldFirewall = lazy(() => import("../adminDashboard/pages/AdminShieldFirewall"));
const AdminShieldAttacks = lazy(() => import("../adminDashboard/pages/AdminShieldAttacks"));
const AdminShieldAnalytics = lazy(() => import("../adminDashboard/pages/AdminShieldAnalytics"));
const AdminShieldSsl = lazy(() => import("../adminDashboard/pages/AdminShieldSsl"));
const AdminCloudAccounts = lazy(() => import("../adminDashboard/pages/AdminCloudAccounts"));
const AdminCloudAccountCreate = lazy(() => import("../adminDashboard/pages/AdminCloudAccountCreate"));
const AdminCloudAccountDetail = lazy(() => import("../adminDashboard/pages/AdminCloudAccountDetail"));
const IntegrationPartnerPayoutsDashboard = lazy(() => import("../adminDashboard/pages/IntegrationPartnerPayoutsDashboard"));
const IntegrationPartnerLedgerDashboard = lazy(() => import("../adminDashboard/pages/IntegrationPartnerLedgerDashboard"));
// AnyCloudFlow admin pages — security, audit, notifications, advanced replication
const AcfTwoFactorPage = lazy(() => import("../adminDashboard/pages/integrations/anycloudflow/TwoFactorPage"));
const AcfIpAllowlistPage = lazy(() => import("../adminDashboard/pages/integrations/anycloudflow/IpAllowlistPage"));
const AcfSshHostKeysPage = lazy(() => import("../adminDashboard/pages/integrations/anycloudflow/SshHostKeysPage"));
const AcfApiKeyRotationPage = lazy(() => import("../adminDashboard/pages/integrations/anycloudflow/ApiKeyRotationPage"));
const AcfAuditLogPage = lazy(() => import("../adminDashboard/pages/integrations/anycloudflow/AuditLogPage"));
const AcfNotificationPreferencesPage = lazy(() => import("../adminDashboard/pages/integrations/anycloudflow/NotificationPreferencesPage"));
const AcfWebhookDeadLettersPage = lazy(() => import("../adminDashboard/pages/integrations/anycloudflow/WebhookDeadLettersPage"));
const AcfAdvancedReplicationPage = lazy(() => import("../adminDashboard/pages/integrations/anycloudflow/AdvancedReplicationPage"));
const AcfJournalEntriesPage = lazy(() => import("../adminDashboard/pages/integrations/anycloudflow/JournalEntriesPage"));
const AcfZfsReplicationPage = lazy(() => import("../adminDashboard/pages/integrations/anycloudflow/ZfsReplicationPage"));
const AcfBucketEndpointsPage = lazy(() => import("../adminDashboard/pages/integrations/anycloudflow/buckets/BucketEndpointsPage"));
const AcfBucketMigrationsPage = lazy(() => import("../adminDashboard/pages/integrations/anycloudflow/buckets/BucketMigrationsPage"));
const AdminBucketMigrationNew = lazy(() => import("../adminDashboard/pages/integrations/anycloudflow/buckets/AdminBucketMigrationNew"));
const AcfBucketMigrationDetailPage = lazy(() => import("../adminDashboard/pages/integrations/anycloudflow/buckets/BucketMigrationDetailPage"));
const AcfBucketReplicationsPage = lazy(() => import("../adminDashboard/pages/integrations/anycloudflow/buckets/BucketReplicationsPage"));
const AdminBucketReplicationNew = lazy(() => import("../adminDashboard/pages/integrations/anycloudflow/buckets/AdminBucketReplicationNew"));
const AcfBucketReplicationDetailPage = lazy(() => import("../adminDashboard/pages/integrations/anycloudflow/buckets/BucketReplicationDetailPage"));
const AcfBucketAccessGrantsPage = lazy(() => import("../adminDashboard/pages/integrations/anycloudflow/buckets/AdminBucketAccessGrantsPage"));
const AdminFlow = lazy(() => import("../adminDashboard/pages/AdminFlow"));
const AdminFlowDashboard = lazy(() => import("../adminDashboard/pages/AdminFlowDashboard"));
// Infrastructure pages — lazy-loaded so the barrel doesn't pull every
// VPC/route-table/load-balancer page into the initial admin bundle.
// Each page is its own chunk; the existing `<Suspense>` wrapper at the
// top of the routes tree handles the fallback.
const AdminNatGateways = lazy(() => import("../adminDashboard/pages/infrastructure/AdminNatGateways"));
const AdminElasticIps = lazy(() => import("../adminDashboard/pages/infrastructure/AdminElasticIps"));
const AdminSecurityGroups = lazy(() => import("../adminDashboard/pages/infrastructure/AdminSecurityGroups"));
const AdminSecurityGroupRules = lazy(() => import("../adminDashboard/pages/infrastructure/AdminSecurityGroupRules"));
const AdminSubnets = lazy(() => import("../adminDashboard/pages/infrastructure/AdminSubnets"));
const AdminRouteTables = lazy(() => import("../adminDashboard/pages/infrastructure/AdminRouteTables"));
const AdminNetworkAcls = lazy(() => import("../adminDashboard/pages/infrastructure/AdminNetworkAcls"));
const AdminNetworkAclRules = lazy(() => import("../adminDashboard/pages/infrastructure/AdminNetworkAclRules"));
const AdminVpcPeering = lazy(() => import("../adminDashboard/pages/infrastructure/AdminVpcPeering"));
const AdminKeyPairs = lazy(() => import("../adminDashboard/pages/infrastructure/AdminKeyPairs"));
const AdminNetworkInterfaces = lazy(() => import("../adminDashboard/pages/infrastructure/AdminNetworkInterfaces"));
const AdminVpcs = lazy(() => import("../adminDashboard/pages/infrastructure/AdminVpcs"));
const AdminInternetGateways = lazy(() => import("../adminDashboard/pages/infrastructure/AdminInternetGateways"));
// FR-043 — Orbit source-VM endpoints (admin variant)
const AdminVmEndpoints = lazy(() => import("../adminDashboard/pages/integrations/orbit/AdminVmEndpoints"));
const AdminVmEndpointNew = lazy(() => import("../adminDashboard/pages/integrations/orbit/AdminVmEndpointNew"));
const AdminVmEndpointDetail = lazy(() => import("../adminDashboard/pages/integrations/orbit/AdminVmEndpointDetail"));
// Project-scoped LB view (per-project under /infrastructure/...) — aliased
// to avoid clashing with the top-level inventory `AdminLoadBalancers`
// page imported above (mounted under /inventory/...).
const AdminLoadBalancersProject = lazy(() => import("../adminDashboard/pages/infrastructure/AdminLoadBalancers"));
const AdminDnsManagement = lazy(() => import("../adminDashboard/pages/infrastructure/AdminDnsManagement"));
const AdminSnapshots = lazy(() => import("../adminDashboard/pages/infrastructure/AdminSnapshots"));
const AdminImages = lazy(() => import("../adminDashboard/pages/infrastructure/AdminImages"));
const AdminAutoScaling = lazy(() => import("../adminDashboard/pages/infrastructure/AdminAutoScaling"));
const AdminKeyPairCreate = lazy(() => import("../adminDashboard/pages/infrastructure/AdminKeyPairCreate"));

const ObjectStorageRouteProvider = (): JSX.Element => (
  <ObjectStorageProvider>
    <div className="object-storage-theme">
      <Outlet />
    </div>
  </ObjectStorageProvider>
);

const AdminRoutes = (): JSX.Element => {
  return (
    <>
      {/* Public admin routes (no auth guard) */}
      <Route path="/admin-signin" element={<AdminLogin />} />
      <Route path="/verify-admin-mail" element={<VerifyAdminMail />} />
      {/* 2FA enrollment — sits outside AdminRoute because the API
          interceptor redirects authenticated-but-not-yet-enrolled
          admins here. The page calls /api/v1/2fa-setup + /2fa-enable
          which are gated by `auth:sanctum` only, not the `2fa`
          middleware (chicken-and-egg). */}
      <Route path="/admin-2fa-enroll" element={<AdminTwoFactorEnroll />} />

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
        {/* Unified Add flow — replaces the split products/add + pricing/add. */}
        <Route path="/admin-dashboard/catalog/add" element={<AdminCatalogCreate />} />
        <Route
          path="/admin-dashboard/products/add"
          element={<Navigate to="/admin-dashboard/catalog/add" replace />}
        />
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
        {/*
          /pricing is the unified single-page pricing shell — left menu
          lists every priceable product (catalog SKUs, third-party
          services, pay-as-you-go meters); the right pane swaps based
          on the `?product=…` query param. Legacy deep links to the
          per-track screens redirect into this shell with the matching
          query param.
        */}
        <Route path="/admin-dashboard/pricing" element={<PricingShell role="admin" />} />
        <Route
          path="/admin-dashboard/pricing/add"
          element={<Navigate to="/admin-dashboard/catalog/add" replace />}
        />
        <Route path="/admin-dashboard/pricing/edit" element={<AdminPricingEdit />} />

        {/* Legacy per-track URLs → redirect into the unified shell. */}
        <Route
          path="/admin-dashboard/pricing/flow-plans"
          element={<Navigate to="/admin-dashboard/pricing?product=simpledeploy" replace />}
        />
        <Route
          path="/admin-dashboard/pricing/shield"
          element={<Navigate to="/admin-dashboard/pricing?product=shield" replace />}
        />
        <Route
          path="/admin-dashboard/pricing/metered"
          element={<Navigate to="/admin-dashboard/pricing?product=pay_as_you_go" replace />}
        />

        <Route path="/admin-dashboard/pricing-calculator" element={<AdminPricingCalculator />} />
        <Route path="/admin-dashboard/pricing/unit-costs" element={<AdminProviderUnitCosts />} />
        <Route path="/admin-dashboard/pricing/fx-rates" element={<AdminPublishedFxRates />} />
        <Route
          path="/admin-dashboard/exchange-rates"
          element={<Suspense fallback={null}><AdminExchangeRates /></Suspense>}
        />
        <Route path="/admin-dashboard/pricing/localizations" element={<AdminPricingLocalizations />} />
        <Route path="/admin-dashboard/create-invoice" element={<CreateInvoice />} />
        {/* Quote+Invoice convergence — alias path so docs / deep-links to
            "billing/new" land on the unified wizard. */}
        <Route
          path="/admin-dashboard/billing/new"
          element={<Navigate to="/admin-dashboard/create-invoice" replace />}
        />

        <Route path="/admin-dashboard/account" element={<EnhancedProfileSettings />} />
        <Route
          path="/admin-dashboard/security/2fa-policy"
          element={
            <Suspense fallback={null}>
              <AdminTwoFactorSettings />
            </Suspense>
          }
        />
        <Route
          path="/admin-dashboard/security/2fa"
          element={
            <Suspense fallback={null}>
              <AdminTwoFactorManage />
            </Suspense>
          }
        />
        <Route path="/admin-dashboard/cube-instances" element={<AdminInstances />} />
        <Route path="/admin-dashboard/cube-instances/details" element={<AdminInstancesDetails />} />

        <Route path="/admin-dashboard/monitoring" element={<AdminMonitoring />} />
        <Route path="/admin-dashboard/noc" element={<AdminNocDashboard />} />
        <Route path="/admin-dashboard/noc/regions/:code" element={<AdminNocRegionDetail />} />
        <Route path="/admin-dashboard/noc/regions/:code/topology/:vpcId" element={<AdminNocTopology />} />
        <Route path="/admin-dashboard/noc/docs/grafana" element={<AdminNocGrafanaDocs />} />
        <Route path="/admin-dashboard/_dev/primitives" element={<AdminUiPlayground />} />
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
        <Route path="/admin-dashboard/ops/failed-jobs" element={<AdminFailedJobs />} />
        <Route path="/admin-dashboard/inventory/image-requests" element={<AdminImageRequests />} />
        <Route path="/admin-dashboard/inventory/load-balancers" element={<AdminLoadBalancers />} />
        <Route path="/admin-dashboard/inventory/dns-zones" element={<AdminDnsZones />} />
        <Route path="/admin-dashboard/destinations" element={<AdminDestinations />} />
        {/* /new must precede /:id so the static segment wins (RES-162) */}
        <Route path="/admin-dashboard/destinations/new" element={<AdminDestinationNew />} />

        <Route path="/admin-dashboard/shield/domains" element={<Suspense fallback={null}><AdminShieldDomains /></Suspense>} />
        <Route path="/admin-dashboard/shield/domains/:domainId" element={<Suspense fallback={null}><AdminShieldDomainDetail /></Suspense>} />
        <Route path="/admin-dashboard/invoices" element={<Suspense fallback={null}><AdminInvoices /></Suspense>} />
        <Route path="/admin-dashboard/invoices/:invoiceId" element={<Suspense fallback={null}><AdminInvoiceDetail /></Suspense>} />
        <Route path="/admin-dashboard/accounting" element={<Suspense fallback={null}><AdminAccounting /></Suspense>} />
        <Route path="/admin-dashboard/shield/overview" element={<Suspense fallback={null}><AdminShieldOverview /></Suspense>} />
        <Route path="/admin-dashboard/shield/attack-map" element={<Suspense fallback={null}><AdminShieldAttackMap /></Suspense>} />
        <Route path="/admin-dashboard/shield/firewall" element={<Suspense fallback={null}><AdminShieldFirewall /></Suspense>} />
        {/* Orbit (white-label of resilience subsystem) — primary paths */}
        <Route path="/admin-dashboard/orbit/calculator" element={<AdminMigrationCalculator />} />
        {/* FR-043 — Source VM endpoints + assessment.
            Order matters: list THEN /new (specific) THEN /:id (catch-all). */}
        <Route path="/admin-dashboard/integrations/orbit/vms" element={<AdminVmEndpoints />} />
        <Route path="/admin-dashboard/integrations/orbit/vms/new" element={<AdminVmEndpointNew />} />
        <Route path="/admin-dashboard/integrations/orbit/vms/:id" element={<AdminVmEndpointDetail />} />
        <Route path="/admin-dashboard/orbit/fast-track" element={<AdminAcfFastTrack />} />
        <Route path="/admin-dashboard/orbit/direct-provision" element={<AdminAcfDirectProvision />} />
        {/* Legacy /anycloudflow/ aliases — redirect to /orbit/ to keep old bookmarks working */}
        <Route path="/admin-dashboard/anycloudflow/calculator" element={<Navigate to="/admin-dashboard/orbit/calculator" replace />} />
        <Route path="/admin-dashboard/anycloudflow/fast-track" element={<Navigate to="/admin-dashboard/orbit/fast-track" replace />} />
        <Route path="/admin-dashboard/anycloudflow/direct-provision" element={<Navigate to="/admin-dashboard/orbit/direct-provision" replace />} />
        <Route path="/admin-dashboard/shield/attacks" element={<Suspense fallback={null}><AdminShieldAttacks /></Suspense>} />
        <Route path="/admin-dashboard/shield/analytics" element={<Suspense fallback={null}><AdminShieldAnalytics /></Suspense>} />
        <Route path="/admin-dashboard/shield/ssl" element={<Suspense fallback={null}><AdminShieldSsl /></Suspense>} />
        <Route path="/admin-dashboard/serverless-dr" element={<AdminServerlessDr />} />
        <Route path="/admin-dashboard/serverless-dr/new" element={<AdminServerlessDrNew />} />
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

        {/* Orbit integration surface — security, audit, notifications, advanced replication */}
        <Route path="/admin-dashboard/integrations/orbit/two-factor" element={<AcfTwoFactorPage />} />
        <Route path="/admin-dashboard/integrations/orbit/ip-allowlist" element={<AcfIpAllowlistPage />} />
        <Route path="/admin-dashboard/integrations/orbit/ssh-host-keys" element={<AcfSshHostKeysPage />} />
        <Route path="/admin-dashboard/integrations/orbit/api-keys/rotate" element={<AcfApiKeyRotationPage />} />
        <Route path="/admin-dashboard/integrations/orbit/audit-log" element={<AcfAuditLogPage />} />
        <Route path="/admin-dashboard/integrations/orbit/notifications" element={<AcfNotificationPreferencesPage />} />
        <Route path="/admin-dashboard/integrations/orbit/webhook-dlq" element={<AcfWebhookDeadLettersPage />} />
        <Route path="/admin-dashboard/integrations/orbit/replications/:id/advanced" element={<AcfAdvancedReplicationPage />} />
        <Route path="/admin-dashboard/integrations/orbit/replications/:id/journal" element={<AcfJournalEntriesPage />} />
        <Route path="/admin-dashboard/integrations/orbit/replications/:id/zfs" element={<AcfZfsReplicationPage />} />

        {/* Orbit — Object Storage (Bucket) sync */}
        <Route path="/admin-dashboard/integrations/orbit/buckets/endpoints" element={<AcfBucketEndpointsPage />} />
        <Route path="/admin-dashboard/integrations/orbit/buckets/migrations" element={<AcfBucketMigrationsPage />} />
        {/* /new must precede /:id so the static segment wins (RES-162) */}
        <Route path="/admin-dashboard/integrations/orbit/buckets/migrations/new" element={<AdminBucketMigrationNew />} />
        <Route path="/admin-dashboard/integrations/orbit/buckets/migrations/:id" element={<AcfBucketMigrationDetailPage />} />
        <Route path="/admin-dashboard/integrations/orbit/buckets/replications" element={<AcfBucketReplicationsPage />} />
        {/* /new must precede /:id so the static segment wins */}
        <Route path="/admin-dashboard/integrations/orbit/buckets/replications/new" element={<AdminBucketReplicationNew />} />
        <Route path="/admin-dashboard/integrations/orbit/buckets/replications/:id" element={<AcfBucketReplicationDetailPage />} />
        <Route path="/admin-dashboard/integrations/orbit/buckets/client-access" element={<AcfBucketAccessGrantsPage />} />

        {/* Legacy /anycloudflow/ aliases — redirect each to its /orbit/ counterpart */}
        <Route path="/admin-dashboard/integrations/anycloudflow/two-factor" element={<Navigate to="/admin-dashboard/integrations/orbit/two-factor" replace />} />
        <Route path="/admin-dashboard/integrations/anycloudflow/ip-allowlist" element={<Navigate to="/admin-dashboard/integrations/orbit/ip-allowlist" replace />} />
        <Route path="/admin-dashboard/integrations/anycloudflow/ssh-host-keys" element={<Navigate to="/admin-dashboard/integrations/orbit/ssh-host-keys" replace />} />
        <Route path="/admin-dashboard/integrations/anycloudflow/api-keys/rotate" element={<Navigate to="/admin-dashboard/integrations/orbit/api-keys/rotate" replace />} />
        <Route path="/admin-dashboard/integrations/anycloudflow/audit-log" element={<Navigate to="/admin-dashboard/integrations/orbit/audit-log" replace />} />
        <Route path="/admin-dashboard/integrations/anycloudflow/notifications" element={<Navigate to="/admin-dashboard/integrations/orbit/notifications" replace />} />
        <Route path="/admin-dashboard/integrations/anycloudflow/webhook-dlq" element={<Navigate to="/admin-dashboard/integrations/orbit/webhook-dlq" replace />} />
        <Route path="/admin-dashboard/integrations/anycloudflow/buckets/endpoints" element={<Navigate to="/admin-dashboard/integrations/orbit/buckets/endpoints" replace />} />
        <Route path="/admin-dashboard/integrations/anycloudflow/buckets/migrations" element={<Navigate to="/admin-dashboard/integrations/orbit/buckets/migrations" replace />} />
        <Route path="/admin-dashboard/integrations/anycloudflow/buckets/replications" element={<Navigate to="/admin-dashboard/integrations/orbit/buckets/replications" replace />} />
        <Route path="/admin-dashboard/integrations/anycloudflow/buckets/client-access" element={<Navigate to="/admin-dashboard/integrations/orbit/buckets/client-access" replace />} />
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
          element={<AdminLoadBalancersProject />}
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
