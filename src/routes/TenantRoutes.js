import React from "react";
import { Route, Navigate } from "react-router-dom";
import TenantRoute from "./TenantRoute";
import Dashboard from "../dashboard/pages/dashboard";
import { Modules } from "../dashboard/pages/modules";
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
import TenantLeads from "../tenantDashboard/pages/tenant-leads";
import TenantLeadDetails from "../tenantDashboard/pages/tenant-lead-details";
import TenantObjectStorage from "../tenantDashboard/pages/TenantObjectStorage";
import TenantOnboardingOverview from "../tenantDashboard/pages/TenantOnboardingOverview";
import RegionRequests from "../tenantDashboard/pages/RegionRequests";
import RegionRequestDetail from "../tenantDashboard/pages/RegionRequestDetail";
import NewRegionRequest from "../tenantDashboard/pages/NewRegionRequest";
import RevenueDashboard from "../tenantDashboard/pages/RevenueDashboard";
import OnboardingDashboard from "../dashboard/onboarding";
import TenantBrandingSettings from "../tenantDashboard/pages/TenantBrandingSettings";
import TenantProvisioningWizard from "../tenantDashboard/pages/TenantProvisioningWizard";
import TenantDiscountManager from "../tenantDashboard/pages/TenantDiscountManager";

const TenantRoutes = () => {
  return (
    <>
      <Route element={<TenantRoute />}>
        <Route path="/dashboard/quote-invoice" element={<TenantQuoteCalculator />} />
        <Route path="/dashboard/instances" element={<DashboardInstances />} />
        <Route path="/dashboard/create-instance" element={<TenantProvisioningWizard />} />

        <Route path="/dashboard/onboarding" element={<OnboardingDashboard />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/dashboard/modules" element={<Modules />} />
        <Route path="/dashboard/purchased-modules" element={<PurchasedModules />} />
        <Route path="/dashboard/clients" element={<PartnersAndClientsPage />} />
        <Route path="/dashboard/partners/new" element={<NewPartnerPage />} />
        <Route path="/dashboard/partners/:partnerId" element={<PartnerDetailsPage />} />
        <Route path="/dashboard/partners/:partnerId/edit" element={<EditPartnerPage />} />
        <Route path="/dashboard/clients/new" element={<NewClientPage />} />
        <Route path="/dashboard/clients/:clientId" element={<ClientDetailsPage />} />
        <Route path="/dashboard/clients/:clientId/edit" element={<EditClientPage />} />
        <Route path="/dashboard/tenant-users/new" element={<InviteTenantUserPage />} />
        <Route path="/dashboard/tenant-users/:userId" element={<TenantUserDetailsPage />} />
        <Route path="/dashboard/tenant-users/:userId/edit" element={<EditTenantUserPage />} />
        <Route path="/dashboard/requests" element={<Requests />} />
        <Route path="/dashboard/projects" element={<Project />} />
        <Route path="/dashboard/projects/create" element={<DashboardProjectCreate />} />
        <Route path="/dashboard/projects/create" element={<DashboardProjectCreate />} />
        <Route path="/dashboard/products" element={<Products />} />
        <Route
          path="/dashboard/admin-users"
          element={<Navigate to="/dashboard/clients?tab=users" replace />}
        />
        <Route path="/dashboard/projects/details" element={<ProjectDetails />} />
        <Route path="/dashboard/leads" element={<DashboardLeads />} />
        <Route path="/dashboard/leads/create" element={<DashboardLeadCreate />} />
        <Route path="/dashboard/leads/details" element={<DashboardLeadDetails />} />
        <Route path="/dashboard/object-storage" element={<DashboardObjectStorage />} />
        <Route path="/dashboard/object-storage/create" element={<TenantObjectStorageCreate />} />
        <Route
          path="/dashboard/object-storage/purchase"
          element={<TenantObjectStoragePurchase />}
        />
        <Route path="/tenant-dashboard/leads" element={<TenantLeads />} />
        <Route path="/tenant-dashboard/leads/details" element={<TenantLeadDetails />} />
        <Route path="/tenant-dashboard/onboarding" element={<TenantOnboardingOverview />} />
        <Route path="/tenant-dashboard/onboarding-review" element={<TenantOnboardingOverview />} />
        <Route path="/tenant-dashboard/region-requests" element={<RegionRequests />} />
        <Route path="/tenant-dashboard/region-requests/new" element={<NewRegionRequest />} />
        <Route path="/tenant-dashboard/region-requests/:id" element={<RegionRequestDetail />} />
        <Route path="/tenant-dashboard/revenue" element={<RevenueDashboard />} />
        <Route path="/tenant-dashboard/branding" element={<TenantBrandingSettings />} />
        <Route path="/tenant-dashboard/object-storage" element={<TenantObjectStorage />} />
        <Route path="/tenant-dashboard/discounts" element={<TenantDiscountManager />} />
        <Route path="/dashboard/account-settings" element={<Settings />} />
        <Route path="/dashboard/tax-configurations" element={<DashboardTaxConfigurations />} />
        <Route path="/dashboard/clients/overview" element={<ClientsOverview />} />
        <Route path="/dashboard/payment-history" element={<PaymentHistory />} />
        <Route path="/dashboard/support-ticket" element={<SupportTicket />} />
        <Route path="/dashboard/pricing-calculator" element={<TenantPricingCalculator />} />
        <Route path="/dashboard/create-invoice" element={<TenantCreateInvoice />} />
      </Route>
    </>
  );
};

export default TenantRoutes;
