// @ts-nocheck
import React, { useEffect, useMemo, useState } from "react";
import { NetworkPolicySettingsCard } from "../../../shared/components/settings";
import {
  useAdminTenantNetworkSettings,
  useUpdateAdminTenantNetworkSettings,
} from "../../../hooks/useAdminTenantNetworkSettings";

interface Props {
  tenantId: string;
}

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

  const handleToggle = (key) => {
    setNetworkSettings((prev) => {
      const nextValue = !prev[key];
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

  return (
    <NetworkPolicySettingsCard
      settings={networkSettings}
      isLoading={isLoading}
      isSaving={updateNetworkSettings.isPending}
      onToggle={handleToggle}
      onSave={handleSave}
      footerNote="Overrides the global defaults for this tenant."
    />
  );
}
