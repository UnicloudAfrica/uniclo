import React, { useEffect, useMemo } from "react";
import { Plus } from "lucide-react";
import { ModernInput, ModernButton } from "../../ui";
import { useFetchAvailabilityZones } from "@/hooks/adminHooks/regionHooks";
import { BillingRegion, InvoiceFormData, ProductPricing, UpdateInvoiceFormData } from "../types";

interface StorageItemBuilderProps {
  formData: InvoiceFormData;
  errors: Record<string, string | null>;
  updateFormData: UpdateInvoiceFormData;
  regions?: BillingRegion[];
  isRegionsFetching: boolean;
  objectStorageProducts?: ProductPricing[];
  isObjectStorageProductsFetching: boolean;
  onAddObjectStorageRequest: () => void;
}

const StorageItemBuilder: React.FC<StorageItemBuilderProps> = ({
  formData,
  errors,
  updateFormData,
  regions = [],
  isRegionsFetching,
  objectStorageProducts = [],
  isObjectStorageProductsFetching,
  onAddObjectStorageRequest,
}) => {
  // Storage products are seeded per-AZ (each AZ has its own
  // ObjectStorageConfiguration row + Product row keyed by `region = az_code`).
  // The geographic region selector narrows the AZ list; the AZ selection
  // is what actually drives the storage-tier query upstream.
  const { data: availabilityZones = [], isFetching: isAzFetching } = useFetchAvailabilityZones(
    formData.object_storage_region || null,
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

  // Storage is now seeded as a single per-GiB tier per AZ — there is no
  // tier picker. Auto-select the (one) product returned for the selected
  // AZ so the request can be added straight away. If the seed ever grows
  // back to multiple tiers, we still pick the first one and the
  // unit-price preview below makes the choice transparent.
  const selectedProduct = useMemo(() => {
    if (!objectStorageProducts?.length) return undefined;
    const id = formData.object_storage_product_id;
    if (id) {
      return objectStorageProducts.find((p) => Number(p.product.productable_id) === Number(id));
    }
    return objectStorageProducts[0];
  }, [objectStorageProducts, formData.object_storage_product_id]);

  useEffect(() => {
    const candidate = objectStorageProducts?.[0];
    if (!candidate) return;
    const candidateId = Number(candidate.product.productable_id);
    if (Number(formData.object_storage_product_id) === candidateId) return;
    updateFormData("object_storage_product_id", candidateId);
    // We intentionally only react to the products list and AZ changing;
    // updateFormData is stable in callers and including it would loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [objectStorageProducts, formData.object_storage_availability_zone]);

  const unitPriceLabel = useMemo(() => {
    const pricing = (selectedProduct as unknown as { pricing?: { effective?: { price_local?: number; currency?: string } } } | undefined)?.pricing?.effective;
    if (!pricing) return null;
    const amount = Number(pricing.price_local ?? 0);
    if (!amount) return null;
    const currency = pricing.currency || "NGN";
    try {
      return new Intl.NumberFormat("en-NG", {
        style: "currency",
        currency,
        maximumFractionDigits: 2,
      }).format(amount);
    } catch {
      return `${currency} ${amount.toFixed(2)}`;
    }
  }, [selectedProduct]);

  const selectClass =
    "w-full rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm transition focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400";

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <header className="mb-6">
        <h3 className="text-base font-semibold text-slate-900">Object Storage Items</h3>
        <p className="text-sm text-slate-500">Add object storage tiers to your invoice.</p>
      </header>

      <div className="space-y-5">
        {/* Region and Availability Zone - Same Row */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Region */}
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Region <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.object_storage_region}
              onChange={(e) => {
                updateFormData("object_storage_region", e.target.value);
                // Reset downstream selections when region changes
                updateFormData("object_storage_availability_zone", "");
                updateFormData("object_storage_product_id", null);
              }}
              className={`${selectClass} ${errors.object_storage_region ? "border-red-400" : ""}`}
              disabled={isRegionsFetching}
            >
              <option value="">Select a region</option>
              {regions?.map((region) => (
                <option key={region.code} value={region.code}>
                  {region.name} ({region.code})
                </option>
              ))}
            </select>
            {errors.object_storage_region && (
              <p className="mt-1 text-xs text-red-600">{errors.object_storage_region}</p>
            )}
          </div>

          {/* Availability Zone */}
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Availability Zone <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.object_storage_availability_zone || ""}
              onChange={(e) => {
                updateFormData("object_storage_availability_zone", e.target.value);
                // Reset tier when AZ changes — tiers are AZ-scoped
                updateFormData("object_storage_product_id", null);
              }}
              className={`${selectClass} ${errors.object_storage_availability_zone ? "border-red-400" : ""}`}
              disabled={!formData.object_storage_region || isAzFetching}
            >
              <option value="">
                {!formData.object_storage_region
                  ? "Select a region first"
                  : "Select availability zone"}
              </option>
              {azOptions.map((az) => (
                <option key={az.code} value={az.code}>
                  {az.name} ({az.code})
                </option>
              ))}
            </select>
            {errors.object_storage_availability_zone && (
              <p className="mt-1 text-xs text-red-600">
                {errors.object_storage_availability_zone}
              </p>
            )}
          </div>
        </div>

        {/* Per-GiB price preview (no tier picker — only one tier is seeded) */}
        {formData.object_storage_availability_zone && (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            {isObjectStorageProductsFetching ? (
              <p className="text-sm text-slate-500">Loading pricing for this zone…</p>
            ) : selectedProduct ? (
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-slate-900">{selectedProduct.product.name}</p>
                  <p className="text-xs text-slate-500">Billed per GiB · monthly</p>
                </div>
                {unitPriceLabel && (
                  <span className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-slate-900 shadow-sm">
                    {unitPriceLabel} <span className="text-xs font-normal text-slate-500">/ GiB</span>
                  </span>
                )}
              </div>
            ) : (
              <p className="text-sm text-amber-700">
                No object storage pricing is published for this availability zone yet.
              </p>
            )}
            {errors.object_storage_product_id && (
              <p className="mt-2 text-xs text-red-600">{errors.object_storage_product_id}</p>
            )}
          </div>
        )}

        {/* Quantity and Term */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <ModernInput
            label="Quantity (GB)"
            type="number"
            min="1"
            value={formData.object_storage_quantity}
            onChange={(e) => updateFormData("object_storage_quantity", e.target.value)}
            placeholder="1000"
            required
            error={errors.object_storage_quantity || undefined}
          />
          <ModernInput
            label="Term (Months)"
            type="number"
            min="1"
            value={formData.object_storage_months}
            onChange={(e) => updateFormData("object_storage_months", e.target.value)}
            placeholder="1"
            required
            error={errors.object_storage_months || undefined}
          />
        </div>

        {/* Add Button */}
        <ModernButton
          variant="primary"
          size="lg"
          className="w-full"
          onClick={onAddObjectStorageRequest}
          disabled={
            !formData.object_storage_region ||
            !formData.object_storage_availability_zone ||
            !selectedProduct ||
            isObjectStorageProductsFetching
          }
          leftIcon={<Plus className="h-5 w-5" />}
        >
          Add Storage
        </ModernButton>
      </div>
    </div>
  );
};

export default StorageItemBuilder;
