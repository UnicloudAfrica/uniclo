import React from "react";
import { Trash2 } from "lucide-react";
import { Configuration, Option, AdditionalVolume } from "../../../types/InstanceConfiguration";
import { ModernCard } from "../ui";
import { ModernSelect } from "../ui";
import { ModernButton } from "../ui";

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
}) => {
  const selectedRegion = cfg.region;

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

  return (
    <ModernCard variant="outlined" padding="lg" className="space-y-6" onClick={undefined}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-lg font-semibold text-slate-900">
            Configuration #{index + 1}: {cfg.name || "Untitled"}
          </p>
          <p className="text-sm text-slate-600">
            Define instances, storage, and networking for this configuration.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
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
        <div className="grid gap-4 md:grid-cols-3">
          <ModernSelect
            label="Region *"
            value={cfg.region}
            onChange={(e) => updateConfiguration(cfg.id, { region: e.target.value })}
            options={[{ value: "", label: "Select region" }, ...regionOptions]}
            helper="Region code used for pricing and provisioning."
            disabled={isLoadingResources}
          />
          <ModernSelect
            label="Project (Optional)"
            value={cfg.project_id}
            onChange={(e) => updateConfiguration(cfg.id, { project_id: e.target.value })}
            options={[
              {
                value: "",
                label: selectedRegion ? "Select project (optional)" : "Select region first",
              },
              ...projectOptions,
            ]}
            helper="Choose a project or leave blank and rely on region."
            disabled={!selectedRegion}
          />
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
