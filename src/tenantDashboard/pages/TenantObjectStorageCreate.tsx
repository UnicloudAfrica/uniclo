// @ts-nocheck
import React, { useState } from "react";
import HeaderBar from "../components/TenantHeadbar";
import Sidebar from "../components/TenantSidebar";
import DashboardPageShell from "../../shared/layouts/DashboardPageShell";
import { ObjectStorageCreateContent } from "../../shared/components/object-storage";
import useTenantAuthStore from "../../stores/tenantAuthStore";
import objectStorageApi from "../../services/objectStorageApi";

interface TenantObjectStorageCreateProps {
  tenantId?: string;
}

const TenantObjectStorageCreate: React.FC<TenantObjectStorageCreateProps> = ({
  tenantId: propTenantId,
}) => {
  const [activeTab, setActiveTab] = useState("silo storage");
  const tenantAuth = useTenantAuthStore((state) => state);
  const currentTenantId = propTenantId || tenantAuth?.tenant?.id || "";
  const tenantData = tenantAuth?.tenant || {
    name: "Tenant",
    logo: "",
    color: "#288DD1",
  };

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
        backgroundColor="var(--theme-surface-alt)"
        title="Create Silo Storage"
        description="Configure and provision Silo Storage for your workspace"
      >
        <ObjectStorageCreateContent
          dashboardContext="tenant"
          config={{
            context: "tenant",
            tenantId: currentTenantId,
            submitOrderFn: (payload) => objectStorageApi.createOrder(payload),
          }}
          enableFastTrack={false}
          showCustomerContext={false}
          showPriceOverride={false}
        />
      </DashboardPageShell>
    </>
  );
};

export default TenantObjectStorageCreate;
