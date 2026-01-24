import React from "react";
import { Package, X } from "lucide-react";
import { Option } from "../../../hooks/objectStorageUtils";
import { ResolvedProfile } from "../../../hooks/useObjectStoragePricing";
import { ModernInput, ModernSelect } from "../ui";

export interface ObjectStorageProfileCardProps {
  profile: ResolvedProfile;
  index: number;
  regionOptions: Option[];
  isLoadingPricing?: boolean;
  errors?: Record<string, string>;
  canRemove?: boolean;
  showPriceOverride?: boolean; // Only show for admin context
  onUpdate: (updates: Partial<ResolvedProfile>) => void;
  onRemove: () => void;
  onRegionChange: (region: string) => void;
  onTierChange: (tierKey: string) => void;
  onMonthsChange: (months: string) => void;
  onStorageGbChange: (storageGb: string) => void;
  onNameChange: (name: string) => void;
  onUnitPriceChange?: (unitPrice: string) => void;
}

export const ObjectStorageProfileCard: React.FC<ObjectStorageProfileCardProps> = ({
  profile,
  index,
  regionOptions,
  isLoadingPricing,
  errors = {},
  canRemove = true,
  showPriceOverride = false,
  onUpdate,
  onRemove,
  onRegionChange,
  onTierChange,
  onMonthsChange,
  onStorageGbChange,
  onNameChange,
  onUnitPriceChange,
}) => {
  const formatCurrency = (amount: number, currency: string) => {
    try {
      return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency,
        minimumFractionDigits: 2,
      }).format(amount);
    } catch {
      return `${currency} ${amount.toFixed(2)}`;
    }
  };

  const monthOptions = [
    { value: "1", label: "1 month" },
    { value: "3", label: "3 months" },
    { value: "6", label: "6 months" },
    { value: "12", label: "12 months" },
    { value: "24", label: "24 months" },
    { value: "36", label: "36 months" },
  ];

  const tierHelper = isLoadingPricing
    ? "Loading tiers..."
    : profile.region
      ? ""
      : "Select a region first.";

  const storageHelper = profile.tierQuotaGb
    ? `Default tier size: ${profile.tierQuotaGb} GB`
    : "Enter storage size in GB.";

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary-50 p-2 text-primary-600">
            <Package className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">
              {profile.name || profile.tierName || `Storage Profile ${index + 1}`}
            </p>
            <p className="text-xs text-slate-500">Profile {index + 1}</p>
          </div>
        </div>
        {canRemove && (
          <button
            type="button"
            className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
            onClick={onRemove}
            title="Remove profile"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <ModernInput
          label="Profile Name (optional)"
          value={profile.name || ""}
          onChange={(event) => onNameChange(event.target.value)}
          placeholder="e.g., Production Storage"
        />

        <ModernSelect
          label="Region"
          value={profile.region}
          onChange={(event) => onRegionChange(event.target.value)}
          options={regionOptions}
          placeholder="Select a region"
          error={errors.region}
        />

        <ModernSelect
          label="Storage Tier"
          value={profile.tierKey}
          onChange={(event) => onTierChange(event.target.value)}
          options={profile.tierOptions}
          placeholder={profile.region ? "Select a tier" : "Select a region first"}
          disabled={!profile.region || Boolean(isLoadingPricing)}
          helper={tierHelper}
          error={errors.tierKey}
        />

        <ModernInput
          label="Storage Size (GB)"
          type="number"
          min="1"
          max="100000"
          step="1"
          value={profile.storageGb ? String(profile.storageGb) : ""}
          onChange={(event) => onStorageGbChange(event.target.value)}
          placeholder={profile.tierQuotaGb ? String(profile.tierQuotaGb) : "100"}
          helper={storageHelper}
          error={errors.storageGb}
        />

        <ModernSelect
          label="Contract Length"
          value={profile.months.toString()}
          onChange={(event) => onMonthsChange(event.target.value)}
          options={monthOptions}
          placeholder="Select term length"
          error={errors.months}
        />

        {showPriceOverride && (
          <div className="md:col-span-2">
            <ModernInput
              label={`Unit Price Override (${profile.currency} / GB)`}
              type="number"
              value={profile.unitPriceOverride || ""}
              onChange={(event) => onUnitPriceChange?.(event.target.value)}
              placeholder={`Default: ${profile.fallbackUnitPrice.toFixed(2)}`}
              min="0"
              step="0.01"
              helper="Leave empty to use default pricing."
            />
          </div>
        )}
      </div>

      {profile.hasTierData && (
        <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
          <div className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Unit price</p>
              <p className="font-semibold text-slate-900">
                {formatCurrency(profile.unitPrice, profile.currency)} / GB / month
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Storage size</p>
              <p className="font-semibold text-slate-900">
                {profile.storageGb ? `${profile.storageGb} GB` : "N/A"}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Duration</p>
              <p className="font-semibold text-slate-900">
                {profile.months} month{profile.months !== 1 ? "s" : ""}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Subtotal</p>
              <p className="font-semibold text-slate-900">
                {formatCurrency(profile.subtotal, profile.currency)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
