import React from "react";
import { Plus } from "lucide-react";
import { ModernInput, ModernButton } from "../../ui";

const StorageItemBuilder = ({
  formData,
  errors,
  updateFormData,
  regions = [],
  isRegionsFetching,
  objectStorageProducts = [],
  isObjectStorageProductsFetching,
  onAddObjectStorageRequest,
}) => {
  const selectClass =
    "w-full rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm transition focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400";

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <header className="mb-6">
        <h3 className="text-base font-semibold text-slate-900">Object Storage Items</h3>
        <p className="text-sm text-slate-500">Add object storage tiers to your invoice.</p>
      </header>

      <div className="space-y-5">
        {/* Region and Storage Tier - Same Row */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Region */}
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Region <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.object_storage_region}
              onChange={(e) => updateFormData("object_storage_region", e.target.value)}
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

          {/* Storage Tier */}
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Storage Tier <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.object_storage_product_id || ""}
              onChange={(e) => updateFormData("object_storage_product_id", e.target.value)}
              className={`${selectClass} ${errors.object_storage_product_id ? "border-red-400" : ""}`}
              disabled={!formData.object_storage_region || isObjectStorageProductsFetching}
            >
              <option value="">Select storage tier</option>
              {objectStorageProducts?.map((product) => (
                <option key={product.product.productable_id} value={product.product.productable_id}>
                  {product.product.name}
                </option>
              ))}
            </select>
            {errors.object_storage_product_id && (
              <p className="mt-1 text-xs text-red-600">{errors.object_storage_product_id}</p>
            )}
          </div>
        </div>

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
            error={errors.object_storage_quantity}
          />
          <ModernInput
            label="Term (Months)"
            type="number"
            min="1"
            value={formData.object_storage_months}
            onChange={(e) => updateFormData("object_storage_months", e.target.value)}
            placeholder="1"
            required
            error={errors.object_storage_months}
          />
        </div>

        {/* Add Button */}
        <ModernButton
          variant="primary"
          size="lg"
          className="w-full"
          onClick={onAddObjectStorageRequest}
          leftIcon={<Plus className="h-5 w-5" />}
        >
          Add Storage
        </ModernButton>
      </div>
    </div>
  );
};

export default StorageItemBuilder;
