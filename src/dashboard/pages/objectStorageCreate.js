import React from "react";
import { useNavigate } from "react-router-dom";
import TenantPageShell from "../components/TenantPageShell";
import ObjectStorageCreateLayout from "../../shared/components/objectStorage/ObjectStorageCreateLayout";

const ObjectStorageCreate = () => {
  const navigate = useNavigate();

  return (
    <TenantPageShell
      title="Provision Object Storage"
      description="Choose how you want to provision capacity for your tenant."
    >
      <ObjectStorageCreateLayout
        persona="tenant"
        enableFastTrack={false}
        onBack={() => navigate(-1)}
        onStandardPlan={() =>
          navigate("/dashboard/object-storage/purchase")
        }
      />
    </TenantPageShell>
  );
};

export default ObjectStorageCreate;
