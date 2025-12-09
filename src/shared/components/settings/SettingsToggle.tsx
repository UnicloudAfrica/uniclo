import React from "react";

interface SettingsToggleProps {
  value: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}

const SettingsToggle: React.FC<SettingsToggleProps> = ({ value, onChange, disabled }) => {
  const active = Boolean(value);
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!active)}
      disabled={disabled}
      className={`relative inline-flex h-9 w-16 items-center rounded-full border transition ${
        active ? "border-primary-200 bg-primary-500/90" : "border-slate-200 bg-slate-200/60"
      } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
    >
      <span
        className={`ml-1 inline-flex h-7 w-7 transform items-center justify-center rounded-full bg-white text-xs font-semibold transition ${
          active ? "translate-x-7 text-primary-600" : "translate-x-0 text-slate-500"
        }`}
      >
        {active ? "On" : "Off"}
      </span>
    </button>
  );
};

export default SettingsToggle;
