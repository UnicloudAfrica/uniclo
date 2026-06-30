import React from "react";
import { useSearchParams } from "react-router-dom";
import AdminPageShell from "../../components/AdminPageShell";
import WebsiteContentList from "./WebsiteContentList";
import {
  MARKETING_FIELD_CONFIG,
  MARKETING_TYPES,
  type MarketingType,
} from "./marketingFieldConfig";

const isMarketingType = (value: string | null): value is MarketingType =>
  value != null && (MARKETING_TYPES as string[]).includes(value);

export default function AdminWebsiteContent() {
  const [searchParams, setSearchParams] = useSearchParams();

  const paramType = searchParams.get("type");
  const activeType: MarketingType = isMarketingType(paramType) ? paramType : MARKETING_TYPES[0];

  const selectType = (type: MarketingType) => {
    setSearchParams({ type });
  };

  return (
    <AdminPageShell
      title="Website Content"
      description="Manage the marketing content shown on the public website."
    >
      {/* Tab bar — one tab per content type. */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
        {MARKETING_TYPES.map((type) => {
          const isActive = type === activeType;
          return (
            <button
              key={type}
              type="button"
              onClick={() => selectType(type)}
              className={`rounded-lg px-3.5 py-2 text-sm font-medium transition ${
                isActive
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {MARKETING_FIELD_CONFIG[type].label}
            </button>
          );
        })}
      </div>

      {/* `key` forces a clean remount per type — keeps hook usage unambiguous. */}
      <WebsiteContentList key={activeType} type={activeType} />
    </AdminPageShell>
  );
}
