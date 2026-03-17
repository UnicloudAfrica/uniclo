import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AlertCircle, Loader2, MapPin, Save, Globe, Check, Plus, Trash2, ChevronDown, ChevronUp, ShieldCheck } from "lucide-react";
import adminRegionApi from "@/services/adminRegionApi";
import { useFetchTenants } from "@/hooks/adminHooks";
import {
  useFetchAvailabilityZones,
  useCreateAvailabilityZone,
  useDeleteAvailabilityZone,
  useUpdateAvailabilityZone,
} from "@/hooks/adminHooks/regionHooks";
import { useFetchCountries } from "@/hooks/resource";
import ToastUtils from "@/utils/toastUtil";
import AdminPageShell from "../components/AdminPageShell";
import { ModernCard, ModernButton } from "@/shared/components/ui";
import ModernInput from "@/shared/components/ui/ModernInput";
import StatusPill from "@/shared/components/ui/StatusPill";
import ProviderBadge from "@/shared/components/ui/ProviderBadge";
import { designTokens } from "@/styles/designTokens";
import logger from "@/utils/logger";
import { statusOptions, statusToneMap, statusLabelMap, formatSegment } from "./regionEditUtils";
import type { RegionFormData } from "./regionEditTypes";
import RegionHeroBanner from "./RegionHeroBanner";
import VisibilityApprovalCard from "./VisibilityApprovalCard";
import FastTrackConfigCard from "./FastTrackConfigCard";
import { CLOUD_PROVIDERS } from "@/shared/domains/regions/types/serviceConfig.types";
import { AZCredentialPanel } from "@/shared/domains/regions/components";
import type { AvailabilityZone } from "@/shared/types/resource";

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

  // ── Availability Zone state ──────────────────────────────────
  const { data: availabilityZones, refetch: refetchAZs } = useFetchAvailabilityZones(code);
  const createAZMutation = useCreateAvailabilityZone();
  const deleteAZMutation = useDeleteAvailabilityZone();
  const updateAZMutation = useUpdateAvailabilityZone();

  const [showAddAZForm, setShowAddAZForm] = useState(false);
  const [azFormData, setAzFormData] = useState({ code: "", name: "", provider: "", is_active: true });
  const [azFormErrors, setAzFormErrors] = useState<Record<string, string>>({});
  const [expandedAZ, setExpandedAZ] = useState<string | null>(null);
  const [deletingAZ, setDeletingAZ] = useState<string | null>(null);

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

  // ── AZ handlers ──────────────────────────────────────────────
  const handleAZFormChange = (event: any) => {
    const { name, value } = event.target;
    setAzFormData((prev) => ({ ...prev, [name]: value }));
    if (azFormErrors[name]) {
      setAzFormErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateAZForm = () => {
    const nextErrors: Record<string, string> = {};
    if (!azFormData.code.trim()) nextErrors.code = "AZ code is required";
    if (!azFormData.name.trim()) nextErrors.name = "AZ name is required";
    if (!azFormData.provider) nextErrors.provider = "Provider is required";
    setAzFormErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleCreateAZ = async () => {
    if (!validateAZForm()) return;
    try {
      await createAZMutation.mutateAsync({
        regionCode: code as string,
        data: {
          code: azFormData.code.trim(),
          name: azFormData.name.trim(),
          provider: azFormData.provider,
          is_active: azFormData.is_active,
        },
      });
      ToastUtils.success("Availability Zone created successfully");
      setAzFormData({ code: "", name: "", provider: "", is_active: true });
      setShowAddAZForm(false);
      refetchAZs();
    } catch (error: any) {
      logger.error("Error creating AZ:", error);
      ToastUtils.error(error.message || "Failed to create Availability Zone");
    }
  };

  const handleDeleteAZ = async (azCode: string) => {
    setDeletingAZ(azCode);
    try {
      await deleteAZMutation.mutateAsync({
        regionCode: code as string,
        azCode,
      });
      ToastUtils.success("Availability Zone deleted successfully");
      refetchAZs();
    } catch (error: any) {
      logger.error("Error deleting AZ:", error);
      ToastUtils.error(error.message || "Failed to delete Availability Zone");
    } finally {
      setDeletingAZ(null);
    }
  };

  const handleToggleAZActive = async (az: AvailabilityZone) => {
    try {
      await updateAZMutation.mutateAsync({
        regionCode: code as string,
        azCode: az.code,
        data: { is_active: !az.is_active },
      });
      ToastUtils.success(`${az.name || az.code} ${az.is_active ? "deactivated" : "activated"}`);
      refetchAZs();
    } catch (error: any) {
      logger.error("Error toggling AZ:", error);
      ToastUtils.error(error.message || "Failed to update Availability Zone");
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

  // ── AZ count for hero banner ─────────────────────────────────
  const azCount = Array.isArray(availabilityZones) ? availabilityZones.length : 0;

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
          regionProvider={`${azCount} Availability Zone${azCount !== 1 ? "s" : ""}`}
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

          {/* ── Availability Zones ──────────────────────────────────── */}
          <ModernCard
            title={`Availability Zones (${azCount})`}
            className="space-y-4"
          >
            <p className="text-sm text-gray-500">
              Manage the availability zones within this region. Each AZ carries its own cloud provider and credentials.
            </p>

            {/* AZ List */}
            {Array.isArray(availabilityZones) && availabilityZones.length > 0 ? (
              <div className="space-y-3">
                {availabilityZones.map((az: AvailabilityZone) => (
                  <div
                    key={az.code}
                    className="rounded-2xl border border-gray-200 bg-white overflow-hidden"
                  >
                    {/* AZ Row */}
                    <div className="flex items-center justify-between gap-3 px-4 py-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <button
                          type="button"
                          onClick={() => setExpandedAZ(expandedAZ === az.code ? null : az.code)}
                          className="text-gray-400 hover:text-gray-600 transition"
                        >
                          {expandedAZ === az.code ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-gray-900 truncate">
                              {az.name || az.code}
                            </span>
                            <span className="text-xs text-gray-400 font-mono">{az.code}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <ProviderBadge provider={az.provider} size="sm" />

                        <StatusPill
                          label={statusLabelMap[az.status] || formatSegment(az.status) || "Unknown"}
                          tone={statusToneMap[az.status] || "info"}
                        />

                        {az.is_verified && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-green-50 border border-green-200 px-2 py-0.5 text-[11px] font-medium text-green-700">
                            <ShieldCheck size={12} />
                            Verified
                          </span>
                        )}

                        {/* Active toggle */}
                        <button
                          type="button"
                          onClick={() => handleToggleAZActive(az)}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition ${
                            az.is_active ? "bg-blue-500" : "bg-gray-300"
                          }`}
                          title={az.is_active ? "Active - click to deactivate" : "Inactive - click to activate"}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                              az.is_active ? "translate-x-4" : "translate-x-0.5"
                            }`}
                          />
                        </button>

                        {/* Delete button */}
                        <ModernButton
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteAZ(az.code)}
                          isLoading={deletingAZ === az.code}
                          isDisabled={deletingAZ === az.code}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 !px-2"
                        >
                          <Trash2 size={14} />
                        </ModernButton>
                      </div>
                    </div>

                    {/* Expanded details + credential management */}
                    {expandedAZ === az.code && (
                      <AZExpandedPanel
                        az={az}
                        regionCode={code as string}
                        onUpdate={async (data) => {
                          await updateAZMutation.mutateAsync({
                            regionCode: code as string,
                            azCode: az.code,
                            data,
                          });
                          ToastUtils.success("AZ updated");
                          refetchAZs();
                        }}
                      />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 p-6 text-center">
                <p className="text-sm text-gray-500">No availability zones configured yet.</p>
                <p className="text-xs text-gray-400 mt-1">
                  Add an availability zone to connect a cloud provider to this region.
                </p>
              </div>
            )}

            {/* Add AZ Form */}
            {showAddAZForm ? (
              <div className="rounded-2xl border border-blue-200 bg-blue-50/30 p-4 space-y-4">
                <h4 className="text-sm font-semibold text-gray-900">Add Availability Zone</h4>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-700">Provider</label>
                    <select
                      name="provider"
                      value={azFormData.provider}
                      onChange={handleAZFormChange}
                      className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    >
                      <option value="">Select provider...</option>
                      {CLOUD_PROVIDERS.map((p) => (
                        <option key={p.value} value={p.value}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                    {azFormErrors.provider && (
                      <p className="mt-1 text-xs text-red-500">{azFormErrors.provider}</p>
                    )}
                  </div>

                  <ModernInput
                    label="AZ Code"
                    name="code"
                    value={azFormData.code}
                    onChange={handleAZFormChange}
                    placeholder="e.g., lagos-az1"
                    error={azFormErrors.code}
                  />

                  <ModernInput
                    label="AZ Name"
                    name="name"
                    value={azFormData.name}
                    onChange={handleAZFormChange}
                    placeholder="e.g., Lagos AZ 1"
                    error={azFormErrors.name}
                  />
                </div>

                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={azFormData.is_active}
                      onChange={(e) => setAzFormData((prev) => ({ ...prev, is_active: e.target.checked }))}
                      className="rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                    />
                    Active
                  </label>
                </div>

                <div className="flex gap-2">
                  <ModernButton
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={handleCreateAZ}
                    isLoading={createAZMutation.isPending}
                    isDisabled={createAZMutation.isPending}
                    className="flex items-center gap-1.5"
                  >
                    <Plus size={14} />
                    Create AZ
                  </ModernButton>
                  <ModernButton
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowAddAZForm(false);
                      setAzFormData({ code: "", name: "", provider: "", is_active: true });
                      setAzFormErrors({});
                    }}
                  >
                    Cancel
                  </ModernButton>
                </div>
              </div>
            ) : (
              <ModernButton
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowAddAZForm(true)}
                className="flex items-center gap-1.5"
              >
                <Plus size={14} />
                Add Availability Zone
              </ModernButton>
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
                  {submitting ? "Saving..." : "Save Changes"}
                </ModernButton>
              </div>
            </div>
          </ModernCard>
        </form>
      </div>
    </AdminPageShell>
  );
};

/** Inline expanded panel for editing an AZ's name, priority, and credentials */
const AZExpandedPanel: React.FC<{
  az: AvailabilityZone;
  regionCode: string;
  onUpdate: (data: Record<string, unknown>) => Promise<void>;
}> = ({ az, regionCode, onUpdate }) => {
  const [editName, setEditName] = useState(az.name || "");
  const [editPriority, setEditPriority] = useState(String(az.priority ?? 100));
  const [saving, setSaving] = useState(false);
  const hasChanges = editName !== (az.name || "") || editPriority !== String(az.priority ?? 100);

  const handleSaveDetails = async () => {
    setSaving(true);
    try {
      await onUpdate({
        name: editName.trim(),
        priority: Number(editPriority) || 100,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="border-t border-gray-100 bg-gray-50/50 px-4 py-4 space-y-4">
      {/* Editable fields */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500 uppercase tracking-wide">
            AZ Name
          </label>
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            placeholder="e.g., Lagos Zadara AZ1"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500 uppercase tracking-wide">
            Priority
          </label>
          <input
            type="number"
            value={editPriority}
            onChange={(e) => setEditPriority(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            min={1}
            step={1}
          />
        </div>
        <div className="flex flex-col justify-between">
          <label className="mb-1 block text-xs font-medium text-gray-500 uppercase tracking-wide">
            Provider
          </label>
          <p className="px-3 py-2 text-sm text-gray-600 capitalize bg-gray-100 rounded-xl">
            {az.provider}
          </p>
        </div>
      </div>

      {hasChanges && (
        <div className="flex items-center gap-2">
          <ModernButton
            type="button"
            variant="primary"
            size="sm"
            onClick={handleSaveDetails}
            isLoading={saving}
            isDisabled={saving || !editName.trim()}
          >
            Save Details
          </ModernButton>
          <ModernButton
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setEditName(az.name || "");
              setEditPriority(String(az.priority ?? 100));
            }}
          >
            Reset
          </ModernButton>
        </div>
      )}

      <div className="text-xs text-gray-400">
        Created: {az.created_at ? new Date(az.created_at).toLocaleDateString() : "N/A"}
      </div>

      {/* Service Credentials Panel */}
      <div className="border-t border-gray-200 pt-4">
        <AZCredentialPanel regionCode={regionCode} az={az} />
      </div>
    </div>
  );
};

export default RegionEdit;
