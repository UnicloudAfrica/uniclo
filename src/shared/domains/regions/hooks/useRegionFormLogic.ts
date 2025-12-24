/**
 * useRegionFormLogic Hook
 * Shared form state management for region creation/editing
 */
// @ts-nocheck
import { useState, useEffect, useCallback, useRef } from "react";
import type {
  RegionFormData,
  ServiceConfigState,
  ProviderServicesSchema,
  DEFAULT_REGION_FORM_DATA,
} from "../types/serviceConfig.types";

export interface UseRegionFormLogicOptions {
  initialData?: Partial<RegionFormData>;
  fetchProviderServices: (provider: string) => Promise<ProviderServicesSchema | null>;
  verifyServiceCredentials?: (
    provider: string,
    serviceType: string,
    credentials: Record<string, string>
  ) => Promise<{ success: boolean; message?: string }>;
}

export interface UseRegionFormLogicReturn {
  // Region data
  regionData: RegionFormData;
  handleRegionChange: (field: keyof RegionFormData, value: any) => void;

  // Service configuration
  serviceConfigs: Record<string, ServiceConfigState>;
  handleServiceToggle: (serviceType: string) => void;
  handleModeChange: (serviceType: string, mode: "manual" | "automated") => void;
  handleCredentialChange: (serviceType: string, field: string, value: string) => void;

  // Connection testing
  connectedServices: Set<string>;
  testingService: Record<string, boolean>;
  handleTestConnection: (serviceType: string) => Promise<void>;

  // Provider services
  providerServices: ProviderServicesSchema | null;
  loadingServices: boolean;

  // Validation
  validateStep1: () => boolean;
  validateStep2: () => boolean;
  getEnabledServices: () => [string, ServiceConfigState][];
}

const DEFAULT_FORM_DATA: RegionFormData = {
  name: "",
  code: "",
  country_code: "",
  city: "",
  provider: "zadara",
  is_active: true,
  visibility: "public",
  fast_track_mode: "disabled",
};

