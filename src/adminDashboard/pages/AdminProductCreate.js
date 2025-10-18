import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, Plus, Trash2 } from "lucide-react";
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
  options: [],
  loadingOptions: false,
  errors: {},
});

const AdminProductCreate = () => {
  const navigate = useNavigate();
  const { isLoading } = useAuthRedirect();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [entries, setEntries] = useState([createEmptyEntry()]);

  const { isFetching: isRegionsFetching, data: regions } = useFetchRegions();
  const { mutate: createProducts, isPending } = useCreateProducts();

  const regionLookup = useMemo(() => {
    if (!regions) return {};
    return regions.reduce((acc, region) => {
      acc[region.code] = region;
      return acc;
    }, {});
  }, [regions]);

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

  const isSubmitting = isPending || isLoading;

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
                        Provider
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
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {entry.provider || "Auto from region"}
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
            </ModernCard>

            <div className="flex items-center justify-end gap-3">
              <ModernButton
                variant="outline"
                type="button"
                onClick={() => navigate("/admin-dashboard/products")}
                isDisabled={isSubmitting}
              >
                Cancel
              </ModernButton>
              <ModernButton type="submit" isDisabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Products"
                )}
              </ModernButton>
            </div>
          </form>
        </div>
      </main>
    </>
  );
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
