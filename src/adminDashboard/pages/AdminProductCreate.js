import React, { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, Plus, Trash2, Upload } from "lucide-react";
import Papa from "papaparse";
import { read as readWorkbook, utils as xlsxUtils } from "xlsx";
import AdminHeadbar from "../components/adminHeadbar";
import AdminSidebar from "../components/adminSidebar";
import AdminActiveTab from "../components/adminActiveTab";
import ModernCard from "../components/ModernCard";
import ModernButton from "../components/ModernButton";
import { designTokens } from "../../styles/designTokens";
import { useFetchRegions } from "../../hooks/adminHooks/regionHooks";
import { useCreateProducts } from "../../hooks/adminHooks/adminProductHooks";
import ToastUtils from "../../utils/toastUtil";
import useAuthRedirect from "../../utils/adminAuthRedirect";
import silentApi from "../../index/admin/silent";

const productTypes = [
  { value: "compute_instance", label: "Compute Instance" },
  { value: "cross_connect", label: "Cross Connect" },
  { value: "os_image", label: "OS Image" },
  { value: "bandwidth", label: "Bandwidth" },
  { value: "ip", label: "Floating IP" },
  { value: "volume_type", label: "Volume Type" },
];

const typeToEndpoint = {
  compute_instance: "/product-compute-instance",
  cross_connect: "/product-cross-connect",
  os_image: "/product-os-image",
  bandwidth: "/product-bandwidth",
  ip: "/product-floating-ip",
  volume_type: "/product-volume-type",
};

