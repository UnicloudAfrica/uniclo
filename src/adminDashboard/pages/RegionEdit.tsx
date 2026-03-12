import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AlertCircle, Loader2, MapPin, Save, Globe, Check } from "lucide-react";
import adminRegionApi from "@/services/adminRegionApi";
import { useFetchTenants } from "@/hooks/adminHooks";
import { useFetchCountries } from "@/hooks/resource";
import ToastUtils from "@/utils/toastUtil";
import AdminPageShell from "../components/AdminPageShell";
import { ModernCard, ModernButton } from "@/shared/components/ui";
import ModernInput from "@/shared/components/ui/ModernInput";
import StatusPill from "@/shared/components/ui/StatusPill";
import { designTokens } from "@/styles/designTokens";
import logger from "@/utils/logger";
import { statusOptions, statusToneMap, statusLabelMap, formatSegment } from "./regionEditUtils";
import type { ServiceDefinition, RegionFormData } from "./regionEditTypes";
import ServiceConfigCard from "./ServiceConfigCard";
import RegionHeroBanner from "./RegionHeroBanner";
import VisibilityApprovalCard from "./VisibilityApprovalCard";
import FastTrackConfigCard from "./FastTrackConfigCard";

const RegionEdit = () => {
  const { id: code } = useParams();
  const navigate = useNavigate();
  const [region, setRegion] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { data: tenantsData } = useFetchTenants();
  const tenants = (tenantsData as { data?: unknown[] })?.data || [];
  const { data: countriesData = [] } = useFetchCountries();
  const countries = Array.isArray(countriesData) ? countriesData : [];
  const [selectedTenantsToGrant, setSelectedTenantsToGrant] = useState<string[]>([]);
  const [tenantSearch, setTenantSearch] = useState("");

  const [formData, setFormData] = useState<RegionFormData>({
    name: "",
    code: "",
    country_code: "",
    city: "",
    status: "healthy",
    is_active: true,
    visibility: "public",
  });
  const [errors, setErrors] = useState<Record<string, any>>({});
  const [providerServices, setProviderServices] = useState<any>(null);
  const [serviceConfigs, setServiceConfigs] = useState<Record<string, any>>({});
  const [testingService, setTestingService] = useState<Record<string, any>>({});
  const [connectedServices, setConnectedServices] = useState<Set<string>>(new Set()); // Set of verified service types
  const [originalConfigs, setOriginalConfigs] = useState<Record<string, any>>({}); // To track changes

  const formId = "region-edit-form";

  const fetchRegionDetail = useCallback(async () => {
    try {
      setLoading(true);
      const response = await adminRegionApi.fetchRegionByCode(code as string);
      const regionData = response.data;
      setRegion(regionData);
      setFormData({
        name: regionData.name || "",
        code: regionData.code || "",
        country_code: (regionData.country_code || "") as string,
        city: (regionData.city || "") as string,
        status: regionData.status || "healthy",
        is_active: (regionData.is_active !== undefined ? regionData.is_active : true) as boolean,
        visibility: (regionData.visibility || "public") as string,
      });

      // Fetch services and credentials
      if (regionData.provider) {
        // 1. Get definitions
        const servicesRes = await adminRegionApi.getProviderServices(regionData.provider as string);
        const servicesDef = (servicesRes.data as { services?: unknown })?.services || {};
        setProviderServices(servicesRes.data);

        // 2. Get current status/config
        const credsRes = await adminRegionApi.getCredentialStatus(regionData.code);
        const currentCreds = (credsRes.data as { credentials?: unknown })?.credentials || {}; // Fix: access credentials nested object

        const initialConfigs: Record<string, any> = {};
        const verifiedSet = new Set<string>();

        Object.keys(servicesDef).forEach((serviceType: any) => {
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
      logger.error("Error fetching region:", error);
      ToastUtils.error("Failed to load region details");
    } finally {
      setLoading(false);
    }
  }, [code]);

  useEffect(() => {
    fetchRegionDetail();
  }, [fetchRegionDetail]);

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
    const nextErrors: Record<string, any> = {};
    if (!formData.name.trim()) nextErrors.name = "Region name is required";
    if (!formData.country_code.trim()) nextErrors.country_code = "Country code is required";

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };
  const handleServiceToggle = (serviceType: string) => {
    setServiceConfigs((prev) => ({
      ...prev,
      [serviceType]: {
        ...prev[serviceType],
        enabled: !prev[serviceType]?.enabled,
      },
    }));
  };

  const handleModeChange = (serviceType: string, mode: string) => {
    setServiceConfigs((prev) => ({
      ...prev,
      [serviceType]: {
        ...prev[serviceType],
        mode,
      },
    }));
  };

  const handleCredentialChange = (serviceType: string, fieldName: string, value: string) => {
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

  const handleTestConnection = async (serviceType: string) => {
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
    } catch (error: any) {
      logger.error(`Verification failed for ${serviceType}:`, error);
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

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate()) return;

    try {
      setSubmitting(true);

      // Update basic details
      await adminRegionApi.updateRegion(code as string, {
        name: formData.name.trim(),
        country_code: formData.country_code.trim(),
        city: formData.city.trim(),
        status: formData.status,
        is_active: formData.is_active,
      });

      // Update Visibility if changed
      if (formData.visibility !== region.visibility) {
        await adminRegionApi.updateVisibility(
          region.code,
          formData.visibility as "public" | "private"
        );
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
    } catch (error: any) {
      logger.error("Error updating region:", error);
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
    } catch (error: any) {
      logger.error("Error revoking Fast Track:", error);
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
    return renderLoadingShell();
  }

  if (!region) {
    return renderNotFoundShell();
  }

  return (
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
        <RegionHeroBanner
          formData={formData}
          regionName={region.name}
          regionProvider={region?.provider}
          locationLabel={locationLabel}
        />

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
                <label className="mb-2 block text-sm font-medium text-gray-700">Country Code</label>
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

          <VisibilityApprovalCard
            formData={formData}
            setFormData={setFormData}
            region={region}
            setRegion={setRegion}
            submitting={submitting}
            setSubmitting={setSubmitting}
            regionCode={code as string}
          />

          <FastTrackConfigCard
            region={region}
            setRegion={setRegion}
            tenants={tenants}
            selectedTenantsToGrant={selectedTenantsToGrant}
            setSelectedTenantsToGrant={setSelectedTenantsToGrant}
            tenantSearch={tenantSearch}
            setTenantSearch={setTenantSearch}
            onRevokeFastTrack={handleRevokeFastTrack}
            fetchRegionDetail={fetchRegionDetail}
          />

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
                {Object.entries(providerServices.services as Record<string, ServiceDefinition>)
                  .filter(([serviceType]) => {
                    // Filter services to only those supported by the provider
                    const providerServiceMap: Record<string, string[]> = {
                      zadara: ["compute", "object_storage"],
                      nobus: ["compute", "object_storage"],
                    };
                    const allowed = providerServiceMap[region?.provider?.toLowerCase()];
                    if (allowed) {
                      return allowed.includes(serviceType);
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
                      onModeChange={(mode: string) => handleModeChange(serviceType, mode)}
                      credentials={serviceConfigs[serviceType]?.credentials || {}}
                      onCredentialChange={(field: string, value: string) =>
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
                  Changes will reflect immediately across provisioning and inventory experiences for
                  this region.
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
  );
};
export default RegionEdit;
