/**
 * Admin Region Create Page
 * Uses shared components from /src/shared/domains/regions/components/
 */
import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, Loader2, AlertCircle } from "lucide-react";
import AdminPageShell from "../components/AdminPageShell";
import { ModernCard, ModernButton } from "@/shared/components/ui";
import adminRegionApi, { RegionCreatePayload } from "@/services/adminRegionApi";
import ToastUtils from "@/utils/toastUtil";
import InvoiceWizardStepper from "@/shared/components/billing/invoice/InvoiceWizardStepper";
import { useFetchCountries } from "@/hooks/resource";
import {
  ServiceConfigState,
  ServiceDefinition,
  FieldDefinition,
} from "@/shared/domains/regions/types/serviceConfig.types";

// Shared region components
import {
  ServiceConfigCard,
  RegionInfoForm,
  AvailabilityAccessForm,
  type Country,
} from "@/shared/domains/regions/components";
import { useRegionFormLogic } from "@/shared/domains/regions/hooks";

/**
 * Main Region Create Page
 */
const RegionCreate = () => {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const { data: countries = [] } = useFetchCountries();
  const typedCountries = countries as Country[];

  // Wizard State
  const [currentStep, setCurrentStep] = useState(0);
  const steps = ["Region Details", "Service Configuration"];

  // Memoize callbacks to prevent infinite re-renders
  const fetchProviderServices = useCallback(async (provider: string) => {
    const res = await adminRegionApi.getProviderServices(provider);
    if (!res.success || !res.data) return null;

    // Backend returns { provider, provider_config, services: { compute: { label, ..., fields: {...} } } }
    const raw = res.data as any;
    const servicesMap = raw?.services || raw || {};

    // Transform keyed services object to ProviderServicesSchema
    const services: Record<string, ServiceDefinition> = {};
    for (const [serviceType, svcConfig] of Object.entries(servicesMap as Record<string, any>)) {
      const fields: Record<string, FieldDefinition> = {};
      const rawFields = svcConfig?.fields || {};

      // fields can be a keyed object { base_url: { label, type, ... } } or an array
      if (Array.isArray(rawFields)) {
        rawFields.forEach((f: any) => {
          fields[f.name] = {
            label: f.label,
            type: f.type as any,
            required: f.required,
            ...(f.placeholder ? { placeholder: f.placeholder } : {}),
            ...(f.description || f.help ? { help: f.description || f.help } : {}),
          };
        });
      } else {
        for (const [fieldName, fieldDef] of Object.entries(rawFields as Record<string, any>)) {
          fields[fieldName] = {
            label: fieldDef.label || fieldName,
            type: fieldDef.type as any,
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
    return { services };
  }, []);

  const verifyServiceCredentials = useCallback(
    async (provider: string, serviceType: string, credentials: Record<string, string>) => {
      const res = await adminRegionApi.verifyProviderServiceCredentials(
        provider,
        serviceType,
        credentials
      );
      return {
        success: res.success,
        ...(res.message ? { message: res.message } : {}),
      };
    },
    []
  );

  // Use shared form logic hook with stable callbacks
  const {
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
    getEnabledServices,
  } = useRegionFormLogic({
    fetchProviderServices,
    verifyServiceCredentials,
  });

  // Filter services to only those supported by the selected provider
  const services = (() => {
    const all = providerServices?.services || {};
    const providerServiceMap: Record<string, string[]> = {
      zadara: ["compute", "object_storage"],
      nobus: ["compute", "object_storage"],
    };
    const allowed = providerServiceMap[regionData.provider?.toLowerCase()];
    if (allowed) {
      return Object.fromEntries(Object.entries(all).filter(([key]) => allowed.includes(key)));
    }
    return all;
  })();

  const handleNext = () => {
    if (currentStep === 0) {
      if (!validateStep1()) {
        ToastUtils.error("Please fill in all required fields (Name, Code, Provider)");
        return;
      }
      setCurrentStep(1);
      globalThis.window.scrollTo(0, 0);
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => prev - 1);
    globalThis.window.scrollTo(0, 0);
  };

  const validateSubmission = () => {
    if (!validateStep1()) {
      ToastUtils.error("Please fill in all required fields");
      return false;
    }

    const enabledServices = getEnabledServices();
    if (enabledServices.length === 0) {
      ToastUtils.error("Please enable at least one service for this region");
      return false;
    }

    const automatedServices = enabledServices.filter(([, cfg]) => cfg.mode === "automated");
    if (automatedServices.length > 0 && connectedServices.size === 0) {
      ToastUtils.error(
        "Please verify credentials for at least one service before creating the region"
      );
      return false;
    }
    return true;
  };

  const storeServiceCredentials = async (
    regionCode: string,
    enabledServices: [string, ServiceConfigState][]
  ) => {
    for (const [serviceType, config] of enabledServices) {
      if (config.mode === "automated" && Object.keys(config.credentials).length > 0) {
        try {
          const isAlreadyVerified = connectedServices.has(serviceType);
          await adminRegionApi.storeServiceCredentials(
            regionCode,
            serviceType,
            config.credentials,
            isAlreadyVerified
          );
        } catch {
          ToastUtils.error(`Failed to verify/store ${serviceType} credentials`);
        }
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateSubmission()) {
      return;
    }

    setSubmitting(true);
    try {
      const createPayload: RegionCreatePayload = {
        name: regionData.name,
        code: regionData.code,
        country_code: regionData.country_code?.toUpperCase() || null,
        city: regionData.city || null,
        provider: regionData.provider,
        is_active: regionData.is_active,
        ownership_type: "platform",
        visibility: regionData.visibility,
        fast_track_mode: regionData.fast_track_mode,
      };

      const regionRes = await adminRegionApi.createPlatformRegion(createPayload);

      if (!regionRes.success) {
        throw new Error("Failed to create region");
      }

      const newRegionCode = regionRes.data?.code || regionData.code;

      await storeServiceCredentials(newRegionCode, getEnabledServices());

      ToastUtils.success("Region created successfully!");

      if (regionData.fast_track_mode === "grant_only" && newRegionCode) {
        navigate(`/admin-dashboard/regions/${newRegionCode}/edit`);
        ToastUtils.info("Please configure Fast Track grants now.");
      } else {
        navigate(`/admin-dashboard/regions/${newRegionCode}`);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to create region";
      ToastUtils.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const renderServicesList = () => {
    if (loadingServices) {
      return (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      );
    }

    if (Object.keys(services).length === 0) {
      return (
        <div className="text-center py-8">
          <AlertCircle className="mx-auto h-8 w-8 text-amber-500 mb-2" />
          <p className="text-sm text-gray-600">No services configured for {regionData.provider}</p>
        </div>
      );
    }

    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
        {Object.entries(services).map(([serviceType, serviceConfig]) => (
          <ServiceConfigCard
            key={serviceType}
            serviceType={serviceType}
            serviceConfig={serviceConfig}
            enabled={serviceConfigs[serviceType]?.enabled || false}
            onToggle={() => handleServiceToggle(serviceType)}
            fulfillmentMode={serviceConfigs[serviceType]?.mode || "manual"}
            onModeChange={(mode) => handleModeChange(serviceType, mode)}
            credentials={serviceConfigs[serviceType]?.credentials || {}}
            onCredentialChange={(field, value) => handleCredentialChange(serviceType, field, value)}
            onTestConnection={() => handleTestConnection(serviceType)}
            testing={testingService[serviceType] || false}
            status={connectedServices.has(serviceType) ? "connected" : "not_configured"}
          />
        ))}
      </div>
    );
  };

  return (
    <AdminPageShell
      title="Create New Region"
      description="Set up a new data center region in a few steps"
      contentClassName="max-w-full pb-32"
    >
      <div className="mb-8 max-w-3xl mx-auto">
        <InvoiceWizardStepper currentStep={currentStep} steps={steps} />
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Step 1: Region Details */}
        {currentStep === 0 && (
          <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <ModernCard title="Region Information" className="space-y-4">
              <RegionInfoForm
                regionData={regionData}
                onChange={handleRegionChange}
                countries={typedCountries}
                showProviderSelection={true}
              />
            </ModernCard>

            <ModernCard title="Availability & Access" className="space-y-6">
              <AvailabilityAccessForm
                regionData={regionData}
                onChange={handleRegionChange}
                showFastTrack={true}
              />
            </ModernCard>
          </div>
        )}

        {/* Step 2: Services */}
        {currentStep === 1 && (
          <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
            <ModernCard title="Available Services" className="space-y-4">
              <p className="text-sm text-gray-500">
                Select which services will be available in this region. For each service, choose
                manual or automated fulfillment.
              </p>
              {renderServicesList()}
            </ModernCard>
          </div>
        )}

        {/* Footer / Actions */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-gray-200 z-10 md:pl-64">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <ModernButton
              type="button"
              variant="ghost"
              onClick={currentStep === 0 ? () => navigate("/admin-dashboard/regions") : handleBack}
              disabled={submitting}
            >
              {currentStep === 0 ? "Cancel" : "Back"}
            </ModernButton>

            {currentStep === 0 ? (
              <ModernButton type="button" variant="primary" onClick={handleNext} className="px-8">
                Next: Configure Services
              </ModernButton>
            ) : (
              <ModernButton
                type="submit"
                variant="primary"
                isLoading={submitting}
                disabled={
                  submitting ||
                  (Object.values(serviceConfigs).some((c) => c.enabled && c.mode === "automated") &&
                    connectedServices.size === 0)
                }
                className="px-8 flex items-center gap-2"
              >
                Create Region
                <ChevronRight className="h-4 w-4" />
              </ModernButton>
            )}
          </div>
        </div>
        {/* Spacer for fixed footer */}
        <div className="h-24"></div>
      </form>
    </AdminPageShell>
  );
};

export default RegionCreate;
