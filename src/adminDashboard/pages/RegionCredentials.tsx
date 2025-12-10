// @ts-nocheck
import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Server,
  Database,
  CheckCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
  Shield,
  Settings,
  ChevronDown,
  X,
} from "lucide-react";
import AdminHeadbar from "../components/adminHeadbar";
import AdminSidebar from "../components/AdminSidebar";
import AdminPageShell from "../components/AdminPageShell.tsx";
import { ModernCard, ModernButton } from "../../shared/components/ui";
import ModernInput from "../../shared/components/ui/ModernInput";
import StatusPill from "../../shared/components/ui/StatusPill";
import adminRegionApi from "../../services/adminRegionApi";
import ToastUtils from "../../utils/toastUtil";

// Service icons mapping
const SERVICE_ICONS = {
  compute: Server,
  object_storage: Database,
};

const SERVICE_LABELS = {
  compute: "Compute (VMs)",
  object_storage: "Object Storage",
};

/**
 * Dynamic credential form based on backend config
 */
const CredentialForm = ({ fields, values, onChange, onSubmit, onTest, submitting, testing }) => {
  const handleChange = (fieldName) => (e) => {
    onChange(fieldName, e.target.value);
  };

  const getInputType = (fieldDef) => {
    if (fieldDef.type === "password") return "password";
    if (fieldDef.type === "number") return "number";
    if (fieldDef.type === "email") return "email";
    if (fieldDef.type === "url") return "url";
    return "text";
  };

  const requiredFields = Object.entries(fields).filter(([_, def]) => def.required);
  const optionalFields = Object.entries(fields).filter(([_, def]) => !def.required);

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        {requiredFields.map(([name, def]) => (
          <ModernInput
            key={name}
            label={def.label}
            name={name}
            type={getInputType(def)}
            value={values[name] || ""}
            onChange={handleChange(name)}
            placeholder={def.placeholder || ""}
            helper={def.help}
            required
            disabled={submitting || testing}
          />
        ))}
      </div>

      {optionalFields.length > 0 && (
        <>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500 pt-2">Optional</p>
          <div className="grid gap-4 md:grid-cols-2">
            {optionalFields.map(([name, def]) => (
              <ModernInput
                key={name}
                label={def.label}
                name={name}
                type={getInputType(def)}
                value={values[name] || ""}
                onChange={handleChange(name)}
                placeholder={def.placeholder || ""}
                helper={def.help}
                disabled={submitting || testing}
              />
            ))}
          </div>
        </>
      )}

      <div className="flex items-center gap-3 pt-2">
        <ModernButton
          type="button"
          variant="outline"
          size="sm"
          onClick={onTest}
          isLoading={testing}
          isDisabled={submitting}
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Test Connection
        </ModernButton>
        <ModernButton
          type="submit"
          variant="primary"
          size="sm"
          isLoading={submitting}
          isDisabled={testing}
          className="flex items-center gap-2"
        >
          <Shield className="h-4 w-4" />
          Save & Verify
        </ModernButton>
      </div>
    </form>
  );
};

/**
 * Single service configuration card
 */
