// @ts-nocheck
import React from "react";
import AdminPageShell from "../components/AdminPageShell";
import { ObjectStorageCreateContent } from "../../shared/components/object-storage";
import objectStorageApi from "../../services/objectStorageApi";

const AdminObjectStorageCreate: React.FC = () => {
  return (
    <>
      <AdminPageShell
        title="Create Silo Storage"
        description="Configure and provision Silo Storage for customers"
        contentClassName="space-y-8"
      >
        <ObjectStorageCreateContent
          dashboardContext="admin"
          config={{
            context: "admin",
            submitOrderFn: (payload) => objectStorageApi.createOrder(payload),
          }}
          showCustomerContext
          showPriceOverride
        />
      </AdminPageShell>
    </>
  );
};

export default AdminObjectStorageCreate;
