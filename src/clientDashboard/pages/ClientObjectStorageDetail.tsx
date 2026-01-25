// @ts-nocheck
import React from "react";
import { useParams } from "react-router-dom";
import ClientActiveTab from "../components/clientActiveTab";
import ClientPageShell from "../components/ClientPageShell";
import ObjectStorageAccountDetail from "../../shared/components/object-storage/ObjectStorageAccountDetail";

const ClientObjectStorageDetail = () => {
  const { accountId } = useParams();

  return (
    <>
      <ClientActiveTab />
      <ClientPageShell
        title="Silo Storage"
        description="View account details, manage silos, and browse files"
        breadcrumbs={[
          { label: "Home", href: "/client-dashboard" },
          { label: "Silo Storage", href: "/client-dashboard/object-storage" },
          { label: "Details" },
        ]}
      >
        <ObjectStorageAccountDetail
          accountId={accountId}
          backUrl="/client-dashboard/object-storage"
          backLabel="Back to Silo Storage"
          canDelete={true}
        />
      </ClientPageShell>
    </>
  );
};

export default ClientObjectStorageDetail;
