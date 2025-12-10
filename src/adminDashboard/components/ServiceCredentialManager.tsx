// @ts-nocheck
import React, { useEffect, useState, useCallback } from "react";
import {
  Server,
  Database,
  CheckCircle,
  AlertTriangle,
  Clock,
  Loader2,
  ChevronRight,
  Shield,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { ModernCard, ModernButton } from "../../shared/components/ui";
import ModernInput from "../../shared/components/ui/ModernInput";
import StatusPill from "../../shared/components/ui/StatusPill";
import adminRegionApi from "../../services/adminRegionApi";
import ToastUtils from "../../utils/toastUtil";

const SERVICE_ICONS = {
  compute: Server,
  object_storage: Database,
  default: Server,
};

const STATUS_CONFIG = {
  verified: { tone: "success", label: "Verified", icon: CheckCircle },
  pending: { tone: "warning", label: "Pending", icon: Clock },
  failed: { tone: "danger", label: "Failed", icon: AlertTriangle },
  not_configured: { tone: "neutral", label: "Not Configured", icon: Clock },
};

/**
 * Dynamic form component that renders fields based on backend config
 */
const DynamicCredentialForm = ({ fields, values, onChange, disabled = false }) => {
  const renderField = (fieldName, fieldDef) => {
    const value = values[fieldName] || "";
    const isRequired = fieldDef.required;
    const isSensitive = fieldDef.sensitive;

    const handleChange = (e) => {
      onChange(fieldName, e.target.value);
    };

    // Map field type to input type
    const inputType =
      fieldDef.type === "password"
        ? "password"
        : fieldDef.type === "number"
          ? "number"
          : fieldDef.type === "email"
            ? "email"
            : fieldDef.type === "url"
              ? "url"
              : "text";

    return (
      <ModernInput
        key={fieldName}
        label={`${fieldDef.label}${isRequired ? "" : " (optional)"}`}
        name={fieldName}
        type={inputType}
        value={value}
        onChange={handleChange}
        placeholder={fieldDef.placeholder || ""}
        helper={fieldDef.help}
        required={isRequired}
        disabled={disabled}
      />
    );
  };

  // Group fields into rows of 2 for better layout
  const fieldEntries = Object.entries(fields);
  const requiredFields = fieldEntries.filter(([_, def]) => def.required);
  const optionalFields = fieldEntries.filter(([_, def]) => !def.required);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        {requiredFields.map(([name, def]) => renderField(name, def))}
      </div>
      {optionalFields.length > 0 && (
        <>
          <div className="border-t border-gray-100 pt-4">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500 mb-3">
              Optional Fields
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {optionalFields.map(([name, def]) => renderField(name, def))}
          </div>
        </>
      )}
    </div>
  );
};

/**
 * Individual service credential card with expand/collapse
 */
