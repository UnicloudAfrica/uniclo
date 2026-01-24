import React, { useEffect, useMemo, useState } from "react";
import TenantPageShell from "../components/TenantPageShell";
import { useFetchTenantNetworkSettings } from "../../hooks/networkSettingsHooks";
import { NetworkPolicySettingsCard } from "../../shared/components/settings";

const Settings = () => {
  const { data: networkData, isLoading: isNetworkLoading } = useFetchTenantNetworkSettings();

  const defaultNetworkSettings = useMemo(
    () => ({
      force_eip_for_public_preset: false,
      allow_preset_upgrade_for_eip: true,
      require_eip_preflight: false,
      strict_eip_preflight: false,
    }),
    []
  );

  const normalizeBool = (value, fallback) => {
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

  return (
    <TenantPageShell
      title="Account Settings"
      description="Manage your profile, business information, and security preferences."
    >
      <div className="space-y-6">
        <NetworkPolicySettingsCard
          settings={networkSettings}
          isLoading={isNetworkLoading}
          readOnly
        />
      </div>
    </TenantPageShell>
  );
};

export default Settings;
