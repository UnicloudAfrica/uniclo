import React from "react";
import { AdditionalVolume, Option } from "@/types/InstanceConfiguration";
import { ModernButton, SearchableSelect } from "../ui";

export interface VolumesSectionProps {
  configId: string;
  additionalVolumes: AdditionalVolume[];
  volumeTypeOptions: Option[];
  selectedRegion: string;
  addAdditionalVolume: (configId: string) => void;
  updateAdditionalVolume: (
    configId: string,
    volumeId: string,
    patch: Partial<AdditionalVolume>
  ) => void;
  removeAdditionalVolume: (configId: string, volumeId: string) => void;
}

const VolumesSection: React.FC<VolumesSectionProps> = ({
  configId,
  additionalVolumes,
  volumeTypeOptions,
  selectedRegion,
  addAdditionalVolume,
  updateAdditionalVolume,
  removeAdditionalVolume,
}) => {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-900">Additional data volumes</span>
        <ModernButton variant="outline" onClick={() => addAdditionalVolume(configId)} size="sm">
          Add data volume
        </ModernButton>
      </div>
      {additionalVolumes.length === 0 && (
        <p className="text-xs text-gray-500">
          No extra data volumes. Click &quot;Add data volume&quot; to attach more storage.
        </p>
      )}
      {additionalVolumes.map((vol) => (
        <div
          key={vol.id}
          className="grid gap-3 rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 md:grid-cols-3"
        >
          <SearchableSelect
            label="Volume type"
            value={vol.volume_type_id}
            onChange={(e: any) =>
              updateAdditionalVolume(configId, vol.id, { volume_type_id: e.target.value })
            }
            options={[
              { value: "", label: selectedRegion ? "Select volume type" : "Select region first" },
              ...volumeTypeOptions,
            ]}
            helper="Data volume class."
            disabled={!selectedRegion}
          />
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Size (GB)</label>
            <input
              type="number"
              min="10"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
              value={vol.storage_size_gb}
              onChange={(e) =>
                updateAdditionalVolume(configId, vol.id, { storage_size_gb: e.target.value })
              }
            />
            <p className="mt-1 text-xs text-gray-500">Capacity for this data volume.</p>
          </div>
          <div className="flex items-end justify-end">
            <ModernButton variant="ghost" onClick={() => removeAdditionalVolume(configId, vol.id)}>
              Remove
            </ModernButton>
          </div>
        </div>
      ))}
    </div>
  );
};

export default VolumesSection;
