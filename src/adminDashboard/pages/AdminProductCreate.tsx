// @ts-nocheck
import React, { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, Plus, Trash2, Upload } from "lucide-react";
// @ts-ignore
import Papa from "papaparse";
import { read as readWorkbook, utils as xlsxUtils } from "xlsx";
import AdminHeadbar from "../components/adminHeadbar";
import AdminSidebar from "../components/AdminSidebar";
import AdminActiveTab from "../components/adminActiveTab";
import AdminPageShell from "../components/AdminPageShell";
import { ModernCard } from "../../shared/components/ui";
import { ModernButton } from "../../shared/components/ui";
// @ts-ignore
import SelectableInput from "../../shared/components/ui/SelectableInput";
import { useFetchRegions } from "../../hooks/adminHooks/regionHooks";
import { useCreateProducts } from "../../hooks/adminHooks/adminProductHooks";
import ToastUtils from "../../utils/toastUtil";
// @ts-ignore
import useAuthRedirect from "../../utils/adminAuthRedirect";
import { useProductForm } from "../../hooks/adminHooks/useProductForm";
import ModernTable from "../../shared/components/ui/ModernTable";
import {
  ProductEntry,
  OBJECT_STORAGE_TYPE,
  productTypes,
  mapRowToEntry,
} from "../../utils/productImportUtils";

