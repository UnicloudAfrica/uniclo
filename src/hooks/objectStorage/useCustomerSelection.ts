import { useState, useEffect, useMemo } from "react";
import { Option, resolveCountryCodeFromEntity } from "../objectStorageUtils";
import { useCustomerContext } from "../adminHooks/useCustomerContext";
import { useFetchClientProfile } from "../clientHooks/resources";
import { useFetchTenantBusinessSettings } from "../settingsHooks";
import type { ObjectStorageContext } from "./types";
import { isRecord, resolveOptionValue, resolveString } from "./utils";

export interface UseCustomerSelectionOptions {
  context: ObjectStorageContext;
  configTenantId?: string;
  configUserId?: string;
  countryOptions: Option[];
  setFormData: React.Dispatch<React.SetStateAction<{ countryCode: string }>>;
  setIsCountryLocked: (locked: boolean) => void;
}

export interface UseCustomerSelectionReturn {
  contextType: string;
  setContextType: (type: string) => void;
  selectedTenantId: string;
  setSelectedTenantId: (id: string) => void;
  selectedUserId: string;
  setSelectedUserId: (id: string) => void;
  tenantOptions: Option[];
  clientOptions: Option[];
  isTenantsFetching: boolean;
  isUsersFetching: boolean;
  assignmentLabel: string;
}

