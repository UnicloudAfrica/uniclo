// @ts-nocheck
import React from "react";
import { useParams } from "react-router-dom";
import TenantPageShell from "../../dashboard/components/TenantPageShell";
import ObjectStorageAccountDetail from "../../shared/components/object-storage/ObjectStorageAccountDetail";

const TenantObjectStorageDetail = () => {
  const { accountId } = useParams();

  return (
    <TenantPageShell
      title="Silo Storage"
      description="View account details, manage silos, and browse files"
    >
      <ObjectStorageAccountDetail
        accountId={accountId}
        backUrl="/dashboard/object-storage"
        backLabel="Back to Silo Storage"
        canDelete={true}
      />
    </TenantPageShell>
  );
};

export default TenantObjectStorageDetail;
