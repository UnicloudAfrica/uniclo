import React from "react";
import { Cloud, Loader2, ShieldCheck } from "lucide-react";

export type NetworkPolicySettings = {
  force_eip_for_public_preset: boolean;
  allow_preset_upgrade_for_eip: boolean;
  require_eip_preflight: boolean;
  strict_eip_preflight: boolean;
};

interface NetworkPolicySettingsCardProps {
  settings: NetworkPolicySettings;
  isLoading?: boolean;
  isSaving?: boolean;
  onToggle?: (key: keyof NetworkPolicySettings) => void;
  onSave?: () => void;
  title?: string;
  description?: string;
  readOnly?: boolean;
  footerNote?: string;
}

const NetworkPolicySettingsCard: React.FC<NetworkPolicySettingsCardProps> = ({
  settings,
  isLoading = false,
  isSaving = false,
  onToggle,
  onSave,
  title = "Network Policy",
  description = "Control Elastic IP enforcement and preflight checks for this tenant.",
  readOnly = false,
  footerNote,
}) => {
  const resolvedFooter =
    footerNote ||
    (readOnly ? "Managed by your administrator." : "Changes apply to new provisioning requests.");

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      <div className="flex items-center gap-3 border-b border-gray-200 px-6 py-4">
        <div className="h-10 w-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
          <Cloud className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
      </div>

      <div className="px-6 py-5 space-y-4">
        {isLoading ? (
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading network settings...
          </div>
        ) : (
          <>
            <label className="flex items-start gap-3 rounded-lg border border-gray-200 px-4 py-3">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                checked={Boolean(settings.force_eip_for_public_preset)}
                onChange={() => onToggle?.("force_eip_for_public_preset")}
                disabled={isSaving || readOnly}
              />
              <div>
                <p className="text-sm font-medium text-gray-900">Require EIP on public presets</p>
                <p className="text-xs text-gray-500">
                  Automatically attach an EIP when a public preset is used, even if the user did not
                  request one.
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3 rounded-lg border border-gray-200 px-4 py-3">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                checked={Boolean(settings.allow_preset_upgrade_for_eip)}
                onChange={() => onToggle?.("allow_preset_upgrade_for_eip")}
                disabled={isSaving || readOnly}
              />
              <div>
                <p className="text-sm font-medium text-gray-900">Allow preset upgrade for EIP</p>
                <p className="text-xs text-gray-500">
                  If a private preset is selected with EIP, auto-switch to a public preset.
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3 rounded-lg border border-gray-200 px-4 py-3">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                checked={Boolean(settings.require_eip_preflight)}
                onChange={() => onToggle?.("require_eip_preflight")}
                disabled={isSaving || readOnly}
              />
              <div>
                <p className="text-sm font-medium text-gray-900">Require EIP pool preflight</p>
                <p className="text-xs text-gray-500">
                  Check pool availability before provisioning when EIPs are requested.
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3 rounded-lg border border-gray-200 px-4 py-3">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                checked={Boolean(settings.strict_eip_preflight)}
                onChange={() => onToggle?.("strict_eip_preflight")}
                disabled={isSaving || readOnly || !settings.require_eip_preflight}
              />
              <div>
                <p className="text-sm font-medium text-gray-900">Strict preflight enforcement</p>
                <p className="text-xs text-gray-500">
                  Fail provisioning if pool availability cannot be determined.
                </p>
              </div>
            </label>
          </>
        )}
      </div>

      <div className="flex items-center justify-between bg-gray-50 px-6 py-4">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <ShieldCheck className="h-4 w-4 text-gray-400" />
          {resolvedFooter}
        </div>
        {!readOnly && (
          <button
            onClick={onSave}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            disabled={isSaving || isLoading}
          >
            {isSaving ? "Saving..." : "Save changes"}
          </button>
        )}
      </div>
    </div>
  );
};

export default NetworkPolicySettingsCard;
