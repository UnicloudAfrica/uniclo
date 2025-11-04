import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  AlertCircle,
  CheckCircle,
  Loader2,
  MapPin,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import AdminHeadbar from "../components/adminHeadbar";
import AdminSidebar from "../components/adminSidebar";
import AdminPageShell from "../components/AdminPageShell";
import ModernCard from "../components/ModernCard";
import ModernButton from "../components/ModernButton";
import ModernInput from "../components/ModernInput";
import StatusPill from "../components/StatusPill";
import adminRegionApi from "../../services/adminRegionApi";
import ToastUtils from "../../utils/toastUtil";
import { designTokens } from "../../styles/designTokens";

const statusToneMap = {
  healthy: "success",
  degraded: "warning",
  down: "danger",
};

const statusLabelMap = {
  healthy: "Healthy",
  degraded: "Degraded",
  down: "Down",
};

const formatSegment = (value) => {
  if (!value) return "";
  return value
    .toString()
    .split(/[_-]/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
};

const RegionCredentials = () => {
  const { id: code } = useParams();
  const navigate = useNavigate();
  const [region, setRegion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [testingObjectStorage, setTestingObjectStorage] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    domain: "",
    domain_id: "",
    default_project: "",
    objectStorageEnabled: false,
    objectStorageBaseUrl: "",
    objectStorageAccount: "zios_admin",
    objectStorageAccessKey: "",
    objectStorageDefaultQuota: "",
    objectStorageNotificationEmail: "",
  });

  const isZadaraRegion = region?.provider?.toLowerCase() === "zadara";

  useEffect(() => {
    fetchRegion();
  }, [code]);

  const toggleMobileMenu = () =>
    setIsMobileMenuOpen((prevState) => !prevState);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const fetchRegion = async () => {
    try {
      setLoading(true);
      const response = await adminRegionApi.fetchRegionByCode(code);
      const regionData = response.data;
      setRegion(regionData);

      const summary = regionData?.msp_credential_summary || {};
      const objectSummary = regionData?.object_storage_summary || {};
      setFormData((prev) => ({
        ...prev,
        domain: summary.domain || "",
        domain_id: summary.domain_id || "",
        default_project: summary.default_project || "",
        objectStorageEnabled: objectSummary.enabled || false,
        objectStorageBaseUrl: objectSummary.base_url || "",
        objectStorageAccount: objectSummary.account || "zios_admin",
        objectStorageAccessKey: "",
        objectStorageDefaultQuota:
          objectSummary.default_quota_gb !== null &&
          objectSummary.default_quota_gb !== undefined
            ? String(objectSummary.default_quota_gb)
            : "",
        objectStorageNotificationEmail:
          objectSummary.notification_email || "",
      }));
    } catch (error) {
      console.error("Error fetching region:", error);
      ToastUtils.error("Failed to load region details");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    if (name === "objectStorageEnabled" && !isZadaraRegion) {
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!isZadaraRegion) {
      ToastUtils.error("Credential management is currently available for Zadara regions only.");
      return;
    }

    if (!formData.username || !formData.password || !formData.domain) {
      ToastUtils.error("Please fill in all required fields");
      return;
    }

    if (formData.objectStorageEnabled && !isObjectStorageConfigured) {
      if (
        !formData.objectStorageBaseUrl ||
        !formData.objectStorageAccessKey ||
        !formData.objectStorageNotificationEmail
      ) {
        ToastUtils.error(
          "Object storage endpoint, access key, and notification email are required when enabling object storage."
        );
        return;
      }
    }

    if (
      formData.objectStorageEnabled &&
      formData.objectStorageDefaultQuota &&
      Number.isNaN(Number(formData.objectStorageDefaultQuota))
    ) {
      ToastUtils.error("Default quota must be a valid number of GiB.");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        username: formData.username.trim(),
        password: formData.password,
        domain: formData.domain.trim(),
        domain_id: formData.domain_id ? formData.domain_id.trim() : null,
        default_project: formData.default_project
          ? formData.default_project.trim()
          : null,
      };

      let objectStoragePayload = null;

      if (formData.objectStorageEnabled) {
        if (!isObjectStorageConfigured) {
          objectStoragePayload = {
            enabled: true,
            base_url: formData.objectStorageBaseUrl.trim(),
            account: formData.objectStorageAccount
              ? formData.objectStorageAccount.trim()
              : "zios_admin",
            access_key: formData.objectStorageAccessKey.trim(),
            default_quota_gb: formData.objectStorageDefaultQuota
              ? Number(formData.objectStorageDefaultQuota)
              : null,
            notification_email:
              formData.objectStorageNotificationEmail.trim(),
          };
        } else if (formData.objectStorageAccessKey.trim()) {
          // allow key rotation while keeping other settings the same
          objectStoragePayload = {
            enabled: true,
            base_url: formData.objectStorageBaseUrl.trim(),
            account: formData.objectStorageAccount
              ? formData.objectStorageAccount.trim()
              : objectStorageSummary.account || "zios_admin",
            access_key: formData.objectStorageAccessKey.trim(),
            default_quota_gb: formData.objectStorageDefaultQuota
              ? Number(formData.objectStorageDefaultQuota)
              : objectStorageSummary.default_quota_gb ?? null,
            notification_email:
              formData.objectStorageNotificationEmail.trim() ||
              objectStorageSummary.notification_email ||
              "",
          };
        }
      } else if (isObjectStorageConfigured) {
        objectStoragePayload = { enabled: false };
      }

      if (objectStoragePayload) {
        payload.object_storage = objectStoragePayload;
      }

      await adminRegionApi.verifyCredentials(code, payload);
      ToastUtils.success("Credentials verified successfully");
      navigate(`/admin-dashboard/regions/${code}`);
    } catch (error) {
      console.error("Error verifying credentials:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleTestObjectStorage = async () => {
    if (!isZadaraRegion) {
      ToastUtils.error(
        "Object storage automation is only available for Zadara regions."
      );
      return;
    }

    try {
      setTestingObjectStorage(true);
      await adminRegionApi.verifyObjectStorage(code);
      ToastUtils.success("Object storage connectivity verified.");
    } catch (error) {
      console.error("Error verifying object storage:", error);
    } finally {
      setTestingObjectStorage(false);
    }
  };

  const locationLabel = useMemo(() => {
    if (!region) return "";
    return [region.city, region.country_code].filter(Boolean).join(", ");
  }, [region]);

  const headerMeta = useMemo(() => {
    if (!region) return null;
    return (
      <div className="flex flex-wrap items-center gap-2">
        {region.status && (
          <StatusPill
            label={statusLabelMap[region.status] || formatSegment(region.status)}
            tone={statusToneMap[region.status] || "info"}
          />
        )}
        <StatusPill
          label={region.is_active ? "Active" : "Inactive"}
          tone={region.is_active ? "success" : "warning"}
        />
        {region.fulfillment_mode && (
          <StatusPill
            label={`${formatSegment(region.fulfillment_mode)} Fulfillment`}
            tone="info"
          />
        )}
      </div>
    );
  }, [region]);

  const renderLoadingShell = () => (
    <AdminPageShell
      title="MSP Credentials"
      description="Securely manage automation credentials for this region."
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
      title="MSP Credentials"
      description="Securely manage automation credentials for this region."
      contentClassName="flex min-h-[60vh] items-center justify-center"
      actions={
        <ModernButton
          variant="outline"
          onClick={() => navigate("/admin-dashboard/regions")}
        >
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
    return (
      <>
        <AdminHeadbar onMenuClick={toggleMobileMenu} />
        <AdminSidebar
          isMobileMenuOpen={isMobileMenuOpen}
          onCloseMobileMenu={closeMobileMenu}
        />
        {renderLoadingShell()}
      </>
    );
  }

  if (!region) {
    return (
      <>
        <AdminHeadbar onMenuClick={toggleMobileMenu} />
        <AdminSidebar
          isMobileMenuOpen={isMobileMenuOpen}
          onCloseMobileMenu={closeMobileMenu}
        />
        {renderNotFoundShell()}
      </>
    );
  }

  const credentialSummary = region.msp_credential_summary || {};
  const objectStorageSummary = region.object_storage_summary || {};
  const isObjectStorageConfigured = Boolean(
    region.has_object_storage_credentials
  );
  const objectStorageLocked =
    isObjectStorageConfigured && formData.objectStorageEnabled;
  const automationDisabled = !isZadaraRegion;
  const providerLabel = region.provider
    ? formatSegment(region.provider)
    : "this provider";
  const saveButtonLabel = isZadaraRegion
    ? submitting
      ? "Verifying…"
      : "Save Credentials"
    : "Automation Coming Soon";

  return (
    <>
      <AdminHeadbar onMenuClick={toggleMobileMenu} />
      <AdminSidebar
        isMobileMenuOpen={isMobileMenuOpen}
        onCloseMobileMenu={closeMobileMenu}
      />
      <AdminPageShell
        title={`MSP Credentials • ${region.name || region.code}`}
        description={
          locationLabel
            ? `${locationLabel} • ${region.code}`
            : `Region Code: ${region.code}`
        }
        subHeaderContent={headerMeta}
        actions={
          <div className="flex flex-wrap gap-2">
            <ModernButton
              variant="ghost"
              size="sm"
              className="flex items-center gap-2"
              onClick={fetchRegion}
              isDisabled={submitting}
            >
              <RefreshCw size={16} />
              Refresh
            </ModernButton>
            <ModernButton
              variant="outline"
              size="sm"
              onClick={() =>
                navigate(`/admin-dashboard/regions/${region.code}`)
              }
            >
              Back to Region
            </ModernButton>
          </div>
        }
        contentClassName="space-y-8"
      >
        <div className="space-y-8">
          {automationDisabled && (
            <ModernCard className="border border-amber-200 bg-amber-50/70">
              <div className="flex items-start gap-3 text-sm text-amber-800">
                <AlertCircle className="mt-1 h-5 w-5 text-amber-500" />
                <div className="space-y-1">
                  <p className="font-semibold">
                    Automation for {providerLabel} regions is coming soon.
                  </p>
                  <p>
                    MSP credential storage and Zadara object storage automation are
                    currently limited to Zadara-backed regions. Manual fulfilment settings
                    remain available from the region overview.
                  </p>
                </div>
              </div>
            </ModernCard>
          )}

          <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-[#0F172A] via-[#1D4ED8] to-[#38BDF8] text-white shadow-2xl">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.12),_transparent_55%)]" />
            <div className="relative p-6 sm:p-8 lg:p-10">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-3">
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-white/70">
                    Credential Update
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                      {region.name || region.code}
                    </h2>
                    <p className="text-sm text-white/80 sm:text-base">
                      {locationLabel || "Location not specified"} • {region.code}
                    </p>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                  <div className="rounded-2xl bg-white/10 px-4 py-3 backdrop-blur">
                    <p className="text-xs font-medium uppercase tracking-wide text-white/70">
                      Automation Status
                    </p>
                    <p className="mt-2 text-lg font-semibold">
                      {region.msp_credentials_verified_at
                        ? "Verified"
                        : "Not Verified"}
                    </p>
                    <p className="text-xs text-white/80">
                      {region.msp_credentials_verified_at
                        ? `Last verified ${new Date(
                            region.msp_credentials_verified_at
                          ).toLocaleString()}`
                        : "Automated provisioning requires verified MSP admin credentials."}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white/10 px-4 py-3 backdrop-blur">
                    <p className="text-xs font-medium uppercase tracking-wide text-white/70">
                      Fulfillment Mode
                    </p>
                    <p className="mt-2 text-sm font-semibold text-white">
                      {formatSegment(region.fulfillment_mode) || "—"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <ModernCard
              title="Credential Details"
              className={`space-y-4 ${automationDisabled ? "opacity-50" : ""}`}
            >
              <div className="grid gap-4 md:grid-cols-2">
                <ModernInput
                  label="Username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="MSP admin username"
                  required
                  disabled={!isZadaraRegion}
                />
                <ModernInput
                  type="password"
                  label="Password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="MSP admin password"
                  required
                  disabled={!isZadaraRegion}
                />
              </div>

              <ModernInput
                label="Domain"
                name="domain"
                value={formData.domain}
                onChange={handleChange}
                placeholder="cloud_msp"
                required
                disabled={!isZadaraRegion}
              />

              <div className="grid gap-4 md:grid-cols-2">
                <ModernInput
                  label="Domain ID (optional)"
                  name="domain_id"
                  value={formData.domain_id}
                  onChange={handleChange}
                  placeholder="dom-xxxxx"
                  disabled={!isZadaraRegion}
                />
                <ModernInput
                  label="Default Project (optional)"
                  name="default_project"
                  value={formData.default_project}
                  onChange={handleChange}
                  placeholder="default"
                  disabled={!isZadaraRegion}
                />
              </div>

              <div className="space-y-3 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-xs text-blue-700">
                <p className="font-medium">
                  MSP admins authenticate using the default project token. Ensure
                  the account has the <span className="font-semibold">msp_admin</span> role.
                </p>
              </div>
            </ModernCard>

            <ModernCard
              title="Object Storage Configuration"
              className={`space-y-4 ${automationDisabled ? "opacity-50" : ""}`}
            >
              {isObjectStorageConfigured && (
                <div className="flex flex-col gap-2 rounded-2xl border border-green-100 bg-green-50 p-4 text-sm text-green-700 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle size={18} className="text-green-600" />
                    <span>Object storage is already configured for this region.</span>
                  </div>
                  <ModernButton
                    type="button"
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                    onClick={handleTestObjectStorage}
                    isLoading={testingObjectStorage}
                    isDisabled={testingObjectStorage || automationDisabled}
                  >
                    <RefreshCw size={14} />
                    {testingObjectStorage ? "Testing…" : "Test Connectivity"}
                  </ModernButton>
                </div>
              )}

              <div className="flex flex-col gap-3 rounded-2xl border border-gray-100 bg-gray-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-800">
                    Does this region support Zadara Object Storage?
                  </p>
                  <p className="mt-1 text-xs text-gray-600">
                    Enable this if tenants in this region should receive S3-style
                    endpoints and credentials managed by the CRM.
                  </p>
                </div>
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="objectStorageEnabled"
                    checked={formData.objectStorageEnabled}
                    onChange={handleChange}
                    className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    disabled={automationDisabled}
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Enable Object Storage
                  </span>
                </label>
              </div>

              {formData.objectStorageEnabled && (
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <ModernInput
                      label="Object Storage Base URL"
                      name="objectStorageBaseUrl"
                      value={formData.objectStorageBaseUrl}
                      onChange={handleChange}
                      placeholder="https://zadara-region.example.com:8443"
                      disabled={automationDisabled || objectStorageLocked}
                      required={formData.objectStorageEnabled}
                    />
                    <ModernInput
                      label="Admin Account (usually zios_admin)"
                      name="objectStorageAccount"
                      value={formData.objectStorageAccount}
                      onChange={handleChange}
                      placeholder="zios_admin"
                      disabled={automationDisabled || objectStorageLocked}
                      required={formData.objectStorageEnabled}
                    />
                  </div>

                  <ModernInput
                    type="password"
                    label="Object Storage Access Key"
                    name="objectStorageAccessKey"
                    value={formData.objectStorageAccessKey}
                    onChange={handleChange}
                    placeholder={
                      objectStorageLocked
                        ? "Stored securely. Disable to replace."
                        : "Paste the X-Access-Key provided by Zadara"
                    }
                    disabled={automationDisabled || objectStorageLocked}
                    required={formData.objectStorageEnabled}
                  />

                  <div className="grid gap-4 md:grid-cols-2">
                    <ModernInput
                      type="number"
                      label="Default Quota (GiB)"
                      name="objectStorageDefaultQuota"
                      value={formData.objectStorageDefaultQuota}
                      onChange={handleChange}
                      placeholder="1000"
                      helper="Applied to every new tenant account by default."
                      min="0"
                      disabled={automationDisabled || objectStorageLocked}
                    />
                    <ModernInput
                      type="email"
                      label="Notification Email"
                      name="objectStorageNotificationEmail"
                      value={formData.objectStorageNotificationEmail}
                      onChange={handleChange}
                      placeholder="object-storage-notify@example.com"
                      disabled={automationDisabled || objectStorageLocked}
                      required={formData.objectStorageEnabled}
                      helper="Must be a monitored inbox for password resets and alerts."
                    />
                  </div>

                  <div className="space-y-3 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-xs text-amber-700">
                    <p className="font-medium">
                      Zadara emails password resets and operational alerts to the
                      address you provide. Use a real mailbox or a shared ops
                      account that your team monitors.
                    </p>
                    {objectStorageLocked && (
                      <p className="text-xs text-amber-600">
                        To modify endpoint details, disable object storage first. Existing
                        credentials remain active until you disable the toggle.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </ModernCard>

            <ModernCard title="Review & Save" className="space-y-3">
              {automationDisabled && (
                <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  <AlertCircle className="mt-1 h-4 w-4 text-amber-500" />
                  <div className="space-y-1">
                    <p className="font-semibold">
                      Credential automation is limited to Zadara regions.
                    </p>
                    <p>
                      We’ll enable secure credential storage for {providerLabel} once the
                      integration is ready. For now, keep fulfilment in manual mode.
                    </p>
                  </div>
                </div>
              )}
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <MapPin className="h-5 w-5 text-blue-500" />
                  <span>
                    Credentials are stored securely and used for automated workflow
                    orchestration within this region.
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <ModernButton
                    type="button"
                    variant="ghost"
                    onClick={() =>
                      navigate(`/admin-dashboard/regions/${region.code}`)
                    }
                    isDisabled={submitting}
                  >
                    Cancel
                  </ModernButton>
                  <ModernButton
                    type="submit"
                    variant="primary"
                    isLoading={submitting}
                    isDisabled={submitting || automationDisabled}
                    className="flex items-center gap-2"
                  >
                    <ShieldCheck size={16} />
                    {saveButtonLabel}
                  </ModernButton>
                </div>
              </div>
            </ModernCard>
          </form>

          {Object.keys(credentialSummary).length > 0 && (
            <ModernCard title="Current Credential Snapshot" className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-gray-100 px-4 py-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Domain
                  </p>
                  <p className="mt-1 text-sm font-semibold text-gray-900">
                    {credentialSummary.domain || "—"}
                  </p>
                </div>
                <div className="rounded-xl border border-gray-100 px-4 py-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Default Project
                  </p>
                  <p className="mt-1 text-sm font-semibold text-gray-900">
                    {credentialSummary.default_project || "—"}
                  </p>
                </div>
                <div className="rounded-xl border border-gray-100 px-4 py-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Credentials Stored
                  </p>
                  <p className="mt-1 text-sm font-semibold text-gray-900">
                    {region.has_msp_credentials ? "Yes" : "No"}
                  </p>
                </div>
                <div className="rounded-xl border border-gray-100 px-4 py-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Username Preview
                  </p>
                  <p className="mt-1 text-sm font-semibold text-gray-900">
                    {credentialSummary.username_preview || "—"}
                  </p>
                </div>
                <div className="rounded-xl border border-gray-100 px-4 py-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Object Storage
                  </p>
                  <p className="mt-1 text-sm font-semibold text-gray-900">
                    {region.has_object_storage_credentials ? "Configured" : "Not Configured"}
                  </p>
                </div>
                <div className="rounded-xl border border-gray-100 px-4 py-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Object Storage Endpoint
                  </p>
                  <p className="mt-1 break-words text-sm font-semibold text-gray-900">
                    {objectStorageSummary.base_url || "—"}
                  </p>
                </div>
                <div className="rounded-xl border border-gray-100 px-4 py-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Notification Email
                  </p>
                  <p className="mt-1 text-sm font-semibold text-gray-900">
                    {objectStorageSummary.notification_email || "—"}
                  </p>
                </div>
                <div className="rounded-xl border border-gray-100 px-4 py-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Access Key Preview
                  </p>
                  <p className="mt-1 text-sm font-semibold text-gray-900">
                    {objectStorageSummary.access_key_preview || "—"}
                  </p>
                </div>
                <div className="rounded-xl border border-gray-100 px-4 py-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Default Quota (GiB)
                  </p>
                  <p className="mt-1 text-sm font-semibold text-gray-900">
                    {objectStorageSummary.default_quota_gb ?? "—"}
                  </p>
                </div>
              </div>
              {region.msp_credentials_verified_at && (
                <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                  <CheckCircle size={18} />
                  Credentials verified on{" "}
                  {new Date(region.msp_credentials_verified_at).toLocaleString()}
                </div>
              )}
            </ModernCard>
          )}
        </div>
      </AdminPageShell>
    </>
  );
};

export default RegionCredentials;
