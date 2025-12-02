import React from "react";
import { Route } from "react-router-dom";
import ClientDashboardLayout from "../clientDashboard/components/ClientDashboardLayout";
import ClientRoute from "./ClientRoute";
import ClientDashboard from "../clientDashboard/pages/clientDashboard";
import ClientProject from "../clientDashboard/pages/clientProjects";
import ClientProjectCreate from "../clientDashboard/pages/clientProjectCreate";
import ClientProjectDetails from "../clientDashboard/pages/clientProjectDetails";
import ClientInstances from "../clientDashboard/pages/clientInstances";
import ClientMultiInstanceCreation from "../clientDashboard/pages/clientMultiInstanceCreation";
import ObjectStoragePage from "../clientDashboard/pages/ObjectStoragePage";
import ClientObjectStoragePurchasePage from "../clientDashboard/pages/ObjectStoragePurchasePage";
import ClientObjectStorageCreate from "../clientDashboard/pages/ObjectStorageCreate";
import ClientPricingCalculator from "../clientDashboard/pages/ClientPricingCalculator";
import ClientPaymentHistory from "../clientDashboard/pages/clientTransaction";
import ClientSettings from "../clientDashboard/pages/clientAccountSettings";
import ClientSupport from "../clientDashboard/pages/clientSupport";

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
            <Route
                path="/client-dashboard/projects"
                element={<ClientProject />}
            />
            <Route
                path="/client-dashboard/projects/create"
                element={<ClientProjectCreate />}
            />
            <Route
                path="/client-dashboard/projects/details"
                element={<ClientProjectDetails />}
            />
            <Route
                path="/client-dashboard/instances"
                element={<ClientInstances />}
            />
            <Route
                path="/client-dashboard/multi-instance-creation"
                element={<ClientMultiInstanceCreation />}
            />
            <Route
                path="/client-dashboard/object-storage"
                element={<ObjectStoragePage />}
            />
            <Route
                path="/client-dashboard/object-storage/purchase"
                element={<ClientObjectStoragePurchasePage />}
            />
            <Route
                path="/client-dashboard/object-storage/create"
                element={<ClientObjectStorageCreate />}
            />
            <Route
                path="/client-dashboard/pricing-calculator"
                element={<ClientPricingCalculator />}
            />
            <Route
                path="/client-dashboard/orders-payments"
                element={<ClientPaymentHistory />}
            />
            <Route
                path="/client-dashboard/account-settings"
                element={<ClientSettings />}
            />
            <Route
                path="/client-dashboard/support"
                element={<ClientSupport />}
            />
        </Route>
    );
};

export default ClientRoutes;
