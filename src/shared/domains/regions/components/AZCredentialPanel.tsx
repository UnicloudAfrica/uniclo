/**
 * AZ Credential Panel
 * Inline credential management for an existing availability zone.
 * Used in the Region Edit page — fetches service schemas, loads current status,
 * and allows storing/verifying/deleting credentials per service.
 */
import React, { useState, useEffect, useCallback, useRef } from "react";
import { Loader2, AlertCircle, KeyRound, Wifi, WifiOff, Trash2 } from "lucide-react";
import { ModernButton } from "@/shared/components/ui";
import ServiceConfigCard from "./ServiceConfigCard";
import adminRegionApi from "@/services/adminRegionApi";
import type { ServiceDefinition, ServiceConfigState, ProviderServicesSchema } from "../types/serviceConfig.types";
import type { AvailabilityZone } from "@/shared/types/resource";
import ToastUtils from "@/utils/toastUtil";
import logger from "@/utils/logger";

export interface AZCredentialPanelProps {
  regionCode: string;
  az: AvailabilityZone;
}

/** Filter services by provider */
const PROVIDER_SERVICE_MAP: Record<string, string[]> = {
  zadara: ["compute", "object_storage"],
  nobus: ["compute", "object_storage"],
};

const filterServices = (
  all: Record<string, ServiceDefinition>,
  provider: string
): Record<string, ServiceDefinition> => {
  const allowed = PROVIDER_SERVICE_MAP[provider?.toLowerCase()];
  if (allowed) {
    return Object.fromEntries(Object.entries(all).filter(([key]) => allowed.includes(key)));
  }
  return all;
};

/** Provider schema cache shared across panels */
const schemaCache: Record<string, ProviderServicesSchema> = {};

