import { useState, useEffect, useMemo, useRef } from "react";
import { Option, resolveCountryCodeFromEntity } from "../objectStorageUtils";
import { COUNTRY_FALLBACK, matchCountryFromOptions } from "../../shared/utils/countryUtils";
import { useCustomerContext } from "../adminHooks/useCustomerContext";
import { useFetchClientById } from "../adminHooks/clientHooks";
import { useFetchTenantById } from "../adminHooks/tenantHooks";
import { useFetchClientProfile } from "../clientHooks/resources";
import { useFetchTenantBillingSettings, useFetchTenantBusinessSettings } from "../settingsHooks";
import { useFetchProfile } from "../resource";
import useTenantAuthStore from "../../stores/tenantAuthStore";
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
  const appliedCountryRef = useRef("");
  const appliedSelectionKeyRef = useRef("");

  // Customer Context - admin uses shared hook, tenant/client use local state
  const isAdminContext = context === "admin";
  const adminContext = useCustomerContext({ enabled: isAdminContext });

  const defaultContextType =
    context === "tenant" ? "tenant" : context === "client" ? "user" : "unassigned";

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
  const { data: tenantBillingSettings } = useFetchTenantBillingSettings({
    enabled: context === "tenant",
  });
  // Fresh profile from API (has country field)
  const { data: tenantProfile } = useFetchProfile({
    enabled: context === "tenant",
  });
  const { data: selectedTenantDetails } = useFetchTenantById(selectedTenantId, {
    enabled: isAdminContext && !!selectedTenantId,
  });
  const { data: selectedClientDetails } = useFetchClientById(selectedUserId, {
    enabled: isAdminContext && !!selectedUserId,
  });
  // Tenant/user objects from auth store for country resolution
  const selfTenant = useTenantAuthStore((state: { tenant?: unknown; profile?: unknown }) => {
    return state?.tenant || state?.profile;
  });
  const authProfile = useTenantAuthStore((state: { profile?: unknown }) => state?.profile);
  const authUser = useTenantAuthStore((state: { user?: unknown }) => state?.user);

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

  const selectedTenantEntry = useMemo(
    () => tenantOptions.find((tenant) => String(tenant.value) === String(selectedTenantId)),
    [selectedTenantId, tenantOptions]
  );

  const selectedClientEntry = useMemo(
    () => clientOptions.find((client) => String(client.value) === String(selectedUserId)),
    [selectedUserId, clientOptions]
  );

  const resolvedCountryOptions = countryOptions.length > 0 ? countryOptions : COUNTRY_FALLBACK;

  const resolvedBillingCountry = useMemo(() => {
    const resolveFromSources = (...sources: unknown[]) => {
      for (const source of sources) {
        const code = resolveCountryCodeFromEntity(source, resolvedCountryOptions);
        if (code) {
          return code;
        }
      }
      return "";
    };

    if (context === "tenant") {
      const tenantCountry = resolveFromSources(
        selfTenant,
        authProfile,
        tenantProfile,
        authUser
      );

      if (tenantCountry) {
        return tenantCountry;
      }

      const tenantSettingsCountry = resolveFromSources(
        tenantBillingSettings,
        tenantSettings
      );

      if (tenantSettingsCountry) {
        return tenantSettingsCountry;
      }

      if (authUser) {
        const raw = authUser as Record<string, unknown>;
        return matchCountryFromOptions(
          raw.country || raw.country_code || raw.countryCode,
          resolvedCountryOptions
        );
      }

      return "";
    }

    if (context === "client") {
      return resolveFromSources(clientProfile, authUser);
    }

    if (contextType === "tenant" && selectedTenantId) {
      return resolveFromSources(selectedTenantDetails, selectedTenantEntry?.raw);
    }

    if (contextType === "user" && selectedUserId) {
      return resolveFromSources(
        selectedClientDetails,
        selectedClientEntry?.raw,
        selectedTenantDetails,
        selectedTenantEntry?.raw
      );
    }

    return "";
  }, [
    authUser,
    clientProfile,
    context,
    contextType,
    resolvedCountryOptions,
    selectedClientDetails,
    selectedClientEntry,
    selectedTenantDetails,
    selectedTenantEntry,
    selectedTenantId,
    selectedUserId,
    selfTenant,
    authProfile,
    tenantBillingSettings,
    tenantProfile,
    tenantSettings,
  ]);

  const selectionKey = useMemo(() => {
    if (context === "tenant") {
      return `tenant:self:${configTenantId || "current"}`;
    }
    if (context === "client") {
      return `client:self:${configUserId || "current"}`;
    }
    return `${contextType}:${selectedTenantId || "none"}:${selectedUserId || "none"}`;
  }, [configTenantId, configUserId, context, contextType, selectedTenantId, selectedUserId]);

  useEffect(() => {
    setIsCountryLocked(context !== "admin" && !!resolvedBillingCountry);
  }, [context, resolvedBillingCountry, setIsCountryLocked]);

  useEffect(() => {
    if (resolvedBillingCountry) {
      return;
    }

    appliedSelectionKeyRef.current = selectionKey;
    appliedCountryRef.current = "";
  }, [resolvedBillingCountry, selectionKey]);

  useEffect(() => {
    if (!resolvedBillingCountry) {
      return;
    }

    setFormData((prev) => {
      const currentCountry = String(prev.countryCode || "").trim().toUpperCase();
      const hasSelectionChanged = appliedSelectionKeyRef.current !== selectionKey;
      const shouldApplyDefault =
        hasSelectionChanged ||
        !currentCountry ||
        currentCountry === appliedCountryRef.current;

      appliedSelectionKeyRef.current = selectionKey;
      appliedCountryRef.current = resolvedBillingCountry;

      if (!shouldApplyDefault || currentCountry === resolvedBillingCountry) {
        return prev;
      }

      return { ...prev, countryCode: resolvedBillingCountry };
    });
  }, [resolvedBillingCountry, selectionKey, setFormData]);

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