const AdminProductCreate: React.FC = () => {
  const navigate = useNavigate();
  const { isLoading: isAuthLoading } = useAuthRedirect();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);

  const { isFetching: isRegionsFetching, data: regions } = useFetchRegions();
  const { mutate: createProducts, isPending: isCreating } = useCreateProducts();

  const regionLookup = useMemo(() => {
    if (!regions) return {};
    return regions.reduce((acc: Record<string, any>, region: any) => {
      acc[region.code] = region;
      return acc;
    }, {});
  }, [regions]);

  const {
    entries,
    setEntries,
    addEntry,
    removeEntry,
    handleEntryFieldChange,
    handleProductSearchChange,
    handleProductSelect,
    validateEntries,
  } = useProductForm(regionLookup);

  const isSubmitting = isCreating || isAuthLoading || isImporting;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!validateEntries()) {
      return;
    }

    const payload = {
      products: entries.map((entry: any) => ({
        name: entry.name.trim(),
        productable_type: entry.productable_type,
        productable_id: Number(entry.productable_id),
        provider: entry.provider,
        region: entry.region,
        price: Number(entry.price),
      })),
    };

    createProducts(payload, {
      onSuccess: () => {
        ToastUtils.success("Products added successfully!");
        navigate("/admin-dashboard/products");
      },
      onError: (error: any) => {
        const message =
          error?.response?.data?.message || error?.message || "Failed to add products.";
        ToastUtils.error(message);
      },
    });
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const extension = file.name.split(".").pop()?.toLowerCase();
    setIsImporting(true);

    try {
      let rows: any[] = [];
      if (extension === "csv") {
        rows = await new Promise((resolve, reject) => {
          Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results: any) => resolve(results.data),
            error: (error: any) => reject(error),
          });
        });
      } else if (extension === "xlsx" || extension === "xls") {
        const data = await file.arrayBuffer();
        const workbook = readWorkbook(data);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        rows = xlsxUtils.sheet_to_json(sheet);
      } else {
        ToastUtils.error("Unsupported file type. Please upload CSV or Excel.");
        setIsImporting(false);
        return;
      }

      const nextEntries: ProductEntry[] = [];
      const errors: any[] = [];

      rows.forEach((row, index) => {
        const result = mapRowToEntry(row, index, regionLookup);
        if (result.error) {
          errors.push(result.error);
        } else if (result.entry) {
          nextEntries.push(result.entry);
        }
      });

      if (errors.length > 0) {
        ToastUtils.error(
          `Import completed with ${errors.length} errors. Check console for details.`
        );
        console.table(errors);
      }

      if (nextEntries.length > 0) {
        setEntries(nextEntries);
        ToastUtils.success("Products imported successfully!");
      } else {
        ToastUtils.warning("No valid rows found in the file.");
      }
    } catch (error) {
      console.error("Failed to import products:", error);
      ToastUtils.error("Failed to import products. Please try again.");
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const columns = useMemo(
    () => [
      {
        key: "index",
        header: "#",
        render: (_: any, __: any, index: number) => (
          <span className="text-gray-500">{index + 1}</span>
        ),
        className: "w-12",
      },
      {
        key: "name",
        header: "Product Name",
        render: (_: any, entry: ProductEntry, index: number) => (
          <div>
            <input
              type="text"
              value={entry.name}
              onChange={(e) => handleEntryFieldChange(index, "name", e.target.value)}
              placeholder="Product name"
              className={`w-full input-field ${entry.errors.name ? "border-red-500" : "border-gray-300"}`}
              disabled={isSubmitting}
            />
            {entry.errors.name && <p className="text-red-500 text-xs mt-1">{entry.errors.name}</p>}
          </div>
        ),
      },
      {
        key: "region",
        header: "Region",
        render: (_: any, entry: ProductEntry, index: number) => (
          <div>
            <select
              value={entry.region}
              onChange={(e) => handleEntryFieldChange(index, "region", e.target.value)}
              className={`w-full input-field ${entry.errors.region ? "border-red-500" : "border-gray-300"}`}
              disabled={isSubmitting || isRegionsFetching}
            >
              <option value="">{isRegionsFetching ? "Loading..." : "Select region"}</option>
              {regions?.map((region: any) => (
                <option key={region.code} value={region.code}>
                  {region.name}
                </option>
              ))}
            </select>
            {entry.errors.region && (
              <p className="text-red-500 text-xs mt-1">{entry.errors.region}</p>
            )}
            <p className="text-xs text-gray-400 mt-1">
              Provider: {entry.provider || "Auto-detected"}
            </p>
          </div>
        ),
      },
      {
        key: "type",
        header: "Type",
        render: (_: any, entry: ProductEntry, index: number) => (
          <div>
            <select
              value={entry.productable_type}
              onChange={(e) => handleEntryFieldChange(index, "productable_type", e.target.value)}
              className={`w-full input-field ${entry.errors.productable_type ? "border-red-500" : "border-gray-300"}`}
              disabled={isSubmitting}
            >
              <option value="">Select type</option>
              {productTypes.map((type: any) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            {entry.errors.productable_type && (
              <p className="text-red-500 text-xs mt-1">{entry.errors.productable_type}</p>
            )}
          </div>
        ),
      },
      {
        key: "product",
        header: "Product",
        render: (_: any, entry: ProductEntry, index: number) => {
          const isObjectStorageRow = entry.productable_type === OBJECT_STORAGE_TYPE;
          const isProductDisabled =
            isObjectStorageRow ||
            isSubmitting ||
            entry.loadingOptions ||
            !entry.region ||
            !entry.productable_type;
          const productPlaceholder =
            !entry.region || !entry.productable_type
              ? "Select region & type first"
              : entry.loadingOptions
                ? "Loading products..."
                : "Search product";

          if (isObjectStorageRow) {
            return (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Quota (GiB)
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={entry.objectStorageQuota}
                    onChange={(e) =>
                      handleEntryFieldChange(index, "objectStorageQuota", e.target.value)
                    }
                    className={`w-full input-field ${entry.errors.objectStorageQuota ? "border-red-500" : "border-gray-300"}`}
                    disabled={isSubmitting}
                  />
                  {entry.errors.objectStorageQuota && (
                    <p className="text-red-500 text-xs mt-1">{entry.errors.objectStorageQuota}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Price per GiB (USD)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.0001"
                    value={entry.objectStoragePricePerGb}
                    onChange={(e) =>
                      handleEntryFieldChange(index, "objectStoragePricePerGb", e.target.value)
                    }
                    className={`w-full input-field ${entry.errors.objectStoragePricePerGb ? "border-red-500" : "border-gray-300"}`}
                    disabled={isSubmitting}
                  />
                  {entry.errors.objectStoragePricePerGb && (
                    <p className="text-red-500 text-xs mt-1">
                      {entry.errors.objectStoragePricePerGb}
                    </p>
                  )}
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                  <div className="flex items-center justify-between">
                    <span>Total price</span>
                    <span className="font-semibold text-slate-900">
                      {entry.price ? `$${Number(entry.price).toFixed(4)}` : "—"}
                    </span>
                  </div>
                  <p className="mt-1 text-[10px] text-slate-500">
                    Calculated as quota × price per GiB.
                  </p>
                </div>
              </div>
            );
          }

          return (
            <div>
              <SelectableInput
                options={entry.options as any}
                value={entry.productable_id}
                searchValue={entry.productSearch}
                onSearchChange={(val: string) => handleProductSearchChange(index, val) as any}
                onSelect={(option: any) => handleProductSelect(index, option) as any}
                placeholder={productPlaceholder}
                disabled={isProductDisabled}
                isLoading={entry.loadingOptions}
                emptyMessage="No products found"
                hasError={Boolean(entry.errors.productable_id)}
              />
              {entry.errors.productable_id && (
                <p className="text-red-500 text-xs mt-1">{entry.errors.productable_id}</p>
              )}
            </div>
          );
        },
      },
      {
        key: "price",
        header: "Price (USD)",
        render: (_: any, entry: ProductEntry, index: number) => {
          const isObjectStorageRow = entry.productable_type === OBJECT_STORAGE_TYPE;
          return (
            <div>
              <input
                type="number"
                min="0"
                step="0.01"
                value={entry.price}
                onChange={(e) => handleEntryFieldChange(index, "price", e.target.value)}
                placeholder="0.00"
                className={`w-full input-field ${entry.errors.price ? "border-red-500" : "border-gray-300"}`}
                disabled={isSubmitting || isObjectStorageRow}
              />
              {entry.errors.price && (
                <p className="text-red-500 text-xs mt-1">{entry.errors.price}</p>
              )}
            </div>
          );
        },
      },
      {
        key: "actions",
        header: "Actions",
        render: (_: any, __: any, index: number) => (
          <div className="text-right">
            {entries.length > 1 && (
              <ModernButton
                variant="ghost"
                size="sm"
                onClick={() => removeEntry(index)}
                type="button"
                isDisabled={isSubmitting}
                className="text-red-600"
              >
                <Trash2 className="w-4 h-4" />
              </ModernButton>
            )}
          </div>
        ),
      },
    ],
    [
      entries,
      isSubmitting,
      isRegionsFetching,
      regions,
      handleEntryFieldChange,
      handleProductSearchChange,
      handleProductSelect,
      removeEntry,
    ]
  );

  if (isAuthLoading) {
    return null;
  }

  return (
    <>
      <AdminHeadbar />
      <AdminSidebar />
      <AdminActiveTab />
      <AdminPageShell
        title="Add Products"
        description="Capture multiple products in one submission. Region determines the provider automatically and product options update based on the selected type."
        actions={
          <ModernButton
            type="button"
            variant="outline"
            className="flex items-center gap-2"
            onClick={() => navigate("/admin-dashboard/products")}
            isDisabled={isSubmitting}
          >
            <ArrowLeft size={16} />
            Back to Products
          </ModernButton>
        }
        contentClassName="space-y-6"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <ModernCard>
            <ModernTable
              data={entries}
              columns={columns as any}
              className="hidden md:block"
              searchable={false}
              paginated={false}
            />

            {/* Mobile View (simplified for now, could also use a separate component) */}
            <div className="md:hidden space-y-4">
              <p className="text-sm text-gray-500 italic">
                Mobile view not fully optimized in this refactor. Please use desktop.
              </p>
            </div>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-gray-500">
                Region automatically determines the provider. Select a type to load available
                products.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-3">
                <ModernButton
                  type="button"
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                  onClick={handleImportClick}
                  isDisabled={isSubmitting}
                >
                  {isImporting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  {isImporting ? "Importing..." : "Import CSV/Excel"}
                </ModernButton>
                <ModernButton
                  type="button"
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                  onClick={addEntry}
                  isDisabled={isSubmitting}
                >
                  <Plus className="w-4 h-4" />
                  Add Row
                </ModernButton>
              </div>
            </div>
          </ModernCard>

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv, .xlsx, .xls"
            className="hidden"
            onChange={handleFileChange}
          />

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`
                px-6 py-2 rounded-lg text-white font-medium transition-all duration-200
                ${
                  isSubmitting
                    ? "bg-blue-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-blue-500/30"
                }
              `}
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing...</span>
                </div>
              ) : (
                "Save Products"
              )}
            </button>
          </div>
        </form>
      </AdminPageShell>
    </>
  );
};

export default AdminProductCreate;