const AZCredentialPanel: React.FC<AZCredentialPanelProps> = ({ regionCode, az }) => {
  const [loading, setLoading] = useState(true);
  const [schema, setSchema] = useState<ProviderServicesSchema | null>(null);
  const [serviceConfigs, setServiceConfigs] = useState<Record<string, ServiceConfigState>>({});
  const [connectedServices, setConnectedServices] = useState<Set<string>>(new Set());
  const [testingService, setTestingService] = useState<Record<string, boolean>>({});
  const [savingService, setSavingService] = useState<Record<string, boolean>>({});
  const [deletingService, setDeletingService] = useState<Record<string, boolean>>({});
  const mountedRef = useRef(true);

  // Load provider schema + current credential status
  useEffect(() => {
    mountedRef.current = true;
    const load = async () => {
      setLoading(true);
      try {
        // Fetch provider services schema
        let providerSchema = schemaCache[az.provider];
        if (!providerSchema) {
          const res = await adminRegionApi.getProviderServices(az.provider);
          if (res.success && res.data) {
            const raw = res.data as any;
            const servicesMap = raw?.services || raw || {};
            const services: Record<string, ServiceDefinition> = {};
            for (const [serviceType, svcConfig] of Object.entries(servicesMap as Record<string, any>)) {
              const fields: Record<string, any> = {};
              const rawFields = svcConfig?.fields || {};
              if (Array.isArray(rawFields)) {
                rawFields.forEach((f: any) => {
                  fields[f.name] = {
                    label: f.label,
                    type: f.type,
                    required: f.required,
                    ...(f.placeholder ? { placeholder: f.placeholder } : {}),
                    ...(f.description || f.help ? { help: f.description || f.help } : {}),
                  };
                });
              } else {
                for (const [fieldName, fieldDef] of Object.entries(rawFields as Record<string, any>)) {
                  fields[fieldName] = {
                    label: fieldDef.label || fieldName,
                    type: fieldDef.type,
                    required: fieldDef.required ?? true,
                    ...(fieldDef.placeholder ? { placeholder: fieldDef.placeholder } : {}),
                    ...(fieldDef.help ? { help: fieldDef.help } : {}),
                  };
                }
              }
              services[serviceType] = {
                label: svcConfig?.label || serviceType,
                fields,
                ...(svcConfig?.description ? { description: svcConfig.description } : {}),
              };
            }
            providerSchema = { services };
            schemaCache[az.provider] = providerSchema;
          }
        }

        if (!mountedRef.current) return;
        setSchema(providerSchema || null);

        // Fetch current credential status
        try {
          const statusRes = await adminRegionApi.getAZCredentialStatus(regionCode, az.code);
          if (!mountedRef.current) return;
          if (statusRes.success && statusRes.data) {
            const statusList = Array.isArray(statusRes.data) ? statusRes.data : [];
            const configs: Record<string, ServiceConfigState> = {};
            const connected = new Set<string>();

            // Initialize all services from schema
            const services = providerSchema ? filterServices(providerSchema.services || {}, az.provider) : {};
            for (const serviceType of Object.keys(services)) {
              configs[serviceType] = { enabled: false, mode: "manual", credentials: {} };
            }

            // Apply status from backend
            for (const status of statusList) {
              const sType = status.service_type || status.serviceType;
              if (sType) {
                const persistedCredentials =
                  status.credentials && typeof status.credentials === "object"
                    ? status.credentials
                    : {};
                configs[sType] = {
                  enabled: true,
                  mode: status.status === "verified" || status.status === "connected" ? "automated" : "manual",
                  credentials: persistedCredentials,
                };
                if (status.status === "verified" || status.status === "connected") {
                  connected.add(sType);
                }
              }
            }

            setServiceConfigs(configs);
            setConnectedServices(connected);
          } else {
            // No status data — initialize from schema
            const services = providerSchema ? filterServices(providerSchema.services || {}, az.provider) : {};
            const configs: Record<string, ServiceConfigState> = {};
            for (const serviceType of Object.keys(services)) {
              configs[serviceType] = { enabled: false, mode: "manual", credentials: {} };
            }
            setServiceConfigs(configs);
          }
        } catch {
          // Credential status endpoint may 404 if no credentials stored — that's fine
          const services = providerSchema ? filterServices(providerSchema.services || {}, az.provider) : {};
          const configs: Record<string, ServiceConfigState> = {};
          for (const serviceType of Object.keys(services)) {
            configs[serviceType] = { enabled: false, mode: "manual", credentials: {} };
          }
          if (mountedRef.current) setServiceConfigs(configs);
        }
      } catch (error) {
        logger.error(`Failed to load credential panel for AZ ${az.code}:`, error);
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    };
    load();
    return () => { mountedRef.current = false; };
  }, [az.provider, az.code, regionCode]);

  const handleServiceToggle = (serviceType: string) => {
    setServiceConfigs((prev) => ({
      ...prev,
      [serviceType]: { ...prev[serviceType], enabled: !prev[serviceType]?.enabled },
    }));
  };

  const handleModeChange = (serviceType: string, mode: "manual" | "automated") => {
    setServiceConfigs((prev) => ({
      ...prev,
      [serviceType]: { ...prev[serviceType], mode },
    }));
  };

  const handleCredentialChange = (serviceType: string, field: string, value: string) => {
    setServiceConfigs((prev) => ({
      ...prev,
      [serviceType]: {
        ...prev[serviceType],
        credentials: { ...prev[serviceType]?.credentials, [field]: value },
      },
    }));
    // Invalidate connection status when credentials change
    setConnectedServices((prev) => {
      const next = new Set(prev);
      next.delete(serviceType);
      return next;
    });
  };

  const handleTestConnection = async (serviceType: string) => {
    const config = serviceConfigs[serviceType];
    if (!config || config.mode !== "automated") return;
    if (Object.keys(config.credentials).length === 0) {
      ToastUtils.error("Please enter credentials before testing");
      return;
    }

    setTestingService((prev) => ({ ...prev, [serviceType]: true }));
    try {
      const result = await adminRegionApi.verifyAZServiceCredentials(
        regionCode,
        az.code,
        serviceType,
        config.credentials
      );
      if (result.success) {
        setConnectedServices((prev) => new Set(prev).add(serviceType));
        ToastUtils.success(result.message || "Connection verified successfully");
      }
    } catch (error: any) {
      ToastUtils.error(error.message || "Verification failed");
    } finally {
      setTestingService((prev) => ({ ...prev, [serviceType]: false }));
    }
  };

  const handleSaveCredentials = async (serviceType: string) => {
    const config = serviceConfigs[serviceType];
    if (!config || Object.keys(config.credentials).length === 0) {
      ToastUtils.error("Please enter credentials before saving");
      return;
    }

    setSavingService((prev) => ({ ...prev, [serviceType]: true }));
    try {
      await adminRegionApi.storeAZServiceCredentials(
        regionCode,
        az.code,
        serviceType,
        config.credentials,
        connectedServices.has(serviceType) // skip re-verification if already verified
      );
      // Mark as connected after successful save
      setConnectedServices((prev) => new Set(prev).add(serviceType));
    } catch (error: any) {
      ToastUtils.error(error.message || "Failed to save credentials");
    } finally {
      setSavingService((prev) => ({ ...prev, [serviceType]: false }));
    }
  };

  const handleDeleteCredentials = async (serviceType: string) => {
    setDeletingService((prev) => ({ ...prev, [serviceType]: true }));
    try {
      await adminRegionApi.deleteAZServiceCredentials(regionCode, az.code, serviceType);
      setConnectedServices((prev) => {
        const next = new Set(prev);
        next.delete(serviceType);
        return next;
      });
      setServiceConfigs((prev) => ({
        ...prev,
        [serviceType]: { ...prev[serviceType], credentials: {}, mode: "manual" },
      }));
    } catch (error: any) {
      ToastUtils.error(error.message || "Failed to delete credentials");
    } finally {
      setDeletingService((prev) => ({ ...prev, [serviceType]: false }));
    }
  };

  const services = schema ? filterServices(schema.services || {}, az.provider) : {};

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="h-5 w-5 animate-spin text-blue-500 mr-2" />
        <span className="text-sm text-gray-500">Loading service configuration...</span>
      </div>
    );
  }

  if (Object.keys(services).length === 0) {
    return (
      <div className="text-center py-6">
        <AlertCircle className="mx-auto h-6 w-6 text-amber-500 mb-2" />
        <p className="text-sm text-gray-500">No services available for {az.provider}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <KeyRound className="h-4 w-4 text-gray-500" />
        <h4 className="text-sm font-semibold text-gray-700">Service Credentials</h4>
      </div>

      {/* Connection summary */}
      <div className="flex flex-wrap gap-2">
        {Object.keys(services).map((serviceType) => {
          const isConnected = connectedServices.has(serviceType);
          const label = services[serviceType]?.label || serviceType;
          return (
            <span
              key={serviceType}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
                isConnected
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : "bg-gray-100 text-gray-500 border border-gray-200"
              }`}
            >
              {isConnected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
              {label}
            </span>
          );
        })}
      </div>

      {/* Service cards */}
      <div className="grid gap-4">
        {Object.entries(services).map(([serviceType, serviceConfig]) => {
          const config = serviceConfigs[serviceType] || { enabled: false, mode: "manual" as const, credentials: {} };
          const isTesting = testingService[serviceType] || false;
          const isSaving = savingService[serviceType] || false;
          const isDeleting = deletingService[serviceType] || false;
          const isConnected = connectedServices.has(serviceType);

          return (
            <div key={serviceType} className="space-y-2">
              <ServiceConfigCard
                serviceType={serviceType}
                serviceConfig={serviceConfig}
                enabled={config.enabled}
                onToggle={() => handleServiceToggle(serviceType)}
                fulfillmentMode={config.mode}
                onModeChange={(mode) => handleModeChange(serviceType, mode)}
                credentials={config.credentials}
                onCredentialChange={(field, value) => handleCredentialChange(serviceType, field, value)}
                onTestConnection={() => handleTestConnection(serviceType)}
                testing={isTesting}
                status={isConnected ? "connected" : "not_configured"}
              />

              {/* Save / Delete actions */}
              {config.enabled && config.mode === "automated" && (
                <div className="flex items-center gap-2 pl-4">
                  <ModernButton
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={() => handleSaveCredentials(serviceType)}
                    isLoading={isSaving}
                    isDisabled={isSaving || Object.keys(config.credentials).length === 0}
                    className="flex items-center gap-1.5"
                  >
                    Save Credentials
                  </ModernButton>

                  {isConnected && (
                    <ModernButton
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteCredentials(serviceType)}
                      isLoading={isDeleting}
                      isDisabled={isDeleting}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 flex items-center gap-1.5"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </ModernButton>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AZCredentialPanel;
