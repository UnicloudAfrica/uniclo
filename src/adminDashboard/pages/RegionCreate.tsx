// @ts-nocheck
/**
 * Admin Region Create Page
 * Uses shared components from /src/shared/domains/regions/components/
 */
import React, { useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, Loader2, AlertCircle } from "lucide-react";
import AdminPageShell from "../components/AdminPageShell";
import { ModernCard, ModernButton } from "../../shared/components/ui";
import adminRegionApi from "../../services/adminRegionApi";
import ToastUtils from "../../utils/toastUtil";
import InvoiceWizardStepper from "../../shared/components/billing/invoice/InvoiceWizardStepper";
import { useFetchCountries } from "../../hooks/resource";

// Shared region components
import {
  ServiceConfigCard,
  RegionInfoForm,
  AvailabilityAccessForm,
} from "../../shared/domains/regions/components";
import { useRegionFormLogic } from "../../shared/domains/regions/hooks";

/**
 * Main Region Create Page
 */
const RegionCreate = () => {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const { data: countries = [] } = useFetchCountries();

  // Wizard State
  const [currentStep, setCurrentStep] = useState(0);
  const steps = ["Region Details", "Service Configuration"];

  // Memoize callbacks to prevent infinite re-renders
  const fetchProviderServices = useCallback(async (provider) => {
    const res = await adminRegionApi.getProviderServices(provider);
    return res.success ? res.data : null;
  }, []);

  const verifyServiceCredentials = useCallback(async (provider, serviceType, credentials) => {
    const res = await adminRegionApi.verifyProviderServiceCredentials(
      provider,
      serviceType,
      credentials
    );
    if (res.success) {
      ToastUtils.success(`${serviceType} verified successfully`);
    }
    return res;
  }, []);

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

  // Filter services for Zadara (only Compute and Storage)
  const services = (() => {
    const all = providerServices?.services || {};
    if (regionData.provider === "zadara") {
      const allowed = ["compute", "object_storage"];
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
      window.scrollTo(0, 0);
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => prev - 1);
    window.scrollTo(0, 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateStep1()) {
      ToastUtils.error("Please fill in all required fields");
      return;
    }

    const enabledServices = getEnabledServices();
    if (enabledServices.length === 0) {
      ToastUtils.error("Please enable at least one service for this region");
      return;
    }

    const automatedServices = enabledServices.filter(([_, cfg]) => cfg.mode === "automated");
    if (automatedServices.length > 0 && connectedServices.size === 0) {
      ToastUtils.error(
        "Please verify credentials for at least one service before creating the region"
      );
      return;
    }

    setSubmitting(true);
    try {
      const createPayload = {
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

      const newRegionId = regionRes.data?.id;
      const newRegionCode = regionRes.data?.code || regionData.code;

      // Store credentials for each automated service
      for (const [serviceType, config] of enabledServices) {
        if (config.mode === "automated" && Object.keys(config.credentials).length > 0) {
          try {
            const isAlreadyVerified = connectedServices.has(serviceType);
            await adminRegionApi.storeServiceCredentials(
              newRegionId,
              serviceType,
              config.credentials,
              isAlreadyVerified
            );
          } catch (credError) {
            console.error(`Failed to verify/store ${serviceType} credentials:`, credError);
          }
        }
      }
      ToastUtils.success("Region created successfully!");

      if (regionData.fast_track_mode === "grant_only" && newRegionId) {
        navigate(`/admin-dashboard/regions/${newRegionId}/edit`);
        ToastUtils.info("Please configure Fast Track grants now.");
      } else {
        navigate(`/admin-dashboard/regions/${newRegionCode}`);
      }
    } catch (error) {
      console.error("Error creating region:", error);
      ToastUtils.error(error.message || "Failed to create region");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
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
                  countries={countries}
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

                {loadingServices ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                  </div>
                ) : Object.keys(services).length > 0 ? (
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
                        onCredentialChange={(field, value) =>
                          handleCredentialChange(serviceType, field, value)
                        }
                        onTestConnection={() => handleTestConnection(serviceType)}
                        testing={testingService[serviceType] || false}
                        status={connectedServices.has(serviceType) ? "connected" : "not_configured"}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <AlertCircle className="mx-auto h-8 w-8 text-amber-500 mb-2" />
                    <p className="text-sm text-gray-600">
                      No services configured for {regionData.provider}
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
                onClick={
                  currentStep === 0 ? () => navigate("/admin-dashboard/regions") : handleBack
                }
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
                    (Object.values(serviceConfigs).some(
                      (c) => c.enabled && c.mode === "automated"
                    ) &&
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
    </>
  );
};

export default RegionCreate;
