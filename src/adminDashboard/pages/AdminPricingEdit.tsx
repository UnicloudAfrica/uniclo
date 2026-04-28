import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Loader2, Save, RotateCcw, Package } from "lucide-react";

import AdminActiveTab from "../components/adminActiveTab";
import AdminPageShell from "../components/AdminPageShell";
import { ModernCard, ModernButton, getRegionOptionLabel } from "@/shared/components/ui";
import ModernTable, { type Column } from "@/shared/components/ui/ModernTable";

import { useFetchRegions, useFetchAvailabilityZones } from "@/hooks/adminHooks/regionHooks";
import {
  useFetchProductPricing,
  useBulkUpdateProductPricing,
} from "@/hooks/adminHooks/adminProductPricingHooks";
import { productTypes } from "@/utils/productImportUtils";
import { getCurrencySymbol } from "@/utils/resource";
import ToastUtils from "@/utils/toastUtil";
import useAuthRedirect from "@/utils/adminAuthRedirect";

const AdminPricingEdit = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isLoading: isAuthLoading } = useAuthRedirect();

  const initialRegion = searchParams.get("region") || "";
  const initialAZ = searchParams.get("az") || "";
  const initialType = searchParams.get("tab") || "";

  const [selectedRegion, setSelectedRegion] = useState(initialRegion);
  const [selectedAZ, setSelectedAZ] = useState(initialAZ);
  const [selectedType, setSelectedType] = useState(initialType);
  const [dirtyPrices, setDirtyPrices] = useState<Map<number, number>>(new Map());

  const { isFetching: isRegionsFetching, data: regionsData } = useFetchRegions();
  const { isFetching: isAZsFetching, data: azData } = useFetchAvailabilityZones(
    selectedRegion || undefined
  );
  const regionsList = useMemo(() => (Array.isArray(regionsData) ? regionsData : []), [regionsData]);
  const azList = useMemo(() => (Array.isArray(azData) ? azData : []), [azData]);

  const {
    isFetching: isPricingFetching,
    data: pricingData,
    refetch,
  } = useFetchProductPricing(
    {
      region: selectedRegion,
      availabilityZone: selectedAZ,
      productType: selectedType,
    },
    {
      enabled: !isRegionsFetching,
      keepPreviousData: true,
    }
  );

  const { mutate: bulkUpdate, isPending: isSaving } = useBulkUpdateProductPricing();

  // Auto-select first region when regions load
  useEffect(() => {
    if (!isRegionsFetching && regionsList.length && !selectedRegion) {
      setSelectedRegion((regionsList[0] as unknown).code);
    }
  }, [isRegionsFetching, regionsList, selectedRegion]);

  // Sync filters to URL
  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedRegion) params.set("region", selectedRegion);
    if (selectedAZ) params.set("az", selectedAZ);
    if (selectedType) params.set("tab", selectedType);
    setSearchParams(params, { replace: true });
  }, [selectedRegion, selectedAZ, selectedType, setSearchParams]);

  const pricingRows = useMemo<unknown[]>(() => {
    const payload: Record<string, unknown> = pricingData;
    const rows = payload?.data ?? [];
    return rows.map((item: unknown) => ({
      ...item,
      product_name: item.product_name || item.name || "Unnamed product",
    }));
  }, [pricingData]);

  const handleRegionChange = useCallback((regionCode: string) => {
    setSelectedRegion(regionCode);
    setSelectedAZ("");
    setDirtyPrices(new Map());
  }, []);

  const handleAZChange = useCallback((azCode: string) => {
    setSelectedAZ(azCode);
    setDirtyPrices(new Map());
  }, []);

  const handleTypeChange = useCallback((type: string) => {
    setSelectedType(type);
    setDirtyPrices(new Map());
  }, []);

  const handlePriceChange = (id: number, originalPrice: number, newValue: string) => {
    const numValue = parseFloat(newValue);
    setDirtyPrices((prev) => {
      const next = new Map(prev);
      if (numValue === originalPrice) {
        next.delete(id);
      } else {
        next.set(id, numValue);
      }
      return next;
    });
  };

  const handleSave = () => {
    const updates = Array.from(dirtyPrices.entries()).map(([id, price_usd]) => ({
      id,
      price_usd,
    }));
    bulkUpdate(updates, {
      onSuccess: () => {
        ToastUtils.success(`${updates.length} pricing entries updated.`);
        setDirtyPrices(new Map());
        refetch();
      },
      onError: () => {
        ToastUtils.error("Failed to save pricing changes.");
      },
    });
  };

  const handleReset = () => {
    setDirtyPrices(new Map());
  };

  const dirtyCount = dirtyPrices.size;

  const columns = useMemo<unknown[]>(
    () => [
      {
        header: "Product",
        key: "product_name",
        render: (_cellValue: unknown, row: unknown) => (
          <div className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary-500/10 text-primary-500">
              <Package className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-900">{row.product_name}</p>
              <p className="text-xs text-slate-500">
                {row.productable_type?.split("\\").pop() || "Product"}
              </p>
            </div>
          </div>
        ),
      },
      {
        header: "Region",
        key: "region",
        align: "center",
        render: (_cellValue: unknown, row: unknown) => (
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
            {row.region || "Global"}
          </span>
        ),
      },
      {
        header: "AZ",
        key: "availability_zone",
        align: "center",
        render: (_cellValue: unknown, row: unknown) =>
          row.availability_zone ? (
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-600">
              {row.availability_zone}
            </span>
          ) : (
            <span className="text-xs text-slate-400">All</span>
          ),
      },
      {
        header: "Price",
        key: "price_usd",
        align: "right",
        render: (_cellValue: unknown, row: unknown) => {
          const originalPrice = Number(row.price_usd ?? 0);
          const currentPrice = dirtyPrices.has(row.id)
            ? dirtyPrices.get(row.id)!
            : originalPrice;
          const currencySymbol = getCurrencySymbol(row.currency_code || "USD");

          return (
            <div className="flex items-center justify-end gap-1">
              <span className="text-xs text-slate-500">{currencySymbol}</span>
              <input
                type="number"
                min={0}
                step={0.01}
                value={currentPrice}
                onChange={(e) => handlePriceChange(row.id, originalPrice, e.target.value)}
                className="w-28 input-field text-right"
                disabled={isSaving}
              />
            </div>
          );
        },
      },
    ],
    [dirtyPrices, isSaving]
  );

  if (isAuthLoading) {
    return null;
  }

  return (
    <>
      <AdminActiveTab />
      <AdminPageShell
        title="Edit Pricing"
        actions={
          <ModernButton
            type="button"
            variant="outline"
            className="flex items-center gap-2"
            onClick={() => navigate("/admin-dashboard/pricing")}
            isDisabled={isSaving}
          >
            <ArrowLeft size={16} />
            Back to Pricing
          </ModernButton>
        }
        contentClassName="space-y-6"
      >
        {/* Filter Bar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-4">
          <div className="w-full sm:w-auto">
            <label className="mb-2 block text-sm font-medium text-slate-600">Region</label>
            <select
              value={selectedRegion}
              onChange={(e) => handleRegionChange(e.target.value)}
              className="w-full min-w-[220px] rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 transition focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-100 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isRegionsFetching}
            >
              <option value="">All Regions</option>
              {isRegionsFetching ? (
                <option value="" disabled>
                  Loading regions...
                </option>
              ) : (
                regionsList.map((region: unknown) => (
                  <option key={region.code} value={region.code}>
                    {getRegionOptionLabel(region)}
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="w-full sm:w-auto">
            <label className="mb-2 block text-sm font-medium text-slate-600">Availability Zone</label>
            <select
              value={selectedAZ}
              onChange={(e) => handleAZChange(e.target.value)}
              className="w-full min-w-[220px] rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 transition focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-100 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={!selectedRegion || isAZsFetching}
            >
              <option value="">All AZs</option>
              {isAZsFetching ? (
                <option value="" disabled>
                  Loading availability zones...
                </option>
              ) : (
                azList.map((az: unknown) => (
                  <option key={az.code} value={az.code}>
                    {az.name || az.code} ({az.provider})
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="w-full sm:w-auto">
            <label className="mb-2 block text-sm font-medium text-slate-600">Category</label>
            <select
              value={selectedType}
              onChange={(e) => handleTypeChange(e.target.value)}
              className="w-full min-w-[220px] rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 transition focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-100"
            >
              <option value="">All Categories</option>
              {productTypes.map((type: { value: string; label: string }) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Table */}
        <ModernCard>
          {isPricingFetching && pricingRows.length === 0 ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
              <span className="ml-3 text-sm text-slate-500">Loading pricing data...</span>
            </div>
          ) : pricingRows.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-500/10 text-primary-500">
                <Package className="h-5 w-5" />
              </span>
              <p className="mt-4 text-sm font-semibold text-slate-700">No pricing entries found</p>
              <p className="mt-1 text-xs text-slate-500">
                Adjust your filters to find pricing data to edit.
              </p>
            </div>
          ) : (
            <ModernTable
              data={pricingRows}
              columns={columns as Column<unknown>[]}
              searchable={false}
              paginated={true}
              pageSize={25}
            />
          )}
        </ModernCard>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <ModernButton
            type="button"
            variant="outline"
            onClick={handleReset}
            isDisabled={dirtyCount === 0 || isSaving}
            className="flex items-center gap-2"
          >
            <RotateCcw size={16} />
            Reset
          </ModernButton>

          <ModernButton
            type="button"
            onClick={handleSave}
            isDisabled={dirtyCount === 0 || isSaving}
            className="flex items-center gap-2"
          >
            {isSaving ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Save size={16} />
            )}
            {isSaving ? "Saving..." : `Save Changes (${dirtyCount})`}
          </ModernButton>
        </div>
      </AdminPageShell>
    </>
  );
};

export default AdminPricingEdit;
