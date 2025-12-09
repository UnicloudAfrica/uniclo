import React, { useState } from "react";
import { FieldConfig } from "../../types/settings";
import SettingsToggle from "./SettingsToggle";

interface FieldControlProps {
  field: FieldConfig;
  value: any;
  onChange: (value: any) => void;
}

const FieldControl: React.FC<FieldControlProps> = ({ field, value, onChange }) => {
  const { label, placeholder, type, help, readOnly, icon: Icon, options = [], rows = 3 } = field;
  const [isFocused, setFocused] = useState(false);

  const renderInput = () => {
    if (type === "textarea") {
      return (
        <textarea
          rows={rows}
          value={value ?? ""}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm transition focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-100"
          disabled={readOnly}
        />
      );
    }

    if (type === "select") {
      return (
        <select
          value={value ?? options[0]?.value ?? ""}
          onChange={(event) => onChange(event.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm transition focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-100"
          disabled={readOnly}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      );
    }

    if (type === "toggle") {
      return <SettingsToggle value={value} onChange={onChange} disabled={readOnly} />;
    }

    const inputType = type === "number" ? "number" : type === "password" ? "password" : "text";
    return (
      <div className="relative">
        {Icon && (
          <Icon
            className={`pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 ${
              isFocused ? "text-primary-500" : ""
            }`}
          />
        )}
        <input
          type={inputType}
          value={value ?? ""}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          readOnly={readOnly}
          className={`w-full rounded-xl border ${
            readOnly
              ? "border-slate-200 bg-slate-50 text-slate-500"
              : "border-slate-200 bg-white text-slate-700 shadow-sm transition focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-100"
          } px-4 py-3 text-sm ${Icon ? "pl-11" : ""}`}
        />
      </div>
    );
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-slate-700">{label}</label>
        {readOnly && (
          <span className="rounded-full border border-slate-200 px-2 py-0.5 text-[11px] uppercase tracking-wide text-slate-400">
            Read only
          </span>
        )}
      </div>
      {renderInput()}
      {help && <p className="text-xs text-slate-400">{help}</p>}
    </div>
  );
};

export default FieldControl;
