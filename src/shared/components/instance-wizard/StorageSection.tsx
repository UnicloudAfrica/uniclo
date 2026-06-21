import React from "react";
import { Configuration, Option } from "@/types/InstanceConfiguration";
import { SearchableSelect } from "../ui";
import { getPricingNotice, stripPricingNoticeOptions } from "./ComputeImageSection";

interface StorageSectionProps {
  cfg: Configuration;
  volumeTypeOptions: Option[];
  selectedRegion: string;
  templateVolumeLabel: string;
  templateVolumeSize: string;
  updateConfigWithFocus: (patch: Partial<Configuration>) => void;
}

const StorageSection: React.FC<StorageSectionProps> = ({
  cfg,
  volumeTypeOptions,
  selectedRegion,
  templateVolumeLabel,
  templateVolumeSize,
  updateConfigWithFocus,
}) => {
  const volumeTypeNotice = getPricingNotice(volumeTypeOptions);
  const volumeTypeChoices = stripPricingNoticeOptions(volumeTypeOptions);
  const volumeTypePlaceholder = !selectedRegion
    ? "Select region first"
    : volumeTypeNotice?.kind === "loading"
      ? volumeTypeNotice.label
      : "Select volume type";

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <SearchableSelect
        label="Boot Volume Type *"
        value={cfg.volume_type_id}
        onChange={(e) => {
          const selectedLabel = e.target.selectedOptions?.[0]?.text || "";
          updateConfigWithFocus({
            volume_type_id: e.target.value,
            volume_type_label: e.target.value ? selectedLabel : "",
          });
        }}
        options={[
          {
            value: "",
            label: volumeTypePlaceholder,
          },
          ...volumeTypeChoices,
        ]}
        helper={
          templateVolumeLabel
            ? `Template: ${templateVolumeLabel}`
            : selectedRegion && volumeTypeNotice && volumeTypeNotice.kind !== "loading"
              ? volumeTypeNotice.label
              : "Choose the primary volume class."
        }
        disabled={!selectedRegion || volumeTypeNotice?.kind === "loading"}
      />
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Size (GB) *</label>
        <input
          type="number"
          min="10"
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
          value={cfg.storage_size_gb}
          onChange={(e) => updateConfigWithFocus({ storage_size_gb: e.target.value })}
        />
        {templateVolumeSize ? (
          <p className="mt-1 text-xs text-gray-500">Template size: {templateVolumeSize}</p>
        ) : null}
      </div>
    </div>
  );
};

export default StorageSection;
