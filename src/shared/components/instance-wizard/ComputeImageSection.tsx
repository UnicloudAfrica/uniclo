import React from "react";
import { Configuration, Option } from "@/types/InstanceConfiguration";
import { SearchableSelect } from "../ui";

interface ComputeImageSectionProps {
  cfg: Configuration;
  computeOptions: Option[];
  osImageOptions: Option[];
  selectedRegion: string;
  templateComputeLabel: string;
  templateImageLabel: string;
  updateConfigWithFocus: (patch: Partial<Configuration>) => void;
}

const ComputeImageSection: React.FC<ComputeImageSectionProps> = ({
  cfg,
  computeOptions,
  osImageOptions,
  selectedRegion,
  templateComputeLabel,
  templateImageLabel,
  updateConfigWithFocus,
}) => {
  return (
    <>
      <SearchableSelect
        label="Instance Type *"
        value={cfg.compute_instance_id}
        onChange={(e) => {
          const selectedLabel = e.target.selectedOptions?.[0]?.text || "";
          updateConfigWithFocus({
            compute_instance_id: e.target.value,
            compute_label: e.target.value ? selectedLabel : "",
          });
        }}
        options={[
          {
            value: "",
            label: selectedRegion ? "Select instance type" : "Select region first",
          },
          ...computeOptions,
        ]}
        helper={
          templateComputeLabel ? `Template: ${templateComputeLabel}` : "Select the compute flavor."
        }
        disabled={!selectedRegion}
      />
      <SearchableSelect
        label="OS Image *"
        value={cfg.os_image_id}
        onChange={(e) => {
          const selectedLabel = e.target.selectedOptions?.[0]?.text || "";
          updateConfigWithFocus({
            os_image_id: e.target.value,
            os_image_label: e.target.value ? selectedLabel : "",
          });
        }}
        options={[
          { value: "", label: selectedRegion ? "Select OS image" : "Select region first" },
          ...osImageOptions,
        ]}
        helper={templateImageLabel ? `Template: ${templateImageLabel}` : "Choose the base image."}
        disabled={!selectedRegion}
      />
    </>
  );
};

export default ComputeImageSection;