export function useRegionFormLogic({
  initialData,
  fetchProviderServices,
  verifyServiceCredentials,
}: UseRegionFormLogicOptions): UseRegionFormLogicReturn {
  // Basic region info
  const [regionData, setRegionData] = useState<RegionFormData>({
    ...DEFAULT_FORM_DATA,
    ...initialData,
  });

  // Code auto-generation tracking
  const [codeManuallyEdited, setCodeManuallyEdited] = useState(false);

  // Services configuration
  const [providerServices, setProviderServices] = useState<ProviderServicesSchema | null>(null);
  const [loadingServices, setLoadingServices] = useState(false);
  const [serviceConfigs, setServiceConfigs] = useState<Record<string, ServiceConfigState>>({});
  const [testingService, setTestingService] = useState<Record<string, boolean>>({});
  const [connectedServices, setConnectedServices] = useState<Set<string>>(new Set());

  // Use refs to store callback functions to avoid infinite loops
  const fetchProviderServicesRef = useRef(fetchProviderServices);
  fetchProviderServicesRef.current = fetchProviderServices;

  const verifyServiceCredentialsRef = useRef(verifyServiceCredentials);
  verifyServiceCredentialsRef.current = verifyServiceCredentials;

  // Fetch provider services when provider changes - only depends on provider string
  useEffect(() => {
    const loadServices = async () => {
      if (!regionData.provider) return;

      setLoadingServices(true);
      try {
        const data = await fetchProviderServicesRef.current(regionData.provider);
        if (data) {
          setProviderServices(data);

          // Initialize service configs
          const services = data.services || {};
          const initialConfigs: Record<string, ServiceConfigState> = {};
          Object.keys(services).forEach((serviceType) => {
            initialConfigs[serviceType] = {
              enabled: false,
              mode: "manual",
              credentials: {},
            };
          });
          setServiceConfigs(initialConfigs);
        }
      } catch (error) {
        console.error("Failed to fetch provider services:", error);
      } finally {
        setLoadingServices(false);
      }
    };

    loadServices();
  }, [regionData.provider]); // Only re-run when provider changes

  const handleRegionChange = useCallback(
    (field: keyof RegionFormData, value: any) => {
      setRegionData((prev) => ({ ...prev, [field]: value }));

      // Track manual edits to the code field
      if (field === "code") {
        setCodeManuallyEdited(true);
      }

      // Auto-generate code from name ONLY if code hasn't been manually edited
      if (field === "name" && !codeManuallyEdited) {
        const code = value
          .toLowerCase()
          .replace(/\s+/g, "-")
          .replace(/[^a-z0-9-]/g, "");
        setRegionData((prev) => ({ ...prev, code }));
      }
    },
    [codeManuallyEdited]
  );

  const handleServiceToggle = useCallback((serviceType: string) => {
    setServiceConfigs((prev) => ({
      ...prev,
      [serviceType]: {
        ...prev[serviceType],
        enabled: !prev[serviceType]?.enabled,
      },
    }));
  }, []);

  const handleModeChange = useCallback((serviceType: string, mode: "manual" | "automated") => {
    setServiceConfigs((prev) => ({
      ...prev,
      [serviceType]: {
        ...prev[serviceType],
        mode,
      },
    }));
  }, []);

  const handleCredentialChange = useCallback(
    (serviceType: string, fieldName: string, value: string) => {
      setServiceConfigs((prev) => ({
        ...prev,
        [serviceType]: {
          ...prev[serviceType],
          credentials: {
            ...prev[serviceType]?.credentials,
            [fieldName]: value,
          },
        },
      }));
      // Invalidate connection status on change
      setConnectedServices((prev) => {
        const next = new Set(prev);
        next.delete(serviceType);
        return next;
      });
    },
    []
  );

  const handleTestConnection = useCallback(
    async (serviceType: string) => {
      if (!verifyServiceCredentials) return;

      const config = serviceConfigs[serviceType];
      if (!config || config.mode !== "automated") return;

      setTestingService((prev) => ({ ...prev, [serviceType]: true }));
      try {
        const result = await verifyServiceCredentials(
          regionData.provider,
          serviceType,
          config.credentials
        );
        if (result.success) {
          setConnectedServices((prev) => new Set(prev).add(serviceType));
        }
      } catch (error) {
        console.error(`Verification failed for ${serviceType}:`, error);
        setConnectedServices((prev) => {
          const next = new Set(prev);
          next.delete(serviceType);
          return next;
        });
      } finally {
        setTestingService((prev) => ({ ...prev, [serviceType]: false }));
      }
    },
    [serviceConfigs, regionData.provider, verifyServiceCredentials]
  );

  const validateStep1 = useCallback((): boolean => {
    return Boolean(regionData.name && regionData.code && regionData.provider);
  }, [regionData]);

  const getEnabledServices = useCallback((): [string, ServiceConfigState][] => {
    return Object.entries(serviceConfigs).filter(([_, cfg]) => cfg.enabled);
  }, [serviceConfigs]);

  const validateStep2 = useCallback((): boolean => {
    const enabledServices = getEnabledServices();
    if (enabledServices.length === 0) return false;

    // Check if automated services have verified connections
    const automatedServices = enabledServices.filter(([_, cfg]) => cfg.mode === "automated");
    if (automatedServices.length > 0 && connectedServices.size === 0) {
      return false;
    }

    return true;
  }, [getEnabledServices, connectedServices]);

  return {
    regionData,
    handleRegionChange,
    serviceConfigs,
    handleServiceToggle,
    handleModeChange,
    handleCredentialChange,
    connectedServices,
    testingService,
    handleTestConnection,
    providerServices,
    loadingServices,
    validateStep1,
    validateStep2,
    getEnabledServices,
  };
}

export default useRegionFormLogic;
