import React from "react";
import { Option } from "../../../hooks/objectStorageUtils";
import { ResolvedProfile } from "../../../hooks/useObjectStoragePricing";

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

  return (
    <div className="profile-card">
      <div className="profile-card-header">
        <div className="profile-title">
          <span className="profile-icon">📦</span>
          <span className="profile-name">
            {profile.name || profile.tierName || `Storage Profile ${index + 1}`}
          </span>
        </div>
        {canRemove && (
          <button
            type="button"
            className="btn-icon btn-remove"
            onClick={onRemove}
            title="Remove profile"
          >
            ✕
          </button>
        )}
      </div>

      <div className="profile-card-body">
        {/* Profile Name */}
        <div className="form-group">
          <label htmlFor={`profile-name-${profile.id}`}>Profile Name (Optional)</label>
          <input
            type="text"
            id={`profile-name-${profile.id}`}
            className="form-control"
            value={profile.name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="e.g., Production Storage"
          />
        </div>

        {/* Region Selection */}
        <div className="form-group">
          <label htmlFor={`profile-region-${profile.id}`}>Region *</label>
          <select
            id={`profile-region-${profile.id}`}
            className={`form-control ${errors.region ? "is-invalid" : ""}`}
            value={profile.region}
            onChange={(e) => onRegionChange(e.target.value)}
          >
            <option value="">Select a region...</option>
            {regionOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {errors.region && <div className="invalid-feedback">{errors.region}</div>}
        </div>

        {/* Tier Selection */}
        <div className="form-group">
          <label htmlFor={`profile-tier-${profile.id}`}>Storage Tier *</label>
          {isLoadingPricing ? (
            <div className="loading-placeholder">Loading tiers...</div>
          ) : (
            <select
              id={`profile-tier-${profile.id}`}
              className={`form-control ${errors.tierKey ? "is-invalid" : ""}`}
              value={profile.tierKey}
              onChange={(e) => onTierChange(e.target.value)}
              disabled={!profile.region}
            >
              <option value="">
                {profile.region ? "Select a tier..." : "Select region first"}
              </option>
              {profile.tierOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          )}
          {errors.tierKey && <div className="invalid-feedback">{errors.tierKey}</div>}
        </div>

        {/* Contract Length */}
        <div className="form-group">
          <label htmlFor={`profile-months-${profile.id}`}>Contract Length *</label>
          <select
            id={`profile-months-${profile.id}`}
            className={`form-control ${errors.months ? "is-invalid" : ""}`}
            value={profile.months.toString()}
            onChange={(e) => onMonthsChange(e.target.value)}
          >
            {monthOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {errors.months && <div className="invalid-feedback">{errors.months}</div>}
        </div>

        {/* Price Override (Admin only) */}
        {showPriceOverride && (
          <div className="form-group">
            <label htmlFor={`profile-price-${profile.id}`}>
              Unit Price Override ({profile.currency})
            </label>
            <input
              type="number"
              id={`profile-price-${profile.id}`}
              className="form-control"
              value={profile.unitPriceOverride || ""}
              onChange={(e) => onUnitPriceChange?.(e.target.value)}
              placeholder={`Default: ${profile.fallbackUnitPrice.toFixed(2)}`}
              min="0"
              step="0.01"
            />
            <small className="form-text text-muted">Leave empty to use default pricing</small>
          </div>
        )}
      </div>

      {/* Profile Summary */}
      {profile.hasTierData && (
        <div className="profile-card-footer">
          <div className="profile-summary">
            <div className="summary-item">
              <span className="label">Unit Price:</span>
              <span className="value">
                {formatCurrency(profile.unitPrice, profile.currency)}/mo
              </span>
            </div>
            <div className="summary-item">
              <span className="label">Duration:</span>
              <span className="value">
                {profile.months} month{profile.months !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="summary-item total">
              <span className="label">Subtotal:</span>
              <span className="value">{formatCurrency(profile.subtotal, profile.currency)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