export const useCustomerSelection = (
  options: UseCustomerSelectionOptions
): UseCustomerSelectionReturn => {
  const { context, configTenantId, configUserId, countryOptions, setFormData, setIsCountryLocked } =
    options;

  // Customer Context - admin uses shared hook, tenant/client use local state
  const isAdminContext = context === "admin";
  const adminContext = useCustomerContext({ enabled: isAdminContext });

  const defaultContextType =
    context === "tenant" ? "tenant" : context === "client" ? "user" : "tenant";

  const [localContextType, setLocalContextType] = useState(defaultContextType);
  const [localTenantId, setLocalTenantId] = useState(configTenantId || "");
  const [localUserId, setLocalUserId] = useState(configUserId || "");

  useEffect(() => {
    if (!isAdminContext) {
      setLocalContextType(defaultContextType);
    }
  }, [defaultContextType, isAdminContext]);

  useEffect(() => {
    if (!isAdminContext) {
      setLocalTenantId(configTenantId || "");
    }
  }, [configTenantId, isAdminContext]);

  useEffect(() => {
    if (!isAdminContext) {
      setLocalUserId(configUserId || "");
    }
  }, [configUserId, isAdminContext]);

  const contextType = isAdminContext ? adminContext.contextType : localContextType;
  const setContextType = isAdminContext ? adminContext.setContextType : setLocalContextType;

  const selectedTenantId = isAdminContext
    ? configTenantId || adminContext.selectedTenantId
    : localTenantId;
  const setSelectedTenantId = isAdminContext ? adminContext.setSelectedTenantId : setLocalTenantId;

  const selectedUserId = isAdminContext ? configUserId || adminContext.selectedUserId : localUserId;
  const setSelectedUserId = isAdminContext ? adminContext.setSelectedUserId : setLocalUserId;

  const tenants = useMemo(
    () => (isAdminContext ? adminContext.tenants : []),
    [isAdminContext, adminContext.tenants]
  );
  const isTenantsFetching = isAdminContext ? adminContext.isTenantsFetching : false;
  const userPool = useMemo(
    () => (isAdminContext ? adminContext.userPool : []),
    [isAdminContext, adminContext.userPool]
  );
  const isUsersFetching = isAdminContext ? adminContext.isUsersFetching : false;

  // Client/Tenant Profile Fetching for Country Lock
  const { data: clientProfile } = useFetchClientProfile({
    enabled: context === "client",
  });
  const { data: tenantSettings } = useFetchTenantBusinessSettings({
    enabled: context === "tenant",
  });

  // Tenant/Client Options
  const tenantOptions = useMemo(() => {
    if (!Array.isArray(tenants)) return [];
    return tenants
      .map((tenant) => {
        if (!isRecord(tenant)) return null;
        const value = resolveOptionValue(
          tenant.id ?? tenant.identifier ?? tenant.code ?? tenant.slug
        );
        if (!value) {
          return null;
        }
        const label = resolveString(
          tenant.name ||
            tenant.company_name ||
            tenant.identifier ||
            tenant.code ||
            `Tenant ${value}`
        );
        return {
          value,
          label,
          raw: tenant,
        };
      })
      .filter(Boolean) as Option[];
  }, [tenants]);

  const clientOptions = useMemo(() => {
    if (!Array.isArray(userPool)) return [];
    return userPool
      .map((client) => {
        if (!isRecord(client)) return null;
        const tenantId =
          client.tenant_id ??
          client.tenantId ??
          (isRecord(client.tenant) ? client.tenant.id : undefined) ??
          client.tenant_identifier ??
          client.tenant_code ??
          "";
        const rawClientId = client.id ?? client.identifier ?? client.uuid ?? "";
        const value = resolveOptionValue(rawClientId);
        if (!value) {
          return null;
        }
        const label = resolveString(
          client.company_name ||
            client.business_name ||
            client.full_name ||
            client.email ||
            `Client ${value}`
        );
        return {
          value,
          label,
          tenantId: tenantId ? String(tenantId) : "",
          raw: client,
        };
      })
      .filter(Boolean) as Option[];
  }, [userPool]);

  // Assignment Label
  const assignmentLabel = useMemo(() => {
    if (contextType === "tenant") {
      const match = tenantOptions.find((t) => String(t.value) === String(selectedTenantId));
      return match?.label || "Tenant order";
    }
    if (contextType === "user") {
      const match = clientOptions.find((c) => String(c.value) === String(selectedUserId));
      return match?.label || "Client order";
    }
    return "Internal order";
  }, [contextType, selectedTenantId, selectedUserId, tenantOptions, clientOptions]);

  // Country auto-lock based on tenant/user selection
  useEffect(() => {
    if (context !== "admin" && context !== "tenant" && context !== "client") {
      return;
    }

    if (contextType === "tenant" && selectedTenantId) {
      const tenantEntry = tenantOptions.find((t) => t.value === String(selectedTenantId));
      const tenantCountry = resolveCountryCodeFromEntity(tenantEntry?.raw, countryOptions);
      if (tenantCountry) {
        setIsCountryLocked(true);
        setFormData((prev) => ({ ...prev, countryCode: tenantCountry }));
      } else {
        setIsCountryLocked(false);
      }
    } else if (contextType === "user" && selectedUserId) {
      const clientEntry = clientOptions.find((c) => c.value === String(selectedUserId));
      const clientCountry = resolveCountryCodeFromEntity(clientEntry?.raw, countryOptions);
      if (clientCountry) {
        setIsCountryLocked(true);
        setFormData((prev) => ({ ...prev, countryCode: clientCountry }));
      } else {
        setIsCountryLocked(false);
      }
      const tenantCountry = resolveCountryCodeFromEntity(tenantSettings, countryOptions);
      if (tenantCountry) {
        setIsCountryLocked(true);
        setFormData((prev) => ({ ...prev, countryCode: tenantCountry }));
      } else {
        setIsCountryLocked(false);
      }
      return;
    } else if (context === "client") {
      const clientCountry = resolveCountryCodeFromEntity(clientProfile, countryOptions);
      if (clientCountry) {
        setIsCountryLocked(true);
        setFormData((prev) => ({ ...prev, countryCode: clientCountry }));
      } else {
        setIsCountryLocked(false);
      }
      return;
    } else {
      setIsCountryLocked(false);
    }
  }, [
    context,
    contextType,
    selectedTenantId,
    selectedUserId,
    tenantOptions,
    clientOptions,
    countryOptions,
    clientProfile,
    tenantSettings,
    setFormData,
    setIsCountryLocked,
  ]);

  return {
    contextType,
    setContextType,
    selectedTenantId,
    setSelectedTenantId,
    selectedUserId,
    setSelectedUserId,
    tenantOptions,
    clientOptions,
    isTenantsFetching,
    isUsersFetching,
    assignmentLabel,
  };
};
