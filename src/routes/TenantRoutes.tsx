import { Route, Navigate, Outlet } from "react-router-dom";
import ObjectStorageProvider from "../contexts/ObjectStorageContext";
import TenantRoute from "./TenantRoute";
import TenantDashboardLayout from "../tenantDashboard/components/TenantDashboardLayout";
import Dashboard from "../dashboard/pages/dashboard";

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
import TenantDeveloperPortal from "../tenantDashboard/pages/DeveloperPortal";
import TenantPricingCalculator from "../tenantDashboard/pages/TenantPricingCalculator";
import TenantPricingOverrides from "../tenantDashboard/pages/TenantPricingOverrides";
import TenantPricingEditList from "../tenantDashboard/pages/TenantPricingEditList";
import TenantCreateInvoice from "../tenantDashboard/pages/TenantCreateInvoice";
import DashboardInstances from "../dashboard/pages/Instances";
import InstanceDetails from "../dashboard/pages/InstanceDetails";
import TenantTicketDetail from "../dashboard/pages/TenantTicketDetail";

import TenantQuoteCalculator from "../dashboard/pages/TenantQuoteCalculator";
import DashboardObjectStorage from "../dashboard/pages/objectStorage";
import TenantObjectStorageCreate from "../dashboard/pages/objectStorageCreate";
import TenantObjectStoragePurchase from "../dashboard/pages/objectStoragePurchase";
import TenantObjectStorageDetail from "../tenantDashboard/pages/TenantObjectStorageDetail";
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
import TenantOnboardingOverview from "../tenantDashboard/pages/TenantOnboardingOverview";
import RegionRequests from "../tenantDashboard/pages/RegionRequests";
import RegionRequestDetail from "../tenantDashboard/pages/RegionRequestDetail";
import NewRegionRequest from "../tenantDashboard/pages/NewRegionRequest";
import RevenueDashboard from "../tenantDashboard/pages/RevenueDashboard";
import TenantProvisioningWizard from "../tenantDashboard/pages/TenantProvisioningWizard";
import TenantTemplates from "../tenantDashboard/pages/TenantTemplates";
import TenantManagedDatabases from "../dashboard/pages/TenantManagedDatabases";
import TenantCloudAccounts from "../dashboard/pages/TenantCloudAccounts";
import TenantCloudAccountCreate from "../dashboard/pages/TenantCloudAccountCreate";
import TenantCloudAccountDetail from "../dashboard/pages/TenantCloudAccountDetail";
import TenantMonitoring from "../tenantDashboard/pages/TenantMonitoring";
import TenantFlow from "../tenantDashboard/pages/TenantFlow";
import TenantMigrationCalculator from "../tenantDashboard/pages/TenantMigrationCalculator";
import TenantDatabaseCreate from "../dashboard/pages/TenantDatabaseCreate";
import TenantDatabaseDetail from "../dashboard/pages/TenantDatabaseDetail";
import TenantDiscountManager from "../tenantDashboard/pages/TenantDiscountManager";
import TenantPayoutsPage from "../tenantDashboard/pages/TenantPayoutsPage";
import TenantBillingSettings from "../tenantDashboard/pages/TenantBillingSettings";
import TenantInvoicesPage from "../tenantDashboard/pages/TenantInvoicesPage";
import TenantPocTrials from "../tenantDashboard/pages/TenantPocTrials";
import TenantProtection from "../dashboard/pages/TenantProtection";
import TenantMigrations from "../dashboard/pages/TenantMigrations";
import TenantMigrationWizard from "../dashboard/pages/TenantMigrationWizard";
import TenantBatchMigrations from "../dashboard/pages/TenantBatchMigrations";
import TenantBatchMigrationWizard from "../dashboard/pages/TenantBatchMigrationWizard";
import TenantBatchMigrationDetail from "../dashboard/pages/TenantBatchMigrationDetail";
import TenantDestinations from "../dashboard/pages/TenantDestinations";
import TenantServerlessDr from "../dashboard/pages/TenantServerlessDr";
import TenantAgent from "../dashboard/pages/TenantAgent";
import TenantDrDrills from "../dashboard/pages/TenantDrDrills";
import TenantHypervisor from "../dashboard/pages/TenantHypervisor";
import TenantDatabaseReplication from "../dashboard/pages/TenantDatabaseReplication";
import TenantRansomware from "../dashboard/pages/TenantRansomware";
import TenantShieldDomains from "../dashboard/pages/TenantShieldDomains";
import TenantShieldDomainDetail from "../dashboard/pages/TenantShieldDomainDetail";
import TenantShieldOverview from "../dashboard/pages/TenantShieldOverview";
import TenantShieldAttackMap from "../dashboard/pages/TenantShieldAttackMap";
import TenantShieldFirewall from "../dashboard/pages/TenantShieldFirewall";
import TenantShieldAttacks from "../dashboard/pages/TenantShieldAttacks";
import TenantShieldAnalytics from "../dashboard/pages/TenantShieldAnalytics";
import TenantShieldSsl from "../dashboard/pages/TenantShieldSsl";
import {
  TenantKeyPairs,
  TenantNetworkInterfaces,
  TenantSubnets,
  TenantSecurityGroups,
  TenantElasticIps,
  TenantNatGateways,
  TenantRouteTables,
  TenantNetworkAcls,
  TenantVpcPeering,
  TenantSecurityGroupRules,
  TenantNetworkAclRules,
  TenantLoadBalancers,
  LoadBalancerWizard,
  TenantLoadBalancerDetail,
  TenantDnsManagement,
  TenantSnapshots,
  TenantImages,
  TenantAutoScaling,
  LaunchConfigurationWizard,
  AutoScalingGroupWizard,
} from "../tenantDashboard/pages/infrastructure";

