import React from "react";
import { Trash2, Save } from "lucide-react";
import { Configuration, Option, AdditionalVolume } from "../../../types/InstanceConfiguration";
import { ModernCard } from "../ui";
import { ModernSelect } from "../ui";
import { ModernButton } from "../ui";
import NetworkPresetSelector from "../network/NetworkPresetSelector";
import TemplateSelector from "./TemplateSelector";

interface Props {
  cfg: Configuration;
  index: number;
  totalConfigurations: number;

  // Actions
  updateConfiguration: (id: string, patch: Partial<Configuration>) => void;
  removeConfiguration: (id: string) => void;
  addAdditionalVolume: (configId: string) => void;
  updateAdditionalVolume: (
    configId: string,
    volumeId: string,
    patch: Partial<AdditionalVolume>
  ) => void;
  removeAdditionalVolume: (configId: string, volumeId: string) => void;

  // Options
  regionOptions: Option[];
  projectOptions: Option[];
  computeOptions: Option[];
  osImageOptions: Option[];
  volumeTypeOptions: Option[];
  networkOptions: Option[];
  subnetOptions: Option[];
  bandwidthOptions: Option[];
  keyPairOptions: Option[];
  securityGroups: any[]; // Raw objects for custom rendering

  // Flags
  isProjectScoped: boolean;
  isLoadingResources: boolean;
  showActionRow?: boolean;
  onAddConfiguration?: () => void;
  onBackToWorkflow?: () => void;
  onSubmitConfigurations?: () => void;
  isSubmitting?: boolean;
  onSaveTemplate?: (config: Configuration) => void;
  onCreateProject?: (configId: string, projectName: string) => void;
  showTemplateSelector?: boolean;
  onTemplateSelect?: (template: any) => void;
  variant?: "classic" | "cube";
}