const ServiceConfigCard = ({
  serviceType,
  serviceConfig,
  regionId,
  credentialStatus,
  onUpdate,
}) => {
  const [enabled, setEnabled] = useState(credentialStatus?.configured || false);
  const [fulfillmentMode, setFulfillmentMode] = useState(
    credentialStatus?.configured ? "automated" : "manual"
  );
  const [showCredentials, setShowCredentials] = useState(false);
  const [formValues, setFormValues] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [testing, setTesting] = useState(false);

  const Icon = SERVICE_ICONS[serviceType] || Server;
  const label = serviceConfig?.label || SERVICE_LABELS[serviceType] || serviceType;
  const description = serviceConfig?.description || "";
  const fields = serviceConfig?.fields || {};
  const isConfigured = credentialStatus?.configured;
  const status = credentialStatus?.status;

  const handleToggle = () => {
    setEnabled(!enabled);
    if (!enabled) {
      setFulfillmentMode("manual");
      setShowCredentials(false);
    }
  };

  const handleModeChange = (mode) => {
    setFulfillmentMode(mode);
    if (mode === "automated") {
      setShowCredentials(true);
    } else {
      setShowCredentials(false);
    }
  };

  const handleFieldChange = (fieldName, value) => {
    setFormValues((prev) => ({ ...prev, [fieldName]: value }));
  };

  const handleTest = async () => {
    setTesting(true);
    try {
      const result = await adminRegionApi.verifyServiceCredentials(
        regionId,
        serviceType,
        formValues
      );
      if (result.success) {
        ToastUtils.success("Connection successful!");
      }
    } catch (error) {
      // Error handled by API
    } finally {
      setTesting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await adminRegionApi.storeServiceCredentials(regionId, serviceType, formValues);
      setFormValues({});
      setShowCredentials(false);
      onUpdate?.();
    } catch (error) {
      // Error handled by API
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModernCard className="overflow-hidden">
      {/* Service Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{label}</h3>
            <p className="text-xs text-gray-500">{description}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isConfigured && (
            <StatusPill
              label={status === "verified" ? "Verified" : "Configured"}
              tone={status === "verified" ? "success" : "info"}
            />
          )}
          <label className="relative inline-flex cursor-pointer items-center">
            <input
              type="checkbox"
              checked={enabled}
              onChange={handleToggle}
              className="peer sr-only"
            />
            <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-100" />
          </label>
        </div>
      </div>

      {/* Expanded content when enabled */}
      {enabled && (
        <div className="p-4 bg-gray-50/50 space-y-4">
          {/* Fulfillment Mode Selection */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">Fulfillment Mode</p>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name={`${serviceType}-mode`}
                  value="manual"
                  checked={fulfillmentMode === "manual"}
                  onChange={() => handleModeChange("manual")}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Manual</span>
                <span className="text-xs text-gray-500">(No automation)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name={`${serviceType}-mode`}
                  value="automated"
                  checked={fulfillmentMode === "automated"}
                  onChange={() => handleModeChange("automated")}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Automated</span>
                <span className="text-xs text-gray-500">(Requires credentials)</span>
              </label>
            </div>
          </div>

          {/* Current credential status if configured */}
          {isConfigured && fulfillmentMode === "automated" && !showCredentials && (
            <div className="flex items-center justify-between rounded-xl border border-green-100 bg-green-50 px-4 py-3">
              <div className="flex items-center gap-2 text-sm text-green-700">
                <CheckCircle className="h-4 w-4" />
                <span>Credentials configured</span>
                {credentialStatus?.verified_at && (
                  <span className="text-xs text-green-600">
                    (verified {new Date(credentialStatus.verified_at).toLocaleDateString()})
                  </span>
                )}
              </div>
              <ModernButton
                variant="ghost"
                size="sm"
                onClick={() => setShowCredentials(true)}
                className="text-blue-600"
              >
                <Settings className="h-4 w-4 mr-1" />
                Update
              </ModernButton>
            </div>
          )}

          {/* Credential Form */}
          {fulfillmentMode === "automated" && showCredentials && Object.keys(fields).length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-700">Credentials</p>
                {isConfigured && (
                  <button
                    type="button"
                    onClick={() => setShowCredentials(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <CredentialForm
                fields={fields}
                values={formValues}
                onChange={handleFieldChange}
                onSubmit={handleSubmit}
                onTest={handleTest}
                submitting={submitting}
                testing={testing}
              />
            </div>
          )}

          {/* Manual mode info */}
          {fulfillmentMode === "manual" && (
            <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-700">
              <p>
                <strong>Manual fulfillment:</strong> Orders for this service will require manual
                processing. No automation credentials needed.
              </p>
            </div>
          )}
        </div>
      )}
    </ModernCard>
  );
};

/**
 * Main Region Credentials Page
 */
const RegionCredentials = () => {
  const { id: code } = useParams();
  const navigate = useNavigate();
  const [region, setRegion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [providerServices, setProviderServices] = useState(null);
  const [credentialStatuses, setCredentialStatuses] = useState({});

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const regionRes = await adminRegionApi.fetchRegionByCode(code);
      const regionData = regionRes.data;
      setRegion(regionData);

      if (regionData?.provider) {
        const [servicesRes, statusRes] = await Promise.all([
          adminRegionApi.getProviderServices(regionData.provider),
          adminRegionApi.getCredentialStatus(regionData.id),
        ]);

        if (servicesRes.success) {
          setProviderServices(servicesRes.data);
        }
        if (statusRes.success && statusRes.data?.credentials) {
          setCredentialStatuses(statusRes.data.credentials);
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      ToastUtils.error("Failed to load region data");
    } finally {
      setLoading(false);
    }
  }, [code]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <>
        <AdminHeadbar />
        <AdminSidebar />
        <AdminPageShell
          title="Region Services"
          description="Configure services and credentials"
          contentClassName="flex min-h-[60vh] items-center justify-center"
        >
          <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
        </AdminPageShell>
      </>
    );
  }

  if (!region) {
    return (
      <>
        <AdminHeadbar />
        <AdminSidebar />
        <AdminPageShell
          title="Region Not Found"
          description="The requested region could not be found"
          actions={
            <ModernButton variant="outline" onClick={() => navigate("/admin-dashboard/regions")}>
              Back to Regions
            </ModernButton>
          }
        >
          <ModernCard className="max-w-md mx-auto text-center space-y-3">
            <AlertCircle className="mx-auto h-10 w-10 text-red-500" />
            <p className="text-sm text-gray-600">Region not found or has been removed.</p>
          </ModernCard>
        </AdminPageShell>
      </>
    );
  }

  const services = providerServices?.services || {};
  const locationLabel = [region.city, region.country_code].filter(Boolean).join(", ");

  return (
    <>
      <AdminHeadbar />
      <AdminSidebar />
      <AdminPageShell
        title={`${region.name || region.code} • Services`}
        description={locationLabel || `Region: ${region.code}`}
        actions={
          <div className="flex gap-2">
            <ModernButton
              variant="ghost"
              size="sm"
              onClick={fetchData}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </ModernButton>
            <ModernButton
              variant="outline"
              size="sm"
              onClick={() => navigate(`/admin-dashboard/regions/${region.code}`)}
            >
              Back to Region
            </ModernButton>
          </div>
        }
        contentClassName="space-y-6"
      >
        {/* Region Info Header */}
        <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-blue-900 to-blue-800 p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-blue-200">
                {region.provider?.toUpperCase()} REGION
              </p>
              <h2 className="text-2xl font-bold mt-1">{region.name || region.code}</h2>
              <p className="text-sm text-blue-100 mt-1">{locationLabel || region.code}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-blue-200">Fulfillment</p>
              <p className="text-lg font-semibold capitalize">
                {region.fulfillment_mode || "Not Set"}
              </p>
            </div>
          </div>
        </div>

        {/* Services Section */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Services</h3>
          <p className="text-sm text-gray-500 mb-4">
            Enable services and configure their fulfillment mode. Automated fulfillment requires
            valid credentials.
          </p>

          <div className="space-y-4">
            {Object.entries(services).map(([serviceType, serviceConfig]) => (
              <ServiceConfigCard
                key={serviceType}
                serviceType={serviceType}
                serviceConfig={serviceConfig}
                regionId={region.id}
                credentialStatus={credentialStatuses[serviceType]}
                onUpdate={fetchData}
              />
            ))}
          </div>

          {Object.keys(services).length === 0 && (
            <ModernCard className="text-center py-8">
              <AlertCircle className="mx-auto h-8 w-8 text-amber-500 mb-2" />
              <p className="text-sm text-gray-600">
                No services available for provider: {region.provider}
              </p>
            </ModernCard>
          )}
        </div>
      </AdminPageShell>
    </>
  );
};

export default RegionCredentials;
