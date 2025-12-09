// @ts-nocheck
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AlertCircle, Loader2, MapPin, Save } from "lucide-react";
import adminRegionApi from "../../services/adminRegionApi";
import ToastUtils from "../../utils/toastUtil";
import AdminSidebar from "../components/AdminSidebar";
import AdminHeadbar from "../components/adminHeadbar";
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
const formatSegment = (value: any) => {
  if (!value) return "";
  return value
    .toString()
    .split(/[_-]/)
    .filter(Boolean)
    .map((segment: any) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
};
const RegionEdit = () => {
  const { id: code } = useParams();
  const navigate = useNavigate();
  const [region, setRegion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    country_code: "",
    city: "",
    base_url: "",
    status: "healthy",
    is_active: true,
  });
  const [errors, setErrors] = useState({});

  const formId = "region-edit-form";

  useEffect(() => {
    fetchRegionDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        base_url: regionData.base_url || "",
        status: regionData.status || "healthy",
        is_active: regionData.is_active !== undefined ? regionData.is_active : true,
      });
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
    if (!formData.base_url.trim()) nextErrors.base_url = "Base URL is required";
    else if (!/^https?:\/\/.+/.test(formData.base_url.trim()))
      nextErrors.base_url = "Enter a valid URL starting with http or https";

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };
  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;

    try {
      setSubmitting(true);
      await adminRegionApi.updateRegion(code, {
        ...formData,
        name: formData.name.trim(),
        country_code: formData.country_code.trim(),
        city: formData.city.trim(),
        base_url: formData.base_url.trim(),
      });
      ToastUtils.success("Region updated successfully");
      navigate(`/admin-dashboard/regions/${formData.code}`);
    } catch (error) {
      console.error("Error updating region:", error);
      ToastUtils.error("Failed to update region");
    } finally {
      setSubmitting(false);
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
    return (
      <>
        <AdminHeadbar />
        <AdminSidebar />
        {renderLoadingShell()}
      </>
    );
  }

  if (!region) {
    return (
      <>
        <AdminHeadbar />
        <AdminSidebar />
        {renderNotFoundShell()}
      </>
    );
  }

  return (
    <>
      <AdminHeadbar />
      <AdminSidebar />
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
          <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-[#0284C7] via-[#2563EB] to-[#1D4ED8] text-white shadow-2xl">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.15),_transparent_55%)]" />
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
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
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

              <ModernInput
                label="Base URL"
                name="base_url"
                value={formData.base_url}
                onChange={handleChange}
                placeholder="https://api.example.com"
                required
                error={errors.base_url}
              />
            </ModernCard>

            <ModernCard title="Location & Status" className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <ModernInput
                  label="Country Code"
                  name="country_code"
                  value={formData.country_code}
                  onChange={handleChange}
                  placeholder="NG"
                  maxLength={2}
                  required
                  helper="Use ISO 3166-1 alpha-2 country codes."
                  error={errors.country_code}
                />

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
