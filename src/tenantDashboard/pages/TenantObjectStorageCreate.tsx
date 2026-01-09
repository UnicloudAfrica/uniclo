// @ts-nocheck
import React, { useState } from "react";
import HeaderBar from "../components/TenantHeadbar";
import Sidebar from "../components/TenantSidebar";
import DashboardPageShell from "../../shared/layouts/DashboardPageShell";
import { ObjectStorageCreateContent } from "../../shared/components/object-storage";
import useTenantAuthStore from "../../stores/tenantAuthStore";

// Tenant-specific submit function placeholder
const createTenantSubmitOrder = (tenantId: string) => async (payload: any) => {
  // TODO: Implement actual tenant API call
  console.log("Submitting tenant order:", payload);
  return { success: true };
};

interface TenantObjectStorageCreateProps {
  tenantId?: string;
}

/**
 * Tenant Object Storage Create Page
 *
 * Uses the shared ObjectStorageCreateContent component wrapped
 * in the tenant dashboard layout.
 */
const TenantObjectStorageCreate: React.FC<TenantObjectStorageCreateProps> = ({
  tenantId: propTenantId,
}) => {
  const [activeTab, setActiveTab] = useState("object storage");

  // Get tenant auth
  const tenantAuth = useTenantAuthStore((state) => state);
  const currentTenantId = propTenantId || tenantAuth?.tenant?.id || "";
  const tenantData = tenantAuth?.tenant || {
    name: "Tenant",
    logo: "",
    color: "#288DD1",
  };

  // Mobile menu handler for headerbar
  const handleMenuClick = () => {
    // The sidebar manages its own mobile menu state internally
  };

  return (
    <>
      <HeaderBar tenantData={tenantData} onMenuClick={handleMenuClick} />
      <Sidebar tenantData={tenantData} activeTab={activeTab} setActiveTab={setActiveTab} />
      <DashboardPageShell
        homeHref="/tenant-dashboard"
        mainClassName="tenant-dashboard-shell"
        backgroundColor="#F9FAFB"
        title="Create Object Storage"
      >
        <ObjectStorageCreateContent
          dashboardContext="tenant"
          config={{
            context: "tenant",
            tenantId: currentTenantId,
            submitOrderFn: createTenantSubmitOrder(currentTenantId),
          }}
          showCustomerContext={false}
          showPriceOverride={false}
        />
      </DashboardPageShell>
    </>
  );
};

export default TenantObjectStorageCreate;
