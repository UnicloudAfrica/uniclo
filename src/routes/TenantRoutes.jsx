import React from "react";
import { Route, Navigate } from "react-router-dom";
import TenantRoute from "./TenantRoute";
import Dashboard from "../dashboard/pages/dashboard";

import PurchasedModules from "../dashboard/pages/purchasedModules";
import PaymentHistory from "../dashboard/pages/paymentHistory";
import SupportTicket from "../dashboard/pages/supportTicket";
import ClientsOverview from "../dashboard/pages/clientsOverview";
import Requests from "../dashboard/pages/requests";
import Project from "../dashboard/pages/ProjectMain";
import DashboardProjectCreate from "../dashboard/pages/ProjectCreate";
import ProjectDetails from "../dashboard/pages/ProjectDetails";
import Settings from "../dashboard/pages/settings";
import DashboardTaxConfigurations from "../dashboard/pages/taxConfiguration";
import Products from "../dashboard/pages/products";
import TenantPricingCalculator from "../tenantDashboard/pages/TenantPricingCalculator";
import TenantCreateInvoice from "../tenantDashboard/pages/TenantCreateInvoice";
import DashboardInstances from "../dashboard/pages/Instances";

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
import OnboardingDashboard from "../dashboard/onboarding";
import TenantBrandingSettings from "../tenantDashboard/pages/TenantBrandingSettings";
import TenantProvisioningWizard from "../tenantDashboard/pages/TenantProvisioningWizard";
import TenantTemplates from "../tenantDashboard/pages/TenantTemplates";
import TenantDiscountManager from "../tenantDashboard/pages/TenantDiscountManager";
import TenantPayoutsPage from "../tenantDashboard/pages/TenantPayoutsPage";
import TenantBillingSettings from "../tenantDashboard/pages/TenantBillingSettings";
import TenantInvoicesPage from "../tenantDashboard/pages/TenantInvoicesPage";
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

const TenantRoutes = () => {
  return (
    <>
      <Route element={<TenantRoute />}>
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
        <Route path="/dashboard/instances" element={<DashboardInstances />} />
        <Route path="/dashboard/create-instance" element={<TenantProvisioningWizard />} />
        <Route path="/dashboard/templates" element={<TenantTemplates />} />

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
        <Route path="/dashboard/pricing-calculator" element={<TenantPricingCalculator />} />
        <Route path="/dashboard/create-invoice" element={<TenantCreateInvoice />} />
        <Route path="/dashboard/quote-invoice" element={<TenantQuoteCalculator />} />
        <Route path="/dashboard/payment-history" element={<PaymentHistory />} />
        <Route path="/dashboard/tax-configurations" element={<DashboardTaxConfigurations />} />
        <Route path="/dashboard/discounts" element={<TenantDiscountManager />} />
        <Route path="/dashboard/payouts" element={<TenantPayoutsPage />} />
        <Route path="/dashboard/billing" element={<TenantBillingSettings />} />
        <Route path="/dashboard/invoices" element={<TenantInvoicesPage />} />

        {/* Standalone */}
        <Route path="/dashboard/products" element={<Products />} />
        <Route path="/dashboard/support" element={<SupportTicket />} />
        <Route path="/dashboard/settings" element={<Settings />} />
        <Route path="/dashboard/branding" element={<TenantBrandingSettings />} />

        {/* Legacy redirects */}
        <Route path="/tenant-dashboard/*" element={<Navigate to="/dashboard" replace />} />
        <Route
          path="/dashboard/account-settings"
          element={<Navigate to="/dashboard/settings" replace />}
        />
        <Route
          path="/dashboard/support-ticket"
          element={<Navigate to="/dashboard/support" replace />}
        />
      </Route>
    </>
  );
};

export default TenantRoutes;
