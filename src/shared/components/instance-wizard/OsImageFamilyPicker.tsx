import React, { useEffect, useMemo, useState } from "react";
import type { Option } from "@/types/InstanceConfiguration";

interface OsImageFamilyPickerProps {
  /** Real OS-image options (pricing notices already stripped), each carrying
   *  raw.os_distro / raw.os_version. */
  options: Option[];
  /** Currently selected os_image_id. */
  value: string;
  /** Called with (os_image_id, label) when a version is chosen. */
  onSelect: (id: string, label: string) => void;
  disabled?: boolean;
  /** Shown when there are no options yet (loading / awaiting AZ / empty / no region). */
  emptyMessage?: string;
  helper?: string;
}

interface FamilyGroup {
  key: string;
  label: string;
  versions: Option[];
}

const distroOf = (option: Option): string =>
  String((option.raw as { os_distro?: unknown } | null | undefined)?.os_distro ?? "").toLowerCase();

const familyLabel = (key: string): string =>
  key === "other" ? "Other" : key.charAt(0).toUpperCase() + key.slice(1);

const OsImageFamilyPicker: React.FC<OsImageFamilyPickerProps> = ({
  options,
  value,
  onSelect,
  disabled = false,
  emptyMessage,
  helper,
}) => {
  // Options arrive already family-sorted; bucket them by distro family.
  const families = useMemo<FamilyGroup[]>(() => {
    const map = new Map<string, FamilyGroup>();
    options.forEach((option) => {
      const key = distroOf(option) || "other";
      const existing = map.get(key);
      if (existing) {
        existing.versions.push(option);
      } else {
        map.set(key, { key, label: familyLabel(key), versions: [option] });
      }
    });
    return [...map.values()];
  }, [options]);

  // Open the family of the currently-selected image by default.
  const selectedFamilyKey = useMemo(() => {
    const selected = options.find((option) => option.value === value);
    return selected ? distroOf(selected) || "other" : "";
  }, [options, value]);

  const [activeFamily, setActiveFamily] = useState<string>(selectedFamilyKey);
  useEffect(() => {
    if (selectedFamilyKey) setActiveFamily(selectedFamilyKey);
  }, [selectedFamilyKey]);

  const activeVersions = useMemo(
    () => families.find((family) => family.key === activeFamily)?.versions ?? [],
    [families, activeFamily]
  );

  const handleFamilyClick = (family: FamilyGroup) => {
    setActiveFamily(family.key);
    // A family with a single version selects immediately — no extra click.
    if (family.versions.length === 1) {
      onSelect(family.versions[0].value, family.versions[0].label);
    }
  };

  if (options.length === 0) {
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">OS Image *</label>
        <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-3 py-4 text-sm text-gray-500">
          {emptyMessage || "Select a region to see OS images."}
        </div>
      </div>
    );
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">OS Image *</label>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
        {families.map((family) => {
          const isActive = family.key === activeFamily;
          return (
            <button
              key={family.key}
              type="button"
              disabled={disabled}
              onClick={() => handleFamilyClick(family)}
              className={`rounded-xl border px-3 py-2.5 text-center text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                isActive
                  ? "border-blue-500 bg-blue-50 font-medium text-blue-700"
                  : "border-gray-200 text-gray-700 hover:border-gray-300"
              }`}
            >
              <span className="block truncate">{family.label}</span>
              <span className="block text-xs text-gray-400">
                {family.versions.length} version{family.versions.length === 1 ? "" : "s"}
              </span>
            </button>
          );
        })}
      </div>

      {activeFamily && activeVersions.length > 0 && (
        <div className="mt-3">
          <label className="block text-xs font-medium text-gray-600 mb-1">Version</label>
          <select
            value={value}
            disabled={disabled}
            onChange={(e) => {
              const picked = activeVersions.find((option) => option.value === e.target.value);
              onSelect(e.target.value, picked?.label || "");
            }}
            className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
          >
            <option value="">Select a version</option>
            {activeVersions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {helper && <p className="mt-2 text-xs text-gray-500">{helper}</p>}
    </div>
  );
};

export default OsImageFamilyPicker;