const generateEntryId = () =>
  `entry-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const createEmptyEntry = () => ({
  id: generateEntryId(),
  name: "",
  productable_type: "",
  productable_id: "",
  provider: "",
  region: "",
  price: "",
  options: [],
  loadingOptions: false,
  errors: {},
});

const AdminProductCreate = () => {
  const navigate = useNavigate();
  const { isLoading } = useAuthRedirect();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [entries, setEntries] = useState([createEmptyEntry()]);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef(null);

  const { isFetching: isRegionsFetching, data: regions } = useFetchRegions();
  const { mutate: createProducts, isPending } = useCreateProducts();

  const regionLookup = useMemo(() => {
    if (!regions) return {};
    return regions.reduce((acc, region) => {
      acc[region.code] = region;
      return acc;
    }, {});
  }, [regions]);

  const allowedTypes = useMemo(
    () => new Set(productTypes.map((type) => type.value)),
    []
  );

  const normalizeType = (raw) => {
    if (raw === null || raw === undefined) return "";
    const value = String(raw).trim().toLowerCase();
    const aliases = {
      "compute instance": "compute_instance",
      "compute": "compute_instance",
      "cross connect": "cross_connect",
      "cross-connect": "cross_connect",
      "os image": "os_image",
      "operating system": "os_image",
      bandwidth: "bandwidth",
      "floating ip": "ip",
      "floating_ip": "ip",
      ip: "ip",
      "volume type": "volume_type",
      volume: "volume_type",
    };

    if (aliases[value]) {
      return aliases[value];
    }

    const normalized = value.replace(/[-\s]+/g, "_");
    return normalized;
  };

  const mapRowToEntry = (row, rowIndex, regionMap) => {
    const rowLabel = rowIndex + 2; // account for header row

    const name = coerceTrimmedString(
      row.name ?? row.product_name ?? row.Name ?? row["Product Name"]
    );
    const region = coerceTrimmedString(
      row.region ?? row.region_code ?? row.Region ?? row["Region"]
    );
    const rawType = row.productable_type ?? row.type ?? row.ProductType ?? row["Product Type"];
    const productableType = normalizeType(rawType);
    const rawProductId = row.productable_id ?? row.product_id ?? row.ProductID ?? row["Product ID"];
    const productableIdNumber = Number(rawProductId);
    const rawPrice = row.price ?? row.price_usd ?? row.Price ?? row["Price"] ?? row["priceUSD"];
    const priceNumber = Number(rawPrice);

    if (!name) {
      return { error: { row: rowLabel, message: "Missing product name." } };
    }

    if (!region) {
      return { error: { row: rowLabel, message: "Missing region." } };
    }

    const regionInfo = regionMap[region];
    if (!regionInfo) {
      return {
        error: {
          row: rowLabel,
          message: `Unknown region '${region}'.`,
        },
      };
    }

    if (!productableType || !allowedTypes.has(productableType)) {
      return {
        error: {
          row: rowLabel,
          message: "Invalid or missing product type.",
        },
      };
    }

    if (!Number.isFinite(productableIdNumber) || productableIdNumber <= 0) {
      return {
        error: {
          row: rowLabel,
          message: "Product ID must be a positive number.",
        },
      };
    }

    if (!Number.isFinite(priceNumber) || priceNumber < 0) {
      return {
        error: {
          row: rowLabel,
          message: "Price must be a positive number.",
        },
      };
    }

    const entry = {
      ...createEmptyEntry(),
      name,
      productable_type: productableType,
      productable_id: String(productableIdNumber),
      provider: regionInfo.provider ?? "",
      region,
      price: priceNumber.toString(),
    };

    return { entry };
  };

  const toggleMobileMenu = () => setIsMobileMenuOpen((open) => !open);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const updateEntry = (index, updater) => {
    setEntries((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...updater };
      return next;
    });
  };

  const loadProductOptions = async (index, regionCode, type) => {
    const endpoint = typeToEndpoint[type];
    if (!endpoint || !regionCode || !type) {
      return;
    }

    updateEntry(index, { loadingOptions: true, options: [], productable_id: "" });

    try {
      const params = new URLSearchParams();
      params.append("country", "USD");
      params.append("region", regionCode);

      const response = await silentApi(
        "GET",
        `${endpoint}?${params.toString()}`
      );
      const options = response?.data || [];

      updateEntry(index, { options, loadingOptions: false });
    } catch (error) {
      console.error("Failed to load product options:", error);
      ToastUtils.error("Unable to load products for the selected type/region.");
      updateEntry(index, { loadingOptions: false, options: [] });
    }
  };

  const handleImportClick = () => {
    if (isImporting || isPending || isLoading) return;
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setIsImporting(true);

    try {
      const extension = file.name.split(".").pop()?.toLowerCase();

      let rows = [];
      if (extension === "csv") {
        rows = await parseCsvFile(file);
      } else if (extension === "xlsx" || extension === "xls") {
        rows = await parseExcelFile(file);
      } else {
        ToastUtils.error("Unsupported file type. Please upload a CSV or Excel file.");
        return;
      }

      const nonEmptyRows = rows.filter((row) =>
        Object.values(row || {}).some((value) =>
          value !== null && value !== undefined && String(value).trim() !== ""
        )
      );

      if (!nonEmptyRows.length) {
        ToastUtils.error("The uploaded file does not contain any rows to import.");
        return;
      }

      const parseErrors = [];
      const newEntries = [];
      const existingLength = entries.length;

      nonEmptyRows.forEach((row, rowIndex) => {
        const mapped = mapRowToEntry(row, rowIndex, regionLookup);
        if (mapped.error) {
          parseErrors.push(mapped.error);
        } else if (mapped.entry) {
          newEntries.push(mapped.entry);
        }
      });

      if (parseErrors.length) {
        const summary = parseErrors
          .slice(0, 5)
          .map((error) => `Row ${error.row}: ${error.message}`)
          .join("\n");
        const more = parseErrors.length > 5 ? "\n..." : "";
        ToastUtils.error(`Some rows could not be imported:\n${summary}${more}`);
      }

      if (!newEntries.length) {
        if (!parseErrors.length) {
          ToastUtils.error("No valid rows were found in the uploaded file.");
        }
        return;
      }

      setEntries((prev) => [...prev, ...newEntries]);

      newEntries.forEach((entry, idx) => {
        const targetIndex = existingLength + idx;
        setTimeout(() => {
          loadProductOptions(targetIndex, entry.region, entry.productable_type);
        }, 0);
      });

      ToastUtils.success(`Imported ${newEntries.length} product${newEntries.length > 1 ? "s" : ""}.`);
    } catch (error) {
      console.error("Failed to import products:", error);
      ToastUtils.error("Failed to import products. Please verify the file and try again.");
    } finally {
      setIsImporting(false);
      if (event.target) {
        event.target.value = "";
      }
    }
  };

  const handleEntryFieldChange = (index, field, value) => {
    const entry = entries[index];
    if (!entry) return;

    const nextRegion =
      field === "region" ? value : entry.region;
    const nextType =
      field === "productable_type" ? value : entry.productable_type;

    setEntries((prev) => {
      const next = [...prev];
      const current = { ...next[index] };
      current.errors = { ...current.errors, [field]: null };

      if (field === "name") {
        current.name = value;
      } else if (field === "region") {
        current.region = value;
        const regionInfo = regionLookup[value];
        current.provider = regionInfo?.provider ?? "";
        current.productable_id = "";
        current.options = [];
      } else if (field === "productable_type") {
        current.productable_type = value;
        current.productable_id = "";
        current.options = [];
      } else if (field === "productable_id") {
        current.productable_id = value;

        if (!current.name) {
          const option = current.options.find(
            (opt) => String(getOptionValue(opt)) === String(value)
          );
          if (option) {
            current.name = getOptionLabel(option);
          }
        }
      } else if (field === "price") {
        current.price = value;
      }

      next[index] = current;
      return next;
    });

    if (
      (field === "region" || field === "productable_type") &&
      nextRegion &&
      nextType
    ) {
      loadProductOptions(index, nextRegion, nextType);
    }
  };

  const addEntry = () => {
    setEntries((prev) => [...prev, createEmptyEntry()]);
  };

  const removeEntry = (index) => {
    setEntries((prev) => prev.filter((_, idx) => idx !== index));
  };

  const validateEntries = () => {
    let hasErrors = false;

    const next = entries.map((entry) => {
      const entryErrors = {};

      if (!entry.name.trim()) entryErrors.name = "Name is required";
      if (!entry.region) entryErrors.region = "Region is required";
      if (!entry.productable_type)
        entryErrors.productable_type = "Product type is required";
      if (!entry.productable_id)
        entryErrors.productable_id = "Product selection is required";
      const priceValue = Number(entry.price);
      if (!Number.isFinite(priceValue) || priceValue < 0) {
        entryErrors.price = "Valid price is required";
      }

      if (Object.keys(entryErrors).length > 0) {
        hasErrors = true;
      }

      return { ...entry, errors: entryErrors };
    });

    setEntries(next);

    if (hasErrors) {
      ToastUtils.error("Please fix the highlighted issues before submitting.");
    }

    return !hasErrors;
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!validateEntries()) {
      return;
    }

    const payload = {
      products: entries.map((entry) => ({
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
      onError: (error) => {
        const message =
          error?.response?.data?.message ||
          error?.message ||
          "Failed to add products.";
        ToastUtils.error(message);
      },
    });
  };

  const isSubmitting = isPending || isLoading || isImporting;

  if (isLoading) {
    return null;
    }

  return (
    <>
      <AdminHeadbar onMenuClick={toggleMobileMenu} />
      <AdminSidebar
        isMobileMenuOpen={isMobileMenuOpen}
        onCloseMobileMenu={closeMobileMenu}
      />
      <AdminActiveTab />
      <main
        className="absolute top-[126px] left-0 md:left-20 lg:left-[20%] font-Outfit w-full md:w-[calc(100%-5rem)] lg:w-[80%] min-h-full p-6 md:p-8"
        style={{ backgroundColor: designTokens.colors.neutral[25] }}
      >
        <div className="space-y-6 max-w-5xl">
          <ModernButton
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
            onClick={() => navigate("/admin-dashboard/products")}
            isDisabled={isSubmitting}
          >
            <ArrowLeft size={16} />
            Back to Products
          </ModernButton>

          <div className="space-y-2">
            <h1
              className="text-2xl font-bold"
              style={{ color: designTokens.colors.neutral[900] }}
            >
              Add Products
            </h1>
            <p
              className="text-sm"
              style={{ color: designTokens.colors.neutral[600] }}
            >
              Capture multiple products in one submission. Region determines the
              provider automatically and product options update based on the
              selected type.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <ModernCard>
              <div className="overflow-x-auto">
                <table className="min-w-[960px] w-full table-auto">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">#</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                        Product Name<span className="text-red-500">*</span>
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                        Region<span className="text-red-500">*</span>
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                        Type<span className="text-red-500">*</span>
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                        Product<span className="text-red-500">*</span>
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                        Price (USD)<span className="text-red-500">*</span>
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {entries.map((entry, index) => (
                      <tr key={entry.id} className="align-top">
                        <td className="px-4 py-3 text-sm text-gray-500">{index + 1}</td>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={entry.name}
                            onChange={(e) =>
                              handleEntryFieldChange(index, "name", e.target.value)
                            }
                            placeholder="Product name"
                            className={`w-full input-field ${
                              entry.errors.name ? "border-red-500" : "border-gray-300"
                            }`}
                            disabled={isSubmitting}
                          />
                          {entry.errors.name && (
                            <p className="text-red-500 text-xs mt-1">{entry.errors.name}</p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={entry.region}
                            onChange={(e) =>
                              handleEntryFieldChange(index, "region", e.target.value)
                            }
                            className={`w-full input-field ${
                              entry.errors.region
                                ? "border-red-500"
                                : "border-gray-300"
                            }`}
                            disabled={isSubmitting || isRegionsFetching}
                          >
                            <option value="">
                              {isRegionsFetching ? "Loading regions..." : "Select region"}
                            </option>
                            {regions?.map((region) => (
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
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={entry.productable_type}
                            onChange={(e) =>
                              handleEntryFieldChange(
                                index,
                                "productable_type",
                                e.target.value
                              )
                            }
                            className={`w-full input-field ${
                              entry.errors.productable_type
                                ? "border-red-500"
                                : "border-gray-300"
                            }`}
                            disabled={isSubmitting}
                          >
                            <option value="">Select type</option>
                            {productTypes.map((type) => (
                              <option key={type.value} value={type.value}>
                                {type.label}
                              </option>
                            ))}
                          </select>
                          {entry.errors.productable_type && (
                            <p className="text-red-500 text-xs mt-1">
                              {entry.errors.productable_type}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={entry.productable_id}
                            onChange={(e) =>
                              handleEntryFieldChange(
                                index,
                                "productable_id",
                                e.target.value
                              )
                            }
                            className={`w-full input-field ${
                              entry.errors.productable_id
                                ? "border-red-500"
                                : "border-gray-300"
                            }`}
                            disabled={
                              isSubmitting ||
                              entry.loadingOptions ||
                              !entry.region ||
                              !entry.productable_type
                            }
                          >
                            <option value="">
                              {!entry.region || !entry.productable_type
                                ? "Select region & type"
                                : entry.loadingOptions
                                ? "Loading options..."
                                : "Select product"}
                            </option>
                            {entry.options.map((option) => {
                              const value = getOptionValue(option);
                              const label = getOptionLabel(option);
                              return (
                                <option key={`${entry.id}-${value}`} value={value}>
                                  {label}
                                </option>
                              );
                            })}
                          </select>
                          {entry.errors.productable_id && (
                            <p className="text-red-500 text-xs mt-1">
                              {entry.errors.productable_id}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={entry.price}
                            onChange={(e) =>
                              handleEntryFieldChange(index, "price", e.target.value)
                            }
                            placeholder="0.00"
                            className={`w-full input-field ${
                              entry.errors.price ? "border-red-500" : "border-gray-300"
                            }`}
                            disabled={isSubmitting}
                          />
                          {entry.errors.price && (
                            <p className="text-red-500 text-xs mt-1">
                              {entry.errors.price}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
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
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-gray-500">
                  Region automatically determines the provider. Select a type to load available products.
                </p>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-3">
                  <ModernButton
                    type="button"
                    variant="outline"
                    className="flex items-center gap-2"
                    onClick={handleImportClick}
                    isDisabled={isSubmitting}
                  >
                    <Upload className="w-4 h-4" />
                    Import CSV/Excel
                  </ModernButton>
                  <ModernButton
                    type="button"
                    variant="outline"
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
              accept=".csv,.xlsx,.xls"
              className="hidden"
              onChange={handleFileChange}
            />

            <div className="flex items-center justify-end gap-3">
              <ModernButton
                variant="outline"
                type="button"
                onClick={() => navigate("/admin-dashboard/products")}
                isDisabled={isSubmitting}
              >
                Cancel
              </ModernButton>
              <button
                type="submit"
                className="modern-button modern-button--primary modern-button--sm flex items-center gap-2"
                disabled={isSubmitting}
                aria-busy={isSubmitting}
                style={{
                  fontFamily: 'Outfit, Inter, "SF Pro Display", system-ui, sans-serif',
                  fontWeight: 600,
                  borderRadius: '12px',
                  transition: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  outline: 'none',
                  textDecoration: 'none',
                  padding: '8px 12px',
                  fontSize: '14px',
                  lineHeight: '20px',
                  minHeight: '32px',
                  opacity: isSubmitting ? 0.6 : 1,
                  pointerEvents: isSubmitting ? 'none' : 'auto',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  backgroundColor: '#06b6d4',
                  color: '#ffffff',
                  border: '1px solid transparent',
                  boxShadow: '0 10px 18px -10px #06b6d4',
                  '--btn-bg': '#06b6d4',
                  '--btn-color': '#ffffff',
                  '--btn-border': '1px solid transparent',
                  '--btn-shadow': '0 10px 18px -10px #06b6d4',
                  '--btn-hover-bg': '#0891b2',
                  '--btn-hover-shadow': '0 14px 24px -12px #06b6d4',
                  '--btn-active-bg': '#0e7490',
                }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>Save Products</>
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
    </>
  );
};

const parseCsvFile = (file) =>
  new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        resolve(results.data ?? []);
      },
      error: (error) => reject(error),
    });
  });

const parseExcelFile = async (file) => {
  const buffer = await file.arrayBuffer();
  const workbook = readWorkbook(buffer, { type: "array" });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  if (!worksheet) {
    return [];
  }
  return xlsxUtils.sheet_to_json(worksheet, { defval: "" });
};

const coerceTrimmedString = (value) => {
  if (value === null || value === undefined) return "";
  return String(value).trim();
};

function getOptionValue(option) {
  if (option?.id !== undefined) return option.id;
  if (option?.productable_id !== undefined) return option.productable_id;
  if (option?.product?.productable_id !== undefined) {
    return option.product.productable_id;
  }
  if (option?.product?.id !== undefined) return option.product.id;
  return option?.value ?? "";
}

function getOptionLabel(option) {
  return (
    option?.name ??
    option?.product?.name ??
    option?.label ??
    "Unnamed Product"
  );
}

export default AdminProductCreate;
