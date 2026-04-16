/**
 * ProtectionModeCard — Toggle protection level for a Shield domain.
 */
import React from "react";
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

  return (
    <div className="db-surface-card rounded-2xl border p-5">
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-widest text-[var(--theme-muted-color)]">
        Protection Mode
      </h3>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {MODES.map((mode) => {
          const isActive = currentMode === mode.value;
          return (
            <button
              key={mode.value}
              type="button"
              onClick={() => {
                if (!isActive) {
                  setMode.mutate({ domainId, mode: mode.value });
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
