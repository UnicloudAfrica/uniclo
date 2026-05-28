import { lazy, Suspense, type JSX } from "react";
import { Route, Outlet, Navigate } from "react-router-dom";
import ObjectStorageProvider from "../contexts/ObjectStorageContext";
import ClientDashboardLayout from "../clientDashboard/components/ClientDashboardLayout";
import ClientRoute from "./ClientRoute";
import ClientTwoFactorEnroll from "../clientDashboard/pages/ClientTwoFactorEnroll";
const ClientTwoFactorManage = lazy(() => import("../clientDashboard/pages/ClientTwoFactorManage"));
const ClientDashboard = lazy(() => import("../clientDashboard/pages/ClientDashboard"));
const ClientProject = lazy(() => import("../clientDashboard/pages/ClientProjects"));
const ClientProjectCreate = lazy(() => import("../clientDashboard/pages/ClientProjectCreate"));
const ClientProjectDetails = lazy(() => import("../clientDashboard/pages/ClientProjectDetails"));
const ClientInstances = lazy(() => import("../clientDashboard/pages/ClientInstances"));
import InstanceDetails from "../dashboard/pages/InstanceDetails";
const ClientInstanceCreate = lazy(() => import("../clientDashboard/pages/ClientInstanceCreate"));
const ClientProvisioningWizard = lazy(() => import("../clientDashboard/pages/ClientProvisioningWizard"));
const ClientTemplates = lazy(() => import("../clientDashboard/pages/ClientTemplates"));
const ClientLaunch = lazy(() => import("../clientDashboard/pages/ClientLaunch"));
const ObjectStoragePage = lazy(() => import("../clientDashboard/pages/ObjectStoragePage"));
const ClientObjectStoragePurchasePage = lazy(() => import("../clientDashboard/pages/ObjectStoragePurchasePage"));
const ClientObjectStorageCreate = lazy(() => import("../clientDashboard/pages/ObjectStorageCreate"));
const ClientObjectStorageDetail = lazy(() => import("../clientDashboard/pages/ClientObjectStorageDetail"));
const ClientDeveloperPortal = lazy(() => import("../clientDashboard/pages/ClientDeveloperPortal"));
const ClientPricingCalculator = lazy(() => import("../clientDashboard/pages/ClientPricingCalculator"));
const ClientDomainPurchase = lazy(() => import("../clientDashboard/pages/ClientDomainPurchase"));
const ClientLogViewer = lazy(() => import("../clientDashboard/pages/ClientLogViewer"));
const ClientPaymentHistory = lazy(() => import("../clientDashboard/pages/ClientTransaction"));
const ClientSettings = lazy(() => import("../clientDashboard/pages/ClientAccountSettings"));
const ClientSupport = lazy(() => import("../clientDashboard/pages/ClientSupport"));
const ClientBillingPage = lazy(() => import("../clientDashboard/pages/ClientBillingPage"));
// Infrastructure pages — lazy-loaded so the client bundle doesn't pay
// to download the network ACL, route table, auto-scaling, etc. pages
// up front. Each page is its own webpack/Vite chunk; the existing
// `<Suspense>` wrapper handles the fallback.
const ClientKeyPairs = lazy(() => import("../clientDashboard/pages/ClientKeyPairs"));
const ClientNetworkInterfaces = lazy(() => import("../clientDashboard/pages/ClientNetworkInterfaces"));
const ClientSubnets = lazy(() => import("../clientDashboard/pages/ClientSubnets"));
const ClientSecurityGroups = lazy(() => import("../clientDashboard/pages/ClientSecurityGroups"));
const ClientElasticIps = lazy(() => import("../clientDashboard/pages/ClientElasticIps"));
const ClientNatGateways = lazy(() => import("../clientDashboard/pages/ClientNatGateways"));
const ClientRouteTables = lazy(() => import("../clientDashboard/pages/ClientRouteTables"));
const ClientNetworkAcls = lazy(() => import("../clientDashboard/pages/ClientNetworkAcls"));
const ClientVpcPeering = lazy(() => import("../clientDashboard/pages/ClientVpcPeering"));
const ClientSecurityGroupRules = lazy(() => import("../clientDashboard/pages/ClientSecurityGroupRules"));
const ClientDnsManagement = lazy(() => import("../clientDashboard/pages/ClientDnsManagement"));
const ClientSnapshots = lazy(() => import("../clientDashboard/pages/ClientSnapshots"));
const ClientImages = lazy(() => import("../clientDashboard/pages/ClientImages"));
const ClientAutoScaling = lazy(() => import("../clientDashboard/pages/ClientAutoScaling"));
const ClientTicketDetail = lazy(() => import("../clientDashboard/pages/ClientTicketDetail"));
const ClientManagedDatabases = lazy(() => import("../clientDashboard/pages/ClientManagedDatabases"));
const ClientDatabaseCreate = lazy(() => import("../clientDashboard/pages/ClientDatabaseCreate"));
const ClientDatabaseDetail = lazy(() => import("../clientDashboard/pages/ClientDatabaseDetail"));
const ClientDatabaseReplication = lazy(() => import("../clientDashboard/pages/ClientDatabaseReplication"));
const ClientTeam = lazy(() => import("../clientDashboard/pages/ClientTeam"));
const ClientProtection = lazy(() => import("../clientDashboard/pages/ClientProtection"));
const ClientServerlessDr = lazy(() => import("../clientDashboard/pages/ClientServerlessDr"));
const ClientAgent = lazy(() => import("../clientDashboard/pages/ClientAgent"));
const ClientMonitoring = lazy(() => import("../clientDashboard/pages/ClientMonitoring"));
const ClientMigrations = lazy(() => import("../clientDashboard/pages/ClientMigrations"));
const ClientMigrationWizard = lazy(() => import("../clientDashboard/pages/ClientMigrationWizard"));
const ClientBatchMigrations = lazy(() => import("../clientDashboard/pages/ClientBatchMigrations"));
const ClientBatchMigrationWizard = lazy(() => import("../clientDashboard/pages/ClientBatchMigrationWizard"));
const ClientBatchMigrationDetail = lazy(() => import("../clientDashboard/pages/ClientBatchMigrationDetail"));
const ClientMigrationRequests = lazy(() => import("../clientDashboard/pages/ClientMigrationRequests"));
const ClientMigrationRequestDetail = lazy(() => import("../clientDashboard/pages/ClientMigrationRequestDetail"));
const ClientImageRequests = lazy(() => import("../clientDashboard/pages/ClientImageRequests"));
const ClientDrDrills = lazy(() => import("../clientDashboard/pages/ClientDrDrills"));
const ClientHypervisor = lazy(() => import("../clientDashboard/pages/ClientHypervisor"));
const ClientRansomware = lazy(() => import("../clientDashboard/pages/ClientRansomware"));
const ClientFlow = lazy(() => import("../clientDashboard/pages/ClientFlow"));
const ClientFlowBilling = lazy(() => import("../clientDashboard/pages/ClientFlowBilling"));
const ClientShieldDomains = lazy(() => import("../clientDashboard/pages/ClientShieldDomains"));
const ClientShieldDomainDetail = lazy(() => import("../clientDashboard/pages/ClientShieldDomainDetail"));
const ClientInvoices = lazy(() => import("../clientDashboard/pages/ClientInvoices"));
const ClientInvoiceDetail = lazy(() => import("../clientDashboard/pages/ClientInvoiceDetail"));
const ClientShieldOverview = lazy(() => import("../clientDashboard/pages/ClientShieldOverview"));
const ClientShieldAttackMap = lazy(() => import("../clientDashboard/pages/ClientShieldAttackMap"));
const ClientShieldFirewall = lazy(() => import("../clientDashboard/pages/ClientShieldFirewall"));
const ClientShieldAttacks = lazy(() => import("../clientDashboard/pages/ClientShieldAttacks"));
const ClientShieldAnalytics = lazy(() => import("../clientDashboard/pages/ClientShieldAnalytics"));
const ClientShieldSsl = lazy(() => import("../clientDashboard/pages/ClientShieldSsl"));
const ClientCloudAccounts = lazy(() => import("../clientDashboard/pages/ClientCloudAccounts"));
const ClientCloudAccountCreate = lazy(() => import("../clientDashboard/pages/ClientCloudAccountCreate"));
const ClientCloudAccountDetail = lazy(() => import("../clientDashboard/pages/ClientCloudAccountDetail"));
// Path C — client-facing AnyCloudFlow bucket subsystem (read-only).
const ClientBucketEndpointsPage = lazy(() => import("../clientDashboard/pages/integrations/anycloudflow/buckets/ClientBucketEndpointsPage"));
// FR-043 — Orbit source-VM endpoints (client variant; read-only)
const ClientVmEndpoints = lazy(() => import("../clientDashboard/pages/integrations/orbit/ClientVmEndpoints"));
const ClientVmEndpointDetail = lazy(() => import("../clientDashboard/pages/integrations/orbit/ClientVmEndpointDetail"));
const ClientBucketMigrationsPage = lazy(() => import("../clientDashboard/pages/integrations/anycloudflow/buckets/ClientBucketMigrationsPage"));
const ClientBucketReplicationsPage = lazy(() => import("../clientDashboard/pages/integrations/anycloudflow/buckets/ClientBucketReplicationsPage"));
import ClientDocsLayout from "../clientDashboard/pages/docs/ClientDocsLayout";
const ClientDocPage = lazy(() => import("../clientDashboard/pages/docs/ClientDocPage"));
const ObjectStorageRouteProvider = (): JSX.Element => (
  <ObjectStorageProvider>
    <div className="object-storage-theme">
      <Outlet />
    </div>
  </ObjectStorageProvider>
);

