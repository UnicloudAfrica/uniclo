import { useEffect, useMemo, useState } from "react";
import { Loader2, Network, ShieldCheck } from "lucide-react";
import { ModernButton } from "@/shared/components/ui";
import {
  useAdminTenantNetworkSettings,
  useUpdateAdminTenantNetworkSettings,
} from "@/hooks/useAdminTenantNetworkSettings";

const accent = "var(--theme-color)";

interface Props {
  tenantId: string;
}

const TOGGLE_FIELDS: Array<{
  key: "force_eip_for_public_preset" | "allow_preset_upgrade_for_eip" | "require_eip_preflight" | "strict_eip_preflight";
  title: string;
  description: string;
}> = [
  {
    key: "force_eip_for_public_preset",
    title: "Require EIP on public presets",
    description:
      "Automatically attach an EIP when a public preset is used, even if the user did not request one.",
  },
  {
    key: "allow_preset_upgrade_for_eip",
    title: "Allow preset upgrade for EIP",
    description: "If a private preset is selected with EIP, auto-switch to a public preset.",
  },
  {
    key: "require_eip_preflight",
    title: "Require EIP pool preflight",
    description: "Check pool availability before provisioning when EIPs are requested.",
  },
  {
    key: "strict_eip_preflight",
    title: "Strict preflight enforcement",
    description: "Fail provisioning if pool availability cannot be determined.",
  },
];

export default function TenantNetworkPolicyTab({ tenantId }: Props) {
  const { data: networkData, isLoading } = useAdminTenantNetworkSettings(tenantId);
  const updateNetworkSettings = useUpdateAdminTenantNetworkSettings();

  const defaultNetworkSettings = useMemo(
    () => ({
      force_eip_for_public_preset: false,
      allow_preset_upgrade_for_eip: true,
      require_eip_preflight: false,
      strict_eip_preflight: false,
    }),
    []
  );

  const normalizeBool = (value: unknown, fallback: boolean) => {
    if (typeof value === "boolean") return value;
    if (typeof value === "number") return value === 1;
    if (typeof value === "string") {
      const normalized = value.toLowerCase().trim();
      if (["1", "true", "yes", "on"].includes(normalized)) return true;
      if (["0", "false", "no", "off"].includes(normalized)) return false;
    }
    return fallback;
  };

  const [networkSettings, setNetworkSettings] = useState(defaultNetworkSettings);

  useEffect(() => {
    const rawSettings = networkData?.network_settings || {};
    setNetworkSettings({
      force_eip_for_public_preset: normalizeBool(
        rawSettings.force_eip_for_public_preset,
        defaultNetworkSettings.force_eip_for_public_preset
      ),
      allow_preset_upgrade_for_eip: normalizeBool(
        rawSettings.allow_preset_upgrade_for_eip,
        defaultNetworkSettings.allow_preset_upgrade_for_eip
      ),
      require_eip_preflight: normalizeBool(
        rawSettings.require_eip_preflight,
        defaultNetworkSettings.require_eip_preflight
      ),
      strict_eip_preflight: normalizeBool(
        rawSettings.strict_eip_preflight,
        defaultNetworkSettings.strict_eip_preflight
      ),
    });
  }, [defaultNetworkSettings, networkData]);

  const handleToggle = (key: string) => {
    setNetworkSettings((prev) => {
      const nextValue = !(prev as unknown)[key];
      if (key === "require_eip_preflight" && !nextValue) {
        return {
          ...prev,
          require_eip_preflight: false,
          strict_eip_preflight: false,
        };
      }
      return { ...prev, [key]: nextValue };
    });
  };

  const handleSave = () => {
    updateNetworkSettings.mutate({ tenantId, data: networkSettings });
  };

  const isSaving = updateNetworkSettings.isPending;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="mb-4 flex items-start gap-3">
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
          style={{ background: "var(--theme-color-10)", color: accent }}
        >
          <Network size={16} />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold text-gray-900 dark:text-white">
            Network Policy
          </h3>
          <p className="mt-0.5 break-words text-xs text-gray-500 dark:text-gray-400">
            Control Elastic IP enforcement and preflight checks for this tenant.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading network settings...
        </div>
      ) : (
        <div className="space-y-3">
          {TOGGLE_FIELDS.map(({ key, title, description }) => {
            const disabled =
              isSaving || (key === "strict_eip_preflight" && !networkSettings.require_eip_preflight);
            return (
              <label
                key={key}
                className="flex cursor-pointer items-start gap-3 rounded-xl border border-gray-200 p-3 dark:border-gray-700"
              >
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300 dark:border-gray-600"
                  style={{ accentColor: accent }}
                  checked={Boolean(networkSettings[key])}
                  onChange={() => handleToggle(key)}
                  disabled={disabled}
                />
                <div className="min-w-0 flex-1">
                  <p className="break-words text-sm font-medium text-gray-900 dark:text-white">
                    {title}
                  </p>
                  <p className="mt-0.5 break-words text-xs text-gray-500 dark:text-gray-400">
                    {description}
                  </p>
                </div>
              </label>
            );
          })}
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 pt-4 dark:border-gray-700">
        <div className="flex min-w-0 flex-1 items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <ShieldCheck className="h-4 w-4 shrink-0 text-gray-400 dark:text-gray-500" />
          <span className="break-words">Overrides the global defaults for this tenant.</span>
        </div>
        <ModernButton
          variant="primary"
          size="sm"
          className="shrink-0"
          onClick={handleSave}
          disabled={isSaving || isLoading}
        >
          {isSaving ? "Saving..." : "Save changes"}
        </ModernButton>
      </div>
    </div>
  );
}
