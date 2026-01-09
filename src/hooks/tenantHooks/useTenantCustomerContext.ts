import { useEffect, useMemo, useState } from "react";
import useTenantAuthStore from "../../stores/tenantAuthStore";
import { useFetchTenantPartners, useFetchTenantPartnerClients } from "./partnerHooks";
import { useSharedClients } from "../sharedCalculatorHooks";

export const useTenantCustomerContext = (options: { enabled?: boolean } = {}) => {
  const { enabled = true } = options;
  const tenantAuth = useTenantAuthStore((state: any) => state);

  const selfTenant = tenantAuth?.tenant || tenantAuth?.profile || null;
  const selfTenantId = selfTenant?.id || tenantAuth?.user?.tenant_id || "";
  const selfTenantIdentifier = selfTenant?.identifier || selfTenant?.slug || "";

  const [contextType, setContextType] = useState("tenant");
  const [selectedTenantId, setSelectedTenantId] = useState(
    selfTenantId ? String(selfTenantId) : ""
  );
  const [selectedUserId, setSelectedUserId] = useState("");

  const { data: partnerTenants = [], isFetching: isTenantsFetching } = useFetchTenantPartners({
    enabled,
  });

  const partners = Array.isArray(partnerTenants)
    ? partnerTenants
    : Array.isArray((partnerTenants as any)?.data)
      ? (partnerTenants as any).data
      : [];

  const tenants = useMemo(() => {
    const list: any[] = [];
    if (selfTenantId) {
      list.push({
        id: selfTenantId,
        identifier: selfTenantIdentifier,
        name:
          selfTenant?.name ||
          selfTenant?.company_name ||
          selfTenant?.business?.name ||
          selfTenantIdentifier ||
          "My Tenant",
        is_self: true,
      });
    }

    partners.forEach((partner: any) => {
      const id = partner?.id;
      if (!id) return;
      list.push({
        ...partner,
        id,
        identifier: partner?.identifier || partner?.slug || partner?.code || id,
        name:
          partner?.name ||
          partner?.company_name ||
          partner?.business?.name ||
          partner?.identifier ||
          `Tenant ${id}`,
      });
    });

    const seen = new Set<string>();
    return list.filter((tenant) => {
      const key = String(tenant.id);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [partners, selfTenant, selfTenantId, selfTenantIdentifier]);

  const selectedTenant = useMemo(
    () => tenants.find((tenant) => String(tenant.id) === String(selectedTenantId)),
    [tenants, selectedTenantId]
  );

  const selectedTenantIdentifier = selectedTenant?.identifier || "";
  const isSelfSelected = selectedTenantId && String(selectedTenantId) === String(selfTenantId);

  const { data: sharedClients = [], isFetching: isSharedClientsFetching } = useSharedClients(
    contextType === "user" ? selectedTenantId || null : null,
    { enabled: enabled && contextType === "user" && (isSelfSelected || !selectedTenantIdentifier) }
  );

  const { data: partnerClients = [], isFetching: isPartnerClientsFetching } =
    useFetchTenantPartnerClients(selectedTenantIdentifier, {
      enabled:
        enabled && contextType === "user" && Boolean(selectedTenantIdentifier) && !isSelfSelected,
    });

  const userPool = useMemo(() => {
    if (contextType !== "user") return [];
    const source = !isSelfSelected && selectedTenantIdentifier ? partnerClients : sharedClients;
    if (Array.isArray(source)) return source;
    if (Array.isArray((source as any)?.data)) return (source as any).data;
    return [];
  }, [contextType, isSelfSelected, selectedTenantIdentifier, partnerClients, sharedClients]);

  const isUsersFetching =
    contextType === "user"
      ? isSelfSelected || !selectedTenantIdentifier
        ? isSharedClientsFetching
        : isPartnerClientsFetching
      : false;

  useEffect(() => {
    if (contextType === "unassigned") {
      setSelectedTenantId("");
      setSelectedUserId("");
      return;
    }

    if (!selectedTenantId && selfTenantId) {
      setSelectedTenantId(String(selfTenantId));
    }
  }, [contextType, selectedTenantId, selfTenantId]);

  const handleContextTypeChange = (type: string) => {
    setContextType(type);
    if (type === "unassigned") {
      setSelectedTenantId("");
      setSelectedUserId("");
      return;
    }
    if (type !== "user") {
      setSelectedUserId("");
    }
    if (!selectedTenantId && selfTenantId) {
      setSelectedTenantId(String(selfTenantId));
    }
  };

  const handleTenantChange = (tenantId: string) => {
    setSelectedTenantId(tenantId);
    setSelectedUserId("");
  };

  return {
    contextType,
    setContextType: handleContextTypeChange,
    selectedTenantId,
    setSelectedTenantId: handleTenantChange,
    selectedUserId,
    setSelectedUserId,
    tenants,
    isTenantsFetching,
    userPool,
    isUsersFetching,
    selectedTenant,
    selfTenant,
  };
};
