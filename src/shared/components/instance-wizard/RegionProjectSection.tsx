import React from "react";
import { AlertTriangle } from "lucide-react";
import { Configuration, Option } from "@/types/InstanceConfiguration";
import { ModernSelect, SearchableSelect } from "../ui";
import type { NetworkPreset } from "../network/NetworkPresetSelector";

interface ProjectLike {
  id?: string | number;
  name?: string;
  identifier?: string;
  [key: string]: unknown;
}

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
  selectedPreset?: NetworkPreset | null;
  selectedProjectPreset?: NetworkPreset | null;
  selectedProject?: ProjectLike | null;
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
  azSelectionMode?: "auto" | "user_selectable" | "disabled";
  availabilityZoneOptions?: Option[];
  /**
   * True when the selected region spans multiple providers, so pricing
   * fetches stay gated until an AZ is picked (see `awaitingAzSelection`
   * in AdminInstanceConfigurationCard). The AZ helper must then steer the
   * user to pick a zone — recommending "Auto-assign" would leave every
   * product dropdown blank.
   */
  requiresAzForPricing?: boolean;
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
  azSelectionMode,
  availabilityZoneOptions,
  requiresAzForPricing = false,
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
              availability_zone: "",
              availability_zone_label: "",
            });
          }}
          placeholder=""
          options={[{ value: "", label: "Select region" }, ...regionOptions]}
          helper="Region code used for pricing and provisioning."
          disabled={isLoadingResources}
        />
        {azSelectionMode === "user_selectable" && availabilityZoneOptions && availabilityZoneOptions.length > 0 && (
          <ModernSelect
            label="Availability Zone"
            value={cfg.availability_zone || ""}
            onChange={(e) => {
              const selectedLabel = e.target.selectedOptions?.[0]?.text || "";
              updateConfigWithFocus({
                availability_zone: e.target.value,
                availability_zone_label: e.target.value ? selectedLabel : "",
              });
            }}
            options={[
              { value: "", label: requiresAzForPricing ? "Select availability zone" : "Auto-assign" },
              ...availabilityZoneOptions,
            ]}
            helper={
              requiresAzForPricing
                ? "Pick an availability zone to see available sizes and prices."
                : "Select a specific availability zone or let the platform auto-assign."
            }
            disabled={isLoadingResources}
          />
        )}
        {azSelectionMode === "auto" && (
          <div className="flex items-end">
            <p className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-blue-700">
              Availability zone will be automatically assigned based on capacity and priority.
            </p>
          </div>
        )}
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
          selectedAz={cfg.availability_zone || ""}
          selectedAzLabel={cfg.availability_zone_label || ""}
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
  selectedAz: string;
  selectedAzLabel: string;
  selectedProjectPreset: NetworkPreset | null;
  selectedProject: ProjectLike | null;
  isSelectedProjectPresetPublic: boolean;
  hasFloatingIp: boolean;
}

const ExistingProjectFields: React.FC<ExistingProjectFieldsProps> = ({
  projectSelectValue,
  projectSelectOptions,
  handleProjectSelection,
  isTemplateLocked,
  selectedRegion,
  selectedAz,
  selectedAzLabel,
  selectedProjectPreset,
  selectedProject,
  isSelectedProjectPresetPublic,
  hasFloatingIp,
}) => {
  // The selector helper line shifts depending on what scope the
  // catalog is filtered by. AZ-scoped is the strictest — surface the
  // human-readable AZ name so the operator knows _why_ the list might
  // be short, and signpost the "no matches" case explicitly.
  const azLabel = selectedAzLabel || selectedAz;
  const helperText = !selectedRegion
    ? "Select a region first."
    : projectSelectOptions.length === 0
      ? selectedAz
        ? `No projects in ${azLabel || "the selected AZ"}. Clear the AZ or create a new project.`
        : "No projects in this region. Create a new project below."
      : selectedAz
        ? `Scoped to ${azLabel || "the selected AZ"}. Change the AZ above to widen the list.`
        : "Choose an existing project for this configuration.";

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <SearchableSelect
        label="Project *"
        value={projectSelectValue}
        onChange={(e) => handleProjectSelection(e.target.value)}
        options={[{ value: "", label: "Select project" }, ...projectSelectOptions]}
        helper={helperText}
        disabled={isTemplateLocked || !selectedRegion}
      />
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600">
      {selectedProjectPreset ? (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-gray-700">
              Network preset: {selectedProjectPreset.name}
            </p>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                isSelectedProjectPresetPublic ? "bg-sky-100 text-sky-700" : "bg-gray-200 text-gray-600"
              }`}
            >
              {isSelectedProjectPresetPublic ? "Internet-facing" : "Internal only"}
            </span>
          </div>
          <p className="mt-1">{selectedProjectPreset.description}</p>
          <p className="mt-1 font-medium text-gray-600">
            {isSelectedProjectPresetPublic
              ? "Instances can reach the internet; attach an Elastic IP for inbound access."
              : "No internet access — instances are reachable only within the project network."}
          </p>
          {Array.isArray(selectedProjectPreset.features) &&
            selectedProjectPreset.features.length > 0 && (
              <p className="mt-1 text-gray-500">
                Includes: {selectedProjectPreset.features.join(", ")}
              </p>
            )}
          {hasFloatingIp && !isSelectedProjectPresetPublic && (
            <div className="mt-2 flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              <p className="text-xs text-amber-800">
                <span className="font-semibold">This will make the entire project internet-facing.</span>{" "}
                Attaching an Elastic IP requires a public network, so this private project will be
                permanently upgraded to public during provisioning.
              </p>
            </div>
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
};

/* ---------- New project sub-section ---------- */

interface NewProjectFieldsProps {
  cfg: Configuration;
  networkPresetValue: string;
  presetOptions: Option[];
  selectedPreset: NetworkPreset | null;
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
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-semibold text-gray-700">{selectedPreset.name}</p>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
              selectedPreset.isPublic ? "bg-sky-100 text-sky-700" : "bg-gray-200 text-gray-600"
            }`}
          >
            {selectedPreset.isPublic ? "Internet-facing" : "Internal only"}
          </span>
        </div>
        <p className="mt-1">{selectedPreset.description}</p>
        <p className="mt-1 font-medium text-gray-600">
          {selectedPreset.isPublic
            ? "Instances can reach the internet; attach an Elastic IP for inbound access."
            : "No internet access — instances are reachable only within the project network."}
        </p>
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
