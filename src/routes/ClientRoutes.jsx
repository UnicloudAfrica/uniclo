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
import ClientObjectStorageDetail from "../clientDashboard/pages/ClientObjectStorageDetail";
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
      <Route
        path="/client-dashboard/object-storage/:accountId"
        element={<ClientObjectStorageDetail />}
      />

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
      <Route path="/client-dashboard/orders-payments" element={<ClientPaymentHistory />} />
      <Route path="/client-dashboard/billing" element={<ClientBillingPage />} />
      <Route path="/client-dashboard/account-settings" element={<ClientSettings />} />
      <Route path="/client-dashboard/support" element={<ClientSupport />} />
    </Route>
  );
};

export default ClientRoutes;
