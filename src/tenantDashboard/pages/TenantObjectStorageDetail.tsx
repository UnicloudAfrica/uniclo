// @ts-nocheck
import React from "react";
import { useParams } from "react-router-dom";
import TenantPageShell from "../../dashboard/components/TenantPageShell";
import ObjectStorageAccountDetail from "../../shared/components/object-storage/ObjectStorageAccountDetail";

const TenantObjectStorageDetail = () => {
  const { accountId } = useParams();

  return (
    <TenantPageShell
      title="Object Storage"
      description="View account details, manage buckets, and browse files"
    >
      <ObjectStorageAccountDetail
        accountId={accountId}
        backUrl="/dashboard/object-storage"
        backLabel="Back to Object Storage"
        canDelete={true}
      />
    </TenantPageShell>
  );
};

export default TenantObjectStorageDetail;
