/**
 * Admin Region Create Page
 * 3-step wizard: Region Details → Availability Zones → Service Configuration
 *
 * Region is geographic (no provider). AZs carry the provider and credentials.
 */
import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, AlertCircle } from "lucide-react";
import AdminPageShell from "../components/AdminPageShell";
import { ModernCard, ModernButton } from "@/shared/components/ui";
import adminRegionApi, { RegionCreatePayload } from "@/services/adminRegionApi";
import ToastUtils from "@/utils/toastUtil";
import InvoiceWizardStepper from "@/shared/components/billing/invoice/InvoiceWizardStepper";
import { useFetchCountries } from "@/hooks/resource";
import {
  type AZFormData,
  type ServiceConfigState,
  type ServiceDefinition,
  type FieldDefinition,
} from "@/shared/domains/regions/types/serviceConfig.types";

import {
  RegionInfoForm,
  AvailabilityAccessForm,
  AZConfigStep,
  AZServiceConfigStep,
  type Country,
} from "@/shared/domains/regions/components";
import { useRegionFormLogic } from "@/shared/domains/regions/hooks";
import { useCreateAvailabilityZone } from "@/hooks/adminHooks/regionHooks";

const RegionCreate = () => {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const { data: countries = [] } = useFetchCountries();
  const typedCountries = countries as Country[];
  const createAZ = useCreateAvailabilityZone();

  // Wizard State — 3 steps
  const [currentStep, setCurrentStep] = useState(0);
  const steps = ["Region Details", "Availability Zones", "Service Configuration"];

  // AZ state
  const [azList, setAzList] = useState<AZFormData[]>([]);
  const [azServiceConfigs, setAzServiceConfigs] = useState<
    Record<number, Record<string, ServiceConfigState>>
  >({});
  const [azConnectedServices, setAzConnectedServices] = useState<Record<number, Set<string>>>({});

  // Memoize callbacks for service fetching
  const fetchProviderServices = useCallback(async (provider: string) => {
    const res = await adminRegionApi.getProviderServices(provider);
    if (!res.success || !res.data) return null;

    type FieldShape = {
      name?: string;
      label?: string;
      type?: string;
      required?: boolean;
      placeholder?: string;
      description?: string;
      help?: string;
    };
    type ServiceShape = {
      fields?: FieldShape[] | Record<string, FieldShape>;
    };
    const raw = res.data as { services?: Record<string, ServiceShape> } | undefined;
    const servicesMap: Record<string, ServiceShape> =
      raw?.services || (raw as Record<string, ServiceShape> | undefined) || {};

    const services: Record<string, ServiceDefinition> = {};
    for (const [serviceType, svcConfig] of Object.entries(servicesMap)) {
      const fields: Record<string, FieldDefinition> = {};
      const rawFields = svcConfig?.fields || {};

      if (Array.isArray(rawFields)) {
        rawFields.forEach((f) => {
          if (!f.name) return;
          fields[f.name] = {
            label: f.label ?? f.name,
            type: f.type as never,
            required: f.required ?? false,
            ...(f.placeholder ? { placeholder: f.placeholder } : {}),
            ...(f.description || f.help ? { help: f.description || f.help } : {}),
          };
        });
      } else {
        for (const [fieldName, fieldDef] of Object.entries(rawFields)) {
          fields[fieldName] = {
            label: fieldDef.label || fieldName,
            type: fieldDef.type as never,
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

  // Use shared form logic for basic region info
  const { regionData, handleRegionChange } = useRegionFormLogic({
    fetchProviderServices,
    verifyServiceCredentials,
  });

  // Step validation
  const validateStep1 = () => {
    return Boolean(regionData.name && regionData.code);
  };

  const validateStep2 = () => {
    if (azList.length === 0) return false;
    return azList.every((az) => az.provider && az.code);
  };

  const handleNext = () => {
    if (currentStep === 0) {
      if (!validateStep1()) {
        ToastUtils.error("Please fill in Region Name and Code");
        return;
      }
      setCurrentStep(1);
    } else if (currentStep === 1) {
      if (!validateStep2()) {
        ToastUtils.error("Add at least one AZ with a provider and code");
        return;
      }
      setCurrentStep(2);
    }
    globalThis.window.scrollTo(0, 0);
  };

  const handleBack = () => {
    setCurrentStep((prev) => prev - 1);
    globalThis.window.scrollTo(0, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateStep1() || !validateStep2()) {
      ToastUtils.error("Please complete all required fields");
      return;
    }

    setSubmitting(true);
    try {
      // 1. Create the geographic region (no provider)
      const azSelectionMode =
        regionData.az_selection_mode !== "disabled"
          ? regionData.az_selection_mode
          : azList.length > 1
            ? "auto"
            : "disabled";

      const createPayload: RegionCreatePayload = {
        name: regionData.name,
        code: regionData.code,
        country_code: regionData.country_code?.toUpperCase() || null,
        city: regionData.city || null,
        is_active: regionData.is_active,
        ownership_type: "platform",
        visibility: regionData.visibility,
        fast_track_mode: regionData.fast_track_mode,
        az_selection_mode: azSelectionMode,
      };

      const regionRes = await adminRegionApi.createPlatformRegion(createPayload);

      if (!regionRes.success) {
        throw new Error("Failed to create region");
      }

      const newRegionCode = regionRes.data?.code || regionData.code;

      // 2. Create each AZ
      for (const az of azList) {
        await createAZ.mutateAsync({
          regionCode: newRegionCode,
          data: {
            code: az.code,
            name: az.name,
            provider: az.provider,
            is_active: az.is_active,
          },
        });
      }

      // 3. Store per-AZ service credentials
      for (let i = 0; i < azList.length; i++) {
        const az = azList[i];
        const configs = azServiceConfigs[i] || {};
        const connected = azConnectedServices[i] || new Set();

        for (const [serviceType, config] of Object.entries(configs)) {
          if (
            config.enabled &&
            config.mode === "automated" &&
            Object.keys(config.credentials).length > 0
          ) {
            try {
              const isAlreadyVerified = connected.has(serviceType);
              await adminRegionApi.storeAZServiceCredentials(
                newRegionCode,
                az.code,
                serviceType,
                config.credentials,
                isAlreadyVerified
              );
            } catch {
              ToastUtils.error(`Failed to store ${serviceType} credentials for AZ ${az.code}`);
            }
          }
        }
      }

      ToastUtils.success("Region created successfully with availability zones!");

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

  return (
    <AdminPageShell
      title="Create New Region"
      description="Set up a new geographic region with availability zones"
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
                showProviderSelection={false}
                showAzSelectionMode={true}
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

        {/* Step 2: Availability Zones */}
        {currentStep === 1 && (
          <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
            <ModernCard title="Configure Availability Zones" className="space-y-4">
              <AZConfigStep azList={azList} onChange={setAzList} />
            </ModernCard>
          </div>
        )}

        {/* Step 3: Per-AZ Service Configuration */}
        {currentStep === 2 && (
          <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
            <ModernCard title="Service Configuration" className="space-y-4">
              <p className="text-sm text-gray-500">
                Configure services and credentials for each availability zone. Switch between AZ
                tabs to configure each one.
              </p>
              {azList.length > 0 ? (
                <AZServiceConfigStep
                  azList={azList}
                  fetchProviderServices={fetchProviderServices}
                  verifyServiceCredentials={verifyServiceCredentials}
                  azServiceConfigs={azServiceConfigs}
                  onAzServiceConfigsChange={setAzServiceConfigs}
                  azConnectedServices={azConnectedServices}
                  onAzConnectedServicesChange={setAzConnectedServices}
                />
              ) : (
                <div className="text-center py-8">
                  <AlertCircle className="mx-auto h-8 w-8 text-amber-500 mb-2" />
                  <p className="text-sm text-gray-600">
                    No availability zones configured. Go back and add at least one AZ.
                  </p>
                </div>
              )}
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

            {currentStep < 2 ? (
              <ModernButton type="button" variant="primary" onClick={handleNext} className="px-8">
                Next: {currentStep === 0 ? "Availability Zones" : "Configure Services"}
              </ModernButton>
            ) : (
              <ModernButton
                type="submit"
                variant="primary"
                isLoading={submitting}
                disabled={submitting}
                className="px-8 flex items-center gap-2"
              >
                Create Region
                <ChevronRight className="h-4 w-4" />
              </ModernButton>
            )}
          </div>
        </div>
        <div className="h-24"></div>
      </form>
    </AdminPageShell>
  );
};

export default RegionCreate;
