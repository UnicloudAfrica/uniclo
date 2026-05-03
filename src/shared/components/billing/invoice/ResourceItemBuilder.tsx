import React, { useState, useMemo } from "react";
import { ChevronDown, ChevronUp, Plus } from "lucide-react";
import { ModernInput, ModernButton } from "../../ui";
import { useFetchAvailabilityZones } from "@/hooks/adminHooks/regionHooks";
import { BillingRegion, InvoiceFormData, ProductPricing, UpdateInvoiceFormData } from "../types";

/**
 * Build a customer-facing label for a compute instance dropdown row.
 *
 * Priority order:
 *   1. family_code (already provider-agnostic, e.g. `compute-2vcpu-8gb`)
 *   2. derived "N vCPU · M GB RAM" from the nested productable's
 *      vcpus + memory_mb fields
 *   3. raw product.name as last resort (which leaks Zadara naming
 *      like `z16.10xlarge` and is what users were rightly confused
 *      by — surfacing this fallback only if neither structured
 *      hint is present)
 *
 * Returns both the headline and a price suffix when available so the
 * dropdown can render "8 vCPU · 32 GB RAM — ₦12,400/mo".
 */
function describeComputeInstance(instance: ProductPricing): string {
  const product = instance.product as Record<string, unknown> & {
    name?: string;
    family_code?: string | null;
    productable?: Record<string, unknown> | null;
  };
  const productable = (product.productable ?? {}) as {
    vcpus?: number | string | null;
    memory_mb?: number | string | null;
  };

  const vcpus = Number(productable.vcpus ?? 0);
  const memMb = Number(productable.memory_mb ?? 0);
  const memGb = memMb > 0 ? Math.round((memMb / 1024) * 10) / 10 : 0;

  // Prefer the structured spec — most readable.
  if (vcpus > 0 && memGb > 0) {
    const memLabel = Number.isInteger(memGb) ? `${memGb}` : `${memGb}`;
    return `${vcpus} vCPU · ${memLabel} GB RAM`;
  }

  // family_code is already provider-safe (set by the Bridge offer service).
  if (typeof product.family_code === "string" && product.family_code !== "") {
    return product.family_code;
  }

  // Last-resort fallback: provider-native name.
  return product.name ?? "Compute instance";
}

function formatPriceSuffix(instance: ProductPricing): string {
  const eff = instance.pricing?.effective as
    | { price_local?: number; currency?: string }
    | undefined;
  const price = Number(eff?.price_local ?? 0);
  const currency = (eff?.currency as string | undefined) ?? "";
  if (!price || !currency) return "";

  const formatted = new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currency.toUpperCase(),
    maximumFractionDigits: 0,
  }).format(price);
  return ` — ${formatted}/mo`;
}

interface ResourceItemBuilderProps {
  formData: InvoiceFormData;
  errors: Record<string, string | null>;
  updateFormData: UpdateInvoiceFormData;
  regions?: BillingRegion[];
  isRegionsFetching: boolean;
  computerInstances?: ProductPricing[];
  isComputerInstancesFetching: boolean;
  osImages?: ProductPricing[];
  isOsImagesFetching: boolean;
  ebsVolumes?: ProductPricing[];
  isEbsVolumesFetching: boolean;
  bandwidths?: ProductPricing[];
  isBandwidthsFetching: boolean;
  floatingIps?: ProductPricing[];
  isFloatingIpsFetching: boolean;
  crossConnects?: ProductPricing[];
  isCrossConnectsFetching: boolean;
  onAddRequest: () => void;
}

