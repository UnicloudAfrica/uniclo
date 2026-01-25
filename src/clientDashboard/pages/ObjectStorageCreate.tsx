// @ts-nocheck
import React from "react";
import ClientActiveTab from "../components/clientActiveTab";
import ClientPageShell from "../components/ClientPageShell";
import { ObjectStorageCreateContent } from "../../shared/components/object-storage";
import objectStorageApi from "../../services/objectStorageApi";

const ClientObjectStorageCreate: React.FC = () => {
  return (
    <>
      <ClientActiveTab />
      <ClientPageShell
        title="Create Silo Storage"
        description="Configure and provision Silo Storage for your workspace"
      >
        <ObjectStorageCreateContent
          dashboardContext="client"
          config={{
            context: "client",
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
