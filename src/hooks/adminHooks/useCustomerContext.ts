import { useState, useMemo } from "react";
import { useFetchTenants } from "./tenantHooks";
import { useFetchClients } from "./clientHooks";
import { useSharedClients } from "../sharedCalculatorHooks";

type CustomerUser = {
  id: string | number;
  first_name?: string;
  last_name?: string;
  email?: string;
  name?: string;
  company_name?: string;
  business_name?: string;
  tenant_id?: string | number | null;
  [key: string]: unknown;
};

type CustomerContextType = "unassigned" | "tenant" | "user";

export const useCustomerContext = (options: Record<string, unknown> = {}) => {
  const { enabled = true } = options;
  const [contextType, setContextType] = useState<CustomerContextType>("unassigned");
  const [selectedTenantId, setSelectedTenantId] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");

  // Fetch data
  const { data: tenants = [], isFetching: isTenantsFetching } = useFetchTenants({
    enabled: enabled,
  }) as never;

  // Fetch all admin clients (direct users)
  const { data: adminClientsData = [], isFetching: isAdminClientsFetching } = useFetchClients({
    enabled: enabled,
  }) as never;
  const adminClients = useMemo<CustomerUser[]>(
    () => (Array.isArray(adminClientsData) ? adminClientsData : []),
    [adminClientsData]
  );

  // Fetch tenant clients (sub-users) if a tenant is selected
  const { data: tenantClientsData = [], isFetching: isTenantClientsFetching } = useSharedClients(
    selectedTenantId || null,
    {
      enabled: enabled && !!selectedTenantId,
    }
  ) as never;
  const tenantClients = useMemo<CustomerUser[]>(
    () => (Array.isArray(tenantClientsData) ? tenantClientsData : []),
    [tenantClientsData]
  );

  // Determine which user pool to show
  const userPool = useMemo<CustomerUser[]>(() => {
    if (contextType !== "user") return [];

    if (selectedTenantId) {
      // If tenant is selected, show only that tenant's users
      return tenantClients;
    } else {
      // If no tenant selected, show users WITHOUT a tenant_id (direct users)
      return adminClients.filter((user: CustomerUser) => !user.tenant_id);
    }
  }, [contextType, selectedTenantId, tenantClients, adminClients]);

  const isUsersFetching = selectedTenantId ? isTenantClientsFetching : isAdminClientsFetching;

  // Reset dependent fields when context changes
  const handleContextTypeChange = (type: CustomerContextType) => {
    setContextType(type);
    if (type === "unassigned") {
      setSelectedTenantId("");
      setSelectedUserId("");
    } else if (type === "tenant") {
      setSelectedUserId("");
    } else if (type === "user") {
      // Keep tenant selection if switching from tenant to user, but clear user
      // If switching from unassigned to user, clear everything
      if (contextType === "unassigned") {
        setSelectedTenantId("");
      }
      setSelectedUserId("");
    }
  };

  const handleTenantChange = (tenantId: string) => {
    setSelectedTenantId(tenantId);
    // If we are in 'user' mode, clearing tenant should reset user selection too
    // But if we change tenant, we definitely need to reset user selection as the pool changes
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
  };
};
