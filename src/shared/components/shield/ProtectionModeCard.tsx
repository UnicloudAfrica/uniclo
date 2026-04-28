/**
 * ProtectionModeCard — Toggle protection level for a Shield domain.
 */
import React, { useState } from "react";
import { Shield, ShieldCheck, ShieldAlert } from "lucide-react";
import { useSetProtectionMode } from "@/shared/hooks/resources/shieldHooks";

interface ProtectionModeCardProps {
  domainId: string;
  currentMode: string;
}

const MODES = [
  {
    value: "standard",
    label: "Standard",
    description: "Balanced protection for normal traffic patterns.",
    icon: <Shield size={20} />,
    tone: "text-[var(--theme-color)]",
  },
  {
    value: "enhanced",
    label: "Enhanced",
    description: "Stricter filtering for elevated threat levels.",
    icon: <ShieldCheck size={20} />,
    tone: "text-amber-600",
  },
  {
    value: "under_attack",
    label: "Under Attack",
    description: "Maximum protection — all traffic challenged.",
    icon: <ShieldAlert size={20} />,
    tone: "text-red-600",
  },
];

const ProtectionModeCard: React.FC<ProtectionModeCardProps> = ({
  domainId,
  currentMode,
}) => {
  const setMode = useSetProtectionMode();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="db-surface-card rounded-2xl border p-5">
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-widest text-[var(--theme-muted-color)]">
        Protection Mode
      </h3>
      {error && (
        <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600 dark:border-red-800 dark:bg-red-950 dark:text-red-400">
          {error}
        </div>
      )}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {MODES.map((mode) => {
          const isActive = currentMode === mode.value;
          return (
            <button
              key={mode.value}
              type="button"
              onClick={() => {
                if (!isActive) {
                  setError(null);
                  setMode.mutate(
                    { domainId, mode: mode.value },
                    {
                      onError: () =>
                        setError("Failed to change protection mode. Please try again."),
                    }
                  );
                }
              }}
              disabled={setMode.isPending}
              className={`rounded-xl border p-4 text-left transition ${
                isActive
                  ? "border-[var(--theme-color)] bg-[var(--theme-color-10)] shadow-sm"
                  : "border-transparent hover:border-[rgb(var(--theme-color-200))]"
              }`}
            >
              <div className={`mb-2 ${mode.tone}`}>{mode.icon}</div>
              <div className="text-sm font-medium text-[var(--theme-heading-color)]">
                {mode.label}
              </div>
              <div className="mt-1 text-xs text-[var(--theme-muted-color)]">
                {mode.description}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ProtectionModeCard;
