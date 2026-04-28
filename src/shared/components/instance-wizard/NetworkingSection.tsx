import React from "react";
import { Configuration, Option } from "@/types/InstanceConfiguration";
import { SearchableSelect } from "../ui";

interface NetworkingSectionProps {
  cfg: Configuration;
  networkOptions: Option[];
  subnetOptions: Option[];
  bandwidthOptions: Option[];
  isProjectScoped: boolean;
  isLoadingResources: boolean;
  hasFloatingIp: boolean;
  isPresetRequiresEip: boolean;
  securityGroups: unknown;
  updateConfigWithFocus: (patch: Partial<Configuration>) => void;
  handleSecurityGroupToggle: (value: string, checked: boolean) => void;
}

const NetworkingSection: React.FC<NetworkingSectionProps> = ({
  cfg,
  networkOptions,
  subnetOptions,
  bandwidthOptions,
  isProjectScoped,
  isLoadingResources,
  hasFloatingIp,
  isPresetRequiresEip,
  securityGroups,
  updateConfigWithFocus,
  handleSecurityGroupToggle,
}) => {
  return (
    <>
      <div className="grid gap-4 md:grid-cols-3">
        <SearchableSelect
          label="Network (Optional)"
          value={cfg.network_id}
          onChange={(e) => updateConfigWithFocus({ network_id: e.target.value })}
          options={[{ value: "", label: "None (use default)" }, ...networkOptions]}
          helper="Select a network when targeting a project."
          disabled={!isProjectScoped}
        />
        <SearchableSelect
          label="Subnet (Optional)"
          value={cfg.subnet_id}
          onChange={(e) => {
            const selectedLabel = e.target.selectedOptions?.[0]?.text || "";
            updateConfigWithFocus({
              subnet_id: e.target.value,
              subnet_label: e.target.value ? selectedLabel : "",
            });
          }}
          options={[{ value: "", label: "None (use default)" }, ...subnetOptions]}
          helper="Select a subnet from the chosen network."
          disabled={!isProjectScoped}
        />
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Bandwidth</label>
          <SearchableSelect
            label=""
            value={cfg.bandwidth_id}
            onChange={(e) =>
              updateConfigWithFocus({
                bandwidth_id: e.target.value,
                bandwidth_count: e.target.value ? 1 : 0,
              })
            }
            options={[{ value: "", label: "Select bandwidth (optional)" }, ...bandwidthOptions]}
            helper="Optional. Leave blank if not required."
            disabled={isLoadingResources}
          />
        </div>
      </div>

      <EipToggle
        hasFloatingIp={hasFloatingIp}
        isPresetRequiresEip={isPresetRequiresEip}
        updateConfigWithFocus={updateConfigWithFocus}
      />

      <SecurityGroupList
        cfg={cfg}
        securityGroups={securityGroups}
        isProjectScoped={isProjectScoped}
        handleSecurityGroupToggle={handleSecurityGroupToggle}
      />
    </>
  );
};

/* ---------- EIP toggle ---------- */

interface EipToggleProps {
  hasFloatingIp: boolean;
  isPresetRequiresEip: boolean;
  updateConfigWithFocus: (patch: Partial<Configuration>) => void;
}

const EipToggle: React.FC<EipToggleProps> = ({
  hasFloatingIp,
  isPresetRequiresEip,
  updateConfigWithFocus,
}) => (
  <div className="grid gap-4 md:grid-cols-2">
    <div className="md:col-span-2">
      <label className="mb-1 block text-sm font-medium text-gray-700">
        Attach EIP when provisioning
      </label>
      <label className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700">
        <input
          type="checkbox"
          className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          checked={hasFloatingIp}
          disabled={isPresetRequiresEip}
          onChange={(e) =>
            updateConfigWithFocus({
              floating_ip_count: e.target.checked ? 1 : 0,
            })
          }
        />
        <span>Allocate and attach one Elastic IP.</span>
        {isPresetRequiresEip && (
          <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
            Required by preset
          </span>
        )}
      </label>
      <p className="mt-1 text-xs text-gray-500">
        {isPresetRequiresEip
          ? "This preset requires an EIP; this is locked on."
          : "When enabled, one EIP is reserved and attached during provisioning."}
      </p>
    </div>
  </div>
);

/* ---------- Security group list ---------- */

interface SecurityGroupListProps {
  cfg: Configuration;
  securityGroups: unknown;
  isProjectScoped: boolean;
  handleSecurityGroupToggle: (value: string, checked: boolean) => void;
}

const SecurityGroupList: React.FC<SecurityGroupListProps> = ({
  cfg,
  securityGroups,
  isProjectScoped,
  handleSecurityGroupToggle,
}) => (
  <div className="grid gap-4 md:grid-cols-3">
    <div className="md:col-span-2">
      <label className="mb-1 block text-sm font-medium text-gray-700">
        Security Groups (Optional)
      </label>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {isProjectScoped ? (
          (Array.isArray(securityGroups) && securityGroups.length > 0 ? securityGroups : []).map(
            (sg: { id?: string | number; identifier?: string; name?: string; label?: string }) => {
              const id = sg.id || sg.identifier || sg.name;
              if (!id) return null;
              const label = sg.name || sg.label || `SG ${id}`;
              const checked = Array.isArray(cfg.security_group_ids)
                ? cfg.security_group_ids.includes(String(id))
                : false;
              return (
                <label
                  key={id}
                  className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700"
                >
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    checked={checked}
                    onChange={(e) => handleSecurityGroupToggle(String(id), e.target.checked)}
                  />
                  <span>{label}</span>
                </label>
              );
            }
          )
        ) : (
          <p className="text-xs text-gray-500">
            Select a region and project to view available security groups.
          </p>
        )}
      </div>
    </div>
  </div>
);

export default NetworkingSection;
