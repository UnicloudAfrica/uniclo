import React, { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, Plus, Trash2, Upload } from "lucide-react";
import Papa from "papaparse";
import { read as readWorkbook, utils as xlsxUtils } from "xlsx";
import AdminHeadbar from "../components/adminHeadbar";
import AdminSidebar from "../components/adminSidebar";
import AdminActiveTab from "../components/adminActiveTab";
import AdminPageShell from "../components/AdminPageShell";
import ModernCard from "../components/ModernCard";
import ModernButton from "../components/ModernButton";
import SelectableInput from "../components/SelectableInput";
import { useFetchRegions } from "../../hooks/adminHooks/regionHooks";
import { useCreateProducts } from "../../hooks/adminHooks/adminProductHooks";
import ToastUtils from "../../utils/toastUtil";
import useAuthRedirect from "../../utils/adminAuthRedirect";
import silentApi from "../../index/admin/silent";

const OBJECT_STORAGE_TYPE = "object_storage_configuration";
const DEFAULT_OBJECT_STORAGE_PRICE_PER_GB = 0.16;

const objectStorageNameForQuota = (quota) =>
  quota === 1 ? "Object Storage (per GiB)" : `Object Storage ${quota} GiB`;

const productTypes = [
  { value: "compute_instance", label: "Compute Instance" },
  { value: "cross_connect", label: "Cross Connect" },
  { value: "os_image", label: "OS Image" },
  { value: "bandwidth", label: "Bandwidth" },
  { value: "ip", label: "Floating IP" },
  { value: OBJECT_STORAGE_TYPE, label: "Object Storage" },
  { value: "volume_type", label: "Volume Type" },
];

const typeToEndpoint = {
  compute_instance: "/product-compute-instance",
  cross_connect: "/product-cross-connect",
  os_image: "/product-os-image",
  bandwidth: "/product-bandwidth",
  ip: "/product-floating-ip",
  [OBJECT_STORAGE_TYPE]: null,
  volume_type: "/product-volume-type",
};

