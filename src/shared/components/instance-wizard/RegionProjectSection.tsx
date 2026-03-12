import React from "react";
import { Configuration, Option } from "@/types/InstanceConfiguration";
import { ModernSelect, SearchableSelect } from "../ui";

interface RegionProjectSectionProps {
  cfg: Configuration;
  regionOptions: Option[];
  projectSelectOptions: Option[];
  projectSelectValue: string;
  effectiveProjectMode: string;
  isTemplateLocked: boolean;
  selectedRegion: string;
  networkPresetValue: string;
  presetOptions: Option[];
  selectedPreset: any;
  selectedProjectPreset: any;
  selectedProject: any;
  isSelectedProjectPresetPublic: boolean;
  hasFloatingIp: boolean;
  normalizedFloatingIpCount: number;
  isLoadingResources: boolean;
  isSubmitting: boolean;
  focusKey: (field: string) => string;
  updateConfigWithFocus: (patch: Partial<Configuration>) => void;
  handleProjectModeChange: (value: string) => void;
  handleProjectSelection: (value: string) => void;
  projectModeOptions: Option[];
}

const RegionProjectSection: React.FC<RegionProjectSectionProps> = ({
  cfg,
  regionOptions,
  projectSelectOptions,
  projectSelectValue,
  effectiveProjectMode,
  isTemplateLocked,
  selectedRegion,
  networkPresetValue,
  presetOptions,
  selectedPreset,
  selectedProjectPreset,
  selectedProject,
  isSelectedProjectPresetPublic,
  hasFloatingIp,
  normalizedFloatingIpCount,
  isLoadingResources,
  isSubmitting,
  focusKey,
  updateConfigWithFocus,
  handleProjectModeChange,
  handleProjectSelection,
  projectModeOptions,
}) => {
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        <ModernSelect
          label="Region *"
          value={cfg.region || ""}
          onChange={(e) => {
            const selectedLabel = e.target.selectedOptions?.[0]?.text || "";
            updateConfigWithFocus({
              region: e.target.value,
              region_label: e.target.value ? selectedLabel : "",
            });
          }}
          placeholder=""
          options={[{ value: "", label: "Select region" }, ...regionOptions]}
          helper="Region code used for pricing and provisioning."
          disabled={isLoadingResources}
        />
        <ModernSelect
          label="Project mode"
          value={effectiveProjectMode}
          onChange={(e) => handleProjectModeChange(e.target.value)}
          options={projectModeOptions}
          helper={isTemplateLocked ? "Project mode is locked by the template." : ""}
          disabled={isTemplateLocked}
        />
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Duration (Months) *
          </label>
          <input
            type="number"
            min="1"
            max="36"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
            value={cfg.months}
            onChange={(e) => updateConfigWithFocus({ months: e.target.value })}
          />
        </div>
      </div>

      {effectiveProjectMode === "existing" ? (
        <ExistingProjectFields
          projectSelectValue={projectSelectValue}
          projectSelectOptions={projectSelectOptions}
          handleProjectSelection={handleProjectSelection}
          isTemplateLocked={isTemplateLocked}
          selectedRegion={selectedRegion}
          selectedProjectPreset={selectedProjectPreset}
          selectedProject={selectedProject}
          isSelectedProjectPresetPublic={isSelectedProjectPresetPublic}
          hasFloatingIp={hasFloatingIp}
        />
      ) : (
        <NewProjectFields
          cfg={cfg}
          networkPresetValue={networkPresetValue}
          presetOptions={presetOptions}
          selectedPreset={selectedPreset}
          hasFloatingIp={hasFloatingIp}
          normalizedFloatingIpCount={normalizedFloatingIpCount}
          isSubmitting={isSubmitting}
          focusKey={focusKey}
          updateConfigWithFocus={updateConfigWithFocus}
        />
      )}
    </>
  );
};

/* ---------- Existing project sub-section ---------- */

interface ExistingProjectFieldsProps {
  projectSelectValue: string;
  projectSelectOptions: Option[];
  handleProjectSelection: (value: string) => void;
  isTemplateLocked: boolean;
  selectedRegion: string;
  selectedProjectPreset: any;
  selectedProject: any;
  isSelectedProjectPresetPublic: boolean;
  hasFloatingIp: boolean;
}

