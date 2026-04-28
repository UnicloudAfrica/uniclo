/**
 * GeoFilterPanel — Geo-based traffic filtering for a Shield domain.
 */
import React, { useState, useEffect, useRef } from "react";
import { MapPin, RefreshCw } from "lucide-react";
import ModernButton from "@/shared/components/ui/ModernButton";
import ModernInput from "@/shared/components/ui/ModernInput";
import ModernSelect from "@/shared/components/ui/ModernSelect";
import {
  useFetchGeoFilter,
  useSetGeoFilter,
} from "@/shared/hooks/resources/shieldHooks";
import type { ShieldGeoFilter } from "@/shared/hooks/resources/shieldHooks";

interface GeoFilterPanelProps {
  domainId: string;
}

const ACTION_OPTIONS = [
  { value: "block", label: "Block" },
  { value: "allow", label: "Allow" },
];

const GeoFilterPanel: React.FC<GeoFilterPanelProps> = ({ domainId }) => {
  const { data: rawFilter, isLoading, isError, error, refetch } = useFetchGeoFilter(domainId);
  const filter = rawFilter as ShieldGeoFilter | undefined;
  const setGeoFilter = useSetGeoFilter();
  const [countries, setCountries] = useState("");
  const [action, setAction] = useState<"block" | "allow">("block");
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (filter && !hasInitialized.current) {
      setCountries(filter.countries.join(", "));
      setAction(filter.action);
      hasInitialized.current = true;
    }
  }, [filter]);

  const handleSave = () => {
    const countryList = countries
      .split(",")
      .map((c) => c.trim().toUpperCase())
      .filter((c) => c.length === 2);

    setGeoFilter.mutate({ domainId, countries: countryList, action });
  };

  if (isLoading) {
    return (
      <div className="flex h-24 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--theme-color)] border-t-transparent" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="db-surface-card flex flex-col items-center justify-center gap-3 rounded-2xl border p-8 text-center">
        <p className="text-sm text-red-600">
          {error?.message || "Failed to load geo-filter settings."}
        </p>
        <button
          type="button"
          onClick={() => refetch()}
          className="flex items-center gap-1.5 rounded-xl bg-[var(--theme-color)] px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
        >
          <RefreshCw size={14} /> Retry
        </button>
      </div>
    );
  }

  return (
    <div className="db-surface-card rounded-2xl border p-5">
      <div className="mb-4 flex items-center gap-2">
        <MapPin size={18} className="text-[var(--theme-color)]" />
        <h3 className="text-sm font-semibold uppercase tracking-widest text-[var(--theme-muted-color)]">
          Geo-Filter
        </h3>
      </div>

      <div className="space-y-4">
        <ModernInput
          label="Countries (comma-separated ISO codes)"
          placeholder="RU, CN, KP"
          value={countries}
          onChange={(e) => setCountries(e.target.value)}
        />

        <ModernSelect
          label="Action"
          options={ACTION_OPTIONS}
          value={action}
          onChange={(e) => setAction(e.target.value as "block" | "allow")}
        />

        <ModernButton
          onClick={handleSave}
          disabled={setGeoFilter.isPending}
          loading={setGeoFilter.isPending}
        >
          Save Geo-Filter
        </ModernButton>
      </div>
    </div>
  );
};

export default GeoFilterPanel;
