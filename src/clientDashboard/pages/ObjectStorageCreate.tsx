// @ts-nocheck
import React, { useState } from "react";
import ClientActiveTab from "../components/clientActiveTab";
import Headbar from "../components/clientHeadbar";
import Sidebar from "../components/clientSidebar";
import ClientPageShell from "../components/ClientPageShell";
import { ObjectStorageCreateContent } from "../../shared/components/object-storage";
import useClientAuthStore from "../../stores/clientAuthStore";
import objectStorageApi from "../../services/objectStorageApi";

const ClientObjectStorageCreate: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const user = useClientAuthStore((state) => state?.user);
  const userId = user?.id ? String(user.id) : "";

  const toggleMobileMenu = () => setIsMobileMenuOpen((prev) => !prev);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <>
      <Headbar onMenuClick={toggleMobileMenu} />
      <Sidebar isMobileMenuOpen={isMobileMenuOpen} onCloseMobileMenu={closeMobileMenu} />
      <ClientActiveTab />
      <ClientPageShell
        title="Create Silo Storage"
        description="Configure and provision Silo Storage for your workspace"
      >
        <ObjectStorageCreateContent
          dashboardContext="client"
          config={{
            context: "client",
            userId,
            submitOrderFn: (payload) => objectStorageApi.createOrder(payload),
          }}
          enableFastTrack={false}
          showCustomerContext={false}
          showPriceOverride={false}
        />
      </ClientPageShell>
    </>
  );
};

export default ClientObjectStorageCreate;
