// @ts-nocheck
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Calculator, Flag, Globe, Loader2, Percent, Pencil, Plus } from "lucide-react";
import AdminHeadbar from "../components/adminHeadbar";
import AdminSidebar from "../components/AdminSidebar";
import AdminPageShell from "../components/AdminPageShell.tsx";
import { ModernButton } from "../../shared/components/ui";
import { ModernCard } from "../../shared/components/ui";
import ResourceHero from "../../shared/components/ui/ResourceHero";
import ResourceDataExplorer from "../components/ResourceDataExplorer";
import AddTaxTypeModal from "./taxComponents/addTax";
import EditTaxTypeModal from "./taxComponents/editTax";
import { useFetchTaxConfigurations } from "../../hooks/adminHooks/taxConfigurationHooks";

const formatRate = (rate: any) => {
  if (rate === null || rate === undefined) return "—";
  const numeric = Number(rate);
  if (Number.isNaN(numeric)) return "—";
  return `${(numeric * 100).toFixed(2)}%`;
};
export default function AdminTax() {
  const [isAddTaxTypeModalOpen, setIsAddTaxTypeModalOpen] = useState(false);
  const [isEditTaxTypeModalOpen, setIsEditTaxTypeModalOpen] = useState(false);
  const [selectedTaxType, setSelectedTaxType] = useState(null);
  const [selectedCountryId, setSelectedCountryId] = useState(null);
  const [countrySearch, setCountrySearch] = useState("");

  const {
    data: taxConfigurations = [],
    isFetching: isTaxFetching,
    refetch,
  } = useFetchTaxConfigurations({
    onError: (error) => {
      console.error("Failed to fetch tax configurations", error);
    },
  });

  const taxTypeMap = useMemo(() => {
    const map = new Map();
    (taxConfigurations || []).forEach((taxType: any) => {
      if (!taxType || typeof taxType !== "object") return;
      map.set(taxType.id, taxType);
    });
    return map;
  }, [taxConfigurations]);

  const countryCatalogue = useMemo(() => {
    const catalogueMap = new Map();

    (taxConfigurations || []).forEach((taxType: any) => {
      const rates = taxType?.country_rates || [];
      rates.forEach((rate: any) => {
        const country = rate?.country;
        if (!country?.id) return;

        if (!catalogueMap.has(country.id)) {
          catalogueMap.set(country.id, {
            country,
            taxTypes: [],
          });
        }

        const entry = catalogueMap.get(country.id);
        entry.taxTypes.push({
          id: `${taxType.id}-${rate.id ?? "rate"}`,
          taxTypeId: taxType.id,
          name: taxType.name || "Untitled tax",
          slug: taxType.slug,
          rate: Number(rate.rate ?? 0),
        });
      });
    });

    return Array.from(catalogueMap.entries())
      .map(([countryId, entry]) => ({
        countryId: Number(countryId),
        country: entry.country,
        name: entry.country?.name || "Unknown country",
        code: entry.country?.code || entry.country?.iso2 || "",
        taxCount: entry.taxTypes.length,
        taxTypes: entry.taxTypes,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [taxConfigurations]);

  useEffect(() => {
    if (!countryCatalogue.length) {
      setSelectedCountryId(null);
      return;
    }

    const stillValid = countryCatalogue.some((entry) => entry.countryId === selectedCountryId);

    if (!stillValid) {
      setSelectedCountryId(countryCatalogue[0].countryId);
    }
  }, [countryCatalogue, selectedCountryId]);

  const filteredCountries = useMemo(() => {
    const query = countrySearch.trim().toLowerCase();
    if (!query) return countryCatalogue;

    return countryCatalogue.filter(
      (entry) =>
        entry.name.toLowerCase().includes(query) || entry.code.toLowerCase().includes(query)
    );
  }, [countryCatalogue, countrySearch]);

  const selectedCountry = useMemo(
    () => countryCatalogue.find((entry) => entry.countryId === selectedCountryId) || null,
    [countryCatalogue, selectedCountryId]
  );

  const countryRows = useMemo(() => {
    if (!selectedCountry) return [];
    return selectedCountry.taxTypes.map((item: any) => ({
      id: item.id,
      taxTypeId: item.taxTypeId,
      name: item.name,
      slug: item.slug,
      rate: item.rate,
      taxType: taxTypeMap.get(item.taxTypeId),
    }));
  }, [selectedCountry, taxTypeMap]);

  const totalRates = useMemo(
    () => countryCatalogue.reduce((sum, entry) => sum + entry.taxTypes.length, 0),
    [countryCatalogue]
  );

  const averageRate = useMemo(() => {
    if (!totalRates) return 0;
    const sum = countryCatalogue.reduce((rateSum, entry) => {
      return (
        rateSum +
        entry.taxTypes.reduce((innerSum, value) => innerSum + (Number(value.rate) || 0), 0)
      );
    }, 0);
    return (sum / totalRates) * 100;
  }, [countryCatalogue, totalRates]);

  const heroMetrics = useMemo(
    () => [
      {
        label: "Countries covered",
        value: countryCatalogue.length,
        description: "With active tax settings",
        icon: <Globe className="h-4 w-4" />,
      },
      {
        label: "Tax categories",
        value: taxConfigurations.length,
        description: "Global tax definitions",
        icon: <Calculator className="h-4 w-4" />,
      },
      {
        label: "Avg rate",
        value: `${averageRate.toFixed(2)}%`,
        description: "Across all country entries",
        icon: <Percent className="h-4 w-4" />,
      },
    ],
    [averageRate, countryCatalogue.length, taxConfigurations.length]
  );

  const handleOpenAddTaxType = useCallback(() => {
    setIsAddTaxTypeModalOpen(true);
  }, []);

  const handleOpenEditTaxType = useCallback((taxType) => {
    if (!taxType) return;
    setSelectedTaxType(taxType);
    setIsEditTaxTypeModalOpen(true);
  }, []);

  const columns = useMemo(
    () => [
      {
        key: "name",
        header: "Tax type",
        render: (row) => (
          <div className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary-500/10 text-primary-500">
              <Calculator className="h-4 w-4" />
            </span>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-slate-900">{row.name}</span>
              {row.slug && (
                <span className="text-xs uppercase tracking-wide text-slate-400">{row.slug}</span>
              )}
            </div>
          </div>
        ),
      },
      {
        key: "rate",
        header: "Rate",
        align: "right",
        render: (row) => (
          <span className="inline-flex items-center justify-end gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-primary-500/10 px-3 py-1 text-xs font-semibold text-primary-600">
              <Percent className="h-3 w-3" />
              {formatRate(row.rate)}
            </span>
          </span>
        ),
      },
      {
        key: "actions",
        header: "",
        align: "right",
        render: (row) => (
          <button
            type="button"
            onClick={() => handleOpenEditTaxType(row.taxType)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-primary-200 hover:text-primary-600"
            title="Edit tax type"
            aria-label="Edit tax type"
          >
            <Pencil className="h-4 w-4" />
          </button>
        ),
      },
    ],
    [handleOpenEditTaxType]
  );

  const countryList = (
    <ModernCard
      padding="none"
      className="flex flex-1 flex-col overflow-hidden border border-slate-200/80 bg-white/90 shadow-sm"
    >
      <div className="border-b border-slate-100 px-6 py-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Country catalogue</h3>
            <p className="mt-1 text-sm text-slate-500">
              Select a market to review tax types and percentage rates.
            </p>
          </div>
          <ModernButton
            onClick={handleOpenAddTaxType}
            className="hidden items-center gap-2 md:flex"
            size="sm"
          >
            <Plus className="h-4 w-4" />
            Add tax type
          </ModernButton>
        </div>
        <div className="relative mt-4">
          <input
            type="search"
            value={countrySearch}
            onChange={(event) => setCountrySearch(event.target.value)}
            placeholder="Search countries"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-600 outline-none transition focus:border-primary-300 focus:bg-white focus:shadow-sm"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {isTaxFetching && !countryCatalogue.length ? (
          <div className="flex h-56 items-center justify-center text-sm text-slate-500">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
              Fetching countries…
            </div>
          </div>
        ) : !filteredCountries.length ? (
          <div className="px-6 py-10 text-center text-sm text-slate-500">
            {countrySearch
              ? "No countries match your search."
              : "No tax rates have been configured yet."}
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {filteredCountries.map((entry: any) => {
              const isActive = entry.countryId === selectedCountryId;
              return (
                <li key={entry.countryId}>
                  <button
                    type="button"
                    onClick={() => setSelectedCountryId(entry.countryId)}
                    className={`flex w-full items-start justify-between gap-3 px-6 py-4 text-left transition ${
                      isActive ? "bg-primary-50/80 text-primary-600" : "hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                        <Flag className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="text-sm font-semibold">{entry.name}</p>
                        <p className="text-xs uppercase tracking-wide text-slate-400">
                          {entry.code || "N/A"}
                        </p>
                      </div>
                    </div>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-500 shadow-sm">
                      {entry.taxCount} {entry.taxCount === 1 ? "tax" : "taxes"}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      <div className="border-t border-slate-100 px-6 py-4 md:hidden">
        <ModernButton
          onClick={handleOpenAddTaxType}
          className="flex w-full items-center justify-center gap-2"
          size="sm"
        >
          <Plus className="h-4 w-4" />
          Add tax type
        </ModernButton>
      </div>
    </ModernCard>
  );

  const detailPanel = (
    <ModernCard
      padding="none"
      className="flex flex-1 flex-col overflow-hidden border border-slate-200/80 bg-white/90 shadow-sm"
    >
      {selectedCountry ? (
        <ResourceDataExplorer
          title={`${selectedCountry.name} tax types`}
          description="Review configured tax categories and adjust rates for this market."
          columns={columns}
          rows={countryRows}
          loading={isTaxFetching}
          page={1}
          perPage={countryRows.length || 10}
          total={countryRows.length}
          toolbarSlot={
            <ModernButton
              onClick={handleOpenAddTaxType}
              className="flex items-center gap-2"
              size="sm"
            >
              <Plus className="h-4 w-4" />
              Add tax type
            </ModernButton>
          }
          emptyState={{
            icon: (
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-500/10 text-primary-500">
                <Percent className="h-5 w-5" />
              </span>
            ),
            title: "No tax types yet",
            description: "Create a tax type to start tracking percentages for this country.",
            action: (
              <ModernButton onClick={handleOpenAddTaxType} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add tax type
              </ModernButton>
            ),
          }}
        />
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-16 text-center">
          {isTaxFetching ? (
            <>
              <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
              <p className="text-sm text-slate-500">Loading tax catalogue…</p>
            </>
          ) : (
            <>
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-500/10 text-primary-500">
                <Globe className="h-5 w-5" />
              </span>
              <h3 className="text-lg font-semibold text-slate-900">No countries configured</h3>
              <p className="max-w-sm text-sm text-slate-500">
                Add a tax type and assign it to a country to begin managing regional tax
                percentages.
              </p>
              <ModernButton onClick={handleOpenAddTaxType} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Create tax type
              </ModernButton>
            </>
          )}
        </div>
      )}
    </ModernCard>
  );

  return (
    <>
      <AdminHeadbar />
      <AdminSidebar />
      <AdminPageShell contentClassName="space-y-8">
        <ResourceHero
          title="Tax configuration"
          subtitle="Billing"
          description="Model country-specific tax rules so billing can automatically apply the right percentages for each market."
          metrics={heroMetrics}
          accent="midnight"
          rightSlot={
            <ModernButton onClick={handleOpenAddTaxType} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              New tax type
            </ModernButton>
          }
        />

        <div className="flex flex-col gap-6 lg:flex-row">
          <div className="w-full lg:max-w-sm">{countryList}</div>
          <div className="flex-1">{detailPanel}</div>
        </div>
      </AdminPageShell>

      {isAddTaxTypeModalOpen && (
        <AddTaxTypeModal
          isOpen={isAddTaxTypeModalOpen}
          onClose={() => setIsAddTaxTypeModalOpen(false)}
          defaultCountryId={selectedCountry?.country?.id}
          onSuccess={() => refetch()}
        />
      )}

      {isEditTaxTypeModalOpen && selectedTaxType && (
        <EditTaxTypeModal
          isOpen={isEditTaxTypeModalOpen}
          onClose={() => {
            setIsEditTaxTypeModalOpen(false);
            setSelectedTaxType(null);
          }}
          taxType={selectedTaxType}
          onSuccess={() => refetch()}
        />
      )}
    </>
  );
}
