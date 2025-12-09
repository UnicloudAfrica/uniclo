import { useState, useCallback } from "react";
import {
  ProductEntry,
  createEmptyEntry,
  OBJECT_STORAGE_TYPE,
  DEFAULT_OBJECT_STORAGE_PRICE_PER_GB,
  objectStorageNameForQuota,
  typeToEndpoint,
} from "../../utils/productImportUtils";
import silentApi from "../../index/admin/silent";
import ToastUtils from "../../utils/toastUtil";

export const useProductForm = (regionLookup: Record<string, any>) => {
  const [entries, setEntries] = useState<ProductEntry[]>([createEmptyEntry()]);

  const updateEntry = useCallback(
    (index: number, updater: Partial<ProductEntry> | ((prev: ProductEntry) => ProductEntry)) => {
      setEntries((prev) => {
        if (index < 0 || index >= prev.length) return prev;
        const next = [...prev];
        const current = next[index];
        // @ts-ignore
        const updated =
          typeof updater === "function" ? updater(current) : { ...current, ...updater };
        next[index] = updated;
        return next;
      });
    },
    []
  );

  const addEntry = useCallback(() => {
    setEntries((prev) => [...prev, createEmptyEntry()]);
  }, []);

  const removeEntry = useCallback((index: number) => {
    setEntries((prev) => prev.filter((_, idx) => idx !== index));
  }, []);

  const loadProductOptions = useCallback(
    async (index: number, regionCode: string, type: string) => {
      const endpoint = typeToEndpoint[type];
      if (!endpoint || !regionCode || !type) return;

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

        // @ts-ignore
        const response = await silentApi("GET", `${endpoint}?${params.toString()}`);

        const records = Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response?.message)
            ? response.message
            : [];

        const mappedOptions = records.map((record: any, optionIndex: number) => {
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
            (option: any) => String(option.id) === String(prev.productable_id)
          );

          return {
            ...prev,
            options: mappedOptions,
            loadingOptions: false,
            productSearch: prev.productSearch,
            ...(matchedOption ? { name: prev.name || matchedOption.name } : {}),
          };
        });
      } catch (error) {
        console.error("Failed to load product options", error);
        updateEntry(index, { options: [], loadingOptions: false });
        ToastUtils.error("Failed to load product options.");
      }
    },
    [updateEntry]
  );

  const handleEntryFieldChange = useCallback(
    (index: number, field: keyof ProductEntry, value: any) => {
      setEntries((prevEntries) => {
        const currentEntry = prevEntries[index];
        if (!currentEntry) return prevEntries;

        // We need to calculate the new state based on the field change
        // AND potentially trigger side effects.
        // Since we are inside setEntries, we can't easily trigger async side effects that depend on the NEW state
        // unless we do it after.
        // But we can calculate the new state here.

        let nextEntry = { ...currentEntry };
        let shouldLoadOptions = false;
        let loadOptionsArgs = { region: "", type: "" };

        if (field === "productable_type") {
          const isObjectStorageType = value === OBJECT_STORAGE_TYPE;
          const quota = Math.max(1, Number(currentEntry.objectStorageQuota) || 1);
          const pricePerGb =
            Number(currentEntry.objectStoragePricePerGb) || DEFAULT_OBJECT_STORAGE_PRICE_PER_GB;
          const totalPrice = Number((quota * pricePerGb).toFixed(4));

          nextEntry = {
            ...nextEntry,
            productable_type: value,
            productable_id: isObjectStorageType ? String(quota) : "",
            productSearch: "",
            options: [],
            name: isObjectStorageType ? objectStorageNameForQuota(quota) : "",
            price: isObjectStorageType ? totalPrice.toFixed(4) : "",
            objectStorageQuota: isObjectStorageType ? String(quota) : "1",
            objectStoragePricePerGb: isObjectStorageType
              ? pricePerGb.toString()
              : DEFAULT_OBJECT_STORAGE_PRICE_PER_GB.toString(),
            errors: {
              ...nextEntry.errors,
              productable_type: null,
              productable_id: null,
              objectStorageQuota: null,
              objectStoragePricePerGb: null,
              price: null,
            },
          };

          if (currentEntry.region && value && value !== OBJECT_STORAGE_TYPE) {
            shouldLoadOptions = true;
            loadOptionsArgs = { region: currentEntry.region, type: value };
          }
        } else if (field === "region") {
          const regionInfo = regionLookup[value];
          const isObjectStorageType = currentEntry.productable_type === OBJECT_STORAGE_TYPE;

          nextEntry = {
            ...nextEntry,
            region: value,
            provider: regionInfo?.provider ?? "",
            productable_id: isObjectStorageType
              ? String(Math.max(1, Number(currentEntry.objectStorageQuota) || 1))
              : "",
            productSearch: "",
            options: [],
            name: isObjectStorageType
              ? objectStorageNameForQuota(Math.max(1, Number(currentEntry.objectStorageQuota) || 1))
              : "",
            errors: {
              ...nextEntry.errors,
              region: null,
              productable_id: null,
            },
          };

          if (
            currentEntry.productable_type &&
            currentEntry.productable_type !== OBJECT_STORAGE_TYPE
          ) {
            shouldLoadOptions = true;
            loadOptionsArgs = { region: value, type: currentEntry.productable_type };
          }
        } else if (field === "productable_id") {
          const selectedOption = currentEntry.options.find(
            (option) => String(option.id) === String(value)
          );
          nextEntry = {
            ...nextEntry,
            productable_id: value,
            name: selectedOption ? selectedOption.name : "",
            productSearch: "",
            errors: {
              ...nextEntry.errors,
              productable_id: null,
              name: selectedOption ? null : currentEntry.errors.name,
            },
          };
        } else if (field === "objectStorageQuota") {
          const rawValue = Number(value);
          const quota = Number.isFinite(rawValue) && rawValue > 0 ? Math.floor(rawValue) : 0;
          const resolvedQuota = quota > 0 ? quota : 0;
          const pricePerGb =
            Number(currentEntry.objectStoragePricePerGb) || DEFAULT_OBJECT_STORAGE_PRICE_PER_GB;
          const total = resolvedQuota > 0 ? Number((resolvedQuota * pricePerGb).toFixed(4)) : 0;

          nextEntry = {
            ...nextEntry,
            objectStorageQuota: value,
            productable_id: resolvedQuota > 0 ? String(resolvedQuota) : "",
            name: resolvedQuota > 0 ? objectStorageNameForQuota(resolvedQuota) : currentEntry.name,
            price: total > 0 ? total.toFixed(4) : "",
            errors: {
              ...nextEntry.errors,
              objectStorageQuota: null,
              productable_id: null,
              name: null,
              price: null,
            },
          };
        } else if (field === "objectStoragePricePerGb") {
          const rawValue = Number(value);
          const pricePerGb = Number.isFinite(rawValue) && rawValue > 0 ? rawValue : 0;
          const quota = Math.max(0, Math.floor(Number(currentEntry.objectStorageQuota) || 0));
          const total = quota > 0 && pricePerGb > 0 ? Number((quota * pricePerGb).toFixed(4)) : 0;

          nextEntry = {
            ...nextEntry,
            objectStoragePricePerGb: value,
            price: total > 0 ? total.toFixed(4) : "",
            errors: {
              ...nextEntry.errors,
              objectStoragePricePerGb: null,
              price: null,
            },
          };
        } else {
          // Default case
          nextEntry = {
            ...nextEntry,
            [field]: value,
            errors: { ...nextEntry.errors, [field]: null },
          };
        }

        // Apply update
        const nextEntries = [...prevEntries];
        nextEntries[index] = nextEntry;

        // Trigger side effect if needed
        // We can't await here, so we'll fire and forget?
        // Or we can use a useEffect that watches entries? No, that's too broad.
        // We can call loadProductOptions, but it calls setEntries again.
        // This is safe in React batching.
        if (shouldLoadOptions) {
          // We need to call this OUTSIDE the setEntries callback to avoid conflicts?
          // Actually, calling setEntries inside setEntries callback is bad.
          // We should return the new state, and then trigger the effect.
          // But we can't return "trigger effect".

          // Workaround: setTimeout to break out of the render cycle?
          setTimeout(() => {
            loadProductOptions(index, loadOptionsArgs.region, loadOptionsArgs.type);
          }, 0);
        }

        return nextEntries;
      });
    },
    [loadProductOptions, regionLookup]
  );

  const handleProductSearchChange = useCallback(
    (index: number, searchValue: string) => {
      updateEntry(index, (prev) => {
        const trimmedValue = (searchValue || "").trim();
        if (!trimmedValue) {
          return {
            ...prev,
            productSearch: "",
            productable_id: "",
            name: "",
          };
        }

        const matchedOption = prev.options.find(
          (option) => option.name.toLowerCase() === trimmedValue.toLowerCase()
        );

        if (matchedOption) {
          return {
            ...prev,
            productSearch: "",
            productable_id: matchedOption.id,
            name: matchedOption.name,
            errors: { ...prev.errors, productable_id: null, name: null },
          };
        } else {
          return {
            ...prev,
            productSearch: searchValue,
            ...(prev.name === searchValue ? {} : { productable_id: "", name: "" }),
          };
        }
      });
    },
    [updateEntry]
  );

  const handleProductSelect = useCallback(
    (index: number, option: any) => {
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
    },
    [updateEntry]
  );

  const validateEntries = useCallback(() => {
    let hasErrors = false;
    setEntries((prevEntries) => {
      const nextEntries = prevEntries.map((entry) => {
        const errors: Record<string, string> = {};

        if (!entry.name.trim()) errors.name = "Product name is required.";
        if (!entry.region) errors.region = "Region is required.";
        if (!entry.productable_type) errors.productable_type = "Product type is required.";

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
            // Auto-fix values if valid
            const quotaInt = Math.max(1, Math.floor(quotaValue));
            const totalPrice = Number((quotaInt * pricePerGbValue).toFixed(4));
            entry.productable_id = String(quotaInt);
            entry.name = entry.name?.trim() || objectStorageNameForQuota(quotaInt);
            entry.price = totalPrice.toFixed(4);
          }
        } else {
          if (!entry.productable_id) errors.productable_id = "Product is required.";
          const priceNumber = Number(entry.price);
          if (!Number.isFinite(priceNumber) || priceNumber < 0) {
            errors.price = "Price must be a positive number.";
          }
        }

        if (Object.keys(errors).length > 0) hasErrors = true;
        return { ...entry, errors };
      });
      return nextEntries;
    });
    return !hasErrors;
  }, []);

  return {
    entries,
    setEntries,
    updateEntry,
    addEntry,
    removeEntry,
    handleEntryFieldChange,
    handleProductSearchChange,
    handleProductSelect,
    validateEntries,
  };
};
