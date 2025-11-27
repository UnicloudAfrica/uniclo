import React from "react";
import { useNavigate } from "react-router-dom";
import ClientPageShell from "../components/ClientPageShell";
import ObjectStorageCreateLayout from "../../shared/components/objectStorage/ObjectStorageCreateLayout";

const ClientObjectStorageCreate = () => {
  const navigate = useNavigate();

  return (
    <ClientPageShell
      title="Provision Object Storage"
      description="Choose how you want to provision capacity for this account."
      breadcrumbs={[
        { label: "Home", href: "/client-dashboard" },
        { label: "Object Storage", href: "/client-dashboard/object-storage" },
        { label: "Provision" },
      ]}
    >
      <ObjectStorageCreateLayout
        persona="client"
        enableFastTrack={false}
        onBack={() => navigate(-1)}
        onStandardPlan={() =>
          navigate("/client-dashboard/object-storage/purchase")
        }
      />
    </ClientPageShell>
  );
};

export default ClientObjectStorageCreate;
