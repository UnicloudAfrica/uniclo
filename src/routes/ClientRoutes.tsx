import { Route, Outlet } from "react-router-dom";
import ObjectStorageProvider from "../contexts/ObjectStorageContext";
import ClientDashboardLayout from "../clientDashboard/components/ClientDashboardLayout";
import ClientRoute from "./ClientRoute";
import ClientDashboard from "../clientDashboard/pages/ClientDashboard";
import ClientProject from "../clientDashboard/pages/ClientProjects";
import ClientProjectCreate from "../clientDashboard/pages/ClientProjectCreate";
import ClientProjectDetails from "../clientDashboard/pages/ClientProjectDetails";
import ClientInstances from "../clientDashboard/pages/ClientInstances";
import InstanceDetails from "../dashboard/pages/InstanceDetails";
import ClientInstanceCreate from "../clientDashboard/pages/ClientInstanceCreate";
import ClientProvisioningWizard from "../clientDashboard/pages/ClientProvisioningWizard";
import ClientTemplates from "../clientDashboard/pages/ClientTemplates";

import ClientLaunch from "../clientDashboard/pages/ClientLaunch";
import ObjectStoragePage from "../clientDashboard/pages/ObjectStoragePage";
import ClientObjectStoragePurchasePage from "../clientDashboard/pages/ObjectStoragePurchasePage";
import ClientObjectStorageCreate from "../clientDashboard/pages/ObjectStorageCreate";
import ClientObjectStorageDetail from "../clientDashboard/pages/ClientObjectStorageDetail";
import ClientDeveloperPortal from "../clientDashboard/pages/ClientDeveloperPortal";
import ClientPricingCalculator from "../clientDashboard/pages/ClientPricingCalculator";
import ClientPaymentHistory from "../clientDashboard/pages/ClientTransaction";
import ClientSettings from "../clientDashboard/pages/ClientAccountSettings";
import ClientSupport from "../clientDashboard/pages/ClientSupport";
import ClientBillingPage from "../clientDashboard/pages/ClientBillingPage";
import ClientKeyPairs from "../clientDashboard/pages/ClientKeyPairs";
import ClientNetworkInterfaces from "../clientDashboard/pages/ClientNetworkInterfaces";
import ClientSubnets from "../clientDashboard/pages/ClientSubnets";
import ClientSecurityGroups from "../clientDashboard/pages/ClientSecurityGroups";
import ClientElasticIps from "../clientDashboard/pages/ClientElasticIps";
import ClientNatGateways from "../clientDashboard/pages/ClientNatGateways";
import ClientRouteTables from "../clientDashboard/pages/ClientRouteTables";
import ClientNetworkAcls from "../clientDashboard/pages/ClientNetworkAcls";
import ClientVpcPeering from "../clientDashboard/pages/ClientVpcPeering";
import ClientSecurityGroupRules from "../clientDashboard/pages/ClientSecurityGroupRules";
import ClientDnsManagement from "../clientDashboard/pages/ClientDnsManagement";
import ClientSnapshots from "../clientDashboard/pages/ClientSnapshots";
import ClientImages from "../clientDashboard/pages/ClientImages";
import ClientAutoScaling from "../clientDashboard/pages/ClientAutoScaling";
import ClientTicketDetail from "../clientDashboard/pages/ClientTicketDetail";
import ClientManagedDatabases from "../clientDashboard/pages/ClientManagedDatabases";
import ClientDatabaseCreate from "../clientDashboard/pages/ClientDatabaseCreate";
import ClientDatabaseDetail from "../clientDashboard/pages/ClientDatabaseDetail";
import ClientDatabaseReplication from "../clientDashboard/pages/ClientDatabaseReplication";
import ClientTeam from "../clientDashboard/pages/ClientTeam";
import ClientProtection from "../clientDashboard/pages/ClientProtection";
import ClientServerlessDr from "../clientDashboard/pages/ClientServerlessDr";
import ClientAgent from "../clientDashboard/pages/ClientAgent";
import ClientMigrations from "../clientDashboard/pages/ClientMigrations";
import ClientMigrationWizard from "../clientDashboard/pages/ClientMigrationWizard";
import ClientBatchMigrations from "../clientDashboard/pages/ClientBatchMigrations";
import ClientBatchMigrationWizard from "../clientDashboard/pages/ClientBatchMigrationWizard";
import ClientBatchMigrationDetail from "../clientDashboard/pages/ClientBatchMigrationDetail";
import ClientDrDrills from "../clientDashboard/pages/ClientDrDrills";
import ClientHypervisor from "../clientDashboard/pages/ClientHypervisor";
import ClientRansomware from "../clientDashboard/pages/ClientRansomware";
import ClientShieldDomains from "../clientDashboard/pages/ClientShieldDomains";
import ClientShieldDomainDetail from "../clientDashboard/pages/ClientShieldDomainDetail";
import ClientShieldOverview from "../clientDashboard/pages/ClientShieldOverview";
import ClientShieldAttackMap from "../clientDashboard/pages/ClientShieldAttackMap";
import ClientFlow from "../clientDashboard/pages/ClientFlow";
import ClientShieldFirewall from "../clientDashboard/pages/ClientShieldFirewall";
import ClientShieldAttacks from "../clientDashboard/pages/ClientShieldAttacks";
import ClientShieldAnalytics from "../clientDashboard/pages/ClientShieldAnalytics";
import ClientShieldSsl from "../clientDashboard/pages/ClientShieldSsl";
import ClientCloudAccounts from "../clientDashboard/pages/ClientCloudAccounts";
import ClientCloudAccountCreate from "../clientDashboard/pages/ClientCloudAccountCreate";
import ClientCloudAccountDetail from "../clientDashboard/pages/ClientCloudAccountDetail";

