/**
 * AZ Service Configuration Step
 * Per-AZ service config + credentials during region creation.
 * Shows tabs for each AZ, each tab contains ServiceConfigCards.
 */
import React, { useState, useEffect, useRef } from "react";
import { Server, Loader2, AlertCircle } from "lucide-react";
import ServiceConfigCard from "./ServiceConfigCard";
import type {
  AZFormData,
  ServiceConfigState,
  ServiceDefinition,
  ProviderServicesSchema,
} from "../types/serviceConfig.types";
import logger from "@/utils/logger";

export interface AZServiceConfigStepProps {
  azList: AZFormData[];
  /** Fetch provider services schema */
  fetchProviderServices: (provider: string) => Promise<ProviderServicesSchema | null>;
  /** Verify credentials before region is created — uses provider-level endpoint */
  verifyServiceCredentials: (
    provider: string,
    serviceType: string,
    credentials: Record<string, string>
  ) => Promise<{ success: boolean; message?: string }>;
  /** Per-AZ service configs: azIndex → serviceType → config */
  azServiceConfigs: Record<number, Record<string, ServiceConfigState>>;
  onAzServiceConfigsChange: (configs: Record<number, Record<string, ServiceConfigState>>) => void;
  /** Per-AZ connected services: azIndex → Set<serviceType> */
  azConnectedServices: Record<number, Set<string>>;
  onAzConnectedServicesChange: (connected: Record<number, Set<string>>) => void;
}

/** Map of provider → services schema, cached across AZs */
const providerServicesCache: Record<string, ProviderServicesSchema> = {};

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

