import TenantPageShell from "../components/TenantPageShell";
import { ObjectStorageCreateContent } from "@/shared/components/object-storage";
import useAuthStore from "@/stores/authStore";
import objectStorageApi from "@/services/objectStorageApi";

const ObjectStorageCreate = () => {
  const tenant = useAuthStore((state) => state?.tenant);
  const tenantId = String(tenant?.id || tenant?.identifier || "");

  return (
    <TenantPageShell
      title="Create Silo Storage"
      description="Configure and provision Silo Storage for your workspace"
    >
      <ObjectStorageCreateContent
        dashboardContext="tenant"
        config={{
          context: "tenant",
          tenantId,
          submitOrderFn: (payload) => objectStorageApi.createOrder(payload),
        }}
        enableFastTrack={false}
        showCustomerContext={false}
        showPriceOverride={false}
      />
    </TenantPageShell>
  );
};

export default ObjectStorageCreate;