import ClientDocsLayout from "../clientDashboard/pages/docs/ClientDocsLayout";
import ClientDocPage from "../clientDashboard/pages/docs/ClientDocPage";

import type { JSX } from "react";

const ObjectStorageRouteProvider = (): JSX.Element => (
  <ObjectStorageProvider>
    <div className="object-storage-theme">
      <Outlet />
    </div>
  </ObjectStorageProvider>
);

const ClientRoutes = (): JSX.Element => (
  <Route
    element={
      <ClientRoute>
        <ClientDashboardLayout />
      </ClientRoute>
    }
  >
    <Route path="/client-dashboard" element={<ClientDashboard />} />
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

    <Route path="/client-dashboard/migrations" element={<ClientMigrations />} />
    <Route path="/client-dashboard/migrations/new" element={<ClientMigrationWizard />} />
    <Route path="/client-dashboard/batch-migrations" element={<ClientBatchMigrations />} />
    <Route path="/client-dashboard/batch-migrations/new" element={<ClientBatchMigrationWizard />} />
    <Route path="/client-dashboard/batch-migrations/:identifier" element={<ClientBatchMigrationDetail />} />

    <Route path="/client-dashboard/shield/domains" element={<ClientShieldDomains />} />
    <Route path="/client-dashboard/shield/domains/:domainId" element={<ClientShieldDomainDetail />} />
    <Route path="/client-dashboard/shield/overview" element={<ClientShieldOverview />} />
    <Route path="/client-dashboard/shield/attack-map" element={<ClientShieldAttackMap />} />
    <Route path="/client-dashboard/shield/firewall" element={<ClientShieldFirewall />} />
    <Route path="/client-dashboard/shield/attacks" element={<ClientShieldAttacks />} />
    <Route path="/client-dashboard/shield/analytics" element={<ClientShieldAnalytics />} />
    <Route path="/client-dashboard/shield/ssl" element={<ClientShieldSsl />} />

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

    <Route path="/client-dashboard/pricing-calculator" element={<ClientPricingCalculator />} />
    <Route path="/client-dashboard/developer/*" element={<ClientDeveloperPortal />} />
    <Route path="/client-dashboard/orders-payments" element={<ClientPaymentHistory />} />
    <Route path="/client-dashboard/billing" element={<ClientBillingPage />} />
    <Route path="/client-dashboard/account-settings" element={<ClientSettings />} />
    <Route path="/client-dashboard/team" element={<ClientTeam />} />
    <Route path="/client-dashboard/flow" element={<ClientFlow />} />
    <Route path="/client-dashboard/support" element={<ClientSupport />} />
    <Route path="/client-dashboard/support/:id" element={<ClientTicketDetail />} />

    {/* Documentation */}
    <Route path="/client-dashboard/docs" element={<ClientDocsLayout />}>
      <Route index element={<ClientDocPage />} />
      <Route path=":slug" element={<ClientDocPage />} />
    </Route>
  </Route>
);

export default ClientRoutes;