const generateEntryId = () =>
  `entry-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const createEmptyEntry = () => ({
  id: generateEntryId(),
  name: "",
  productable_type: "",
  productable_id: "",
  productSearch: "",
  provider: "",
  region: "",
  price: "",
  objectStorageQuota: "1",
  objectStoragePricePerGb: DEFAULT_OBJECT_STORAGE_PRICE_PER_GB.toString(),
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
    compute: "compute_instance",
    "cross connect": "cross_connect",
    "cross-connect": "cross_connect",
      "os image": "os_image",
      "operating system": "os_image",
      bandwidth: "bandwidth",
    "floating ip": "ip",
    floating_ip: "ip",
    ip: "ip",
    "object storage": OBJECT_STORAGE_TYPE,
    object_storage: OBJECT_STORAGE_TYPE,
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

    if (productableType === OBJECT_STORAGE_TYPE) {
      const quota = Number.isFinite(productableIdNumber) && productableIdNumber > 0
        ? Math.floor(productableIdNumber)
        : 1;
      const resolvedPrice = Number.isFinite(priceNumber) && priceNumber > 0
        ? Number(priceNumber.toFixed(4))
        : Number((quota * DEFAULT_OBJECT_STORAGE_PRICE_PER_GB).toFixed(4));
      const pricePerGb =
        quota > 0 && resolvedPrice > 0
          ? Number((resolvedPrice / quota).toFixed(4))
          : DEFAULT_OBJECT_STORAGE_PRICE_PER_GB;

      const entry = {
        ...createEmptyEntry(),
        name: name || objectStorageNameForQuota(quota),
        productable_type: productableType,
        productable_id: String(quota),
        productSearch: "",
        provider: regionInfo.provider ?? "",
        region,
        price: resolvedPrice.toFixed(4),
        objectStorageQuota: String(quota),
        objectStoragePricePerGb: pricePerGb.toString(),
      };

      return { entry };
    }

    const entry = {
      ...createEmptyEntry(),
      name,
      productable_type: productableType,
      productable_id: String(productableIdNumber),
      productSearch: "",
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
      if (index < 0 || index >= prev.length) {
        return prev;
      }
      const next = [...prev];
      const current = next[index];
      next[index] =
        typeof updater === "function" ? updater(current) : { ...current, ...updater };
      return next;
    });
  };

  const loadProductOptions = async (index, regionCode, type) => {
    const endpoint = typeToEndpoint[type];
    if (!endpoint || !regionCode || !type) {
      return;
    }

    updateEntry(index, (prev) => ({
      ...prev,
      loadingOptions: true,
      options: [],
      productable_id: "",
      productSearch: "",
    }));

    try {
      const params = new URLSearchParams();
      params.append("country", "USD");
      params.append("region", regionCode);

      const response = await silentApi(
        "GET",
        `${endpoint}?${params.toString()}`
      );

      const records = Array.isArray(response?.data)
        ? response.data
        : Array.isArray(response?.message)
        ? response.message
        : [];

      const mappedOptions = records.map((record, optionIndex) => {
        const rawId =
          record.productable_id ??
          record.product_id ??
          record.id ??
          record.product?.productable_id ??
          record.product?.id ??
          optionIndex;
        return {
          id: String(rawId),
          name: record.name || record.product?.name || `Option ${optionIndex + 1}`,
        };
      });

      updateEntry(index, (prev) => {
        const matchedOption = mappedOptions.find(
          (option) => String(option.id) === String(prev.productable_id)
        );

        return {
          ...prev,
          options: mappedOptions,
          loadingOptions: false,
          productSearch: prev.productSearch,
          ...(matchedOption
            ? { name: prev.name || matchedOption.name }
            : {}),
        };
      });
    } catch (error) {
      console.error("Failed to load product options", error);
      updateEntry(index, { options: [], loadingOptions: false });
      ToastUtils.error("Failed to load product options.");
    }
  };

  const handleEntryFieldChange = (index, field, value) => {
    const currentEntry = entries[index];
    if (!currentEntry) return;

    if (field === "productable_type") {
      const isObjectStorageType = value === OBJECT_STORAGE_TYPE;
      const quota = Math.max(1, Number(currentEntry.objectStorageQuota) || 1);
      const pricePerGb = Number(currentEntry.objectStoragePricePerGb) || DEFAULT_OBJECT_STORAGE_PRICE_PER_GB;
      const totalPrice = Number((quota * pricePerGb).toFixed(4));

      updateEntry(index, {
        productable_type: value,
        productable_id: isObjectStorageType ? String(quota) : "",
        productSearch: "",
        options: [],
        name: isObjectStorageType
          ? objectStorageNameForQuota(quota)
          : "",
        price: isObjectStorageType ? totalPrice.toFixed(4) : "",
        objectStorageQuota: isObjectStorageType ? String(quota) : "1",
        objectStoragePricePerGb: isObjectStorageType
          ? pricePerGb.toString()
          : DEFAULT_OBJECT_STORAGE_PRICE_PER_GB.toString(),
        errors: {
          ...currentEntry.errors,
          productable_type: null,
          productable_id: null,
          objectStorageQuota: null,
          objectStoragePricePerGb: null,
          price: null,
        },
      });
      if (currentEntry.region && value && value !== OBJECT_STORAGE_TYPE) {
        loadProductOptions(index, currentEntry.region, value);
      }
      return;
    }

    if (field === "region") {
      const regionInfo = regionLookup[value];
      const isObjectStorageType = currentEntry.productable_type === OBJECT_STORAGE_TYPE;
      updateEntry(index, {
        region: value,
        provider: regionInfo?.provider ?? "",
        productable_id: isObjectStorageType
          ? String(Math.max(1, Number(currentEntry.objectStorageQuota) || 1))
          : "",
        productSearch: "",
        options: [],
        name: isObjectStorageType
          ? objectStorageNameForQuota(
              Math.max(1, Number(currentEntry.objectStorageQuota) || 1)
            )
          : "",
        errors: {
          ...currentEntry.errors,
          region: null,
          productable_id: null,
        },
      });
      if (
        currentEntry.productable_type &&
        currentEntry.productable_type !== OBJECT_STORAGE_TYPE
      ) {
        loadProductOptions(index, value, currentEntry.productable_type);
      }
      return;
    }

    if (field === "productable_id") {
      const selectedOption = currentEntry.options.find(
        (option) => String(option.id) === String(value)
      );
      updateEntry(index, {
        productable_id: value,
        name: selectedOption ? selectedOption.name : "",
        productSearch: "",
        errors: {
          ...currentEntry.errors,
          productable_id: null,
          name: selectedOption ? null : currentEntry.errors.name,
        },
      });
      return;
    }

    if (field === "objectStorageQuota") {
      const rawValue = Number(value);
      const quota = Number.isFinite(rawValue) && rawValue > 0 ? Math.floor(rawValue) : 0;
      updateEntry(index, (prev) => {
        const resolvedQuota = quota > 0 ? quota : 0;
        const pricePerGb = Number(prev.objectStoragePricePerGb) || DEFAULT_OBJECT_STORAGE_PRICE_PER_GB;
        const total = resolvedQuota > 0
          ? Number((resolvedQuota * pricePerGb).toFixed(4))
          : 0;
        return {
          ...prev,
          objectStorageQuota: value,
          productable_id: resolvedQuota > 0 ? String(resolvedQuota) : "",
          name:
            resolvedQuota > 0
              ? objectStorageNameForQuota(resolvedQuota)
              : prev.name,
          price: total > 0 ? total.toFixed(4) : "",
          errors: {
            ...prev.errors,
            objectStorageQuota: null,
            productable_id: null,
            name: null,
            price: null,
          },
        };
      });
      return;
    }

    if (field === "objectStoragePricePerGb") {
      const rawValue = Number(value);
      updateEntry(index, (prev) => {
        const pricePerGb = Number.isFinite(rawValue) && rawValue > 0 ? rawValue : 0;
        const quota = Math.max(0, Math.floor(Number(prev.objectStorageQuota) || 0));
        const total = quota > 0 && pricePerGb > 0
          ? Number((quota * pricePerGb).toFixed(4))
          : 0;
        return {
          ...prev,
          objectStoragePricePerGb: value,
          price: total > 0 ? total.toFixed(4) : "",
          errors: {
            ...prev.errors,
            objectStoragePricePerGb: null,
            price: null,
          },
        };
      });
      return;
    }

    updateEntry(index, {
      [field]: value,
      errors: { ...currentEntry.errors, [field]: null },
    });
  };

  const handleProductSearchChange = (index, searchValue) => {
    const currentEntry = entries[index];
    if (!currentEntry) return;

    const trimmedValue = (searchValue || "").trim();

    if (!trimmedValue) {
      updateEntry(index, {
        productSearch: "",
        productable_id: "",
        name: "",
      });
      return;
    }

    const matchedOption = currentEntry.options.find(
      (option) => option.name.toLowerCase() === trimmedValue.toLowerCase()
    );

    if (matchedOption) {
      updateEntry(index, (prev) => ({
        ...prev,
        productSearch: "",
        productable_id: matchedOption.id,
        name: matchedOption.name,
        errors: { ...prev.errors, productable_id: null, name: null },
      }));
    } else {
      updateEntry(index, (prev) => ({
        ...prev,
        productSearch: searchValue,
        ...(prev.name === searchValue
          ? {}
          : { productable_id: "", name: "" }),
      }));
    }
  };

  const handleProductSelect = (index, option) => {
    if (!option) {
      updateEntry(index, (prev) => ({
        ...prev,
        productable_id: "",
        name: "",
        productSearch: "",
      }));
      return;
    }

    updateEntry(index, (prev) => ({
      ...prev,
      productable_id: String(option.id),
      name: option.name,
      productSearch: option.name,
      errors: { ...prev.errors, productable_id: null, name: null },
    }));
  };

  const addEntry = () => {
    setEntries((prev) => [...prev, createEmptyEntry()]);
  };

  const removeEntry = (index) => {
    setEntries((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const extension = file.name.split(".").pop()?.toLowerCase();
    setIsImporting(true);

    try {
      let rows = [];
      if (extension === "csv") {
        rows = await parseCsvFile(file);
      } else if (extension === "xlsx" || extension === "xls") {
        rows = await parseExcelFile(file);
      } else {
        ToastUtils.error("Unsupported file type. Please upload CSV or Excel.");
        return;
      }

      const regionMap = regionLookup;
      const nextEntries = [];
      const errors = [];

      rows.forEach((row, index) => {
        const result = mapRowToEntry(row, index, regionMap);
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

  const validateEntries = () => {
    let hasErrors = false;
    const nextEntries = entries.map((entry) => {
      const errors = {};

      if (!entry.name.trim()) {
        errors.name = "Product name is required.";
      }
      if (!entry.region) {
        errors.region = "Region is required.";
      }
      if (!entry.productable_type) {
        errors.productable_type = "Product type is required.";
      }

      if (entry.productable_type === OBJECT_STORAGE_TYPE) {
        const quotaValue = Number(entry.objectStorageQuota);
        const pricePerGbValue = Number(entry.objectStoragePricePerGb);

        if (!Number.isFinite(quotaValue) || quotaValue <= 0) {
          errors.objectStorageQuota = "Quota must be greater than zero.";
        }

        if (!Number.isFinite(pricePerGbValue) || pricePerGbValue <= 0) {
          errors.objectStoragePricePerGb = "Price per GiB must be greater than zero.";
        }

        if (!errors.objectStorageQuota && !errors.objectStoragePricePerGb) {
          const quotaInt = Math.max(1, Math.floor(quotaValue));
          const totalPrice = Number((quotaInt * pricePerGbValue).toFixed(4));
          entry.productable_id = String(quotaInt);
          entry.name =
            entry.name?.trim() || objectStorageNameForQuota(quotaInt);
          entry.price = totalPrice.toFixed(4);
        } else {
          entry.productable_id = entry.productable_id || "";
          entry.price = entry.price || "";
        }
      } else {
        if (!entry.productable_id) {
          errors.productable_id = "Product is required.";
        }
        const priceNumber = Number(entry.price);
        if (!Number.isFinite(priceNumber) || priceNumber < 0) {
          errors.price = "Price must be a positive number.";
        }
      }

      if (Object.keys(errors).length > 0) {
        hasErrors = true;
      }

      return { ...entry, errors };
    });

    setEntries(nextEntries);
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
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-[960px] w-full table-auto">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                      #
                    </th>
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
                  {entries.map((entry, index) => {
                    const isObjectStorageRow =
                      entry.productable_type === OBJECT_STORAGE_TYPE;
                    const isProductDisabled =
                      isObjectStorageRow ||
                      isSubmitting ||
                      entry.loadingOptions ||
                      !entry.region ||
                      !entry.productable_type;
                    const productPlaceholder = !entry.region || !entry.productable_type
                      ? "Select region & type first"
                      : entry.loadingOptions
                      ? "Loading products..."
                      : "Search product";

                    return (
                      <tr key={entry.id} className="align-top">
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {index + 1}
                      </td>
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
                            entry.errors.region ? "border-red-500" : "border-gray-300"
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
                            handleEntryFieldChange(index, "productable_type", e.target.value)
                          }
                          className={`w-full input-field ${
                            entry.errors.productable_type ? "border-red-500" : "border-gray-300"
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
                        {isObjectStorageRow ? (
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
                                className={`w-full input-field ${
                                  entry.errors.objectStorageQuota
                                    ? "border-red-500"
                                    : "border-gray-300"
                                }`}
                                disabled={isSubmitting}
                              />
                              {entry.errors.objectStorageQuota && (
                                <p className="text-red-500 text-xs mt-1">
                                  {entry.errors.objectStorageQuota}
                                </p>
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
                                className={`w-full input-field ${
                                  entry.errors.objectStoragePricePerGb
                                    ? "border-red-500"
                                    : "border-gray-300"
                                }`}
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
                        ) : (
                          <>
                            <SelectableInput
                              options={entry.options}
                              value={entry.productable_id}
                              searchValue={entry.productSearch}
                              onSearchChange={(val) =>
                                handleProductSearchChange(index, val)
                              }
                              onSelect={(option) =>
                                handleProductSelect(index, option)
                              }
                              placeholder={productPlaceholder}
                              disabled={isProductDisabled}
                              isLoading={entry.loadingOptions}
                              emptyMessage="No products found"
                              hasError={Boolean(entry.errors.productable_id)}
                            />
                            {entry.errors.productable_id && (
                              <p className="text-red-500 text-xs mt-1">
                                {entry.errors.productable_id}
                              </p>
                            )}
                          </>
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
                          disabled={isSubmitting || isObjectStorageRow}
                        />
                        {entry.errors.price && (
                          <p className="text-red-500 text-xs mt-1">{entry.errors.price}</p>
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
                    );
                })}
                </tbody>
              </table>
            </div>

            <div className="md:hidden space-y-4">
              {entries.map((entry, index) => {
                const isObjectStorageRow =
                  entry.productable_type === OBJECT_STORAGE_TYPE;
                const isProductDisabled =
                  isObjectStorageRow ||
                  isSubmitting ||
                  entry.loadingOptions ||
                  !entry.region ||
                  !entry.productable_type;
                const productPlaceholder = !entry.region || !entry.productable_type
                  ? "Select region & type first"
                  : entry.loadingOptions
                  ? "Loading products..."
                  : "Search product";

                return (
                  <div key={entry.id} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-center mb-4">
                      <p className="font-semibold">Product #{index + 1}</p>
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
                    <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Product Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={entry.name}
                        onChange={(e) =>
                          handleEntryFieldChange(index, "name", e.target.value)
                        }
                        placeholder="Product name"
                        className={`w-full input-field mt-1 ${
                          entry.errors.name ? "border-red-500" : "border-gray-300"
                        }`}
                        disabled={isSubmitting}
                      />
                      {entry.errors.name && (
                        <p className="text-red-500 text-xs mt-1">{entry.errors.name}</p>
                      )}
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Region <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={entry.region}
                        onChange={(e) =>
                          handleEntryFieldChange(index, "region", e.target.value)
                        }
                        className={`w-full input-field mt-1 ${
                          entry.errors.region ? "border-red-500" : "border-gray-300"
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
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Type <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={entry.productable_type}
                        onChange={(e) =>
                          handleEntryFieldChange(index, "productable_type", e.target.value)
                        }
                        className={`w-full input-field mt-1 ${
                          entry.errors.productable_type ? "border-red-500" : "border-gray-300"
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
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Product <span className="text-red-500">*</span>
                      </label>
                      {isObjectStorageRow ? (
                        <div className="space-y-3 mt-1">
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
                              className={`w-full input-field ${
                                entry.errors.objectStorageQuota
                                  ? "border-red-500"
                                  : "border-gray-300"
                              }`}
                              disabled={isSubmitting}
                            />
                            {entry.errors.objectStorageQuota && (
                              <p className="text-red-500 text-xs mt-1">
                                {entry.errors.objectStorageQuota}
                              </p>
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
                              className={`w-full input-field ${
                                entry.errors.objectStoragePricePerGb
                                  ? "border-red-500"
                                  : "border-gray-300"
                              }`}
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
                      ) : (
                        <>
                          <SelectableInput
                            options={entry.options}
                            value={entry.productable_id}
                            searchValue={entry.productSearch}
                            onSearchChange={(val) =>
                              handleProductSearchChange(index, val)
                            }
                            onSelect={(option) =>
                              handleProductSelect(index, option)
                            }
                            placeholder={productPlaceholder}
                            disabled={isProductDisabled}
                            isLoading={entry.loadingOptions}
                            emptyMessage="No products found"
                            hasError={Boolean(entry.errors.productable_id)}
                          />
                          {entry.errors.productable_id && (
                            <p className="text-red-500 text-xs mt-1">
                              {entry.errors.productable_id}
                            </p>
                          )}
                        </>
                      )}
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Price (USD) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={entry.price}
                        onChange={(e) =>
                          handleEntryFieldChange(index, "price", e.target.value)
                        }
                        placeholder="0.00"
                        className={`w-full input-field mt-1 ${
                          entry.errors.price ? "border-red-500" : "border-gray-300"
                        }`}
                        disabled={isSubmitting || isObjectStorageRow}
                      />
                      {entry.errors.price && (
                        <p className="text-red-500 text-xs mt-1">{entry.errors.price}</p>
                      )}
                    </div>
                  </div>
                </div>
              );
              })}
            </div>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-gray-500">
                Region automatically determines the provider. Select a type to load available products.
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
            accept=".csv,.xlsx,.xls"
            className="hidden"
            onChange={handleFileChange}
          />

          <div className="flex items-center justify-end gap-3">
            <ModernButton
              variant="outline"
              type="button"
              size="sm"
              onClick={() => navigate("/admin-dashboard/products")}
              isDisabled={isSubmitting}
            >
              Cancel
            </ModernButton>

            <button
              type="submit"
              className="rounded-[30px] py-2 px-4 bg-[#288DD1] text-white font-normal text-sm"
              disabled={isSubmitting}
              aria-busy={isSubmitting}
            >
              {isSubmitting ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </span>
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

export default AdminProductCreate;