const InstanceConfigurationForm: React.FC<Props> = ({
  cfg,
  index,
  totalConfigurations,
  updateConfiguration,
  removeConfiguration,
  addAdditionalVolume,
  updateAdditionalVolume,
  removeAdditionalVolume,

  regionOptions,
  projectOptions,
  computeOptions,
  osImageOptions,
  volumeTypeOptions,
  networkOptions,
  subnetOptions,
  bandwidthOptions,
  keyPairOptions,
  securityGroups,

  isProjectScoped,
  isLoadingResources,
  showActionRow = false,
  onAddConfiguration,
  onBackToWorkflow,
  onSubmitConfigurations,
  isSubmitting = false,
  onSaveTemplate,
  onCreateProject,
  showTemplateSelector = false,
  onTemplateSelect,
  variant = "classic",
}) => {
  const selectedRegion = cfg.region;
  const projectMode = cfg.project_mode === "new" ? "new" : "existing";
  const isTemplateLocked = Boolean(cfg.template_locked || cfg.template_id);
  const effectiveProjectMode = isTemplateLocked ? "new" : projectMode;
  const networkPresetValue = cfg.network_preset || "standard";
  const isCube = variant === "cube";
  const resourceLabel = isCube ? "Cube-nstance" : "Instance";
  const configurationLabel = isCube ? "Cube-nstance" : "Configuration";

  const handleProjectModeChange = (mode: "existing" | "new") => {
    if (isTemplateLocked && mode === "existing") {
      return;
    }
    if (mode === "new") {
      updateConfiguration(cfg.id, {
        project_mode: "new",
        project_id: "",
        network_preset: cfg.network_preset || "standard",
      });
      return;
    }
    updateConfiguration(cfg.id, { project_mode: "existing", project_name: "" });
  };

  const handleSecurityGroupToggle = (value: string, checked: boolean) => {
    const current = Array.isArray(cfg.security_group_ids) ? cfg.security_group_ids : [];
    const next = new Set(current.map((v) => String(v)));
    if (checked) {
      next.add(String(value));
    } else {
      next.delete(String(value));
    }
    updateConfiguration(cfg.id, { security_group_ids: Array.from(next) });
  };

  const SectionWrapper = ({
    title,
    description,
    children,
  }: {
    title: string;
    description?: string;
    children: React.ReactNode;
  }) => (
    <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
      <div className="space-y-1">
        <p className="text-sm font-semibold text-slate-900">{title}</p>
        {description && <p className="text-xs text-slate-500">{description}</p>}
      </div>
      {children}
    </div>
  );

  const addConfigurationLabel = isCube ? "Add cube-nstance configuration" : "Add configuration";
  const submitLabel = isCube ? "Create cube-nstance and price" : "Create and price";
  const submittingLabel = isCube ? "Creating cube-nstance..." : "Creating...";

  if (isCube) {
    return (
      <ModernCard variant="outlined" padding="lg" className="space-y-6" onClick={undefined}>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-lg font-semibold text-slate-900">
              {configurationLabel} #{index + 1}: {cfg.name || "Untitled"}
            </p>
            <p className="text-sm text-slate-600">
              Build a cube-nstance with region, size, image, storage, and networking.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            {onSaveTemplate && (
              <button
                type="button"
                onClick={() => onSaveTemplate(cfg)}
                className="inline-flex items-center gap-1.5 rounded-full border border-primary-200 bg-primary-50 px-3 py-1.5 text-xs font-semibold text-primary-600 transition hover:border-primary-300 hover:bg-primary-100 hover:text-primary-700 focus:outline-none"
                title="Save as Template"
              >
                <Save className="h-4 w-4" />
                Save Template
              </button>
            )}
            {totalConfigurations > 1 && (
              <button
                type="button"
                onClick={() => removeConfiguration(cfg.id)}
                className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:border-red-300 hover:bg-red-100 hover:text-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
              >
                <Trash2 className="h-4 w-4" />
                Remove
              </button>
            )}
          </div>
        </div>

        {showTemplateSelector && onTemplateSelect && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="mb-3 text-xs font-medium text-amber-800">
              Templates always create a new project.
            </p>
            <div className="rounded-lg bg-white p-3">
              <TemplateSelector onSelect={onTemplateSelect} primaryActionLabel="Apply template" />
            </div>
          </div>
        )}

        <div className="space-y-5">
          <SectionWrapper
            title="1. Region & project"
            description="Select the region and decide whether to use an existing project or create a new one."
          >
            {onCreateProject && (
              <div className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                <span className="text-xs font-semibold text-slate-600">Project mode</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleProjectModeChange("existing")}
                    disabled={isTemplateLocked}
                    className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                      effectiveProjectMode === "existing"
                        ? "bg-primary-600 text-white"
                        : "bg-white text-slate-600 border border-slate-200 hover:border-slate-300"
                    } ${isTemplateLocked ? "cursor-not-allowed opacity-50 hover:border-slate-200" : ""}`}
                  >
                    Use existing
                  </button>
                  <button
                    type="button"
                    onClick={() => handleProjectModeChange("new")}
                    className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                      effectiveProjectMode === "new"
                        ? "bg-primary-600 text-white"
                        : "bg-white text-slate-600 border border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    Create new
                  </button>
                </div>
                {isTemplateLocked && (
                  <p className="text-xs text-slate-600">
                    Template-based configurations must use a new project to avoid mixing.
                  </p>
                )}
              </div>
            )}
            <div className="grid gap-4 md:grid-cols-3">
              <ModernSelect
                label="Region *"
                value={cfg.region}
                onChange={(e) => updateConfiguration(cfg.id, { region: e.target.value })}
                options={[{ value: "", label: "Select region" }, ...regionOptions]}
                helper="Region code used for pricing and provisioning."
                disabled={isLoadingResources}
              />
              {effectiveProjectMode === "new" && onCreateProject ? (
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Project name *
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
                    value={cfg.project_name || ""}
                    onChange={(e) => updateConfiguration(cfg.id, { project_name: e.target.value })}
                    placeholder={selectedRegion ? "Enter project name" : "Select region first"}
                    disabled={!selectedRegion}
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    This will create a new project for this configuration.
                  </p>
                </div>
              ) : (
                <ModernSelect
                  label="Project (Optional)"
                  value={cfg.project_id}
                  onChange={(e) =>
                    updateConfiguration(cfg.id, {
                      project_id: e.target.value,
                      project_mode: "existing",
                    })
                  }
                  options={[
                    {
                      value: "",
                      label: selectedRegion ? "Select project (optional)" : "Select region first",
                    },
                    ...projectOptions,
                  ]}
                  helper="Use an existing project or leave blank to rely on region."
                  disabled={!selectedRegion}
                />
              )}
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Duration (Months) *
                </label>
                <input
                  type="number"
                  min="1"
                  max="36"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
                  value={cfg.months}
                  onChange={(e) => updateConfiguration(cfg.id, { months: e.target.value })}
                />
              </div>
            </div>
            {effectiveProjectMode === "new" && onCreateProject && !cfg.project_id && (
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <NetworkPresetSelector
                  value={networkPresetValue}
                  onChange={(presetId) => updateConfiguration(cfg.id, { network_preset: presetId })}
                  disabled={isSubmitting}
                  showAdvancedOption={false}
                />
              </div>
            )}
            {effectiveProjectMode === "new" && onCreateProject && (
              <div className="flex flex-wrap items-center gap-2">
                {!cfg.project_id && (
                  <p className="text-xs text-amber-700">Create a project to continue to pricing.</p>
                )}
                <ModernButton
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const name = (cfg.project_name || "").trim();
                    if (!name) return;
                    onCreateProject(cfg.id, name);
                  }}
                  disabled={!selectedRegion || !(cfg.project_name || "").trim() || isSubmitting}
                  className="ml-auto"
                >
                  Create project
                </ModernButton>
              </div>
            )}
          </SectionWrapper>

          <SectionWrapper
            title="2. Choose size"
            description="Pick the compute profile for this cube-nstance."
          >
            <ModernSelect
              label="Instance Type *"
              value={cfg.compute_instance_id}
              onChange={(e) => updateConfiguration(cfg.id, { compute_instance_id: e.target.value })}
              options={[
                {
                  value: "",
                  label: selectedRegion ? "Select instance type" : "Select region first",
                },
                ...computeOptions,
              ]}
              helper="Select the compute flavor."
              disabled={!selectedRegion}
            />
          </SectionWrapper>

          <SectionWrapper
            title="3. Choose image"
            description="Select the operating system image to boot from."
          >
            <ModernSelect
              label="OS Image *"
              value={cfg.os_image_id}
              onChange={(e) => updateConfiguration(cfg.id, { os_image_id: e.target.value })}
              options={[
                { value: "", label: selectedRegion ? "Select OS image" : "Select region first" },
                ...osImageOptions,
              ]}
              helper="Choose the base image."
              disabled={!selectedRegion}
            />
          </SectionWrapper>

          <SectionWrapper
            title="4. Storage"
            description="Configure the boot volume and attach any extra data disks."
          >
            <div className="grid gap-4 md:grid-cols-3">
              <ModernSelect
                label="Boot Volume Type *"
                value={cfg.volume_type_id}
                onChange={(e) => updateConfiguration(cfg.id, { volume_type_id: e.target.value })}
                options={[
                  {
                    value: "",
                    label: selectedRegion ? "Select volume type" : "Select region first",
                  },
                  ...volumeTypeOptions,
                ]}
                helper="Choose the primary volume class."
                disabled={!selectedRegion}
              />
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Size (GB) *</label>
                <input
                  type="number"
                  min="10"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
                  value={cfg.storage_size_gb}
                  onChange={(e) => updateConfiguration(cfg.id, { storage_size_gb: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-900">
                  Additional data volumes
                </span>
                <ModernButton
                  variant="outline"
                  onClick={() => addAdditionalVolume(cfg.id)}
                  size="sm"
                >
                  Add data volume
                </ModernButton>
              </div>
              {(cfg.additional_volumes || []).length === 0 && (
                <p className="text-xs text-slate-500">
                  No extra data volumes. Click “Add data volume” to attach more storage.
                </p>
              )}
              {(cfg.additional_volumes || []).map((vol) => (
                <div
                  key={vol.id}
                  className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 md:grid-cols-3"
                >
                  <ModernSelect
                    label="Volume type"
                    value={vol.volume_type_id}
                    onChange={(e) =>
                      updateAdditionalVolume(cfg.id, vol.id, { volume_type_id: e.target.value })
                    }
                    options={[
                      {
                        value: "",
                        label: selectedRegion ? "Select volume type" : "Select region first",
                      },
                      ...volumeTypeOptions,
                    ]}
                    helper="Data volume class."
                    disabled={!selectedRegion}
                  />
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Size (GB)
                    </label>
                    <input
                      type="number"
                      min="10"
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
                      value={vol.storage_size_gb}
                      onChange={(e) =>
                        updateAdditionalVolume(cfg.id, vol.id, {
                          storage_size_gb: e.target.value,
                        })
                      }
                    />
                    <p className="mt-1 text-xs text-slate-500">Capacity for this data volume.</p>
                  </div>
                  <div className="flex items-end justify-end">
                    <ModernButton
                      variant="ghost"
                      onClick={() => removeAdditionalVolume(cfg.id, vol.id)}
                    >
                      Remove
                    </ModernButton>
                  </div>
                </div>
              ))}
            </div>
          </SectionWrapper>

          <SectionWrapper
            title="5. Networking & access"
            description="Attach networks, bandwidth, security groups, and access keys."
          >
            <div className="grid gap-4 md:grid-cols-3">
              <ModernSelect
                label="Network (Optional)"
                value={cfg.network_id}
                onChange={(e) => updateConfiguration(cfg.id, { network_id: e.target.value })}
                options={[{ value: "", label: "None (use default)" }, ...networkOptions]}
                helper="Select a network when targeting a project."
                disabled={!isProjectScoped}
              />
              <ModernSelect
                label="Subnet (Optional)"
                value={cfg.subnet_id}
                onChange={(e) => {
                  const selectedLabel = e.target.selectedOptions?.[0]?.text || "";
                  updateConfiguration(cfg.id, {
                    subnet_id: e.target.value,
                    subnet_label: e.target.value ? selectedLabel : "",
                  });
                }}
                options={[{ value: "", label: "None (use default)" }, ...subnetOptions]}
                helper="Select a subnet from the chosen network."
                disabled={!isProjectScoped}
              />
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Bandwidth</label>
                <ModernSelect
                  label=""
                  value={cfg.bandwidth_id}
                  onChange={(e) => updateConfiguration(cfg.id, { bandwidth_id: e.target.value })}
                  options={[
                    { value: "", label: "Select bandwidth (optional)" },
                    ...bandwidthOptions,
                  ]}
                  helper="Optional. Leave blank if not required."
                  disabled={isLoadingResources}
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Bandwidth count
                </label>
                <input
                  type="number"
                  min="1"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
                  value={cfg.bandwidth_count}
                  onChange={(e) => updateConfiguration(cfg.id, { bandwidth_count: e.target.value })}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Floating IPs
                </label>
                <input
                  type="number"
                  min="0"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
                  value={cfg.floating_ip_count}
                  onChange={(e) =>
                    updateConfiguration(cfg.id, { floating_ip_count: e.target.value })
                  }
                />
                <p className="mt-1 text-xs text-slate-500">
                  Optional count of floating IPs to reserve.
                </p>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Key pair</label>
                <ModernSelect
                  label=""
                  value={cfg.keypair_name}
                  onChange={(e) => {
                    const selectedLabel = e.target.selectedOptions?.[0]?.text || "";
                    updateConfiguration(cfg.id, {
                      keypair_name: e.target.value,
                      keypair_label: e.target.value ? selectedLabel : "",
                    });
                  }}
                  options={[{ value: "", label: "Select key pair (optional)" }, ...keyPairOptions]}
                  helper="Select SSH key pair to authorize access."
                  disabled={!isProjectScoped}
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Security Groups (Optional)
                </label>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {isProjectScoped ? (
                    (Array.isArray(securityGroups) && securityGroups.length > 0
                      ? securityGroups
                      : []
                    ).map((sg: any) => {
                      const id = sg.id || sg.identifier || sg.name;
                      if (!id) return null;
                      const label = sg.name || sg.label || `SG ${id}`;
                      const checked = Array.isArray(cfg.security_group_ids)
                        ? cfg.security_group_ids.includes(String(id))
                        : false;
                      return (
                        <label
                          key={id}
                          className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                        >
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                            checked={checked}
                            onChange={(e) => handleSecurityGroupToggle(id, e.target.checked)}
                          />
                          <span>{label}</span>
                        </label>
                      );
                    })
                  ) : (
                    <p className="text-xs text-slate-500">
                      Select a region and project to view available security groups.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </SectionWrapper>

          <SectionWrapper
            title="6. Finalize details"
            description="Name, quantity, and optional tags for this cube-nstance."
          >
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  {resourceLabel} name
                </label>
                <input
                  type="text"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
                  value={cfg.name}
                  onChange={(e) => updateConfiguration(cfg.id, { name: e.target.value })}
                  placeholder="Optional friendly name"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Quantity *</label>
                <input
                  type="number"
                  min="1"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
                  value={cfg.instance_count}
                  onChange={(e) => updateConfiguration(cfg.id, { instance_count: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Description</label>
              <textarea
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
                rows={2}
                value={cfg.description}
                onChange={(e) => updateConfiguration(cfg.id, { description: e.target.value })}
                placeholder="Optional description"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Tags (Optional)
              </label>
              <input
                type="text"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
                placeholder="Tag1, Tag2 (optional)"
                value={cfg.tags}
                onChange={(e) => updateConfiguration(cfg.id, { tags: e.target.value })}
              />
              <p className="mt-1 text-xs text-slate-500">Separate multiple tags with commas.</p>
            </div>
          </SectionWrapper>
        </div>

        {showActionRow && (
          <div className="flex flex-wrap items-center justify-between gap-4 pt-4">
            <ModernButton
              variant="outline"
              onClick={() => onAddConfiguration?.()}
              style={{
                borderRadius: "999px",
                padding: "12px 22px",
                fontSize: "15px",
                lineHeight: "22px",
                backgroundColor: "#FFFFFF",
                border: "1px solid #8CC5F5",
                color: "#1877D4",
                boxShadow: "0 1px 2px rgba(24, 119, 212, 0.15)",
              }}
            >
              <span className="mr-2 text-lg leading-none text-blue-500">+</span>
              {addConfigurationLabel}
            </ModernButton>
            <div className="flex flex-wrap items-center gap-3">
              <ModernButton
                variant="ghost"
                onClick={() => onBackToWorkflow?.()}
                style={{
                  borderRadius: "999px",
                  padding: "12px 26px",
                  fontSize: "15px",
                  lineHeight: "22px",
                  border: "1px solid #DFE6F0",
                  backgroundColor: "#FFFFFF",
                  color: "#0F172A",
                }}
              >
                Back to workflow
              </ModernButton>
              <ModernButton
                variant="primary"
                onClick={() => onSubmitConfigurations?.()}
                isDisabled={isSubmitting}
                style={{
                  borderRadius: "999px",
                  padding: "14px 32px",
                  fontSize: "16px",
                  fontWeight: 600,
                  minWidth: "230px",
                  backgroundColor: "#1D7EDF",
                  color: "#FFFFFF",
                  border: "1px solid #1D7EDF",
                  boxShadow: "0 10px 20px rgba(29, 126, 223, 0.2)",
                }}
                className="shadow-md shadow-primary-500/25 hover:-translate-y-0.5 transition-all"
              >
                {isSubmitting ? submittingLabel : submitLabel}
              </ModernButton>
            </div>
          </div>
        )}
      </ModernCard>
    );
  }

  return (
    <ModernCard variant="outlined" padding="lg" className="space-y-6" onClick={undefined}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-lg font-semibold text-slate-900">
            {configurationLabel} #{index + 1}: {cfg.name || "Untitled"}
          </p>
          <p className="text-sm text-slate-600">
            Define {resourceLabel.toLowerCase()}s, storage, and networking for this configuration.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          {onSaveTemplate && (
            <button
              type="button"
              onClick={() => onSaveTemplate(cfg)}
              className="inline-flex items-center gap-1.5 rounded-full border border-primary-200 bg-primary-50 px-3 py-1.5 text-xs font-semibold text-primary-600 transition hover:border-primary-300 hover:bg-primary-100 hover:text-primary-700 focus:outline-none"
              title="Save as Template"
            >
              <Save className="h-4 w-4" />
              Save Template
            </button>
          )}
          {totalConfigurations > 1 && (
            <button
              type="button"
              onClick={() => removeConfiguration(cfg.id)}
              className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:border-red-300 hover:bg-red-100 hover:text-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
            >
              <Trash2 className="h-4 w-4" />
              Remove
            </button>
          )}
        </div>
      </div>

      {showTemplateSelector && onTemplateSelect && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="mb-3 text-xs font-medium text-amber-800">
            Templates always create a new project.
          </p>
          <div className="rounded-lg bg-white p-3">
            <TemplateSelector onSelect={onTemplateSelect} primaryActionLabel="Apply template" />
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Instance name</label>
          <input
            type="text"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
            value={cfg.name}
            onChange={(e) => updateConfiguration(cfg.id, { name: e.target.value })}
            placeholder="Optional friendly name"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Number of instances *
          </label>
          <input
            type="number"
            min="1"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
            value={cfg.instance_count}
            onChange={(e) => updateConfiguration(cfg.id, { instance_count: e.target.value })}
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Description</label>
        <textarea
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
          rows={2}
          value={cfg.description}
          onChange={(e) => updateConfiguration(cfg.id, { description: e.target.value })}
          placeholder="Optional description"
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2 text-slate-700">
          <span className="text-sm font-semibold">Infrastructure Configuration</span>
        </div>
        {onCreateProject && (
          <div className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
            <span className="text-xs font-semibold text-slate-600">Project mode</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleProjectModeChange("existing")}
                disabled={isTemplateLocked}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                  effectiveProjectMode === "existing"
                    ? "bg-primary-600 text-white"
                    : "bg-white text-slate-600 border border-slate-200 hover:border-slate-300"
                } ${isTemplateLocked ? "cursor-not-allowed opacity-50 hover:border-slate-200" : ""}`}
              >
                Use existing
              </button>
              <button
                type="button"
                onClick={() => handleProjectModeChange("new")}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                  effectiveProjectMode === "new"
                    ? "bg-primary-600 text-white"
                    : "bg-white text-slate-600 border border-slate-200 hover:border-slate-300"
                }`}
              >
                Create new
              </button>
            </div>
            {isTemplateLocked && (
              <p className="text-xs text-slate-600">
                Template-based configurations must use a new project to avoid mixing.
              </p>
            )}
          </div>
        )}
        <div className="grid gap-4 md:grid-cols-3">
          <ModernSelect
            label="Region *"
            value={cfg.region}
            onChange={(e) => updateConfiguration(cfg.id, { region: e.target.value })}
            options={[{ value: "", label: "Select region" }, ...regionOptions]}
            helper="Region code used for pricing and provisioning."
            disabled={isLoadingResources}
          />
          {effectiveProjectMode === "new" && onCreateProject ? (
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Project name *
              </label>
              <input
                type="text"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
                value={cfg.project_name || ""}
                onChange={(e) => updateConfiguration(cfg.id, { project_name: e.target.value })}
                placeholder={selectedRegion ? "Enter project name" : "Select region first"}
                disabled={!selectedRegion}
              />
              <p className="mt-1 text-xs text-slate-500">
                This will create a new project for this configuration.
              </p>
            </div>
          ) : (
            <ModernSelect
              label="Project (Optional)"
              value={cfg.project_id}
              onChange={(e) =>
                updateConfiguration(cfg.id, {
                  project_id: e.target.value,
                  project_mode: "existing",
                })
              }
              options={[
                {
                  value: "",
                  label: selectedRegion ? "Select project (optional)" : "Select region first",
                },
                ...projectOptions,
              ]}
              helper="Use an existing project or leave blank to rely on region."
              disabled={!selectedRegion}
            />
          )}
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Duration (Months) *
            </label>
            <input
              type="number"
              min="1"
              max="36"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
              value={cfg.months}
              onChange={(e) => updateConfiguration(cfg.id, { months: e.target.value })}
            />
          </div>
        </div>
        {effectiveProjectMode === "new" && onCreateProject && !cfg.project_id && (
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <NetworkPresetSelector
              value={networkPresetValue}
              onChange={(presetId) => updateConfiguration(cfg.id, { network_preset: presetId })}
              disabled={isSubmitting}
              showAdvancedOption={false}
            />
          </div>
        )}
        {effectiveProjectMode === "new" && onCreateProject && (
          <div className="flex flex-wrap items-center gap-2">
            {!cfg.project_id && (
              <p className="text-xs text-amber-700">Create a project to continue to pricing.</p>
            )}
            <ModernButton
              variant="outline"
              size="sm"
              onClick={() => {
                const name = (cfg.project_name || "").trim();
                if (!name) return;
                onCreateProject(cfg.id, name);
              }}
              disabled={!selectedRegion || !(cfg.project_name || "").trim() || isSubmitting}
              className="ml-auto"
            >
              Create project
            </ModernButton>
          </div>
        )}
        <div className="grid gap-4 md:grid-cols-3">
          <ModernSelect
            label="Instance Type *"
            value={cfg.compute_instance_id}
            onChange={(e) => updateConfiguration(cfg.id, { compute_instance_id: e.target.value })}
            options={[
              { value: "", label: selectedRegion ? "Select instance type" : "Select region first" },
              ...computeOptions,
            ]}
            helper="Select the compute flavor."
            disabled={!selectedRegion}
          />
          <ModernSelect
            label="OS Image *"
            value={cfg.os_image_id}
            onChange={(e) => updateConfiguration(cfg.id, { os_image_id: e.target.value })}
            options={[
              { value: "", label: selectedRegion ? "Select OS image" : "Select region first" },
              ...osImageOptions,
            ]}
            helper="Choose the base image."
            disabled={!selectedRegion}
          />
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Floating IPs</label>
            <input
              type="number"
              min="0"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
              value={cfg.floating_ip_count}
              onChange={(e) => updateConfiguration(cfg.id, { floating_ip_count: e.target.value })}
            />
            <p className="mt-1 text-xs text-slate-500">
              Optional count of floating IPs to reserve.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2 text-slate-700">
          <span className="text-sm font-semibold">Storage Configuration</span>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <ModernSelect
            label="Volume 1 (Boot Volume) Type *"
            value={cfg.volume_type_id}
            onChange={(e) => updateConfiguration(cfg.id, { volume_type_id: e.target.value })}
            options={[
              { value: "", label: selectedRegion ? "Select volume type" : "Select region first" },
              ...volumeTypeOptions,
            ]}
            helper="Choose the primary volume class."
            disabled={!selectedRegion}
          />
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Size (GB) *</label>
            <input
              type="number"
              min="10"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
              value={cfg.storage_size_gb}
              onChange={(e) => updateConfiguration(cfg.id, { storage_size_gb: e.target.value })}
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2 text-slate-700">
          <span className="text-sm font-semibold">Network Configuration</span>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <ModernSelect
            label="Network (Optional)"
            value={cfg.network_id}
            onChange={(e) => updateConfiguration(cfg.id, { network_id: e.target.value })}
            options={[{ value: "", label: "None (use default)" }, ...networkOptions]}
            helper="Select a network when targeting a project."
            disabled={!isProjectScoped}
          />
          <ModernSelect
            label="Subnet (Optional)"
            value={cfg.subnet_id}
            onChange={(e) => {
              const selectedLabel = e.target.selectedOptions?.[0]?.text || "";
              updateConfiguration(cfg.id, {
                subnet_id: e.target.value,
                subnet_label: e.target.value ? selectedLabel : "",
              });
            }}
            options={[{ value: "", label: "None (use default)" }, ...subnetOptions]}
            helper="Select a subnet from the chosen network."
            disabled={!isProjectScoped}
          />
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Bandwidth</label>
            <ModernSelect
              label=""
              value={cfg.bandwidth_id}
              onChange={(e) => updateConfiguration(cfg.id, { bandwidth_id: e.target.value })}
              options={[{ value: "", label: "Select bandwidth (optional)" }, ...bandwidthOptions]}
              helper="Optional. Leave blank if not required."
              disabled={isLoadingResources}
            />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Bandwidth count</label>
            <input
              type="number"
              min="1"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
              value={cfg.bandwidth_count}
              onChange={(e) => updateConfiguration(cfg.id, { bandwidth_count: e.target.value })}
            />
          </div>
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Security Groups (Optional)
            </label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {isProjectScoped ? (
                (Array.isArray(securityGroups) && securityGroups.length > 0
                  ? securityGroups
                  : []
                ).map((sg: any) => {
                  const id = sg.id || sg.identifier || sg.name;
                  if (!id) return null;
                  const label = sg.name || sg.label || `SG ${id}`;
                  const checked = Array.isArray(cfg.security_group_ids)
                    ? cfg.security_group_ids.includes(String(id))
                    : false;
                  return (
                    <label
                      key={id}
                      className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                    >
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                        checked={checked}
                        onChange={(e) => handleSecurityGroupToggle(id, e.target.checked)}
                      />
                      <span>{label}</span>
                    </label>
                  );
                })
              ) : (
                <p className="text-xs text-slate-500">
                  Select a region and project to view available security groups.
                </p>
              )}
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Key pair</label>
            <ModernSelect
              label=""
              value={cfg.keypair_name}
              onChange={(e) => {
                const selectedLabel = e.target.selectedOptions?.[0]?.text || "";
                updateConfiguration(cfg.id, {
                  keypair_name: e.target.value,
                  keypair_label: e.target.value ? selectedLabel : "",
                });
              }}
              options={[{ value: "", label: "Select key pair (optional)" }, ...keyPairOptions]}
              helper="Select SSH key pair to authorize access."
              disabled={!isProjectScoped}
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Tags (Optional)</label>
          <input
            type="text"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
            placeholder="Tag1, Tag2 (optional)"
            value={cfg.tags}
            onChange={(e) => updateConfiguration(cfg.id, { tags: e.target.value })}
          />
          <p className="mt-1 text-xs text-slate-500">Separate multiple tags with commas.</p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-900">Additional data volumes</span>
          <ModernButton variant="outline" onClick={() => addAdditionalVolume(cfg.id)} size="sm">
            Add data volume
          </ModernButton>
        </div>
        {(cfg.additional_volumes || []).length === 0 && (
          <p className="text-xs text-slate-500">
            No extra data volumes. Click “Add data volume” to attach more storage.
          </p>
        )}
        {(cfg.additional_volumes || []).map((vol) => (
          <div
            key={vol.id}
            className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 md:grid-cols-3"
          >
            <ModernSelect
              label="Volume type"
              value={vol.volume_type_id}
              onChange={(e) =>
                updateAdditionalVolume(cfg.id, vol.id, { volume_type_id: e.target.value })
              }
              options={[
                { value: "", label: selectedRegion ? "Select volume type" : "Select region first" },
                ...volumeTypeOptions,
              ]}
              helper="Data volume class."
              disabled={!selectedRegion}
            />
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Size (GB)</label>
              <input
                type="number"
                min="10"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
                value={vol.storage_size_gb}
                onChange={(e) =>
                  updateAdditionalVolume(cfg.id, vol.id, { storage_size_gb: e.target.value })
                }
              />
              <p className="mt-1 text-xs text-slate-500">Capacity for this data volume.</p>
            </div>
            <div className="flex items-end justify-end">
              <ModernButton variant="ghost" onClick={() => removeAdditionalVolume(cfg.id, vol.id)}>
                Remove
              </ModernButton>
            </div>
          </div>
        ))}
      </div>

      {showActionRow && (
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4">
          <ModernButton
            variant="outline"
            onClick={() => onAddConfiguration?.()}
            style={{
              borderRadius: "999px",
              padding: "12px 22px",
              fontSize: "15px",
              lineHeight: "22px",
              backgroundColor: "#FFFFFF",
              border: "1px solid #8CC5F5",
              color: "#1877D4",
              boxShadow: "0 1px 2px rgba(24, 119, 212, 0.15)",
            }}
          >
            <span className="mr-2 text-lg leading-none text-blue-500">+</span>
            Add configuration
          </ModernButton>
          <div className="flex flex-wrap items-center gap-3">
            <ModernButton
              variant="ghost"
              onClick={() => onBackToWorkflow?.()}
              style={{
                borderRadius: "999px",
                padding: "12px 26px",
                fontSize: "15px",
                lineHeight: "22px",
                border: "1px solid #DFE6F0",
                backgroundColor: "#FFFFFF",
                color: "#0F172A",
              }}
            >
              Back to workflow
            </ModernButton>
            <ModernButton
              variant="primary"
              onClick={() => onSubmitConfigurations?.()}
              isDisabled={isSubmitting}
              style={{
                borderRadius: "999px",
                padding: "14px 32px",
                fontSize: "16px",
                fontWeight: 600,
                minWidth: "230px",
                backgroundColor: "#1D7EDF",
                color: "#FFFFFF",
                border: "1px solid #1D7EDF",
                boxShadow: "0 10px 20px rgba(29, 126, 223, 0.2)",
              }}
              className="shadow-md shadow-primary-500/25 hover:-translate-y-0.5 transition-all"
            >
              {isSubmitting ? "Creating..." : "Create and price"}
            </ModernButton>
          </div>
        </div>
      )}
    </ModernCard>
  );
};

export default InstanceConfigurationForm;
