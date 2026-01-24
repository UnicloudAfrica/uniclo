import React from "react";
import { Plus } from "lucide-react";
import { Option } from "../../../hooks/objectStorageUtils";
import { ResolvedProfile } from "../../../hooks/useObjectStoragePricing";
import { ModernButton, ModernCard } from "../ui";
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
  onStorageGbChange: (id: string, storageGb: string) => void;
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
  onStorageGbChange,
  onNameChange,
  onUnitPriceChange,
}) => {
  const canAddMore = profiles.length < maxProfiles;
  const canRemove = profiles.length > 1;

  return (
    <ModernCard title="Service Profiles">
      <p className="text-sm text-slate-500 -mt-2 mb-4">
        Configure your Silo Storage profiles. Select regions, tiers, storage size, and contract
        length.
      </p>

      <div className="space-y-4">
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
            onUpdate={() => {}}
            onRemove={() => onRemoveProfile(profile.id)}
            onRegionChange={(region) => onRegionChange(profile.id, region)}
            onTierChange={(tierKey) => onTierChange(profile.id, tierKey)}
            onMonthsChange={(months) => onMonthsChange(profile.id, months)}
            onStorageGbChange={(storageGb) => onStorageGbChange(profile.id, storageGb)}
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
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <ModernButton variant="outline" onClick={onAddProfile} leftIcon={<Plus size={16} />}>
            Add another profile
          </ModernButton>
          <span className="text-xs text-slate-500">
            {profiles.length} of {maxProfiles} profiles
          </span>
        </div>
      )}

      {!canAddMore && (
        <p className="mt-4 text-xs text-amber-600">Maximum of {maxProfiles} profiles reached.</p>
      )}
    </ModernCard>
  );
};
