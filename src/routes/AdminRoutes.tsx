import React from "react";
import { Route } from "react-router-dom";
import AdminDashboard from "../adminDashboard/pages/AdminDashboard";
import AdminPartners from "../adminDashboard/pages/AdminPartners";
import AdminPartnerCreate from "../adminDashboard/pages/AdminPartnerCreate";
import AdminPartnerDetails from "../adminDashboard/pages/AdminPartnerDetails";
import AdminClients from "../adminDashboard/pages/AdminClients";
import AdminClientCreate from "../adminDashboard/pages/AdminClientCreate";
import AdminClientDetails from "../adminDashboard/pages/AdminClientDetails";
import AdminModules from "../adminDashboard/pages/adminModules";
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
import AdminKeyPairs from "../adminDashboard/pages/adminKeyPairs";
import AdminPricing from "../adminDashboard/pages/adminPricing";
import AdminProducts from "../adminDashboard/pages/AdminProducts";
import AdminProductCreate from "../adminDashboard/pages/AdminProductCreate";
import AdminMultiQuote from "../adminDashboard/pages/adminMultiQuote";
import CreateInvoice from "../adminDashboard/pages/CreateInvoice";
import AdminAdvancedCalculator from "../adminDashboard/pages/adminAdvancedCalculator";
import AdminPricingCalculator from "../adminDashboard/pages/AdminPricingCalculator";
import AdminInfrastructureSetup from "../adminDashboard/pages/adminInfrastructureSetup";
import AdminObjectStorage from "../adminDashboard/pages/adminObjectStorage";
import AdminObjectStorageCreate from "../adminDashboard/pages/adminObjectStorageCreate";
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
import RegionCredentials from "../adminDashboard/pages/RegionCredentials";
import AdminSubscriptionPlans from "../adminDashboard/pages/AdminSubscriptionPlans";
import WalletDashboard from "../adminDashboard/pages/WalletDashboard";
import SettlementsDashboard from "../adminDashboard/pages/SettlementsDashboard";
import PayoutsDashboard from "../adminDashboard/pages/PayoutsDashboard";
import AnalyticsDashboard from "../adminDashboard/pages/AnalyticsDashboard";
import TicketsDashboard from "../adminDashboard/pages/TicketsDashboard";

const AdminRoutes = (): React.JSX.Element => {
  return (
    <>
      <Route path="/admin-signin" element={<AdminLogin />} />
      <Route path="/verify-admin-mail" element={<VerifyAdminMail />} />
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
      <Route path="/admin-dashboard/modules" element={<AdminModules />} />
      <Route path="/admin-dashboard/purchased-modules" element={<AdminPurchasedModules />} />
      <Route path="/admin-dashboard/payment" element={<AdminPayment />} />
      <Route path="/admin-dashboard/payment/:transactionId" element={<AdminPaymentDetails />} />
      <Route path="/admin-dashboard/products" element={<AdminProducts />} />
      <Route path="/admin-dashboard/products/add" element={<AdminProductCreate />} />
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
      <Route path="/admin-dashboard/regions/:id/credentials" element={<RegionCredentials />} />
      <Route path="/admin-dashboard/region-approvals" element={<RegionApprovals />} />
      <Route path="/admin-dashboard/onboarding-review" element={<AdminOnboardingReview />} />
      <Route path="/admin-dashboard/onboarding-settings" element={<AdminOnboardingSettings />} />
      <Route path="/admin-dashboard/region-approvals/create" element={<RegionApprovalCreate />} />
      <Route path="/admin-dashboard/region-approvals/:id" element={<RegionApprovalDetail />} />
      <Route path="/admin-dashboard/region-approvals/:id/edit" element={<RegionApprovalEdit />} />
      <Route path="/admin-dashboard/leads/details" element={<AdminLeadDetails />} />
      <Route path="/admin-dashboard/projects/details" element={<AdminProjectDetails />} />
      <Route path="/admin-dashboard/infrastructure-setup" element={<AdminInfrastructureSetup />} />

      <Route path="/admin-dashboard/create-instance" element={<AdminCreateInstance />} />
      <Route path="/admin-dashboard/key-pairs" element={<AdminKeyPairs />} />
      <Route path="/admin-dashboard/pricing" element={<AdminPricing />} />

      <Route path="/admin-dashboard/pricing-calculator" element={<AdminPricingCalculator />} />
      <Route path="/admin-dashboard/create-invoice" element={<CreateInvoice />} />

      <Route path="/admin-dashboard/profile-settings" element={<EnhancedProfileSettings />} />
      <Route path="/admin-dashboard/instances" element={<AdminInstances />} />
      <Route path="/admin-dashboard/instances/details" element={<AdminInstancesDetails />} />
      <Route path="/admin-dashboard/object-storage" element={<AdminObjectStorage />} />
      <Route path="/admin-dashboard/object-storage/create" element={<AdminObjectStorageCreate />} />
      <Route path="/admin-dashboard/tax-configuration" element={<AdminTax />} />
      <Route path="/admin-dashboard/subscription-plans" element={<AdminSubscriptionPlans />} />
      <Route path="/admin-dashboard/wallet" element={<WalletDashboard />} />
      <Route path="/admin-dashboard/settlements" element={<SettlementsDashboard />} />
      <Route path="/admin-dashboard/payouts" element={<PayoutsDashboard />} />
      <Route path="/admin-dashboard/analytics" element={<AnalyticsDashboard />} />
      <Route path="/admin-dashboard/tickets" element={<TicketsDashboard />} />
    </>
  );
};

export default AdminRoutes;