import TenantDocsLayout from "../tenantDashboard/pages/docs/TenantDocsLayout";
import TenantDocPage from "../tenantDashboard/pages/docs/TenantDocPage";

import type { JSX } from "react";

const ObjectStorageRouteProvider = (): JSX.Element => (
  <ObjectStorageProvider>
    <div className="object-storage-theme">
      <Outlet />
    </div>
  </ObjectStorageProvider>
);

const TenantRoutes = (): JSX.Element => (
  <>
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
        <Route path="/dashboard/databases" element={<TenantManagedDatabases />} />
        <Route path="/dashboard/databases/create" element={<TenantDatabaseCreate />} />
        <Route path="/dashboard/databases/:identifier" element={<TenantDatabaseDetail />} />

        <Route path="/dashboard/cloud-accounts" element={<TenantCloudAccounts />} />
        <Route path="/dashboard/cloud-accounts/create" element={<TenantCloudAccountCreate />} />
        <Route path="/dashboard/cloud-accounts/:accountId" element={<TenantCloudAccountDetail />} />

        <Route path="/dashboard/anycloudflow/calculator" element={<TenantMigrationCalculator />} />
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
        <Route path="/dashboard/serverless-dr" element={<TenantServerlessDr />} />

        <Route path="/dashboard/shield/domains" element={<TenantShieldDomains />} />
        <Route path="/dashboard/shield/domains/:domainId" element={<TenantShieldDomainDetail />} />
        <Route path="/dashboard/shield/overview" element={<TenantShieldOverview />} />
        <Route path="/dashboard/shield/attack-map" element={<TenantShieldAttackMap />} />
        <Route path="/dashboard/shield/firewall" element={<TenantShieldFirewall />} />
        <Route path="/dashboard/shield/attacks" element={<TenantShieldAttacks />} />
        <Route path="/dashboard/shield/analytics" element={<TenantShieldAnalytics />} />
        <Route path="/dashboard/shield/ssl" element={<TenantShieldSsl />} />
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
        <Route path="/dashboard/pricing-overrides" element={<TenantPricingOverrides />} />
        <Route path="/dashboard/pricing-overrides/edit-list" element={<TenantPricingEditList />} />
        <Route path="/dashboard/pricing-calculator" element={<TenantPricingCalculator />} />
        <Route path="/dashboard/create-invoice" element={<TenantCreateInvoice />} />
        <Route path="/dashboard/quote-invoice" element={<TenantQuoteCalculator />} />
        <Route path="/dashboard/payment-history" element={<PaymentHistory />} />
        <Route path="/dashboard/tax-configurations" element={<DashboardTaxConfigurations />} />
        <Route path="/dashboard/discounts" element={<TenantDiscountManager />} />
        <Route path="/dashboard/payouts" element={<TenantPayoutsPage />} />
        <Route path="/dashboard/billing" element={<TenantBillingSettings />} />
        <Route path="/dashboard/invoices" element={<TenantInvoicesPage />} />
        <Route path="/dashboard/poc-trials" element={<TenantPocTrials />} />

        {/* Standalone */}
        <Route path="/dashboard/products" element={<Products />} />
        <Route path="/dashboard/developer/*" element={<TenantDeveloperPortal />} />
        <Route path="/dashboard/support" element={<SupportTicket />} />
        <Route path="/dashboard/support/:id" element={<TenantTicketDetail />} />
        <Route path="/dashboard/account" element={<TenantAccountSettings />} />
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