const ServiceCredentialCard = ({
  regionId,
  serviceType,
  serviceConfig,
  credentialStatus,
  onRefresh,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [formValues, setFormValues] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const Icon = SERVICE_ICONS[serviceType] || SERVICE_ICONS.default;
  const status =
    credentialStatus?.status || (credentialStatus?.configured ? "verified" : "not_configured");
  const statusInfo = STATUS_CONFIG[status] || STATUS_CONFIG.not_configured;
  const StatusIcon = statusInfo.icon;

  const handleFieldChange = useCallback((fieldName, value) => {
    setFormValues((prev) => ({ ...prev, [fieldName]: value }));
  }, []);

  const handleVerify = async () => {
    setVerifying(true);
    try {
      const result = await adminRegionApi.verifyServiceCredentials(
        regionId,
        serviceType,
        formValues
      );
      if (result.success) {
        ToastUtils.success(result.message || "Verification successful");
      }
    } catch (error) {
      console.error("Verification failed:", error);
    } finally {
      setVerifying(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await adminRegionApi.storeServiceCredentials(regionId, serviceType, formValues);
      setFormValues({});
      setExpanded(false);
      onRefresh?.();
    } catch (error) {
      console.error("Save failed:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete ${serviceConfig.label} credentials?`)) {
      return;
    }
    setDeleting(true);
    try {
      await adminRegionApi.deleteServiceCredentials(regionId, serviceType);
      onRefresh?.();
    } catch (error) {
      console.error("Delete failed:", error);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <ModernCard className="overflow-hidden">
      {/* Header - always visible */}
      <div
        className="flex items-center justify-between cursor-pointer p-4 hover:bg-gray-50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
            <Icon className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{serviceConfig.label}</h3>
            <p className="text-xs text-gray-500">{serviceConfig.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <StatusPill label={statusInfo.label} tone={statusInfo.tone} />
          <ChevronRight
            className={`h-5 w-5 text-gray-400 transition-transform ${expanded ? "rotate-90" : ""}`}
          />
        </div>
      </div>

      {/* Expanded form */}
      {expanded && (
        <div className="border-t border-gray-100 p-4 bg-gray-50/50">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Current status banner */}
            {credentialStatus?.configured && (
              <div className="flex items-center justify-between rounded-xl border border-green-100 bg-green-50 px-4 py-3 text-sm text-green-700">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  <span>Credentials configured</span>
                  {credentialStatus.verified_at && (
                    <span className="text-xs text-green-600">
                      (verified {new Date(credentialStatus.verified_at).toLocaleDateString()})
                    </span>
                  )}
                </div>
                <ModernButton
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleDelete}
                  isLoading={deleting}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </ModernButton>
              </div>
            )}

            {/* Dynamic form fields */}
            {serviceConfig.fields && (
              <DynamicCredentialForm
                fields={serviceConfig.fields}
                values={formValues}
                onChange={handleFieldChange}
                disabled={submitting || verifying}
              />
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-2">
              <ModernButton
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleVerify}
                isLoading={verifying}
                isDisabled={Object.keys(formValues).length === 0 || submitting}
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
                isDisabled={verifying}
                className="flex items-center gap-2"
              >
                <Shield className="h-4 w-4" />
                Save & Verify
              </ModernButton>
            </div>
          </form>
        </div>
      )}
    </ModernCard>
  );
};

/**
 * Main component for managing all service credentials in a region
 */
const ServiceCredentialManager = ({ region }) => {
  const [loading, setLoading] = useState(true);
  const [providerServices, setProviderServices] = useState(null);
  const [credentialStatuses, setCredentialStatuses] = useState({});
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    if (!region?.provider || !region?.id) return;

    setLoading(true);
    setError(null);

    try {
      // Fetch provider services and credential status in parallel
      const [servicesRes, statusRes] = await Promise.all([
        adminRegionApi.getProviderServices(region.provider),
        adminRegionApi.getCredentialStatus(region.id),
      ]);

      if (servicesRes.success) {
        setProviderServices(servicesRes.data);
      }

      if (statusRes.success && statusRes.data?.credentials) {
        setCredentialStatuses(statusRes.data.credentials);
      }
    } catch (err) {
      console.error("Error fetching credential data:", err);
      setError("Failed to load credential configuration");
    } finally {
      setLoading(false);
    }
  }, [region?.provider, region?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <ModernCard className="border-red-100 bg-red-50">
        <div className="flex items-center gap-3 text-red-700">
          <AlertTriangle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      </ModernCard>
    );
  }

  if (!providerServices?.services) {
    return (
      <ModernCard className="border-amber-100 bg-amber-50">
        <div className="flex items-center gap-3 text-amber-700">
          <AlertTriangle className="h-5 w-5" />
          <span>No services available for provider: {region?.provider}</span>
        </div>
      </ModernCard>
    );
  }

  const services = providerServices.services;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Service Credentials</h2>
          <p className="text-sm text-gray-500">
            Configure credentials for each service type in this region
          </p>
        </div>
        <ModernButton
          variant="ghost"
          size="sm"
          onClick={fetchData}
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </ModernButton>
      </div>

      <div className="space-y-3">
        {Object.entries(services).map(([serviceType, serviceConfig]) => (
          <ServiceCredentialCard
            key={serviceType}
            regionId={region.id}
            serviceType={serviceType}
            serviceConfig={serviceConfig}
            credentialStatus={credentialStatuses[serviceType]}
            onRefresh={fetchData}
          />
        ))}
      </div>
    </div>
  );
};

export default ServiceCredentialManager;
