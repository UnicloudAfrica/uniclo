// @ts-nocheck
import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building2,
  Globe,
  MapPin,
  DollarSign,
  Shield,
  CheckCircle,
  AlertCircle,
  KeyRound,
} from "lucide-react";
import adminRegionApi from "../../services/adminRegionApi";
import ToastUtils from "../../utils/toastUtil";
import AdminSidebar from "../components/AdminSidebar";
import AdminHeadbar from "../components/adminHeadbar";
import AdminPageShell from "../components/AdminPageShell.tsx";
import { ModernCard } from "../../shared/components/ui";
import { ModernButton } from "../../shared/components/ui";
import StatusPill from "../../shared/components/ui/StatusPill";
import { useFetchTenants } from "../../hooks/adminHooks/tenantHooks";

const PROVIDER_OPTIONS = [
  { value: "zadara", label: "Zadara" },
  { value: "aws", label: "AWS (coming soon)" },
  { value: "azure", label: "Azure (coming soon)" },
  { value: "gcp", label: "Google Cloud (coming soon)" },
  { value: "oracle", label: "Oracle Cloud (coming soon)" },
  { value: "ibm", label: "IBM Cloud (coming soon)" },
  { value: "openstack", label: "OpenStack (coming soon)" },
];

const initialFormState = {
  provider: "zadara",
  ownership_type: "platform",
  owner_tenant_id: "",
  code: "",
  name: "",
  country_code: "",
  city: "",
  base_url: "",
  platform_fee_percentage: "0",
  fulfillment_mode: "automated",
  is_active: true,
  object_storage_enabled: false,
  object_storage_base_url: "",
  object_storage_account: "zios_admin",
  object_storage_access_key: "",
  object_storage_default_quota: "",
  object_storage_notification_email: "",
};
const RegionApprovalCreate = () => {
  const navigate = useNavigate();

  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState(initialFormState);
  const [errors, setErrors] = useState({});
  const { data: tenants = [], isFetching: isTenantsLoading } = useFetchTenants();

  const isTenantOwned = formData.ownership_type === "tenant_owned";

  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    const rawValue = type === "checkbox" ? checked : value;

    setFormData((prev) => {
      const next = {
        ...prev,
        [name]: rawValue,
      };
      if (name === "provider" && typeof value === "string") {
        const normalized = value.toLowerCase();
        next.provider = normalized;
        if (normalized !== "zadara") {
          next.fulfillment_mode = "manual";
          next.base_url = "";
          next.object_storage_enabled = false;
        }
      }

      if (name === "ownership_type") {
        if (value === "platform") {
          next.owner_tenant_id = "";
          next.platform_fee_percentage = "0";
        } else if (
          value === "tenant_owned" &&
          (!prev.platform_fee_percentage || prev.platform_fee_percentage === "0")
        ) {
          next.platform_fee_percentage = "20";
        }
      }

      if (name === "country_code" && typeof rawValue === "string") {
        next.country_code = rawValue.toUpperCase();
      }

      return next;
    });
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
    if (name === "ownership_type") {
      setErrors((prev) => {
        const nextErrors = { ...prev };
        delete nextErrors.owner_tenant_id;
        delete nextErrors.platform_fee_percentage;
        return nextErrors;
      });
    }
    if (name === "provider") {
      setErrors((prev) => ({ ...prev, provider: "", base_url: "" }));
    }
  };
  const validations = () => {
    const nextErrors = {};
    if (!formData.provider) nextErrors.provider = "Provider is required";
    if (!formData.code) nextErrors.code = "Region code is required";
    if (!formData.name) nextErrors.name = "Region name is required";
    if (!formData.country_code) nextErrors.country_code = "Country code is required";
    if (formData.provider === "zadara") {
      if (!formData.base_url) {
        nextErrors.base_url = "Base URL is required for Zadara";
      } else if (!/^https?:\/\/.+/.test(formData.base_url)) {
        nextErrors.base_url = "Use a valid http(s) URL";
      }
    } else if (formData.base_url && !/^https?:\/\/.+/.test(formData.base_url)) {
      nextErrors.base_url = "Use a valid http(s) URL";
    }

    if (formData.provider !== "zadara" && formData.fulfillment_mode === "automated") {
      nextErrors.fulfillment_mode = "Automated fulfilment is available for Zadara only";
    }

    if (formData.provider === "zadara" && formData.object_storage_enabled) {
      if (!formData.object_storage_base_url) {
        nextErrors.object_storage_base_url = "Object storage base URL is required";
      } else if (!/^https?:\/\/.+/.test(formData.object_storage_base_url)) {
        nextErrors.object_storage_base_url = "Use a valid https URL";
      }

      if (!formData.object_storage_access_key) {
        nextErrors.object_storage_access_key = "Object storage access key is required";
      }

      if (!formData.object_storage_notification_email) {
        nextErrors.object_storage_notification_email = "Notification email is required";
      } else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(formData.object_storage_notification_email)) {
        nextErrors.object_storage_notification_email = "Provide a valid email";
      }

      if (
        formData.object_storage_default_quota &&
        Number.isNaN(Number(formData.object_storage_default_quota))
      ) {
        nextErrors.object_storage_default_quota = "Quota must be numeric";
      }
    } else if (formData.provider !== "zadara" && formData.object_storage_enabled) {
      nextErrors.object_storage_enabled = "Object storage automation is available for Zadara only";
    }

    if (isTenantOwned) {
      if (!formData.owner_tenant_id) {
        nextErrors.owner_tenant_id = "Select the tenant that owns this region";
      }

      const fee = parseFloat(formData.platform_fee_percentage);
      if (Number.isNaN(fee)) {
        nextErrors.platform_fee_percentage = "Platform fee is required";
      } else if (fee < 0 || fee > 100) {
        nextErrors.platform_fee_percentage = "Value must be between 0 and 100";
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };
  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validations()) return;

    try {
      setSubmitting(true);
      const sanitize = (value, transformer = (v: any) => v) => {
        if (typeof value === "string") {
          const trimmed = value.trim();
          return trimmed === "" ? null : transformer(trimmed);
        }
        return transformer(value);
      };
      const provider = sanitize(formData.provider) ?? "zadara";

      const payload = {
        provider,
        code: sanitize(formData.code),
        name: sanitize(formData.name),
        country_code: sanitize(formData.country_code, (v) => v.toUpperCase()),
        city: sanitize(formData.city),
        base_url: sanitize(formData.base_url),
        ownership_type: formData.ownership_type,
        fulfillment_mode: formData.fulfillment_mode,
        is_active: formData.is_active,
      };
      if (isTenantOwned) {
        payload.owner_tenant_id = formData.owner_tenant_id;
        payload.platform_fee_percentage = parseFloat(formData.platform_fee_percentage);
      }

      if (provider !== "zadara") {
        payload.base_url = null;
        payload.fulfillment_mode = "manual";
      }

      if (provider === "zadara" && formData.object_storage_enabled) {
        const objectStorageBaseUrl = sanitize(formData.object_storage_base_url);
        const objectStorageAccessKey = sanitize(formData.object_storage_access_key);
        const objectStorageAccount = sanitize(formData.object_storage_account) || "zios_admin";
        const objectStorageNotificationEmail = sanitize(formData.object_storage_notification_email);

        payload.object_storage = {
          enabled: true,
          base_url: objectStorageBaseUrl,
          account: objectStorageAccount,
          access_key: objectStorageAccessKey,
          default_quota_gb: formData.object_storage_default_quota
            ? Number(formData.object_storage_default_quota)
            : null,
          notification_email: objectStorageNotificationEmail,
        };
      }
      if (!isTenantOwned) {
        delete payload.owner_tenant_id;
        delete payload.platform_fee_percentage;
      }

      await adminRegionApi.createPlatformRegion(payload);

      if (isTenantOwned) {
        navigate("/admin-dashboard/region-approvals");
      } else {
        navigate("/admin-dashboard/regions");
      }
    } catch (error) {
      console.error("Error creating region:", error);
      ToastUtils.error(error?.message || "Failed to create region");
    } finally {
      setSubmitting(false);
    }
  };
  const headerMeta = (
    <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-gray-500">
      <StatusPill
        label={isTenantOwned ? "Tenant-owned" : "Platform-owned"}
        tone={isTenantOwned ? "warning" : "info"}
      />
      <span className="hidden sm:inline text-gray-300">•</span>
      <span>{isTenantOwned ? "Tenant-specific region" : "Auto-approved region"}</span>
      <span className="hidden sm:inline text-gray-300">•</span>
      <span>Automation supported</span>
    </div>
  );

  const backHref = isTenantOwned ? "/admin-dashboard/region-approvals" : "/admin-dashboard/regions";

  const providerOptions = useMemo(() => PROVIDER_OPTIONS, []);

  const tenantOptions = useMemo(
    () =>
      tenants.map((tenant: any) => ({
        value: tenant.id,
        label: tenant.name || tenant.identifier || tenant.slug || tenant.email || tenant.id,
      })),
    [tenants]
  );

  const ownershipOptions = useMemo(
    () => [
      {
        value: "platform",
        title: "Platform-owned",
        description: "Region is managed centrally. Platform fee is not applied.",
      },
      {
        value: "tenant_owned",
        title: "Tenant-owned",
        description: "Assign this region to a tenant and configure their revenue share.",
      },
    ],
    []
  );

  const selectedTenant = useMemo(
    () => tenants.find((tenant) => tenant.id === formData.owner_tenant_id),
    [tenants, formData.owner_tenant_id]
  );

  const providerLabel = useMemo(() => {
    const found = providerOptions.find((option) => option.value === formData.provider);
    return found ? found.label : formData.provider || "—";
  }, [providerOptions, formData.provider]);

  const selectedTenantName = selectedTenant
    ? selectedTenant.name ||
      selectedTenant.identifier ||
      selectedTenant.slug ||
      selectedTenant.email ||
      selectedTenant.id
    : "—";

  const overviewTiles = [
    {
      label: "Region Code",
      value: formData.code || "Pending",
      icon: KeyRound,
    },
    {
      label: "Provider",
      value: providerLabel,
      icon: Building2,
    },
    {
      label: "Country",
      value: formData.country_code || "--",
      icon: Globe,
    },
    {
      label: "Ownership",
      value: isTenantOwned ? "Tenant-owned" : "Platform-owned",
      icon: Shield,
    },
    isTenantOwned
      ? {
          label: "Owning Tenant",
          value: selectedTenantName,
          icon: Building2,
        }
      : null,
    {
      label: "Platform Fee",
      value: isTenantOwned ? `${formData.platform_fee_percentage || 0}%` : "—",
      icon: DollarSign,
    },
  ].filter(Boolean);

  const providerIsZadara = formData.provider === "zadara";

  const infoBanner = useMemo(() => {
    if (!providerIsZadara) {
      return {
        tone: "warning",
        title: "Coming soon",
        body: "Automated provisioning is currently available for Zadara only. Regions on other providers will operate in manual mode until integrations are released.",
      };
    }
    const base =
      formData.fulfillment_mode === "automated"
        ? {
            tone: "info",
            title: "Automated provisioning",
            body: "This region will provision resources automatically using MSP admin credentials. Ensure credentials are verified in the region detail screen.",
          }
        : {
            tone: "warning",
            title: "Manual fulfillment",
            body: "Orders in this region will require manual intervention. MSP credentials are optional but recommended for consistency.",
          };
    if (isTenantOwned) {
      base.body +=
        " The selected tenant will control commercial terms; platform fees apply only to tenant-owned regions.";
    }

    return base;
  }, [formData.fulfillment_mode, isTenantOwned, providerIsZadara]);

  const renderInput = (id, label, placeholder, Icon, props = {}) => (
    <div className="space-y-2">
      <label htmlFor={id} className="text-sm font-medium text-gray-700">
        {label} {props.required && <span className="text-red-500">*</span>}
      </label>
      <div
        className={`flex items-center gap-3 rounded-lg border px-3 py-2 focus-within:ring-2 ${
          errors[id]
            ? "border-red-400 focus-within:ring-red-100"
            : "border-gray-300 focus-within:ring-primary-100"
        }`}
      >
        {Icon && <Icon className="h-4 w-4 text-gray-400" />}
        <input
          id={id}
          name={id}
          value={formData[id]}
          onChange={handleChange}
          placeholder={placeholder}
          className="flex-1 border-none bg-transparent text-sm outline-none"
          {...props}
        />
      </div>
      {errors[id] && <p className="text-xs text-red-500">{errors[id]}</p>}
    </div>
  );

  const renderSelect = (
    id,
    label,
    options,
    { required = false, placeholder = "Select option", disabled = false } = {}
  ) => (
    <div className="space-y-2">
      <label htmlFor={id} className="text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div
        className={`rounded-lg border px-3 py-2 ${
          errors[id]
            ? "border-red-400 focus-within:ring-red-100"
            : "border-gray-300 focus-within:ring-primary-100"
        }`}
      >
        <select
          id={id}
          name={id}
          disabled={disabled}
          value={formData[id] ?? ""}
          onChange={handleChange}
          className="w-full border-none bg-transparent text-sm outline-none"
        >
          <option value="" disabled={!disabled || options.length > 0}>
            {placeholder}
          </option>
          {options.map((option: any) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      {errors[id] && <p className="text-xs text-red-500">{errors[id]}</p>}
    </div>
  );

  const renderObjectStorageSection = () => (
    <ModernCard title="Object Storage (Optional)" className="space-y-4">
      <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-gray-800">
            Enable Zadara Object Storage for this region?
          </p>
          <p className="mt-1 text-xs text-gray-600">
            Turning this on lets tenants in this region receive S3 credentials managed by the CRM.
            You&apos;ll need a valid access key.
          </p>
        </div>
        <label
          className={`inline-flex items-center gap-2 ${!providerIsZadara ? "opacity-60" : ""}`}
        >
          <input
            type="checkbox"
            name="object_storage_enabled"
            checked={formData.object_storage_enabled}
            onChange={handleChange}
            className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            disabled={!providerIsZadara}
          />
          <span className="text-sm font-medium text-gray-700">Enable Object Storage</span>
        </label>
      </div>

      {!providerIsZadara && (
        <p className="text-xs text-gray-500">
          Object storage automation is available when the region is backed by Zadara.
        </p>
      )}

      {providerIsZadara && formData.object_storage_enabled && (
        <div className="space-y-4">
          {renderInput(
            "object_storage_base_url",
            "Object Storage Base URL",
            "https://zadara-region.example.com:8443",
            Globe,
            {
              required: formData.object_storage_enabled,
              value: formData.object_storage_base_url,
              onChange: handleChange,
            }
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            {renderInput(
              "object_storage_account",
              "Admin Account (usually zios_admin)",
              "zios_admin",
              Shield,
              {
                required: formData.object_storage_enabled,
                value: formData.object_storage_account,
                onChange: handleChange,
              }
            )}
            {renderInput(
              "object_storage_access_key",
              "Object Storage Access Key",
              "Paste X-Access-Key",
              KeyRound,
              {
                required: formData.object_storage_enabled,
                value: formData.object_storage_access_key,
                onChange: handleChange,
                type: "password",
              }
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {renderInput("object_storage_default_quota", "Default Quota (GiB)", "1000", Building2, {
              value: formData.object_storage_default_quota,
              onChange: handleChange,
              type: "number",
              min: "0",
            })}
            {renderInput(
              "object_storage_notification_email",
              "Notification Email",
              "storage-alerts@example.com",
              AlertCircle,
              {
                required: formData.object_storage_enabled,
                value: formData.object_storage_notification_email,
                onChange: handleChange,
                type: "email",
              }
            )}
          </div>

          <div className="rounded-xl border border-amber-100 bg-amber-50 p-4 text-xs text-amber-700">
            Provide a monitored mailbox—Zadara sends password resets and operational alerts here.
          </div>
        </div>
      )}
    </ModernCard>
  );

  return (
    <>
      <AdminHeadbar />
      <AdminSidebar />
      <AdminPageShell
        title="Create Platform Region"
        description="Add a new platform-owned region that becomes available to clients immediately."
        subHeaderContent={headerMeta}
        breadcrumbs={[
          { label: "Home", href: "/admin-dashboard" },
          { label: "Region Approvals", href: "/admin-dashboard/region-approvals" },
          { label: "Create Region" },
        ]}
        actions={
          <ModernButton
            variant="outline"
            size="sm"
            onClick={() => navigate("/admin-dashboard/region-approvals")}
          >
            Cancel
          </ModernButton>
        }
        contentClassName="space-y-6"
      >
        <ModernCard padding="lg">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {overviewTiles.map(({ label, value, icon: Icon }: any) => (
              <div
                key={label}
                className="rounded-2xl border border-gray-100 bg-gray-50/80 px-4 py-3"
              >
                <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-gray-500">
                  <Icon className="h-4 w-4 text-gray-400" />
                  {label}
                </div>
                <p className="mt-1 text-sm font-semibold text-gray-900 break-all">{value}</p>
              </div>
            ))}
          </div>
        </ModernCard>

        <ModernCard padding="lg" className="space-y-6">
          <div
            className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${
              infoBanner.tone === "warning"
                ? "border-yellow-200 bg-yellow-50 text-yellow-800"
                : "border-blue-200 bg-blue-50 text-blue-800"
            }`}
          >
            {infoBanner.tone === "warning" ? (
              <AlertCircle className="mt-0.5 h-5 w-5" />
            ) : (
              <CheckCircle className="mt-0.5 h-5 w-5" />
            )}
            <div>
              <p className="font-semibold">{infoBanner.title}</p>
              <p className="mt-1 text-xs leading-relaxed">{infoBanner.body}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="provider" className="text-sm font-medium text-gray-700">
                  Provider <span className="text-red-500">*</span>
                </label>
                <div
                  className={`rounded-lg border px-3 py-2 ${
                    errors.provider
                      ? "border-red-400 focus-within:ring-red-100"
                      : "border-gray-300 focus-within:ring-primary-100"
                  }`}
                >
                  <select
                    id="provider"
                    name="provider"
                    value={formData.provider}
                    onChange={handleChange}
                    className="w-full border-none bg-transparent text-sm outline-none"
                  >
                    <option value="" disabled>
                      Select provider
                    </option>
                    {providerOptions.map((option: any) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                {!providerIsZadara && formData.provider && (
                  <p className="text-xs text-amber-600">
                    Automated provisioning for {formData.provider.toUpperCase()} is coming soon.
                    Regions will operate in manual mode until the integration is ready.
                  </p>
                )}
                {errors.provider && <p className="text-xs text-red-500">{errors.provider}</p>}
              </div>

              <div className="space-y-3">
                <p className="text-sm font-medium text-gray-700">
                  Ownership Type <span className="text-red-500">*</span>
                </p>
                <div className="space-y-3">
                  {ownershipOptions.map((option: any) => (
                    <label
                      key={option.value}
                      className={`flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 transition-colors ${
                        formData.ownership_type === option.value
                          ? "border-primary-500 bg-primary-50"
                          : "border-gray-200 hover:border-primary-200 hover:bg-gray-50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="ownership_type"
                        value={option.value}
                        checked={formData.ownership_type === option.value}
                        onChange={handleChange}
                        className="mt-1 h-4 w-4"
                      />
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{option.title}</p>
                        <p className="text-xs text-gray-600">{option.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {isTenantOwned && (
              <div>
                {renderSelect("owner_tenant_id", "Owning Tenant", tenantOptions, {
                  required: true,
                  placeholder: isTenantsLoading
                    ? "Loading tenants…"
                    : tenantOptions.length > 0
                      ? "Select tenant"
                      : "No tenants available",
                  disabled: isTenantsLoading || tenantOptions.length === 0,
                })}
                {!isTenantsLoading && tenantOptions.length === 0 && (
                  <p className="mt-2 text-xs text-amber-600">
                    No tenants found. Create a tenant before assigning a tenant-owned region.
                  </p>
                )}
              </div>
            )}

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-6">
                {renderInput("code", "Region Code", "lagos-1", MapPin, {
                  required: true,
                  maxLength: 32,
                })}
                {renderInput("name", "Region Name", "Lagos Region 1", Building2, {
                  required: true,
                })}
              </div>
              <div className="space-y-6">
                {renderInput("country_code", "Country Code", "NG", Globe, {
                  required: true,
                  maxLength: 2,
                })}
                {renderInput("city", "City", "Lagos", MapPin)}
                <div className="space-y-2">
                  <label htmlFor="base_url" className="text-sm font-medium text-gray-700">
                    Base URL {providerIsZadara && <span className="text-red-500">*</span>}
                  </label>
                  <div
                    className={`flex items-center gap-3 rounded-lg border px-3 py-2 focus-within:ring-2 ${
                      errors.base_url
                        ? "border-red-400 focus-within:ring-red-100"
                        : "border-gray-300 focus-within:ring-primary-100"
                    } ${!providerIsZadara ? "opacity-60" : ""}`}
                  >
                    <Globe className="h-4 w-4 text-gray-400" />
                    <input
                      id="base_url"
                      name="base_url"
                      value={formData.base_url}
                      onChange={handleChange}
                      placeholder="https://api.lagos1.example.com"
                      className="flex-1 border-none bg-transparent text-sm outline-none"
                      type="url"
                      disabled={!providerIsZadara}
                    />
                  </div>
                  {errors.base_url && <p className="text-xs text-red-500">{errors.base_url}</p>}
                  {!providerIsZadara && (
                    <p className="text-xs text-gray-500">
                      Base URL will be captured once automated provisioning is supported for this
                      provider.
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {isTenantOwned ? (
                <FeeField
                  value={formData.platform_fee_percentage}
                  onChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      platform_fee_percentage: value,
                    }))
                  }
                  error={errors.platform_fee_percentage}
                />
              ) : (
                <NoFeeField />
              )}

              <div className="space-y-3">
                <p className="text-sm font-medium text-gray-700">
                  Fulfillment Mode <span className="text-red-500">*</span>
                </p>
                <div className="space-y-3">
                  {[
                    {
                      value: "automated",
                      title: "Automated (Recommended)",
                      description: "Provision orders automatically using MSP admin credentials.",
                    },
                    {
                      value: "manual",
                      title: "Manual",
                      description: "Admin manually processes each order created in this region.",
                    },
                  ].map((mode: any) => (
                    <label
                      key={mode.value}
                      className={`flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 transition-colors ${
                        formData.fulfillment_mode === mode.value
                          ? "border-primary-500 bg-primary-50"
                          : "border-gray-200 hover:border-primary-200 hover:bg-gray-50"
                      } ${
                        mode.value === "automated" && !providerIsZadara
                          ? "opacity-60 cursor-not-allowed"
                          : ""
                      }`}
                    >
                      <input
                        type="radio"
                        name="fulfillment_mode"
                        value={mode.value}
                        checked={formData.fulfillment_mode === mode.value}
                        onChange={handleChange}
                        disabled={mode.value === "automated" && !providerIsZadara}
                        className="mt-1 h-4 w-4"
                      />
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{mode.title}</p>
                        <p className="text-xs text-gray-600">{mode.description}</p>
                        {mode.value === "automated" && !providerIsZadara && (
                          <p className="text-[11px] text-amber-600 mt-1">
                            Enable automated fulfilment once {formData.provider.toUpperCase()}{" "}
                            integration is live.
                          </p>
                        )}
                      </div>
                    </label>
                  ))}
                  {errors.fulfillment_mode && (
                    <p className="text-xs text-red-500">{errors.fulfillment_mode}</p>
                  )}
                </div>
              </div>
            </div>

            <label className="flex items-start gap-3 rounded-xl border border-gray-200 px-4 py-3">
              <input
                type="checkbox"
                name="is_active"
                checked={formData.is_active}
                onChange={handleChange}
                className="mt-1 h-4 w-4"
              />
              <div>
                <p className="text-sm font-semibold text-gray-900">Activate immediately</p>
                <p className="text-xs text-gray-500">
                  Toggle off if you want to stage the region before making it available to clients.
                </p>
              </div>
            </label>

            <div className="flex gap-3">
              <ModernButton
                type="button"
                variant="ghost"
                onClick={() => navigate("/admin-dashboard/region-approvals")}
                isDisabled={submitting}
              >
                Cancel
              </ModernButton>
              <ModernButton type="submit" variant="primary" isLoading={submitting}>
                Create Region
              </ModernButton>
            </div>
          </form>
        </ModernCard>

        {renderObjectStorageSection()}
      </AdminPageShell>
    </>
  );
};

const FeeField = ({ value, onChange, error }: any) => (
  <div className="space-y-2">
    <label className="text-sm font-medium text-gray-700">
      Platform Fee Percentage <span className="text-red-500">*</span>
    </label>
    <div className="relative">
      <input
        type="number"
        min="0"
        max="100"
        step="0.01"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full rounded-lg border px-4 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100 ${
          error ? "border-red-400 focus:ring-red-100" : "border-gray-300"
        }`}
        placeholder="20.00"
        required
      />
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
        %
      </span>
    </div>
    {error && <p className="text-xs text-red-500">{error}</p>}
  </div>
);

const NoFeeField = () => (
  <div className="space-y-2">
    <label className="text-sm font-medium text-gray-700">Platform Fee Percentage</label>
    <div className="rounded-lg border border-dashed border-gray-300 px-4 py-3 text-sm text-gray-500">
      Not applicable for platform-owned regions.
    </div>
  </div>
);

export default RegionApprovalCreate;
