// @ts-nocheck
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Server,
  Database,
  MapPin,
  Globe,
  Building,
  Check,
  ChevronRight,
  Loader2,
  AlertCircle,
} from "lucide-react";
import AdminHeadbar from "../components/adminHeadbar";
import AdminSidebar from "../components/AdminSidebar";
import AdminPageShell from "../components/AdminPageShell";
import { ModernCard, ModernButton } from "../../shared/components/ui";
import ModernInput from "../../shared/components/ui/ModernInput";
import adminRegionApi from "../../services/adminRegionApi";
import ToastUtils from "../../utils/toastUtil";
import InvoiceWizardStepper from "../../shared/components/billing/invoice/InvoiceWizardStepper";
import { useFetchCountries } from "../../hooks/resource";

// Available providers
const PROVIDERS = [
  { value: "zadara", label: "Zadara" },
  { value: "aws", label: "AWS" },
  { value: "azure", label: "Azure" },
  { value: "gcp", label: "Google Cloud" },
];

// Service icons
const SERVICE_ICONS = {
  compute: Server,
  object_storage: Database,
  network: Globe, // Added network service icon
};

/**
 * Service configuration card for enabling/configuring a service
 */
const ServiceConfigCard = ({
  serviceType,
  serviceConfig,
  enabled,
  onToggle,
  fulfillmentMode,
  onModeChange,
  credentials,
  onCredentialChange,
  onTestConnection,
  status = "not_configured",
  testing = false,
}) => {
  const Icon = SERVICE_ICONS[serviceType] || Server;
  const label = serviceConfig?.label || serviceType;
  const description = serviceConfig?.description || "";
  const fields = serviceConfig?.fields || {};

  const getInputType = (fieldDef) => {
    if (fieldDef.type === "password") return "password";
    if (fieldDef.type === "number") return "number";
    if (fieldDef.type === "email") return "email";
    if (fieldDef.type === "url") return "url";
    return "text";
  };

  return (
    <div
      className={`rounded-2xl border-2 transition-all ${
        enabled ? "border-blue-500 bg-blue-50/30" : "border-gray-200 bg-white hover:border-gray-300"
      }`}
    >
      {/* Header with toggle */}
      <div className="flex items-center justify-between p-4 cursor-pointer" onClick={onToggle}>
        <div className="flex items-center gap-3">
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-xl ${
              enabled ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-500"
            }`}
          >
            <Icon className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{label}</h3>
            <p className="text-sm text-gray-500">{description}</p>
          </div>
        </div>
        <div
          className={`flex h-6 w-6 items-center justify-center rounded-full border-2 ${
            enabled ? "border-blue-500 bg-blue-500" : "border-gray-300"
          }`}
        >
          {enabled && <Check className="h-4 w-4 text-white" />}
        </div>
      </div>

      {/* Expanded configuration when enabled */}
      {enabled && (
        <div className="border-t border-blue-200 p-4 space-y-4">
          {/* Status Banner */}
          {fulfillmentMode === "automated" && (
            <div
              className={`p-3 rounded-lg flex items-center gap-2 text-sm font-medium ${
                status === "connected"
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : "bg-gray-50 text-gray-600 border border-gray-200"
              }`}
            >
              {status === "connected" ? (
                <>
                  <Check className="h-4 w-4" />
                  <span>Connection Verified</span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-4 w-4" />
                  <span>Not Connected</span>
                </>
              )}
            </div>
          )}

          {/* Fulfillment Mode */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Fulfillment Mode</p>
            <div className="flex gap-4">
              <label
                className={`flex-1 flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                  fulfillmentMode === "manual"
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <input
                  type="radio"
                  name={`${serviceType}-mode`}
                  value="manual"
                  checked={fulfillmentMode === "manual"}
                  onChange={() => onModeChange("manual")}
                  className="sr-only"
                />
                <div
                  className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                    fulfillmentMode === "manual" ? "border-blue-500" : "border-gray-300"
                  }`}
                >
                  {fulfillmentMode === "manual" && (
                    <div className="h-2 w-2 rounded-full bg-blue-500" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-900">Manual</p>
                  <p className="text-xs text-gray-500">Process orders manually</p>
                </div>
              </label>

              <label
                className={`flex-1 flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                  fulfillmentMode === "automated"
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <input
                  type="radio"
                  name={`${serviceType}-mode`}
                  value="automated"
                  checked={fulfillmentMode === "automated"}
                  onChange={() => onModeChange("automated")}
                  className="sr-only"
                />
                <div
                  className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                    fulfillmentMode === "automated" ? "border-blue-500" : "border-gray-300"
                  }`}
                >
                  {fulfillmentMode === "automated" && (
                    <div className="h-2 w-2 rounded-full bg-blue-500" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-900">Automated</p>
                  <p className="text-xs text-gray-500">Requires credentials</p>
                </div>
              </label>
            </div>
          </div>

          {/* Credentials Form (only for automated) */}
          {fulfillmentMode === "automated" && Object.keys(fields).length > 0 && (
            <div className="space-y-3 pt-2">
              <p className="text-sm font-medium text-gray-700">Credentials</p>
              <div className="grid gap-3 md:grid-cols-2">
                {Object.entries(fields).map(([fieldName, fieldDef]) => (
                  <ModernInput
                    key={fieldName}
                    label={`${fieldDef.label}${fieldDef.required ? "" : " (optional)"}`}
                    name={fieldName}
                    type={getInputType(fieldDef)}
                    value={credentials[fieldName] || ""}
                    onChange={(e) => onCredentialChange(fieldName, e.target.value)}
                    placeholder={fieldDef.placeholder || ""}
                    helper={fieldDef.help}
                    required={fieldDef.required}
                  />
                ))}
              </div>
              <div className="flex items-center gap-3">
                <ModernButton
                  type="button"
                  variant={status === "connected" ? "outline" : "secondary"}
                  className="w-full md:w-auto"
                  onClick={onTestConnection}
                  disabled={testing}
                >
                  {testing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  {testing
                    ? "Testing..."
                    : status === "connected"
                      ? "Re-test Connection"
                      : "Test Connection"}
                </ModernButton>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Main Region Create Page
 */
const RegionCreate = () => {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [providerServices, setProviderServices] = useState(null);
  const [loadingServices, setLoadingServices] = useState(false);
  const { data: countries = [] } = useFetchCountries();
  const [codeManuallyEdited, setCodeManuallyEdited] = useState(false);

  // Wizard State
  const [currentStep, setCurrentStep] = useState(0);
  const steps = ["Region Details", "Service Configuration"];

  // Basic region info
  const [regionData, setRegionData] = useState({
    name: "",
    code: "",
    country_code: "",
    city: "",
    provider: "zadara",
    is_active: true,
    visibility: "public",
    fast_track_mode: "disabled",
  });

  // Services configuration (keyed by service type)
  const [serviceConfigs, setServiceConfigs] = useState({});
  const [testingService, setTestingService] = useState({});
  const [connectedServices, setConnectedServices] = useState(new Set()); // Set of verified service types

  // Fetch provider services when provider changes
  useEffect(() => {
    const fetchServices = async () => {
      if (!regionData.provider) return;

      setLoadingServices(true);
      try {
        const res = await adminRegionApi.getProviderServices(regionData.provider);
        if (res.success) {
          setProviderServices(res.data);

          // Initialize service configs
          const services = res.data?.services || {};
          const initialConfigs = {};
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

    fetchServices();
  }, [regionData.provider]);

  const handleRegionChange = (field, value) => {
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
  };

  const handleServiceToggle = (serviceType) => {
    setServiceConfigs((prev) => ({
      ...prev,
      [serviceType]: {
        ...prev[serviceType],
        enabled: !prev[serviceType]?.enabled,
      },
    }));
  };

  const handleModeChange = (serviceType, mode) => {
    setServiceConfigs((prev) => ({
      ...prev,
      [serviceType]: {
        ...prev[serviceType],
        mode,
      },
    }));
  };

  const handleCredentialChange = (serviceType, fieldName, value) => {
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
  };

  const handleTestConnection = async (serviceType) => {
    const config = serviceConfigs[serviceType];
    if (!config || config.mode !== "automated") return;

    setTestingService((prev) => ({ ...prev, [serviceType]: true }));
    try {
      const res = await adminRegionApi.verifyProviderServiceCredentials(
        regionData.provider,
        serviceType,
        config.credentials
      );
      if (res.success) {
        ToastUtils.success(`${serviceType} verified successfully`);
        setConnectedServices((prev) => new Set(prev).add(serviceType));
      }
    } catch (error) {
      console.error(`Verification failed for ${serviceType}:`, error);
      ToastUtils.error(error.message || "Verification failed");
      setConnectedServices((prev) => {
        const next = new Set(prev);
        next.delete(serviceType);
        return next;
      });
    } finally {
      setTestingService((prev) => ({ ...prev, [serviceType]: false }));
    }
  };

  const handleNext = () => {
    if (currentStep === 0) {
      // Basic validation for Step 1
      if (!regionData.name || !regionData.code || !regionData.provider) {
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

    // Validation
    if (!regionData.name || !regionData.code || !regionData.provider) {
      ToastUtils.error("Please fill in all required fields");
      return;
    }

    // Check if at least one service is enabled
    const enabledServices = Object.entries(serviceConfigs).filter(([_, cfg]) => cfg.enabled);
    if (enabledServices.length === 0) {
      ToastUtils.error("Please enable at least one service for this region");
      return;
    }

    // Enforce at least one connected automated service if any automated are selected
    const automatedServices = enabledServices.filter(([_, cfg]) => cfg.mode === "automated");
    if (automatedServices.length > 0 && connectedServices.size === 0) {
      ToastUtils.error(
        "Please verify credentials for at least one service before creating the region"
      );
      return;
    }

    setSubmitting(true);
    try {
      // Create region first
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

      // Store credentials for each automated service after verification
      for (const [serviceType, config] of enabledServices) {
        if (config.mode === "automated" && Object.keys(config.credentials).length > 0) {
          try {
            const isAlreadyVerified = connectedServices.has(serviceType);

            await adminRegionApi.storeServiceCredentials(
              newRegionId,
              serviceType,
              config.credentials,
              isAlreadyVerified // skipVerification if true
            );
          } catch (credError) {
            console.error(`Failed to verify/store ${serviceType} credentials:`, credError);
            // Continue with other services
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

  const services = (() => {
    const all = providerServices?.services || {};
    if (regionData.provider === "zadara") {
      // User requested only Compute and Storage for Zadara
      const allowed = ["compute", "object_storage"];
      return Object.fromEntries(Object.entries(all).filter(([key]) => allowed.includes(key)));
    }
    return all;
  })();

  return (
    <>
      <AdminHeadbar />
      <AdminSidebar />
      <AdminPageShell
        title="Create New Region"
        description="Set up a new data center region in a few steps"
        contentClassName="max-w-full pb-32" // Added padding bottom for footer
      >
        <div className="mb-8 max-w-3xl mx-auto">
          <InvoiceWizardStepper currentStep={currentStep} steps={steps} />
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Step 1: Region Details */}
          {currentStep === 0 && (
            <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <ModernCard title="Region Information" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <ModernInput
                    label="Region Name"
                    name="name"
                    value={regionData.name}
                    onChange={(e) => handleRegionChange("name", e.target.value)}
                    placeholder="e.g., Lagos"
                    required
                    icon={<MapPin className="h-4 w-4" />}
                  />
                  <ModernInput
                    label="Region Code"
                    name="code"
                    value={regionData.code}
                    onChange={(e) => handleRegionChange("code", e.target.value)}
                    placeholder="e.g., lagos-1"
                    required
                    helper="Unique identifier for this region"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                    <div className="relative">
                      <select
                        name="country_code"
                        value={regionData.country_code}
                        onChange={(e) => handleRegionChange("country_code", e.target.value)}
                        className="w-full appearance-none rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 pl-10"
                      >
                        <option value="">Select a country...</option>
                        {countries.map((c: any) => (
                          <option key={c.id || c.code} value={c.code || c.iso2}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                      <Globe className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                      <ChevronRight className="absolute right-3 top-2.5 h-4 w-4 rotate-90 text-gray-400" />
                    </div>
                  </div>
                  <ModernInput
                    label="City"
                    name="city"
                    value={regionData.city}
                    onChange={(e) => handleRegionChange("city", e.target.value)}
                    placeholder="e.g., Lagos"
                    icon={<Building className="h-4 w-4" />}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cloud Provider
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {PROVIDERS.map((provider) => (
                      <label
                        key={provider.value}
                        className={`flex items-center justify-center p-3 rounded-xl border-2 cursor-pointer transition-all ${
                          regionData.provider === provider.value
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <input
                          type="radio"
                          name="provider"
                          value={provider.value}
                          checked={regionData.provider === provider.value}
                          onChange={(e) => handleRegionChange("provider", e.target.value)}
                          className="sr-only"
                        />
                        <span
                          className={`font-medium ${
                            regionData.provider === provider.value
                              ? "text-blue-600"
                              : "text-gray-700"
                          }`}
                        >
                          {provider.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </ModernCard>

              <ModernCard title="Availability & Access" className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Region Visibility
                    </label>
                    <div className="flex rounded-xl bg-gray-100 p-1 border border-gray-200">
                      <button
                        type="button"
                        onClick={() => handleRegionChange("visibility", "public")}
                        className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition-all ${
                          regionData.visibility === "public"
                            ? "bg-white text-blue-600 shadow-sm ring-1 ring-gray-200"
                            : "text-gray-500 hover:text-gray-900"
                        }`}
                      >
                        <Globe className="h-4 w-4" />
                        Public
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRegionChange("visibility", "private")}
                        className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition-all ${
                          regionData.visibility === "private"
                            ? "bg-white text-amber-600 shadow-sm ring-1 ring-gray-200"
                            : "text-gray-500 hover:text-gray-900"
                        }`}
                      >
                        <AlertCircle className="h-4 w-4" />
                        Private
                      </button>
                    </div>
                    <p className="mt-2 text-xs text-gray-500">
                      {regionData.visibility === "public"
                        ? "Public regions are visible to all tenants."
                        : "Private regions are restricted."}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fast Track Access
                    </label>
                    <div className="relative">
                      <select
                        value={regionData.fast_track_mode}
                        onChange={(e) => handleRegionChange("fast_track_mode", e.target.value)}
                        className="w-full appearance-none rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                      >
                        <option value="disabled">Disabled (Standard)</option>
                        <option value="owner_only">Owner Only</option>
                        <option value="grant_only">Grant Based</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-400">
                        <ChevronRight className="h-4 w-4 rotate-90" />
                      </div>
                    </div>
                    <p className="mt-2 text-xs text-gray-500">
                      {regionData.fast_track_mode === "disabled" &&
                        "Standard visibility rules apply."}
                      {regionData.fast_track_mode === "owner_only" &&
                        "Only the owning tenant can access this region."}
                      {regionData.fast_track_mode === "grant_only" && (
                        <span className="text-blue-600 font-medium">
                          You will be redirected to configure specific tenant grants after creation.
                        </span>
                      )}
                    </p>
                  </div>
                </div>
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