const AZServiceConfigStep: React.FC<AZServiceConfigStepProps> = ({
  azList,
  fetchProviderServices,
  verifyServiceCredentials,
  azServiceConfigs,
  onAzServiceConfigsChange,
  azConnectedServices,
  onAzConnectedServicesChange,
}) => {
  const [activeAzIndex, setActiveAzIndex] = useState(0);
  const [providerSchemas, setProviderSchemas] = useState<Record<string, ProviderServicesSchema>>(
    {}
  );
  const [loadingProviders, setLoadingProviders] = useState<Set<string>>(new Set());
  const [testingService, setTestingService] = useState<Record<string, boolean>>({});

  const fetchRef = useRef(fetchProviderServices);
  fetchRef.current = fetchProviderServices;

  // Load provider services for each unique provider in the AZ list
  useEffect(() => {
    const uniqueProviders = [...new Set(azList.map((az) => az.provider).filter(Boolean))];

    uniqueProviders.forEach(async (provider) => {
      if (providerSchemas[provider] || providerServicesCache[provider]) {
        if (providerServicesCache[provider] && !providerSchemas[provider]) {
          setProviderSchemas((prev) => ({ ...prev, [provider]: providerServicesCache[provider] }));
        }
        return;
      }

      setLoadingProviders((prev) => new Set(prev).add(provider));
      try {
        const data = await fetchRef.current(provider);
        if (data) {
          providerServicesCache[provider] = data;
          setProviderSchemas((prev) => ({ ...prev, [provider]: data }));

          // Initialize service configs for AZs with this provider
          const services = data.services || {};
          azList.forEach((az, idx) => {
            if (az.provider === provider && !azServiceConfigs[idx]) {
              const initialConfigs: Record<string, ServiceConfigState> = {};
              Object.keys(services).forEach((serviceType) => {
                initialConfigs[serviceType] = {
                  enabled: false,
                  mode: "manual",
                  credentials: {},
                };
              });
              onAzServiceConfigsChange({ ...azServiceConfigs, [idx]: initialConfigs });
            }
          });
        }
      } catch (error) {
        logger.error(`Failed to fetch services for provider ${provider}:`, error);
      } finally {
        setLoadingProviders((prev) => {
          const next = new Set(prev);
          next.delete(provider);
          return next;
        });
      }
    });
  }, [azList.map((az) => az.provider).join(",")]);

  const handleServiceToggle = (azIdx: number, serviceType: string) => {
    const current = azServiceConfigs[azIdx] || {};
    onAzServiceConfigsChange({
      ...azServiceConfigs,
      [azIdx]: {
        ...current,
        [serviceType]: {
          ...current[serviceType],
          enabled: !current[serviceType]?.enabled,
        },
      },
    });
  };

  const handleModeChange = (azIdx: number, serviceType: string, mode: "manual" | "automated") => {
    const current = azServiceConfigs[azIdx] || {};
    onAzServiceConfigsChange({
      ...azServiceConfigs,
      [azIdx]: {
        ...current,
        [serviceType]: { ...current[serviceType], mode },
      },
    });
  };

  const handleCredentialChange = (
    azIdx: number,
    serviceType: string,
    field: string,
    value: string
  ) => {
    const current = azServiceConfigs[azIdx] || {};
    onAzServiceConfigsChange({
      ...azServiceConfigs,
      [azIdx]: {
        ...current,
        [serviceType]: {
          ...current[serviceType],
          credentials: { ...current[serviceType]?.credentials, [field]: value },
        },
      },
    });
    // Invalidate connection status
    const connected = { ...azConnectedServices };
    if (connected[azIdx]) {
      const next = new Set(connected[azIdx]);
      next.delete(serviceType);
      connected[azIdx] = next;
      onAzConnectedServicesChange(connected);
    }
  };

  const handleTestConnection = async (azIdx: number, serviceType: string) => {
    const az = azList[azIdx];
    const config = azServiceConfigs[azIdx]?.[serviceType];
    if (!config || config.mode !== "automated") return;

    const testKey = `${azIdx}-${serviceType}`;
    setTestingService((prev) => ({ ...prev, [testKey]: true }));
    try {
      const result = await verifyServiceCredentials(
        az.provider,
        serviceType,
        config.credentials
      );
      if (result.success) {
        const connected = { ...azConnectedServices };
        connected[azIdx] = new Set(connected[azIdx] || []).add(serviceType);
        onAzConnectedServicesChange(connected);
      }
    } catch (error) {
      logger.error(`Verification failed for AZ ${az.code} ${serviceType}:`, error);
    } finally {
      setTestingService((prev) => ({ ...prev, [testKey]: false }));
    }
  };

  const currentAz = azList[activeAzIndex];
  const currentProvider = currentAz?.provider;
  const currentSchema = currentProvider ? providerSchemas[currentProvider] : null;
  const currentServices = currentSchema
    ? filterServices(currentSchema.services || {}, currentProvider)
    : {};
  const isLoading = currentProvider ? loadingProviders.has(currentProvider) : false;

  return (
    <div className="space-y-6">
      {/* AZ Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {azList.map((az, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => setActiveAzIndex(idx)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
              activeAzIndex === idx
                ? "bg-blue-500 text-white shadow-sm"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            <Server className="h-4 w-4" />
            {az.name || az.code || `AZ ${idx + 1}`}
            <span className="text-xs opacity-70">({az.provider || "no provider"})</span>
          </button>
        ))}
      </div>

      {/* Current AZ services */}
      {!currentProvider && (
        <div className="text-center py-8">
          <AlertCircle className="mx-auto h-8 w-8 text-amber-500 mb-2" />
          <p className="text-sm text-gray-600">
            No provider selected for this AZ. Go back and select a provider.
          </p>
        </div>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      )}

      {currentProvider && !isLoading && Object.keys(currentServices).length === 0 && (
        <div className="text-center py-8">
          <AlertCircle className="mx-auto h-8 w-8 text-amber-500 mb-2" />
          <p className="text-sm text-gray-600">No services configured for {currentProvider}</p>
        </div>
      )}

      {currentProvider && !isLoading && Object.keys(currentServices).length > 0 && (
        <div className="grid gap-6 md:grid-cols-2">
          {Object.entries(currentServices).map(([serviceType, serviceConfig]) => {
            const testKey = `${activeAzIndex}-${serviceType}`;
            const configs = azServiceConfigs[activeAzIndex] || {};
            const connected = azConnectedServices[activeAzIndex] || new Set();

            return (
              <ServiceConfigCard
                key={serviceType}
                serviceType={serviceType}
                serviceConfig={serviceConfig}
                enabled={configs[serviceType]?.enabled || false}
                onToggle={() => handleServiceToggle(activeAzIndex, serviceType)}
                fulfillmentMode={configs[serviceType]?.mode || "manual"}
                onModeChange={(mode) => handleModeChange(activeAzIndex, serviceType, mode)}
                credentials={configs[serviceType]?.credentials || {}}
                onCredentialChange={(field, value) =>
                  handleCredentialChange(activeAzIndex, serviceType, field, value)
                }
                onTestConnection={() => handleTestConnection(activeAzIndex, serviceType)}
                testing={testingService[testKey] || false}
                status={connected.has(serviceType) ? "connected" : "not_configured"}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AZServiceConfigStep;
