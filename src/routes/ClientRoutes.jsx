import React from "react";
import { Route } from "react-router-dom";
import ClientDashboardLayout from "../clientDashboard/components/ClientDashboardLayout";
import ClientRoute from "./ClientRoute";
import ClientDashboard from "../clientDashboard/pages/ClientDashboard";
import ClientProject from "../clientDashboard/pages/ClientProjects";
import ClientProjectCreate from "../clientDashboard/pages/ClientProjectCreate";
import ClientProjectDetails from "../clientDashboard/pages/ClientProjectDetails";
import ClientInstances from "../clientDashboard/pages/ClientInstances";
import ClientAddInstancePage from "../clientDashboard/pages/ClientAddInstances";
import ClientProvisioningWizard from "../clientDashboard/pages/ClientProvisioningWizard";

import ClientLaunch from "../clientDashboard/pages/ClientLaunch";
import ObjectStoragePage from "../clientDashboard/pages/ObjectStoragePage";
import ClientObjectStoragePurchasePage from "../clientDashboard/pages/ObjectStoragePurchasePage";
import ClientObjectStorageCreate from "../clientDashboard/pages/ObjectStorageCreate";
import ClientPricingCalculator from "../clientDashboard/pages/ClientPricingCalculator";
import ClientPaymentHistory from "../clientDashboard/pages/ClientTransaction";
import ClientSettings from "../clientDashboard/pages/ClientAccountSettings";
import ClientSupport from "../clientDashboard/pages/ClientSupport";
import ClientBillingPage from "../clientDashboard/pages/ClientBillingPage";

const ClientRoutes = () => {
  return (
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
      <Route path="/client-dashboard/instances" element={<ClientInstances />} />
      <Route path="/client-dashboard/instances/create" element={<ClientAddInstancePage />} />
      <Route path="/client-dashboard/create-instance" element={<ClientProvisioningWizard />} />

      <Route path="/client-dashboard/launch" element={<ClientLaunch />} />
      <Route path="/client-dashboard/object-storage" element={<ObjectStoragePage />} />
      <Route
        path="/client-dashboard/object-storage/purchase"
        element={<ClientObjectStoragePurchasePage />}
      />
      <Route
        path="/client-dashboard/object-storage/create"
        element={<ClientObjectStorageCreate />}
      />
      <Route path="/client-dashboard/pricing-calculator" element={<ClientPricingCalculator />} />
      <Route path="/client-dashboard/orders-payments" element={<ClientPaymentHistory />} />
      <Route path="/client-dashboard/billing" element={<ClientBillingPage />} />
      <Route path="/client-dashboard/account-settings" element={<ClientSettings />} />
      <Route path="/client-dashboard/support" element={<ClientSupport />} />
    </Route>
  );
};

export default ClientRoutes;
