import React from "react";
import { Option } from "../../../hooks/objectStorageUtils";
import { ResolvedProfile } from "../../../hooks/useObjectStoragePricing";
import { ObjectStorageProfileCard } from "./ObjectStorageProfileCard";

export interface ObjectStorageServiceStepProps {
  profiles: ResolvedProfile[];
  regionOptions: Option[];
  isLoadingPricing?: boolean;
  profileErrors?: Record<string, Record<string, string>>;
  maxProfiles?: number;
  showPriceOverride?: boolean; // Only for admin
  dashboardContext: "admin" | "tenant" | "client";

  // Handlers
  onAddProfile: () => void;
  onRemoveProfile: (id: string) => void;
  onRegionChange: (id: string, region: string) => void;
  onTierChange: (id: string, tierKey: string) => void;
  onMonthsChange: (id: string, months: string) => void;
  onNameChange: (id: string, name: string) => void;
  onUnitPriceChange?: (id: string, unitPrice: string) => void;
}

export const ObjectStorageServiceStep: React.FC<ObjectStorageServiceStepProps> = ({
  profiles,
  regionOptions,
  isLoadingPricing,
  profileErrors = {},
  maxProfiles = 10,
  showPriceOverride = false,
  dashboardContext,
  onAddProfile,
  onRemoveProfile,
  onRegionChange,
  onTierChange,
  onMonthsChange,
  onNameChange,
  onUnitPriceChange,
}) => {
  const canAddMore = profiles.length < maxProfiles;
  const canRemove = profiles.length > 1;

  return (
    <div className="service-step">
      <div className="step-header">
        <h2 className="step-title">Service Profiles</h2>
        <p className="step-description">
          Configure your object storage profiles. Select regions, tiers, and contract length.
        </p>
      </div>

      <div className="profiles-container">
        {profiles.map((profile, index) => (
          <ObjectStorageProfileCard
            key={profile.id}
            profile={profile}
            index={index}
            regionOptions={regionOptions}
            isLoadingPricing={isLoadingPricing}
            errors={profileErrors[profile.id]}
            canRemove={canRemove}
            showPriceOverride={showPriceOverride && dashboardContext === "admin"}
            onUpdate={() => {}} // Not used directly
            onRemove={() => onRemoveProfile(profile.id)}
            onRegionChange={(region) => onRegionChange(profile.id, region)}
            onTierChange={(tierKey) => onTierChange(profile.id, tierKey)}
            onMonthsChange={(months) => onMonthsChange(profile.id, months)}
            onNameChange={(name) => onNameChange(profile.id, name)}
            onUnitPriceChange={
              onUnitPriceChange
                ? (unitPrice) => onUnitPriceChange(profile.id, unitPrice)
                : undefined
            }
          />
        ))}
      </div>

      {canAddMore && (
        <div className="add-profile-container">
          <button
            type="button"
            className="btn btn-outline-primary btn-add-profile"
            onClick={onAddProfile}
          >
            <span className="btn-icon">+</span>
            Add Another Profile
          </button>
          <small className="profiles-limit">
            {profiles.length} of {maxProfiles} profiles
          </small>
        </div>
      )}

      {!canAddMore && (
        <p className="profiles-limit-warning">Maximum of {maxProfiles} profiles reached.</p>
      )}
    </div>
  );
};
