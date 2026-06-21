import React from "react";
import { Configuration, Option } from "@/types/InstanceConfiguration";
import { SearchableSelect } from "../ui";

/* ── Pricing-notice options ────────────────────────────────────────────
 * The product dropdowns (instance type / OS image / volume type /
 * bandwidth) are presentational: they receive plain `Option[]` arrays
 * threaded through `InstanceConfigurationForm`. The options array is
 * therefore the only channel by which the pricing fetches (producer:
 * `AdminInstanceConfigurationCard`) can tell these sections *why* a
 * list is empty — still loading, waiting for an AZ pick, or genuinely
 * unpublished. A notice is a sentinel Option whose `raw` carries a
 * marker; `value` stays "" so any consumer that renders it as a plain
 * option treats selecting it as "clear selection" (harmless).
 */
const PRICING_NOTICE_KEY = "__pricing_notice__";

export type PricingNoticeKind = "loading" | "awaiting_az" | "empty";

export interface PricingNotice {
  kind: PricingNoticeKind;
  label: string;
}

export const makePricingNoticeOption = (kind: PricingNoticeKind, label: string): Option => ({
  value: "",
  label,
  raw: { [PRICING_NOTICE_KEY]: kind },
});

export const getPricingNotice = (options: Option[]): PricingNotice | null => {
  for (const option of options) {
    const kind = (option?.raw as Record<string, unknown> | null | undefined)?.[PRICING_NOTICE_KEY];
    if (kind === "loading" || kind === "awaiting_az" || kind === "empty") {
      return { kind, label: option.label };
    }
  }
  return null;
};

export const stripPricingNoticeOptions = (options: Option[]): Option[] =>
  options.filter((option) => getPricingNotice([option]) === null);

/**
 * When a dropdown's catalog offers exactly one real choice (after
 * stripping placeholder values and pricing notices), return it so the
 * wizard can pre-select it instead of making the user open a one-item
 * dropdown. Same UX rule as `resolveAutoSelectTierKey` in
 * objectStorageUtils. Returns null for zero or multiple choices.
 */
export const resolveLoneSelectableOption = (options: Option[]): Option | null => {
  const real = stripPricingNoticeOptions(options).filter((option) => option.value);
  return real.length === 1 && real[0] ? real[0] : null;
};

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
  const computeNotice = getPricingNotice(computeOptions);
  const osImageNotice = getPricingNotice(osImageOptions);
  const computeChoices = stripPricingNoticeOptions(computeOptions);
  const osImageChoices = stripPricingNoticeOptions(osImageOptions);

  const computePlaceholder = !selectedRegion
    ? "Select region first"
    : computeNotice?.kind === "loading"
      ? computeNotice.label
      : "Select instance type";
  const osImagePlaceholder = !selectedRegion
    ? "Select region first"
    : osImageNotice?.kind === "loading"
      ? osImageNotice.label
      : "Select OS image";

  return (
    <>
      <SearchableSelect
        label="Instance Type *"
        value={cfg.compute_instance_id}
        onChange={(e) => {
          const selectedLabel = e.target.selectedOptions?.[0]?.text || "";
          const selectedValue = e.target.value;
          const selectedOption = computeOptions.find((o) => String(o.value) === selectedValue);
          const familyCode = selectedOption?.raw
            ? (selectedOption.raw as { family_code?: string }).family_code || ""
            : "";
          updateConfigWithFocus({
            compute_instance_id: selectedValue,
            compute_label: selectedValue ? selectedLabel : "",
            family_code: familyCode,
          });
        }}
        options={[
          {
            value: "",
            label: computePlaceholder,
          },
          ...computeChoices,
        ]}
        helper={
          templateComputeLabel
            ? `Template: ${templateComputeLabel}`
            : selectedRegion && computeNotice && computeNotice.kind !== "loading"
              ? computeNotice.label
              : "Select the compute flavor."
        }
        disabled={!selectedRegion || computeNotice?.kind === "loading"}
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
        options={[{ value: "", label: osImagePlaceholder }, ...osImageChoices]}
        helper={
          templateImageLabel
            ? `Template: ${templateImageLabel}`
            : selectedRegion && osImageNotice && osImageNotice.kind !== "loading"
              ? osImageNotice.label
              : "Choose the base image."
        }
        disabled={!selectedRegion || osImageNotice?.kind === "loading"}
      />
    </>
  );
};

export default ComputeImageSection;
