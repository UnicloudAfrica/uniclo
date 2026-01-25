import React from "react";
import { Shield, Loader2 } from "lucide-react";
import { ModernButton } from "../ui";

interface SecurityTwoFactorPanelProps {
  enabled: boolean;
  onEnable: (event?: any) => void;
  onDisable: (event?: any) => void;
  isBusy: boolean;
  isFetching: boolean;
}

const SecurityTwoFactorPanel: React.FC<SecurityTwoFactorPanelProps> = ({
  enabled,
  onEnable,
  onDisable,
  isBusy,
  isFetching,
}) => {
  const statusLabel = enabled ? "Enabled" : "Disabled";
  const statusStyles = enabled ? "bg-emerald-50 text-emerald-600" : "bg-slate-200 text-slate-600";

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-slate-900">Two-factor authentication (2FA)</p>
          <p className="text-sm text-slate-500">
            Add a second verification step to keep your administrative access secure.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles}`}>
            {statusLabel}
          </span>
          <ModernButton
            size="sm"
            variant={enabled ? "outline" : "primary"}
            className={`flex items-center gap-2 ${
              enabled
                ? "hover:!bg-[--theme-color-10] !text-[--theme-color] !border-[--theme-color]"
                : "!bg-[--theme-color] hover:opacity-90 !text-white !border-transparent"
            }`}
            onClick={enabled ? onDisable : onEnable}
            disabled={isBusy || isFetching}
          >
            {isBusy || isFetching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Shield className="h-4 w-4" />
            )}
            {enabled ? "Disable 2FA" : "Enable 2FA"}
          </ModernButton>
        </div>
      </div>
      <div className="rounded-2xl border border-dashed border-slate-200 bg-white/80 p-4 text-sm text-slate-600">
        {enabled ? (
          <p>
            You will need the 6-digit code from your authenticator app whenever you sign in. Keep
            your backup codes somewhere safe.
          </p>
        ) : (
          <p>
            Use Google Authenticator, Authy, or any compatible authenticator app to scan our QR code
            and confirm a 6-digit code to complete setup.
          </p>
        )}
      </div>
    </div>
  );
};

export default SecurityTwoFactorPanel;