const ExistingProjectFields: React.FC<ExistingProjectFieldsProps> = ({
  projectSelectValue,
  projectSelectOptions,
  handleProjectSelection,
  isTemplateLocked,
  selectedRegion,
  selectedProjectPreset,
  selectedProject,
  isSelectedProjectPresetPublic,
  hasFloatingIp,
}) => (
  <div className="grid gap-4 md:grid-cols-2">
    <SearchableSelect
      label="Project *"
      value={projectSelectValue}
      onChange={(e) => handleProjectSelection(e.target.value)}
      options={[{ value: "", label: "Select project" }, ...projectSelectOptions]}
      helper="Choose an existing project for this configuration."
      disabled={isTemplateLocked || !selectedRegion}
    />
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600">
      {selectedProjectPreset ? (
        <>
          <p className="font-semibold text-gray-700">
            Network preset: {selectedProjectPreset.name}
          </p>
          <p className="mt-1">{selectedProjectPreset.description}</p>
          {Array.isArray(selectedProjectPreset.features) &&
            selectedProjectPreset.features.length > 0 && (
              <p className="mt-1 text-gray-500">
                Includes: {selectedProjectPreset.features.join(", ")}
              </p>
            )}
          {hasFloatingIp && !isSelectedProjectPresetPublic && (
            <p className="mt-2 text-xs text-amber-600">
              Elastic IPs require a public preset. This project is private and will be upgraded
              during provisioning.
            </p>
          )}
        </>
      ) : selectedProject ? (
        <p className="text-gray-500">
          No preset recorded. This project will use its existing network resources.
        </p>
      ) : (
        <p className="text-gray-500">Select a project to view its network preset details.</p>
      )}
    </div>
  </div>
);

/* ---------- New project sub-section ---------- */

interface NewProjectFieldsProps {
  cfg: Configuration;
  networkPresetValue: string;
  presetOptions: Option[];
  selectedPreset: any;
  hasFloatingIp: boolean;
  normalizedFloatingIpCount: number;
  isSubmitting: boolean;
  focusKey: (field: string) => string;
  updateConfigWithFocus: (patch: Partial<Configuration>) => void;
}

const NewProjectFields: React.FC<NewProjectFieldsProps> = ({
  cfg,
  networkPresetValue,
  presetOptions,
  selectedPreset,
  hasFloatingIp,
  normalizedFloatingIpCount,
  isSubmitting,
  focusKey,
  updateConfigWithFocus,
}) => (
  <div className="space-y-3 rounded-xl border border-gray-200 bg-white p-4">
    <div className="grid gap-4 md:grid-cols-2">
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Project name *</label>
        <input
          type="text"
          data-focus-key={focusKey("project_name")}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
          value={cfg.project_name || ""}
          onChange={(e) => updateConfigWithFocus({ project_name: e.target.value })}
          placeholder="Enter project name"
        />
        <p className="mt-1 text-xs text-gray-500">
          Project will be created after payment and uses the selected preset.
        </p>
      </div>
      <ModernSelect
        label="Network preset *"
        value={networkPresetValue}
        onChange={(e) => updateConfigWithFocus({ network_preset: e.target.value })}
        options={[{ value: "", label: "Select network preset" }, ...presetOptions]}
        helper="Choose the base network layout for this new project."
        disabled={isSubmitting}
      />
    </div>
    {selectedPreset ? (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600">
        <p className="font-semibold text-gray-700">{selectedPreset.name}</p>
        <p className="mt-1">{selectedPreset.description}</p>
        {Array.isArray(selectedPreset.features) && selectedPreset.features.length > 0 && (
          <p className="mt-1 text-gray-500">Includes: {selectedPreset.features.join(", ")}</p>
        )}
        <p className="mt-2 text-xs text-gray-500">
          {hasFloatingIp
            ? `Elastic IPs: ${normalizedFloatingIpCount} will be allocated and attached during provisioning.`
            : 'Elastic IPs: none requested. Enable "Attach EIP when provisioning" to attach one.'}
        </p>
      </div>
    ) : (
      <p className="text-xs text-gray-500">
        Select a preset to see the network layout that will be provisioned.
      </p>
    )}
  </div>
);

export default RegionProjectSection;