const ResourceItemBuilder: React.FC<ResourceItemBuilderProps> = ({
  formData,
  errors,
  updateFormData,
  regions = [],
  isRegionsFetching,
  computerInstances = [],
  isComputerInstancesFetching,
  osImages = [],
  isOsImagesFetching,
  ebsVolumes = [],
  isEbsVolumesFetching,
  bandwidths = [],
  isBandwidthsFetching,
  floatingIps = [],
  isFloatingIpsFetching,
  crossConnects = [],
  isCrossConnectsFetching,
  onAddRequest,
}) => {
  const [showNetworking, setShowNetworking] = useState(false);

  // Fetch availability zones for the selected region
  const { data: availabilityZones = [], isFetching: isAzFetching } = useFetchAvailabilityZones(
    formData.region || null
  );

  const azOptions = useMemo(() => {
    if (!Array.isArray(availabilityZones)) return [];
    return (availabilityZones as Array<{ code: string; name?: string; is_active?: boolean }>)
      .filter((az) => az.is_active !== false)
      .map((az) => ({
        code: az.code,
        name: az.name || az.code,
      }));
  }, [availabilityZones]);

  const selectClass =
    "w-full rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm transition focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400";

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <header className="mb-6">
        <h3 className="text-base font-semibold text-slate-900">Configure Resource Item</h3>
        <p className="text-sm text-slate-500">
          Build a compute configuration with storage and optional networking.
        </p>
      </header>

      <div className="space-y-5">
        {/* Region */}
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Region <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.region}
            onChange={(e) => updateFormData("region", e.target.value)}
            className={`${selectClass} ${errors.region ? "border-red-400" : ""}`}
            disabled={isRegionsFetching}
          >
            <option value="">Select a region</option>
            {regions?.map((region) => (
              <option key={region.code} value={region.code}>
                {region.name} ({region.code})
              </option>
            ))}
          </select>
          {errors.region && <p className="mt-1 text-xs text-red-600">{errors.region}</p>}
        </div>

        {/* Availability Zone */}
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Availability Zone
          </label>
          <select
            value={(formData as unknown as Record<string, unknown>).availability_zone as string || ""}
            onChange={(e) => updateFormData("availability_zone" as keyof typeof formData, e.target.value)}
            className={selectClass}
            disabled={!formData.region || isAzFetching}
          >
            <option value="">{!formData.region ? "Select a region first" : "Select availability zone"}</option>
            {azOptions.map((az) => (
              <option key={az.code} value={az.code}>
                {az.name} ({az.code})
              </option>
            ))}
          </select>
        </div>

        {/* Compute Instance */}
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Compute Instance <span className="text-red-500">*</span>
          </label>
          <p className="mb-2 text-xs text-slate-500">
            Each option shows vCPU and RAM so you can pick by size.
          </p>
          <select
            value={formData.compute_instance_id || ""}
            onChange={(e) => updateFormData("compute_instance_id", e.target.value)}
            className={`${selectClass} ${errors.compute_instance_id ? "border-red-400" : ""}`}
            disabled={!formData.region || isComputerInstancesFetching}
          >
            <option value="">Select compute instance</option>
            {computerInstances?.map((instance) => (
              <option key={instance.product.productable_id} value={instance.product.productable_id}>
                {describeComputeInstance(instance)}
                {formatPriceSuffix(instance)}
              </option>
            ))}
          </select>
          {errors.compute_instance_id && (
            <p className="mt-1 text-xs text-red-600">{errors.compute_instance_id}</p>
          )}
        </div>

        {/* OS Image */}
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Operating System <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.os_image_id || ""}
            onChange={(e) => updateFormData("os_image_id", e.target.value)}
            className={`${selectClass} ${errors.os_image_id ? "border-red-400" : ""}`}
            disabled={!formData.region || isOsImagesFetching}
          >
            <option value="">Select OS image</option>
            {osImages?.map((os) => (
              <option key={os.product.productable_id} value={os.product.productable_id}>
                {os.product.name}
              </option>
            ))}
          </select>
          {errors.os_image_id && <p className="mt-1 text-xs text-red-600">{errors.os_image_id}</p>}
        </div>

        {/* Term and Instances */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <ModernInput
            label="Term (Months)"
            type="number"
            min="1"
            value={formData.months}
            onChange={(e) => updateFormData("months", e.target.value)}
            required
            error={errors.months || undefined}
          />
          <ModernInput
            label="Number of Instances"
            type="number"
            min="1"
            value={formData.number_of_instances}
            onChange={(e) => updateFormData("number_of_instances", e.target.value)}
            required
            error={errors.number_of_instances || undefined}
          />
        </div>

        {/* Storage Configuration */}
        <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4">
          <h4 className="mb-3 text-sm font-semibold text-slate-900">Storage Configuration</h4>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Volume Type <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.volume_type_id || ""}
                onChange={(e) => updateFormData("volume_type_id", e.target.value)}
                className={`${selectClass} ${errors.volume_type_id ? "border-red-400" : ""}`}
                disabled={!formData.region || isEbsVolumesFetching}
              >
                <option value="">Select volume type</option>
                {ebsVolumes?.map((volume) => (
                  <option key={volume.product.productable_id} value={volume.product.productable_id}>
                    {volume.product.name}
                  </option>
                ))}
              </select>
              {errors.volume_type_id && (
                <p className="mt-1 text-xs text-red-600">{errors.volume_type_id}</p>
              )}
            </div>
            <ModernInput
              label="Storage Size (GB)"
              type="number"
              min="1"
              value={formData.storage_size_gb}
              onChange={(e) => updateFormData("storage_size_gb", e.target.value)}
              placeholder="100"
              required
              error={errors.storage_size_gb || undefined}
            />
          </div>
        </div>

        {/* Networking - Collapsible */}
        <div className="rounded-2xl border border-slate-200 bg-white">
          <button
            type="button"
            onClick={() => setShowNetworking(!showNetworking)}
            className="flex w-full items-center justify-between p-4 text-left transition hover:bg-slate-50"
          >
            <div>
              <h4 className="text-sm font-semibold text-slate-900">Networking (Optional)</h4>
              <p className="text-xs text-slate-500">
                Add bandwidth, floating IPs, or cross-connect
              </p>
            </div>
            {showNetworking ? (
              <ChevronUp className="h-5 w-5 text-slate-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-slate-400" />
            )}
          </button>

          {showNetworking && (
            <div className="space-y-4 border-t border-slate-200 p-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Bandwidth <span className="text-xs font-normal text-slate-500">(Internet Bandwidth Included)</span>
                  </label>
                  <select
                    value={formData.bandwidth_id || ""}
                    onChange={(e) => updateFormData("bandwidth_id", e.target.value)}
                    className={selectClass}
                    disabled={!formData.region || isBandwidthsFetching}
                  >
                    <option value="">Default (Internet Bandwidth Included)</option>
                    {bandwidths?.map((bw) => (
                      <option key={bw.product.productable_id} value={bw.product.productable_id}>
                        {bw.product.name}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-slate-500">
                    Internet bandwidth is included with every compute instance. Pick a higher tier to upgrade.
                  </p>
                </div>
                <ModernInput
                  label="Bandwidth Count"
                  type="number"
                  min="1"
                  value={formData.bandwidth_count || 1}
                  onChange={(e) => updateFormData("bandwidth_count", e.target.value)}
                  placeholder="1"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Floating IP
                  </label>
                  <select
                    value={formData.floating_ip_id || ""}
                    onChange={(e) => updateFormData("floating_ip_id", e.target.value)}
                    className={selectClass}
                    disabled={!formData.region || isFloatingIpsFetching}
                  >
                    <option value="">None</option>
                    {floatingIps?.map((ip) => (
                      <option key={ip.product.productable_id} value={ip.product.productable_id}>
                        {ip.product.name}
                      </option>
                    ))}
                  </select>
                </div>
                <ModernInput
                  label="Floating IP Count"
                  type="number"
                  min="0"
                  value={formData.floating_ip_count}
                  onChange={(e) => updateFormData("floating_ip_count", e.target.value)}
                  placeholder="0"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Cross Connect
                </label>
                <select
                  value={formData.cross_connect_id || ""}
                  onChange={(e) => updateFormData("cross_connect_id", e.target.value)}
                  className={selectClass}
                  disabled={!formData.region || isCrossConnectsFetching}
                >
                  <option value="">None</option>
                  {crossConnects?.map((cc) => (
                    <option key={cc.product.productable_id} value={cc.product.productable_id}>
                      {cc.product.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Add Button */}
        <ModernButton
          variant="primary"
          size="lg"
          className="w-full"
          onClick={onAddRequest}
          leftIcon={<Plus className="h-5 w-5" />}
        >
          Add to Invoice
        </ModernButton>
      </div>
    </div>
  );
};

export default ResourceItemBuilder;
