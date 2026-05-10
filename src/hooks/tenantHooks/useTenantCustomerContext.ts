import { useEffect, useMemo, useState } from "react";
import useAuthStore from "@/stores/authStore";
import { useFetchTenantPartners, useFetchTenantPartnerClients } from "./partnerHooks";
import { useSharedClients } from "../sharedCalculatorHooks";

type TenantShape = {
  id?: string | number;
  identifier?: string;
  slug?: string;
  name?: string;
  company_name?: string;
  business?: { name?: string } | null;
  [key: string]: unknown;
};

type PartnerShape = {
  id?: string | number;
  identifier?: string;
  slug?: string;
  code?: string;
  name?: string;
  company_name?: string;
  business?: { name?: string } | null;
  [key: string]: unknown;
};

type TenantAuthShape = {
  tenant?: TenantShape | null;
  profile?: TenantShape | null;
  user?: { tenant_id?: string | number } | null;
  [key: string]: unknown;
};

export const useTenantCustomerContext = (options: { enabled?: boolean } = {}) => {
  const { enabled = true } = options;
  const tenantAuth = useAuthStore((state) => state) as unknown as TenantAuthShape | null;

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

  useEffect(() => {
    if (selfTenantId && !selectedTenantId) {
      setSelectedTenantId(String(selfTenantId));
    }
  }, [selfTenantId, selectedTenantId]);

  const partners = useMemo(
    () =>
      Array.isArray(partnerTenants)
        ? partnerTenants
        : Array.isArray((partnerTenants as Record<string, unknown>)?.data)
          ? ((partnerTenants as Record<string, unknown>).data as unknown[])
          : [],
    [partnerTenants]
  );

  const tenants = useMemo(() => {
    const list: Array<Record<string, unknown> & { id: string | number; identifier?: string; name?: string; is_self?: boolean }> = [];
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

    partners.forEach((partner) => {
      const p = partner as PartnerShape | null;
      const id = p?.id;
      if (!id) return;
      list.push({
        ...(p as Record<string, unknown>),
        id,
        identifier: p?.identifier || p?.slug || p?.code || String(id),
        name:
          p?.name ||
          p?.company_name ||
          p?.business?.name ||
          p?.identifier ||
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
    contextType === "user" ? ((selectedTenantId || null) as unknown as string) : null,
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
    if (Array.isArray((source as Record<string, unknown>)?.data))
      return (source as Record<string, unknown>).data as unknown[];
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
      // "Unassigned" means internal team use - assign to self tenant
      if (selfTenantId) {
        setSelectedTenantId(String(selfTenantId));
      }
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
      // "Unassigned" = internal team use, assign to self tenant
      if (selfTenantId) {
        setSelectedTenantId(String(selfTenantId));
      }
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
