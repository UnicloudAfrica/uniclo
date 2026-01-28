// @ts-nocheck
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AlertCircle, Loader2, MapPin, Save, Globe, Server, Database, Check } from "lucide-react";
import adminRegionApi from "../../services/adminRegionApi";
import { useFetchTenants } from "../../hooks/adminHooks";
import { useFetchCountries } from "../../hooks/resource";
import ToastUtils from "../../utils/toastUtil";
import AdminPageShell from "../components/AdminPageShell.tsx";
import { ModernCard } from "../../shared/components/ui";
import { ModernButton } from "../../shared/components/ui";
import ModernInput from "../../shared/components/ui/ModernInput";
import StatusPill from "../../shared/components/ui/StatusPill";
import { designTokens } from "../../styles/designTokens";

const statusOptions = [
  { value: "healthy", label: "Healthy" },
  { value: "degraded", label: "Degraded" },
  { value: "down", label: "Down" },
];

const statusToneMap: Record<string, "success" | "warning" | "danger" | "info" | "neutral"> = {
  healthy: "success",
  degraded: "warning",
  down: "danger",
};

const statusLabelMap: Record<string, string> = {
  healthy: "Healthy",
  degraded: "Degraded",
  down: "Down",
};

const formatSegment = (value: any) => {
  if (!value) return "";
  return value
    .toString()
    .split(/[_-]/)
    .filter(Boolean)
    .map((segment: any) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
};

// Service icons
const SERVICE_ICONS = {
  compute: Server,
  object_storage: Database,
  network: Globe,
};

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
  isExistingConnection = false, // New prop to indicate credentials already exist
}) => {
  const Icon = SERVICE_ICONS[serviceType] || Server;
  const label = serviceConfig?.label || serviceType;
  const description = serviceConfig?.description || "";
  const fields = serviceConfig?.fields || {};
  const [showUpdateForm, setShowUpdateForm] = useState(false);

  const getInputType = (fieldDef) => {
    if (fieldDef.type === "password") return "password";
    if (fieldDef.type === "number") return "number";
    if (fieldDef.type === "email") return "email";
    if (fieldDef.type === "url") return "url";
    return "text";
  };

  // Determine if we should show the credential form
  const hasCredentialsEntered = Object.values(credentials || {}).some((v) => v && v !== "");
  const shouldShowCredentialsForm =
    !isExistingConnection || showUpdateForm || hasCredentialsEntered;

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
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900">{label}</h3>
              {/* Verified indicator - shows even when collapsed */}
              {(status === "connected" || status === "verified") && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                  <Check className="h-3 w-3" />
                  Verified
                </span>
              )}
            </div>
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
                status === "connected" || status === "verified"
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : "bg-gray-50 text-gray-600 border border-gray-200"
              }`}
            >
              {status === "connected" || status === "verified" ? (
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

              {/* Show existing connection message when credentials are already saved */}
              {isExistingConnection && !showUpdateForm && !hasCredentialsEntered && (
                <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Check className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="text-sm font-medium text-blue-800">
                          Credentials are configured
                        </p>
                        <p className="text-xs text-blue-600">
                          Your credentials are securely stored. Click update to modify them.
                        </p>
                      </div>
                    </div>
                    <ModernButton
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowUpdateForm(true)}
                    >
                      Update Credentials
                    </ModernButton>
                  </div>
                </div>
              )}

              {/* Show form when updating or for new connections */}
              {shouldShowCredentialsForm && (
                <>
                  <div className="grid gap-3 md:grid-cols-2">
                    {Object.entries(fields).map(([fieldName, fieldDef]) => (
                      <ModernInput
                        key={fieldName}
                        label={`${fieldDef.label}${fieldDef.required ? "" : " (optional)"}`}
                        name={fieldName}
                        type={getInputType(fieldDef)}
                        value={credentials[fieldName] || ""}
                        onChange={(e) => onCredentialChange(fieldName, e.target.value)}
                        placeholder={
                          isExistingConnection
                            ? "Enter new value to update..."
                            : fieldDef.placeholder || ""
                        }
                        helper={fieldDef.help}
                        required={!isExistingConnection && fieldDef.required}
                      />
                    ))}
                  </div>
                  <div className="flex items-center gap-3">
                    <ModernButton
                      type="button"
                      variant={
                        status === "connected" || status === "verified" ? "outline" : "secondary"
                      }
                      className="w-full md:w-auto"
                      onClick={onTestConnection}
                      disabled={testing}
                    >
                      {testing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      {testing
                        ? "Testing..."
                        : status === "connected" || status === "verified"
                          ? "Re-test Connection"
                          : "Test Connection"}
                    </ModernButton>
                    {isExistingConnection && showUpdateForm && (
                      <ModernButton
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowUpdateForm(false)}
                      >
                        Cancel
                      </ModernButton>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const RegionEdit = () => {
  const { id: code } = useParams();
  const navigate = useNavigate();
  const [region, setRegion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { data: tenantsData } = useFetchTenants();
  const tenants = tenantsData?.data || [];
  const { data: countries = [] } = useFetchCountries();
  const [selectedTenantsToGrant, setSelectedTenantsToGrant] = useState<string[]>([]);
  const [tenantSearch, setTenantSearch] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    country_code: "",
    city: "",
    status: "healthy",
    is_active: true,
    visibility: "public",
  });
  const [errors, setErrors] = useState({});
  const [providerServices, setProviderServices] = useState(null);
  const [serviceConfigs, setServiceConfigs] = useState({});
  const [testingService, setTestingService] = useState({});
  const [connectedServices, setConnectedServices] = useState(new Set()); // Set of verified service types
  const [originalConfigs, setOriginalConfigs] = useState({}); // To track changes

  const formId = "region-edit-form";

  useEffect(() => {
    fetchRegionDetail();
  }, [code]);

  const fetchRegionDetail = async () => {
    try {
      setLoading(true);
      const response = await adminRegionApi.fetchRegionByCode(code);
      const regionData = response.data;
      setRegion(regionData);
      setFormData({
        name: regionData.name || "",
        code: regionData.code || "",
        country_code: regionData.country_code || "",
        city: regionData.city || "",
        status: regionData.status || "healthy",
        is_active: regionData.is_active !== undefined ? regionData.is_active : true,
        visibility: regionData.visibility || "public",
      });

      // Fetch services and credentials
      if (regionData.provider) {
        // 1. Get definitions
        const servicesRes = await adminRegionApi.getProviderServices(regionData.provider);
        const servicesDef = servicesRes.data?.services || {};
        setProviderServices(servicesRes.data);

        // 2. Get current status/config
        const credsRes = await adminRegionApi.getCredentialStatus(regionData.code);
        const currentCreds = credsRes.data?.credentials || {}; // Fix: access credentials nested object

        const initialConfigs = {};
        const verifiedSet = new Set();

        Object.keys(servicesDef).forEach((serviceType) => {
          const existing = currentCreds[serviceType];
          // Check if service has credentials configured
          const isConfigured = existing?.configured === true;
          // Check if it's verified (status field from backend)
          const isVerified = existing?.status === "verified";

          initialConfigs[serviceType] = {
            enabled: isConfigured,
            mode: isConfigured ? "automated" : "manual", // If has credentials, it's automated
            credentials: {}, // Credentials are not returned for security, user needs to re-enter to change
          };

          if (isVerified) {
            verifiedSet.add(serviceType);
          }
        });
        setServiceConfigs(initialConfigs);
        setOriginalConfigs(JSON.parse(JSON.stringify(initialConfigs))); // Deep copy for comparison
        setConnectedServices(verifiedSet);
      }
    } catch (error) {
      console.error("Error fetching region:", error);
      ToastUtils.error("Failed to load region details");
    } finally {
      setLoading(false);
    }
  };
  const handleChange = (event: any) => {
    const { name, value, type, checked } = event.target;
    setFormData((prev) => {
      const updatedValue =
        type === "checkbox" ? checked : name === "country_code" ? value.toUpperCase() : value;
      return { ...prev, [name]: updatedValue };
    });
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };
  const handleStatusChange = (event: any) => {
    const { value } = event.target;
    setFormData((prev) => ({ ...prev, status: value }));
    if (errors.status) {
      setErrors((prev) => ({ ...prev, status: "" }));
    }
  };
  const toggleActiveState = () => {
    setFormData((prev) => ({ ...prev, is_active: !prev.is_active }));
  };
  const validate = () => {
    const nextErrors = {};
    if (!formData.name.trim()) nextErrors.name = "Region name is required";
    if (!formData.country_code.trim()) nextErrors.country_code = "Country code is required";

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
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
    // Invalidate connection status on change if it was verified
    if (connectedServices.has(serviceType)) {
      setConnectedServices((prev) => {
        const next = new Set(prev);
        next.delete(serviceType);
        return next;
      });
    }
  };

  const handleTestConnection = async (serviceType) => {
    const config = serviceConfigs[serviceType];
    if (!config || config.mode !== "automated") return;

    setTestingService((prev) => ({ ...prev, [serviceType]: true }));
    try {
      // For existing regions, use storeServiceCredentials which verifies AND stores
      // This ensures credentials persist after page refresh
      const res = await adminRegionApi.storeServiceCredentials(
        region.code,
        serviceType,
        config.credentials
      );
      if (res.success) {
        ToastUtils.success(`${serviceType} verified and saved successfully`);
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

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;

    try {
      setSubmitting(true);

      // Update basic details
      await adminRegionApi.updateRegion(code, {
        name: formData.name.trim(),
        country_code: formData.country_code.trim(),
        city: formData.city.trim(),
        status: formData.status,
        is_active: formData.is_active,
      });

      // Update Visibility if changed
      if (formData.visibility !== region.visibility) {
        await adminRegionApi.updateVisibility(region.code, formData.visibility);
      }

      // Update Services
      // Logic:
      // 1. If service disabled -> delete credentials (disconnect)
      // 2. If service enabled and changed -> store credentials
      // 3. If service enabled and unchanged -> do nothing

      for (const [serviceType, config] of Object.entries(serviceConfigs)) {
        const original = originalConfigs[serviceType] || { enabled: false };

        if (!config.enabled && original.enabled) {
          // Service was disabled, remove credentials
          await adminRegionApi.deleteServiceCredentials(region.code, serviceType);
        } else if (config.enabled) {
          // Service is enabled
          // Check if needs update (credentials changed or mode changed or was/is new)
          // Crude check: JSON stringify comparison or dirty flag.
          // Simplest: Always update if enabled? Or just if verified?
          // "Test Connection" marks it as connected.
          // If Automated and Connected, we store.
          // If Manual, we just store (mode change).

          if (config.mode === "automated") {
            if (Object.keys(config.credentials).length > 0) {
              const isVerified = connectedServices.has(serviceType);
              // Only store if we have credentials.
              // If verification was skipped (user didn't test) we can try to verify?
              // Or just store with verify=true (default storeServiceCredentials calls verifyAndStoreService)

              // Optimize: If credentials haven't changed and already verified, skip?
              // For now, let's just save.
              await adminRegionApi.storeServiceCredentials(
                region.code,
                serviceType,
                config.credentials,
                isVerified // skip verification if already tested in UI
              );
            }
          } else {
            // Manual mode - no credentials to store, but maybe backend tracks "enabled" via presence of record?
            // storeServiceCredentials handles mode? Backend MspCredentialService usually keys by service.
            // If manual, we might store empty credentials or a flag.
            // Current backend implementation of storeServiceCredentials expects credentials array.
            // If manual, we probably don't need to call storeServiceCredentials?
            // Wait, how do we "enable" a manual service?
            // The backend `getCredentialStatus` returns list of services with credentials.
            // If manual, maybe we just don't store credentials?
            // But we need to record that it IS enabled.
            // If the system implies "Enabled = Has Credentials", then Manual services might not be "installable" in this sense,
            // OR we store a dummy record.
            // let's assume for now we only strictly manage Automated credentials here.
          }
        }
      }

      ToastUtils.success("Region updated successfully");
      navigate(`/admin-dashboard/regions/${formData.code}`);
    } catch (error) {
      console.error("Error updating region:", error);
      ToastUtils.error(error.message || "Failed to update region");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRevokeFastTrack = async (tenantId: string) => {
    try {
      await adminRegionApi.revokeFastTrack(region.code, tenantId);
      ToastUtils.success("Fast Track access revoked successfully");
      fetchRegionDetail();
    } catch (error) {
      console.error("Error revoking Fast Track:", error);
      ToastUtils.error(error.message || "Failed to revoke Fast Track access");
    }
  };
  const locationLabel = useMemo(() => {
    const parts = [formData.city, formData.country_code].filter(Boolean);
    return parts.join(", ");
  }, [formData.city, formData.country_code]);

  const headerMeta = useMemo(() => {
    if (!region) return null;
    return (
      <div className="flex flex-wrap items-center gap-2">
        <StatusPill
          label={
            statusLabelMap[formData.status] || formatSegment(formData.status) || "Status Unknown"
          }
          tone={statusToneMap[formData.status] || "info"}
        />
        <StatusPill
          label={formData.is_active ? "Active" : "Inactive"}
          tone={formData.is_active ? "success" : "warning"}
        />
        {region.ownership_type && (
          <StatusPill label={`${formatSegment(region.ownership_type)} Ownership`} tone="neutral" />
        )}
      </div>
    );
  }, [region, formData.status, formData.is_active]);

  const headerActions = useMemo(() => {
    if (!region) return null;
    return (
      <div className="flex flex-wrap gap-2">
        <ModernButton
          variant="ghost"
          size="sm"
          onClick={() => navigate(`/admin-dashboard/regions/${region.code}`)}
        >
          View Region
        </ModernButton>
        <ModernButton
          variant="primary"
          size="sm"
          type="submit"
          form={formId}
          isLoading={submitting}
          isDisabled={submitting}
          className="flex items-center gap-2"
        >
          <Save size={16} />
          Save Changes
        </ModernButton>
      </div>
    );
  }, [region, submitting, navigate]);

  const renderLoadingShell = () => (
    <AdminPageShell
      title="Edit Region"
      description="Update region configuration."
      contentClassName="flex min-h-[60vh] items-center justify-center"
    >
      <Loader2
        className="h-10 w-10 animate-spin"
        style={{ color: designTokens.colors.primary[500] }}
      />
    </AdminPageShell>
  );

  const renderNotFoundShell = () => (
    <AdminPageShell
      title="Edit Region"
      description="Update region configuration."
      contentClassName="flex min-h-[60vh] items-center justify-center"
      actions={
        <ModernButton variant="outline" onClick={() => navigate("/admin-dashboard/regions")}>
          Back to Regions
        </ModernButton>
      }
    >
      <ModernCard className="max-w-md space-y-3 text-center">
        <AlertCircle className="mx-auto h-10 w-10 text-red-500" />
        <p className="text-sm text-gray-600">
          We could not find this region. It may have been removed.
        </p>
      </ModernCard>
    </AdminPageShell>
  );

  if (loading) {
    return <>{renderLoadingShell()}</>;
  }

  if (!region) {
    return <>{renderNotFoundShell()}</>;
  }

  return (
    <>
      <AdminPageShell
        title={`Edit ${region.name || region.code}`}
        description={
          locationLabel ? `${locationLabel} • ${formData.code}` : `Region Code: ${formData.code}`
        }
        subHeaderContent={headerMeta}
        actions={headerActions}
        contentClassName="space-y-8"
      >
        <div className="space-y-8">
          <div className="brand-hero rounded-[32px] text-white shadow-2xl">
            <div className="relative p-6 sm:p-8 lg:p-10">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-3">
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-white/70">
                    Edit Region
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                      {formData.name || region.name || "Region"}
                    </h2>
                    <p className="text-sm text-white/80 sm:text-base">
                      {locationLabel || "Location not specified"} • {formData.code}
                    </p>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
                  <div className="rounded-2xl bg-white/10 px-4 py-3 backdrop-blur">
                    <p className="text-xs font-medium uppercase tracking-wide text-white/70">
                      Provider
                    </p>
                    <p className="mt-2 text-lg font-semibold text-white capitalize">
                      {region?.provider || "—not set"}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white/10 px-4 py-3 backdrop-blur">
                    <p className="text-xs font-medium uppercase tracking-wide text-white/70">
                      Active State
                    </p>
                    <p className="mt-2 text-lg font-semibold text-white">
                      {formData.is_active ? "Active" : "Inactive"}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white/10 px-4 py-3 backdrop-blur">
                    <p className="text-xs font-medium uppercase tracking-wide text-white/70">
                      Country
                    </p>
                    <p className="mt-2 text-sm font-semibold text-white">
                      {formData.country_code || "—not set"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <form id={formId} onSubmit={handleSubmit} className="space-y-6">
            <ModernCard title="Identity & Routing" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <ModernInput
                  label="Region Name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g., Lagos Region 1"
                  required
                  error={errors.name}
                />

                <ModernInput
                  label="Region Code"
                  name="code"
                  value={formData.code}
                  disabled
                  helper="Region codes cannot be changed."
                />
              </div>
            </ModernCard>

            <ModernCard title="Location & Status" className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Country Code
                  </label>
                  <div className="relative">
                    <select
                      name="country_code"
                      value={formData.country_code}
                      onChange={handleChange}
                      className="w-full appearance-none rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 pl-10"
                    >
                      <option value="">Select a country...</option>
                      {countries.map((c: any) => (
                        <option key={c.id || c.code} value={c.code || c.iso2}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                    <Globe className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <Check
                      className={`absolute right-3 top-2.5 h-4 w-4 ${formData.country_code ? "text-green-500" : "text-transparent"}`}
                    />
                  </div>
                  {errors.country_code && (
                    <p className="mt-1 text-sm text-red-500">{errors.country_code}</p>
                  )}
                </div>

                <ModernInput
                  label="City"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="Lagos"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Operational Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleStatusChange}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  >
                    {statusOptions.map((option: any) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col justify-end">
                  <span className="mb-2 text-sm font-medium text-gray-700">Active Region</span>
                  <div className="flex items-center justify-between rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-gray-900">
                        {formData.is_active ? "Active" : "Inactive"}
                      </span>
                      <span className="text-xs text-gray-500">
                        Toggle availability for provisioning workflows.
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={toggleActiveState}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                        formData.is_active ? "bg-blue-500" : "bg-gray-300"
                      }`}
                      aria-pressed={formData.is_active}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${
                          formData.is_active ? "translate-x-5" : "translate-x-1"
                        }`}
                      />
                      <span className="sr-only">Toggle active state</span>
                    </button>
                  </div>
                </div>
              </div>
            </ModernCard>

            <ModernCard title="Region Access & Visibility" className="space-y-4">
              <div className="flex gap-4">
                <label
                  className={`flex-1 flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                    formData.visibility === "public"
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200"
                  }`}
                >
                  <input
                    type="radio"
                    name="visibility"
                    value="public"
                    checked={formData.visibility === "public"}
                    onChange={() => setFormData((p) => ({ ...p, visibility: "public" }))}
                    className="sr-only"
                  />
                  <Globe
                    className={`h-5 w-5 ${formData.visibility === "public" ? "text-blue-500" : "text-gray-400"}`}
                  />
                  <div>
                    <p className="font-medium text-gray-900">Public</p>
                    <p className="text-xs text-gray-500">Available for new provisioning & access</p>
                  </div>
                </label>
                <label
                  className={`flex-1 flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                    formData.visibility === "private"
                      ? "border-amber-500 bg-amber-50"
                      : "border-gray-200"
                  }`}
                >
                  <input
                    type="radio"
                    name="visibility"
                    value="private"
                    checked={formData.visibility === "private"}
                    onChange={() => setFormData((p) => ({ ...p, visibility: "private" }))}
                    className="sr-only"
                  />
                  <AlertCircle
                    className={`h-5 w-5 ${formData.visibility === "private" ? "text-amber-500" : "text-gray-400"}`}
                  />
                  <div>
                    <p className="font-medium text-gray-900">Private</p>
                    <p className="text-xs text-gray-500">
                      Restricted to existing resources (No new provisioning)
                    </p>
                  </div>
                </label>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-gray-900">
                      Admin Approval Status
                    </span>
                    <span className="text-xs text-gray-500">
                      Required for any access (public or private).
                    </span>
                  </div>
                  <div
                    className={`px-3 py-1 rounded-full text-xs font-medium border ${
                      region?.is_verified
                        ? "bg-green-50 text-green-700 border-green-200"
                        : "bg-yellow-50 text-yellow-700 border-yellow-200"
                    }`}
                  >
                    {region?.is_verified ? "Approved" : "Pending Approval"}
                  </div>
                </div>
                {!region?.is_verified && (
                  <div className="mt-3">
                    <ModernButton
                      variant="primary"
                      size="sm"
                      className="w-full"
                      onClick={async () => {
                        try {
                          await adminRegionApi.verifyRegion(region.code);
                          // Update local state immediately to reflect the change
                          setRegion((prev) => ({
                            ...prev,
                            is_verified: true,
                            approval_status: "approved",
                          }));
                          ToastUtils.success("Region approved successfully");
                        } catch (e) {
                          console.error(e);
                          ToastUtils.error("Failed to approve region");
                        }
                      }}
                    >
                      Approve Region
                    </ModernButton>
                  </div>
                )}
                {region?.is_verified && (
                  <div className="mt-3">
                    <ModernButton
                      variant="outline"
                      size="sm"
                      className="w-full text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-200"
                      onClick={async () => {
                        if (
                          window.confirm(
                            "Are you sure you want to revoke approval for this region? It will immediately become inaccessible to tenants."
                          )
                        ) {
                          try {
                            setSubmitting(true);
                            const res = await adminRegionApi.unverifyRegion(code);
                            if (res.success) {
                              ToastUtils.success("Region approval revoked");
                              // Update local state
                              setRegion((prev) => ({
                                ...prev,
                                is_verified: false,
                                approval_status: "pending",
                              }));
                            }
                          } catch (error) {
                            console.error("Error revoking region:", error);
                            ToastUtils.error(error.message || "Failed to revoke region");
                          } finally {
                            setSubmitting(false);
                          }
                        }
                      }}
                    >
                      Revoke Approval
                    </ModernButton>
                  </div>
                )}
              </div>
            </ModernCard>

            <ModernCard title="Fast Track Configuration" className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Fast Track Access Mode
                  </label>
                  <p className="text-xs text-gray-500 mb-3">
                    Control how tenants can bypass standard visibility rules or access
                    restricted/private regions.
                  </p>
                  <div className="grid gap-4 md:grid-cols-3">
                    <label
                      className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${region?.fast_track_mode === "disabled" ? "border-red-500 bg-red-50" : "border-gray-200"}`}
                    >
                      <input
                        type="radio"
                        name="fast_track_mode"
                        value="disabled"
                        checked={region?.fast_track_mode === "disabled"}
                        onChange={async () => {
                          try {
                            await adminRegionApi.updateFastTrackSettings(region.id, {
                              fast_track_mode: "disabled",
                            });
                            setRegion((prev) => ({ ...prev, fast_track_mode: "disabled" }));
                            ToastUtils.success("Fast Track disabled");
                          } catch (e) {
                            console.error(e);
                          }
                        }}
                        className="mt-1"
                      />
                      <div>
                        <p className="font-medium text-gray-900">Disabled</p>
                        <p className="text-xs text-gray-500">No fast track access allowed.</p>
                      </div>
                    </label>

                    <label
                      className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${region?.fast_track_mode === "owner_only" ? "border-blue-500 bg-blue-50" : "border-gray-200"}`}
                    >
                      <input
                        type="radio"
                        name="fast_track_mode"
                        value="owner_only"
                        checked={region?.fast_track_mode === "owner_only"}
                        onChange={async () => {
                          try {
                            await adminRegionApi.updateFastTrackSettings(region.id, {
                              fast_track_mode: "owner_only",
                            });
                            setRegion((prev) => ({ ...prev, fast_track_mode: "owner_only" }));
                            ToastUtils.success("Set to Owner Only");
                          } catch (e) {
                            console.error(e);
                          }
                        }}
                        className="mt-1"
                      />
                      <div>
                        <p className="font-medium text-gray-900">Owner Only</p>
                        <p className="text-xs text-gray-500">
                          Only the tenant who owns this region has access.
                        </p>
                      </div>
                    </label>

                    <label
                      className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${region?.fast_track_mode === "grant_only" ? "border-purple-500 bg-purple-50" : "border-gray-200"}`}
                    >
                      <input
                        type="radio"
                        name="fast_track_mode"
                        value="grant_only"
                        checked={region?.fast_track_mode === "grant_only"}
                        onChange={async () => {
                          try {
                            await adminRegionApi.updateFastTrackSettings(region.id, {
                              fast_track_mode: "grant_only",
                            });
                            setRegion((prev) => ({ ...prev, fast_track_mode: "grant_only" }));
                            ToastUtils.success("Set to Grant Based");
                          } catch (e) {
                            console.error(e);
                          }
                        }}
                        className="mt-1"
                      />
                      <div>
                        <p className="font-medium text-gray-900">Grant Based</p>
                        <p className="text-xs text-gray-500">
                          Specific tenants must be explicitly granted access.
                        </p>
                      </div>
                    </label>
                  </div>
                </div>

                {region?.fast_track_mode === "grant_only" && (
                  <div className="pt-4 border-t border-gray-100">
                    <h4 className="text-sm font-semibold text-gray-900 mb-3">Active Grants</h4>
                    <div className="space-y-3">
                      {/* Search input */}
                      <input
                        type="text"
                        placeholder="Search tenants..."
                        value={tenantSearch}
                        onChange={(e) => setTenantSearch(e.target.value)}
                        className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                      />

                      {/* Multi-select tenant list */}
                      <div className="border border-gray-200 rounded-xl max-h-56 overflow-y-auto">
                        {tenants.length === 0 ? (
                          <p className="p-3 text-sm text-gray-500">No tenants available</p>
                        ) : (
                          (() => {
                            const searchLower = tenantSearch.toLowerCase();
                            const filteredTenants = tenants.filter(
                              (t: any) =>
                                t.name?.toLowerCase().includes(searchLower) ||
                                t.email?.toLowerCase().includes(searchLower)
                            );

                            // Sort: already granted first, then ungranted
                            const sortedTenants = [...filteredTenants].sort((a: any, b: any) => {
                              const aGranted = region.fast_track_grants?.some(
                                (g: any) => g.tenant_id === a.id
                              );
                              const bGranted = region.fast_track_grants?.some(
                                (g: any) => g.tenant_id === b.id
                              );
                              if (aGranted && !bGranted) return -1;
                              if (!aGranted && bGranted) return 1;
                              return 0;
                            });

                            if (sortedTenants.length === 0) {
                              return (
                                <p className="p-3 text-sm text-gray-500">
                                  No tenants match your search
                                </p>
                              );
                            }

                            return sortedTenants.map((t: any) => {
                              const isAlreadyGranted = region.fast_track_grants?.some(
                                (g: any) => g.tenant_id === t.id
                              );
                              const isSelected = selectedTenantsToGrant.includes(t.id);

                              return (
                                <label
                                  key={t.id}
                                  className={`flex items-center gap-3 p-3 border-b border-gray-100 last:border-b-0 cursor-pointer transition-colors ${
                                    isAlreadyGranted
                                      ? "bg-green-50"
                                      : isSelected
                                        ? "bg-blue-50"
                                        : "hover:bg-gray-50"
                                  }`}
                                >
                                  {isAlreadyGranted ? (
                                    <div className="h-4 w-4 rounded border-green-500 bg-green-500 flex items-center justify-center">
                                      <Check className="h-3 w-3 text-white" />
                                    </div>
                                  ) : (
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          setSelectedTenantsToGrant((prev) => [...prev, t.id]);
                                        } else {
                                          setSelectedTenantsToGrant((prev) =>
                                            prev.filter((id) => id !== t.id)
                                          );
                                        }
                                      }}
                                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">
                                      {t.name}
                                    </p>
                                    <p className="text-xs text-gray-500 truncate">{t.email}</p>
                                  </div>
                                  {isAlreadyGranted && (
                                    <span className="text-xs text-green-600 font-medium bg-green-100 px-2 py-0.5 rounded-full">
                                      Connected
                                    </span>
                                  )}
                                </label>
                              );
                            });
                          })()
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          {selectedTenantsToGrant.length} tenant(s) selected
                        </span>
                        <ModernButton
                          type="button"
                          variant="secondary"
                          disabled={selectedTenantsToGrant.length === 0}
                          onClick={async () => {
                            if (selectedTenantsToGrant.length === 0) return;
                            try {
                              // Grant access to all selected tenants
                              for (const tenantId of selectedTenantsToGrant) {
                                await adminRegionApi.grantFastTrack(
                                  region.id,
                                  tenantId,
                                  "Manual Grant via Admin UI"
                                );
                              }
                              setSelectedTenantsToGrant([]);
                              fetchRegionDetail(); // Refresh to see new grants
                              ToastUtils.success(
                                `Granted access to ${selectedTenantsToGrant.length} tenant(s)`
                              );
                            } catch (e) {
                              console.error(e);
                              ToastUtils.error("Failed to grant access");
                            }
                          }}
                        >
                          Grant Access
                        </ModernButton>
                      </div>
                    </div>

                    {region.fast_track_grants && region.fast_track_grants.length > 0 ? (
                      <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                        {region.fast_track_grants.map((grant: any) => (
                          <div
                            key={grant.id}
                            className="flex justify-between items-center text-sm p-2 bg-white rounded border border-gray-200 shadow-sm"
                          >
                            <div className="flex flex-col">
                              <span className="font-medium text-gray-900">
                                {grant.tenant?.name || grant.tenant_id}
                              </span>
                              <span className="text-xs text-gray-500">
                                Granted: {new Date(grant.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            <ModernButton
                              title="Revoke Access"
                              variant="ghost"
                              className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 h-auto"
                              onClick={async () => {
                                if (
                                  window.confirm(
                                    "Are you sure you want to revoke Fast Track access for this tenant?"
                                  )
                                ) {
                                  handleRevokeFastTrack(grant.tenant_id);
                                }
                                fetchRegionDetail();
                              }}
                            >
                              Revoke
                            </ModernButton>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 italic">No active grants found.</p>
                    )}
                  </div>
                )}
              </div>
            </ModernCard>

            <ModernCard
              title={`Service Connections${region?.provider ? ` (${region.provider.charAt(0).toUpperCase() + region.provider.slice(1)})` : ""}`}
              className="space-y-4"
            >
              <p className="text-sm text-gray-500">Configure services available in this region.</p>

              {!region?.provider && (
                <div className="p-4 rounded-lg bg-yellow-50 border border-yellow-200">
                  <p className="text-sm font-medium text-yellow-800">
                    No cloud provider set for this region.
                  </p>
                  <p className="text-xs text-yellow-600 mt-1">
                    Provider must be configured to manage service connections.
                  </p>
                </div>
              )}

              {region?.provider && !providerServices?.services && (
                <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
                  <p className="text-sm font-medium text-gray-600">
                    Loading service configurations...
                  </p>
                </div>
              )}

              {providerServices?.services && (
                <div className="space-y-4">
                  {Object.entries(providerServices.services)
                    .filter(([serviceType]) => {
                      // Filter Zadara to only Compute and Object Storage (matching RegionCreate)
                      if (region?.provider === "zadara") {
                        return ["compute", "object_storage"].includes(serviceType);
                      }
                      return true;
                    })
                    .map(([serviceType, serviceConfig]) => (
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
                        status={
                          connectedServices.has(serviceType)
                            ? "connected"
                            : serviceConfigs[serviceType]?.enabled
                              ? "not_connected"
                              : "not_configured"
                        }
                        isExistingConnection={connectedServices.has(serviceType)}
                      />
                    ))}
                </div>
              )}
            </ModernCard>

            <ModernCard title="Review & Submit" className="space-y-3">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <MapPin className="h-5 w-5 text-blue-500" />
                  <span>
                    Changes will reflect immediately across provisioning and inventory experiences
                    for this region.
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <ModernButton
                    type="button"
                    variant="ghost"
                    onClick={() => navigate(`/admin-dashboard/regions/${region.code}`)}
                    isDisabled={submitting}
                  >
                    Cancel
                  </ModernButton>
                  <ModernButton
                    type="submit"
                    variant="primary"
                    isLoading={submitting}
                    isDisabled={submitting}
                    className="flex items-center gap-2"
                  >
                    <Save size={16} />
                    {submitting ? "Saving…" : "Save Changes"}
                  </ModernButton>
                </div>
              </div>
            </ModernCard>
          </form>
        </div>
      </AdminPageShell>
    </>
  );
};
export default RegionEdit;
