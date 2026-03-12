import React from "react";
import { RefreshCw } from "lucide-react";
import { ModernCard } from "@/shared/components/ui";
import StatusPill from "@/shared/components/ui/StatusPill";

import type { ActionConfig } from "./instanceDetailsTypes";
import { ACTION_LIBRARY, buildToneClass } from "./instanceDetailsUtils";

interface InstanceLifecycleControlsProps {
  supportsInstanceActions: boolean;
  availableActions: Record<string, unknown>;
  displayStatus: string | undefined;
  pendingAction: string | null;
  onAction: (actionKey: string) => void;
}

const InstanceLifecycleControls: React.FC<InstanceLifecycleControlsProps> = ({
  supportsInstanceActions,
  availableActions,
  displayStatus,
  pendingAction,
  onAction,
}) => {
  return (
    <ModernCard padding="xl" className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Action Centre</h2>
          <p className="text-sm text-slate-500">
            Lifecycle controls surface based on provider capabilities and current state.
          </p>
        </div>
        <StatusPill
          label={supportsInstanceActions ? "Actions available" : "Actions disabled"}
          tone={supportsInstanceActions ? "success" : "warning"}
        />
      </div>
      <div className="flex flex-wrap gap-3">
        {(Object.keys(ACTION_LIBRARY) as string[])
          .filter((actionKey: string) =>
            actionKey === "refresh"
              ? true
              : availableActions?.[actionKey] || supportsInstanceActions
          )
          .map((actionKey: string) => {
            const actionConfig: ActionConfig =
              ACTION_LIBRARY[actionKey] ?? ACTION_LIBRARY["refresh"]!;
            const Icon = actionConfig.icon || RefreshCw;
            const disabled =
              pendingAction === actionKey ||
              (actionConfig.disableOnStatus && actionConfig.disableOnStatus(displayStatus));
            return (
              <button
                key={actionKey}
                type="button"
                onClick={() => onAction(actionKey)}
                disabled={disabled || (actionKey === "refresh" && pendingAction === "refresh")}
                className={`flex w-full max-w-xs flex-col gap-1 rounded-2xl px-4 py-3 text-left text-sm transition sm:w-auto ${
                  disabled
                    ? "cursor-not-allowed opacity-60 border border-slate-200 bg-slate-100 text-slate-400"
                    : buildToneClass(actionConfig.tone)
                }`}
              >
                <span className="flex items-center gap-2 font-semibold">
                  <Icon className="h-4 w-4" />
                  {actionConfig.label}
                </span>
                <span className="text-xs">{actionConfig.description}</span>
              </button>
            );
          })}
      </div>
    </ModernCard>
  );
};

export default InstanceLifecycleControls;