const ClientRoutes = (): JSX.Element => (
  <>
    {/* 2FA enrollment — sits outside the ClientRoute guard since the
        api interceptor redirects authenticated-but-not-yet-enrolled
        clients here when their tenant has force_client_2fa enabled
        (or the platform has force_tenantless_client_2fa enabled). */}
    <Route path="/client-2fa-enroll" element={<ClientTwoFactorEnroll />} />
    <Route
    element={
      <ClientRoute>
        <ClientDashboardLayout />
      </ClientRoute>
    }
  >
    <Route path="/client-dashboard" element={<ClientDashboard />} />
    <Route
      path="/client-dashboard/security/2fa"
      element={
        <Suspense fallback={null}>
          <ClientTwoFactorManage />
        </Suspense>
      }
    />
    <Route path="/client-dashboard/projects" element={<ClientProject />} />
    <Route path="/client-dashboard/projects/create" element={<ClientProjectCreate />} />
    <Route path="/client-dashboard/projects/details" element={<ClientProjectDetails />} />
    <Route path="/client-dashboard/cube-instances" element={<ClientInstances />} />
    <Route path="/client-dashboard/cube-instances/details" element={<InstanceDetails />} />
    <Route path="/client-dashboard/cube-instances/create" element={<ClientInstanceCreate />} />
    <Route path="/client-dashboard/cube-instances/provision" element={<ClientProvisioningWizard />} />
    <Route path="/client-dashboard/templates" element={<ClientTemplates />} />

    <Route path="/client-dashboard/databases" element={<ClientManagedDatabases />} />
    <Route path="/client-dashboard/databases/create" element={<ClientDatabaseCreate />} />
    <Route path="/client-dashboard/databases/:identifier" element={<ClientDatabaseDetail />} />

    <Route path="/client-dashboard/cloud-accounts" element={<ClientCloudAccounts />} />
    <Route path="/client-dashboard/cloud-accounts/create" element={<ClientCloudAccountCreate />} />
    <Route path="/client-dashboard/cloud-accounts/:accountId" element={<ClientCloudAccountDetail />} />

    <Route path="/client-dashboard/protection" element={<ClientProtection />} />
    <Route path="/client-dashboard/dr-drills" element={<ClientDrDrills />} />
    <Route path="/client-dashboard/hypervisor" element={<ClientHypervisor />} />
    <Route path="/client-dashboard/database-replication" element={<ClientDatabaseReplication />} />
    <Route path="/client-dashboard/ransomware" element={<ClientRansomware />} />
    <Route path="/client-dashboard/serverless-dr" element={<ClientServerlessDr />} />
    <Route path="/client-dashboard/agent" element={<ClientAgent />} />
    <Route path="/client-dashboard/monitoring" element={<ClientMonitoring />} />

    <Route path="/client-dashboard/migrations" element={<ClientMigrations />} />
    <Route path="/client-dashboard/migrations/new" element={<ClientMigrationWizard />} />
    <Route path="/client-dashboard/batch-migrations" element={<ClientBatchMigrations />} />
    <Route path="/client-dashboard/batch-migrations/new" element={<ClientBatchMigrationWizard />} />
    <Route path="/client-dashboard/batch-migrations/:identifier" element={<ClientBatchMigrationDetail />} />
    <Route path="/client-dashboard/migration-requests" element={<ClientMigrationRequests />} />
    <Route path="/client-dashboard/migration-requests/:identifier" element={<ClientMigrationRequestDetail />} />
    <Route path="/client-dashboard/image-requests" element={<ClientImageRequests />} />

    <Route path="/client-dashboard/shield/domains" element={<Suspense fallback={null}><ClientShieldDomains /></Suspense>} />
    <Route path="/client-dashboard/shield/domains/:domainId" element={<Suspense fallback={null}><ClientShieldDomainDetail /></Suspense>} />
    <Route path="/client-dashboard/invoices" element={<Suspense fallback={null}><ClientInvoices /></Suspense>} />
    <Route path="/client-dashboard/invoices/:invoiceId" element={<Suspense fallback={null}><ClientInvoiceDetail /></Suspense>} />
    <Route path="/client-dashboard/shield/overview" element={<Suspense fallback={null}><ClientShieldOverview /></Suspense>} />
    <Route path="/client-dashboard/shield/attack-map" element={<Suspense fallback={null}><ClientShieldAttackMap /></Suspense>} />
    <Route path="/client-dashboard/shield/firewall" element={<Suspense fallback={null}><ClientShieldFirewall /></Suspense>} />
    <Route path="/client-dashboard/shield/attacks" element={<Suspense fallback={null}><ClientShieldAttacks /></Suspense>} />
    <Route path="/client-dashboard/shield/analytics" element={<Suspense fallback={null}><ClientShieldAnalytics /></Suspense>} />
    <Route path="/client-dashboard/shield/ssl" element={<Suspense fallback={null}><ClientShieldSsl /></Suspense>} />

    <Route path="/client-dashboard/launch" element={<ClientLaunch />} />
    <Route element={<ObjectStorageRouteProvider />}>
      <Route path="/client-dashboard/object-storage" element={<ObjectStoragePage />} />
      <Route
        path="/client-dashboard/object-storage/purchase"
        element={<ClientObjectStoragePurchasePage />}
      />
      <Route
        path="/client-dashboard/object-storage/create"
        element={<ClientObjectStorageCreate />}
      />
      <Route
        path="/client-dashboard/object-storage/:accountId"
        element={<ClientObjectStorageDetail />}
      />
    </Route>

    {/* VPC Infrastructure */}
    <Route path="/client-dashboard/infrastructure/key-pairs" element={<ClientKeyPairs />} />
    <Route
      path="/client-dashboard/infrastructure/network-interfaces"
      element={<ClientNetworkInterfaces />}
    />
    <Route path="/client-dashboard/infrastructure/subnets" element={<ClientSubnets />} />
    <Route
      path="/client-dashboard/infrastructure/security-groups"
      element={<ClientSecurityGroups />}
    />
    <Route
      path="/client-dashboard/infrastructure/security-group-rules"
      element={<ClientSecurityGroupRules />}
    />
    <Route path="/client-dashboard/infrastructure/elastic-ips" element={<ClientElasticIps />} />
    <Route path="/client-dashboard/infrastructure/nat-gateways" element={<ClientNatGateways />} />
    <Route path="/client-dashboard/infrastructure/route-tables" element={<ClientRouteTables />} />
    <Route path="/client-dashboard/infrastructure/network-acls" element={<ClientNetworkAcls />} />
    <Route path="/client-dashboard/infrastructure/vpc-peering" element={<ClientVpcPeering />} />
    <Route path="/client-dashboard/infrastructure/dns" element={<ClientDnsManagement />} />
    <Route path="/client-dashboard/infrastructure/snapshots" element={<ClientSnapshots />} />
    <Route path="/client-dashboard/infrastructure/images" element={<ClientImages />} />
    <Route path="/client-dashboard/infrastructure/autoscaling" element={<ClientAutoScaling />} />

    {/* FR-043 — source-VM endpoints (client read-only).
        Detail-only — clients cannot register or edit. */}
    <Route path="/client-dashboard/integrations/orbit/vms" element={<ClientVmEndpoints />} />
    <Route path="/client-dashboard/integrations/orbit/vms/:id" element={<ClientVmEndpointDetail />} />

    {/* Path C — Orbit Bucket (Object Storage) read-only client views */}
    <Route path="/client-dashboard/integrations/orbit/buckets/endpoints" element={<ClientBucketEndpointsPage />} />
    <Route path="/client-dashboard/integrations/orbit/buckets/migrations" element={<ClientBucketMigrationsPage />} />
    <Route path="/client-dashboard/integrations/orbit/buckets/replications" element={<ClientBucketReplicationsPage />} />

    {/* Legacy /anycloudflow/ aliases — redirect to /orbit/ counterparts */}
    <Route path="/client-dashboard/integrations/anycloudflow/buckets/endpoints" element={<Navigate to="/client-dashboard/integrations/orbit/buckets/endpoints" replace />} />
    <Route path="/client-dashboard/integrations/anycloudflow/buckets/migrations" element={<Navigate to="/client-dashboard/integrations/orbit/buckets/migrations" replace />} />
    <Route path="/client-dashboard/integrations/anycloudflow/buckets/replications" element={<Navigate to="/client-dashboard/integrations/orbit/buckets/replications" replace />} />

    <Route path="/client-dashboard/pricing-calculator" element={<ClientPricingCalculator />} />
    {/* GAP-034 — buy a domain */}
    <Route path="/client-dashboard/domains" element={<ClientDomainPurchase />} />
    {/* GAP-038 — central log viewer */}
    <Route path="/client-dashboard/logs" element={<ClientLogViewer />} />
    <Route path="/client-dashboard/developer/*" element={<ClientDeveloperPortal />} />
    <Route path="/client-dashboard/orders-payments" element={<ClientPaymentHistory />} />
    <Route path="/client-dashboard/billing" element={<ClientBillingPage />} />
    <Route path="/client-dashboard/account-settings" element={<ClientSettings />} />
    <Route path="/client-dashboard/team" element={<ClientTeam />} />
    <Route path="/client-dashboard/flow" element={<ClientFlow />} />
    <Route path="/client-dashboard/flow/billing" element={<ClientFlowBilling />} />
    <Route path="/client-dashboard/support" element={<ClientSupport />} />
    <Route path="/client-dashboard/support/:id" element={<ClientTicketDetail />} />

    {/* Documentation */}
    <Route path="/client-dashboard/docs" element={<ClientDocsLayout />}>
      <Route index element={<ClientDocPage />} />
      <Route path=":slug" element={<ClientDocPage />} />
    </Route>
  </Route>
  </>
);

export default ClientRoutes;
