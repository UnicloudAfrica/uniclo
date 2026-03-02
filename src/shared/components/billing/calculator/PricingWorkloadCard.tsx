import React, { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  HardDrive,
  Network,
  Plus,
  Trash2,
  Loader2,
  ChevronDown,
  ChevronUp,
  Monitor,
  Clock,
} from "lucide-react";
import { ModernButton, ModernCard, ModernInput, SelectableInput } from "../../ui";
import { useFetchProductPricing } from "../../../../hooks/resource";
import { BillingRegion, PricingRequest, ProductPricing } from "../types";

const formatCurrency = (amount: number | null | undefined, currency: string = "USD") => {
  if (amount === null || amount === undefined || Number.isNaN(amount)) {
    return null;
  }
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency || ""} ${amount}`.trim();
  }
};

const createInitialSearchState = () => ({
  region: "",
  compute: "",
  os: "",
  volume: "",
  bandwidth: "",
  floatingIp: "",
  crossConnect: "",
});

const EMPTY_ERRORS: Record<string, string | null> = {};
const asProductPricingList = (value: unknown): ProductPricing[] =>
  Array.isArray(value) ? (value as ProductPricing[]) : [];

interface WorkloadAccordionHeaderProps {
  index: number;
  isExpanded: boolean;
  setIsExpanded: (val: boolean) => void;
  summaryText: string;
  estimatedPrice: string;
}

const WorkloadAccordionHeader: React.FC<WorkloadAccordionHeaderProps> = ({
  index,
  isExpanded,
  setIsExpanded,
  summaryText,
  estimatedPrice,
}) => (
  <div
    className="flex cursor-pointer items-center justify-between bg-slate-50 px-6 py-4 transition-colors hover:bg-slate-100"
    onClick={() => setIsExpanded(!isExpanded)}
    onKeyDown={(e) => {
      if (e.key === "Enter" || e.key === " ") {
        setIsExpanded(!isExpanded);
      }
    }}
    role="button"
    tabIndex={0}
  >
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-slate-900">
          Virtual machine workload #{index + 1}
        </span>
        {!isExpanded && (
          <span className="hidden text-xs text-slate-500 sm:inline-block">{summaryText}</span>
        )}
      </div>
      {!isExpanded && <div className="text-xs text-slate-500 sm:hidden">{summaryText}</div>}
    </div>
    <div className="flex items-center gap-4">
      {!isExpanded && <span className="text-sm font-medium text-slate-900">{estimatedPrice}</span>}
      {isExpanded ? (
        <ChevronUp className="h-5 w-5 text-slate-400" />
      ) : (
        <ChevronDown className="h-5 w-5 text-slate-400" />
      )}
    </div>
  </div>
);

interface ResourceSelectionSectionProps {
  index: number;
  data: PricingRequest;
  regions: BillingRegion[];
  isRegionsFetching: boolean;
  itemErrors: Record<string, string | null>;
  searchTerms: any;
  setSearchTerms: React.Dispatch<React.SetStateAction<any>>;
  handleSelectableChange: (field: keyof PricingRequest) => (option?: any) => void;
  computerInstances: ProductPricing[];
  isComputerInstancesFetching: boolean;
  selectedCompute: ProductPricing | undefined;
  renderPricePill: (label: string | null | undefined) => React.ReactNode;
  buildPriceLabel: (
    amount: number | null | undefined,
    currency: string | null | undefined,
    suffix?: string
  ) => string | null;
  osImages: ProductPricing[];
  isOsImagesFetching: boolean;
  selectedOs: ProductPricing | undefined;
  handleNumericChange: (
    field: keyof PricingRequest,
    min?: number
  ) => (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const ResourceSelectionSection: React.FC<ResourceSelectionSectionProps> = ({
  index,
  data,
  regions,
  isRegionsFetching,
  itemErrors,
  searchTerms,
  setSearchTerms,
  handleSelectableChange,
  computerInstances,
  isComputerInstancesFetching,
  selectedCompute,
  renderPricePill,
  buildPriceLabel,
  osImages,
  isOsImagesFetching,
  selectedOs,
  handleNumericChange,
}) => (
  <div className="space-y-6">
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label htmlFor={`region-${index}`} className="text-sm font-medium text-slate-700">
          Region<span className="text-red-500">*</span>
        </label>
        {isRegionsFetching && (
          <span className="flex items-center gap-1 text-xs text-slate-500">
            <Loader2 className="h-3 w-3 animate-spin" /> Loading
          </span>
        )}
      </div>
      <SelectableInput
        options={regions?.map((r) => ({ id: r.code, name: r.name })) || []}
        value={data["region"] || ""}
        searchValue={searchTerms.region}
        onSearchChange={(v) => setSearchTerms((prev: any) => ({ ...prev, region: v }))}
        onSelect={handleSelectableChange("region")}
        placeholder="Search regions"
        isLoading={isRegionsFetching}
        hasError={Boolean(itemErrors["region"])}
      />
    </div>

    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label htmlFor={`compute-${index}`} className="text-sm font-medium text-slate-700">
          Compute instance<span className="text-red-500">*</span>
        </label>
        {renderPricePill(
          selectedCompute
            ? buildPriceLabel(
                selectedCompute.pricing.effective.price_local,
                selectedCompute.pricing.effective.currency
              )
            : null
        )}
      </div>
      <SelectableInput
        options={
          computerInstances?.map(({ product, pricing }: any) => ({
            id: Number(product.productable_id),
            name: `${product.name} • ${formatCurrency(pricing?.effective?.price_local, pricing?.effective?.currency) || "N/A"}`,
          })) || []
        }
        value={data["compute_instance_id"] ?? ""}
        searchValue={searchTerms.compute}
        onSearchChange={(v) => setSearchTerms((prev: any) => ({ ...prev, compute: v }))}
        onSelect={handleSelectableChange("compute_instance_id")}
        placeholder="Select instance type"
        disabled={!data["region"]}
        isLoading={isComputerInstancesFetching}
        hasError={Boolean(itemErrors["compute_instance_id"])}
      />
    </div>

    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-slate-700">
          OS image<span className="text-red-500">*</span>
        </label>
        {renderPricePill(
          selectedOs
            ? buildPriceLabel(
                selectedOs.pricing.effective.price_local,
                selectedOs.pricing.effective.currency
              )
            : null
        )}
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <SelectableInput
          options={
            osImages?.map(({ product, pricing }: any) => ({
              id: Number(product.productable_id),
              name: `${product.name} • ${formatCurrency(pricing?.effective?.price_local, pricing?.effective?.currency) || "N/A"}`,
            })) || []
          }
          value={data["os_image_id"] ?? ""}
          searchValue={searchTerms.os}
          onSearchChange={(v) => setSearchTerms((prev: any) => ({ ...prev, os: v }))}
          onSelect={handleSelectableChange("os_image_id")}
          placeholder="Select OS image"
          disabled={!data["region"]}
          isLoading={isOsImagesFetching}
          hasError={Boolean(itemErrors["os_image_id"])}
        />
      </div>
    </div>

    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <ModernInput
        label="Term (months)"
        type="number"
        min="1"
        value={data["months"]}
        onChange={handleNumericChange("months", 1)}
        error={itemErrors["months"] || ""}
        icon={<Clock className="text-slate-400" />}
      />
      <ModernInput
        label="Number of instances"
        type="number"
        min="1"
        value={data["number_of_instances"]}
        onChange={handleNumericChange("number_of_instances", 1)}
        error={itemErrors["number_of_instances"] || ""}
        icon={<Monitor className="text-slate-400" />}
      />
    </div>
  </div>
);

interface StorageVolumesSectionProps {
  data: PricingRequest;
  ebsVolumes: ProductPricing[];
  isEbsVolumesFetching: boolean;
  itemErrors: Record<string, string | null>;
  searchTerms: any;
  setSearchTerms: React.Dispatch<React.SetStateAction<any>>;
  handleSelectableChange: (field: keyof PricingRequest) => (option?: any) => void;
  handleNumericChange: (
    field: keyof PricingRequest,
    min?: number
  ) => (e: React.ChangeEvent<HTMLInputElement>) => void;
  addVolume: () => void;
  removeVolume: (idx: number) => void;
  index: number;
}

const StorageVolumesSection: React.FC<StorageVolumesSectionProps> = ({
  data,
  ebsVolumes,
  isEbsVolumesFetching,
  itemErrors,
  searchTerms,
  setSearchTerms,
  handleSelectableChange,
  handleNumericChange,
  addVolume,
  removeVolume,
}) => (
  <div className="space-y-3 rounded-xl bg-slate-50 p-4 border border-slate-200">
    <h4 className="text-sm font-medium text-slate-900">Storage Volumes</h4>

    {data["volumes"] && data["volumes"].length > 0 && (
      <div className="space-y-2">
        {data["volumes"].map((vol, idx) => {
          const volProduct = ebsVolumes?.find(
            (v: any) => String(v.product.productable_id) === String(vol.volume_type_id)
          );
          return (
            <div
              key={`${vol.volume_type_id}-${idx}`}
              className="flex items-center justify-between rounded-lg bg-white p-2 shadow-sm border border-slate-100"
            >
              <div className="flex items-center gap-2 text-sm">
                <HardDrive className="h-4 w-4 text-slate-400" />
                <span className="font-medium text-slate-700">
                  {volProduct?.product?.name || "Volume"}
                </span>
                <span className="text-slate-400">•</span>
                <span>{vol.storage_size_gb} GB</span>
              </div>
              <button
                onClick={() => removeVolume(idx)}
                className="text-slate-400 hover:text-red-500"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    )}

    <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_120px_auto]">
      <SelectableInput
        options={
          ebsVolumes?.map(({ product, pricing }: any) => ({
            id: Number(product.productable_id),
            name: `${product.name} • ${formatCurrency(Number(pricing?.effective?.price_local), pricing?.effective?.currency)}/GB`,
          })) || []
        }
        value={data["volume_type_id"] || ""}
        searchValue={searchTerms.volume}
        onSearchChange={(v) => setSearchTerms((prev: any) => ({ ...prev, volume: v }))}
        onSelect={handleSelectableChange("volume_type_id")}
        placeholder="Volume Type"
        disabled={!data["region"]}
        isLoading={isEbsVolumesFetching}
        hasError={Boolean(itemErrors["volume_type_id"])}
      />
      <ModernInput
        type="number"
        placeholder="Size (GB)"
        min="1"
        value={data["storage_size_gb"] || ""}
        onChange={handleNumericChange("storage_size_gb", 1)}
        error={itemErrors["storage_size_gb"] || ""}
      />
      <ModernButton
        variant="secondary"
        onClick={addVolume}
        disabled={!data["volume_type_id"]}
        className="h-[44px]"
      >
        <Plus className="h-4 w-4" />
      </ModernButton>
    </div>
  </div>
);

interface NetworkingOptionsSectionProps {
  data: PricingRequest;
  bandwidths: ProductPricing[];
  floatingIps: ProductPricing[];
  crossConnects: ProductPricing[];
  isCrossConnectsFetching: boolean;
  searchTerms: any;
  setSearchTerms: React.Dispatch<React.SetStateAction<any>>;
  handleSelectableChange: (field: keyof PricingRequest) => (option?: any) => void;
  handleNumericChange: (
    field: keyof PricingRequest,
    min?: number
  ) => (e: React.ChangeEvent<HTMLInputElement>) => void;
  isNetworkingOpen: boolean;
  setIsNetworkingOpen: (val: boolean) => void;
}

const NetworkingOptionsSection: React.FC<NetworkingOptionsSectionProps> = ({
  data,
  bandwidths,
  floatingIps,
  crossConnects,
  isCrossConnectsFetching,
  searchTerms,
  setSearchTerms,
  handleSelectableChange,
  handleNumericChange,
  isNetworkingOpen,
  setIsNetworkingOpen,
}) => (
  <div className="border-t border-slate-200 pt-4">
    <button
      className="flex items-center gap-2 text-sm font-medium text-primary-600 hover:text-primary-700"
      onClick={() => setIsNetworkingOpen(!isNetworkingOpen)}
    >
      <Network className="h-4 w-4" />
      {isNetworkingOpen ? "Hide Networking Options" : "Show Networking Options (Optional)"}
    </button>

    <AnimatePresence>
      {isNetworkingOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="mt-4 space-y-4 overflow-hidden"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <SelectableInput
              options={
                bandwidths?.map(({ product }: any) => ({
                  id: Number(product.productable_id),
                  name: product.name,
                })) || []
              }
              value={data["bandwidth_id"] || ""}
              searchValue={searchTerms.bandwidth}
              onSearchChange={(v) => setSearchTerms((prev: any) => ({ ...prev, bandwidth: v }))}
              onSelect={handleSelectableChange("bandwidth_id")}
              placeholder="Bandwidth"
              disabled={!data["region"]}
            />
            <ModernInput
              placeholder="Bandwidth Units"
              value={data["bandwidth_count"]}
              onChange={handleNumericChange("bandwidth_count", 0)}
            />
            <SelectableInput
              options={
                floatingIps?.map(({ product }: any) => ({
                  id: Number(product.productable_id),
                  name: product.name,
                })) || []
              }
              value={data["floating_ip_id"] || ""}
              searchValue={searchTerms.floatingIp}
              onSearchChange={(v) => setSearchTerms((prev: any) => ({ ...prev, floatingIp: v }))}
              onSelect={handleSelectableChange("floating_ip_id")}
              placeholder="Floating IP"
              disabled={!data["region"]}
            />
            <ModernInput
              placeholder="IP Count"
              value={data["floating_ip_count"]}
              onChange={handleNumericChange("floating_ip_count", 0)}
            />
            <div className="sm:col-span-2">
              <SelectableInput
                options={
                  crossConnects?.map(({ product }: any) => ({
                    id: Number(product.productable_id),
                    name: product.name,
                  })) || []
                }
                value={data["cross_connect_id"] ?? ""}
                searchValue={searchTerms.crossConnect}
                onSearchChange={(v) =>
                  setSearchTerms((prev: any) => ({ ...prev, crossConnect: v }))
                }
                onSelect={handleSelectableChange("cross_connect_id")}
                placeholder="Cross Connect"
                disabled={!data["region"]}
                isLoading={isCrossConnectsFetching}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

interface PricingWorkloadCardProps {
  data: PricingRequest;
  onChange: (newData: PricingRequest) => void;
  onRemove: () => void;
  index: number;
  countryCode: string;
  currencyCode: string;
  errors?: Record<string, string | null>;
  regions?: BillingRegion[];
  isRegionsFetching?: boolean;
  isLastItem?: boolean;
  [key: string]: any;
}

const PricingWorkloadCard: React.FC<PricingWorkloadCardProps> = ({
  data,
  onChange,
  onRemove,
  index,
  countryCode,
  currencyCode,
  errors = EMPTY_ERRORS,
  regions = [],
  isRegionsFetching = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [searchTerms, setSearchTerms] = useState(createInitialSearchState);
  const [isNetworkingOpen, setIsNetworkingOpen] = useState(false);
  const [itemErrors, setItemErrors] = useState(errors);

  useEffect(() => {
    setItemErrors(errors);
  }, [errors]);

  const { data: computerInstancesRaw, isFetching: isComputerInstancesFetching } =
    useFetchProductPricing(data["region"], "compute_instance", {
      enabled: !!data["region"],
      countryCode,
    });

  const { data: osImagesRaw, isFetching: isOsImagesFetching } = useFetchProductPricing(
    data["region"],
    "os_image",
    { enabled: !!data["region"], countryCode }
  );

  const { data: ebsVolumesRaw, isFetching: isEbsVolumesFetching } = useFetchProductPricing(
    data["region"],
    "volume_type",
    { enabled: !!data["region"], countryCode }
  );

  const { data: bandwidthsRaw } = useFetchProductPricing(data["region"], "bandwidth", {
    enabled: !!data["region"],
    countryCode,
  });

  const { data: floatingIpsRaw } = useFetchProductPricing(data["region"], "ip", {
    enabled: !!data["region"],
    countryCode,
  });

  const { data: crossConnectsRaw, isFetching: isCrossConnectsFetching } = useFetchProductPricing(
    data["region"],
    "cross_connect",
    {
      enabled: !!data["region"],
      countryCode,
    }
  );

  const computerInstances = asProductPricingList(computerInstancesRaw);
  const osImages = asProductPricingList(osImagesRaw);
  const ebsVolumes = asProductPricingList(ebsVolumesRaw);
  const bandwidths = asProductPricingList(bandwidthsRaw);
  const floatingIps = asProductPricingList(floatingIpsRaw);
  const crossConnects = asProductPricingList(crossConnectsRaw);

  const findSelectedItem = (collection: ProductPricing[], id: number | string | null | undefined) =>
    collection?.find(({ product }) => String(product.productable_id) === String(id));

  const selectedCompute = findSelectedItem(computerInstances, data["compute_instance_id"]);
  const selectedOs = findSelectedItem(osImages, data["os_image_id"]);

  const renderPricePill = (label: string | null | undefined) =>
    label ? (
      <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 shadow-sm">
        {label}
      </span>
    ) : null;

  const buildPriceLabel = (
    amount: number | null | undefined,
    currency: string | null | undefined,
    suffix = "/mo"
  ) => {
    const formatted = formatCurrency(amount, currency || undefined);
    return formatted ? `${formatted}${suffix}` : null;
  };

  const updateField = (field: keyof PricingRequest, value: any) => {
    onChange({ ...data, [field]: value });
    setItemErrors((prev) => ({ ...prev, [field]: null }));
  };

  const handleNumericChange =
    (field: keyof PricingRequest, min: number = 0) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = Number.parseInt(e.target.value) || min;
      updateField(field, Math.max(min, val));
    };

  const handleSelectableChange =
    (field: keyof PricingRequest) =>
    (option: any = null) => {
      const value = option ? String(option.id) : null;
      const name = option ? option.name : "";

      if (field === "region") {
        onChange({
          ...data,
          region: value || "",
          region_name: name,
          compute_instance_id: 0,
          compute_instance_name: "",
          os_image_id: 0,
          os_image_name: "",
          volume_type_id: 0,
          volumes: [],
          bandwidth_id: 0,
          bandwidth_count: 0,
          floating_ip_id: 0,
          floating_ip_count: 0,
          cross_connect_id: 0,
        });
        setSearchTerms({
          ...createInitialSearchState(),
          region: name,
        });
        return;
      }

      const nameKeyMap: Record<string, keyof PricingRequest> = {
        compute_instance_id: "compute_instance_name",
        os_image_id: "os_image_name",
        volume_type_id: "volume_type_name",
        bandwidth_id: "bandwidth_name",
        floating_ip_id: "floating_ip_name",
        cross_connect_id: "cross_connect_name",
      };

      const nameKey = nameKeyMap[field];
      const newData = { ...data, [field]: value };
      if (nameKey) {
        (newData as any)[nameKey] = name;
      }

      onChange(newData);
      setItemErrors((prev) => ({ ...prev, [field]: null }));

      const getSearchKey = (f: keyof PricingRequest) => {
        if (f === "compute_instance_id") return "compute";
        if (f === "os_image_id") return "os";
        if ((f as any) === "volume_type_id") return "volume";
        if (f === "bandwidth_id") return "bandwidth";
        if (f === "floating_ip_id") return "floatingIp";
        if (f === "cross_connect_id") return "crossConnect";
        return f as string;
      };

      setSearchTerms((prev) => ({
        ...prev,
        [getSearchKey(field)]: name,
      }));

      if (["bandwidth_id", "floating_ip_id", "cross_connect_id"].includes(field)) {
        setIsNetworkingOpen((prev) => prev || Boolean(option));
      }
    };

  const validateVolumeInput = () => {
    const newErrors: Record<string, string | null> = {};
    if (!data["volume_type_id"]) newErrors["volume_type_id"] = "Required";
    if (!data["storage_size_gb"] || Number(data["storage_size_gb"]) < 1)
      newErrors["storage_size_gb"] = "Min 1 GB";

    setItemErrors((prev) => ({ ...prev, ...newErrors }));
    return Object.keys(newErrors).length === 0;
  };

  const addVolume = () => {
    if (!validateVolumeInput()) return;

    const found = ebsVolumes?.find(
      (item: any) => String(item.product.productable_id) === String(data["volume_type_id"])
    );
    const volName = found?.product?.name || "Volume";

    const newVolume = {
      volume_type_id: Number(data["volume_type_id"]) || 0,
      volume_type_name: volName,
      storage_size_gb: Number(data["storage_size_gb"]) || 0,
    };

    onChange({
      ...data,
      volumes: [...(data["volumes"] || []), newVolume],
      volume_type_id: null,
      volume_type_name: "",
      storage_size_gb: 50,
    });

    setSearchTerms((prev) => ({ ...prev, volume: "" }));
  };

  const removeVolume = (vIdx: number) => {
    onChange({
      ...data,
      volumes: (data["volumes"] || []).filter((_: any, i: number) => i !== vIdx),
    });
  };

  const calculateEstimatedPrice = () => {
    let total = 0;
    if (selectedCompute?.pricing?.effective?.price_local) {
      total +=
        selectedCompute.pricing.effective.price_local * Number(data["number_of_instances"] || 1);
    }
    if (selectedOs?.pricing?.effective?.price_local) {
      total += selectedOs.pricing.effective.price_local * Number(data["number_of_instances"] || 1);
    }
    data["volumes"]?.forEach((vol) => {
      const volProduct = ebsVolumes?.find(
        (v: any) => String(v.product.productable_id) === String(vol.volume_type_id)
      );
      if (volProduct?.pricing?.effective?.price_local) {
        total +=
          Number(vol.storage_size_gb || 0) * (volProduct?.pricing?.effective?.price_local || 0);
      }
    });

    return total > 0 ? formatCurrency(total, currencyCode) : "$—/mo";
  };

  const summaryText = [
    data["region"] ? regions?.find((r) => r.code === data["region"])?.name : "Select Region",
    selectedCompute ? selectedCompute.product.name : "Instance",
    `${data["volumes"]?.reduce((acc, v) => acc + Number(v.storage_size_gb || 0), 0) || 0} GB Storage`,
    `${data["months"] || 1} Month${(data["months"] || 0) > 1 ? "s" : ""}`,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <ModernCard padding="none" className="overflow-hidden border border-slate-200 shadow-sm">
      <WorkloadAccordionHeader
        index={index}
        isExpanded={isExpanded}
        setIsExpanded={setIsExpanded}
        summaryText={summaryText || ""}
        estimatedPrice={calculateEstimatedPrice() || ""}
      />

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="space-y-6 p-6 border-t border-slate-200 bg-white">
              <ResourceSelectionSection
                index={index}
                data={data}
                regions={regions}
                isRegionsFetching={isRegionsFetching}
                itemErrors={itemErrors}
                searchTerms={searchTerms}
                setSearchTerms={setSearchTerms}
                handleSelectableChange={handleSelectableChange}
                computerInstances={computerInstances}
                isComputerInstancesFetching={isComputerInstancesFetching}
                selectedCompute={selectedCompute}
                renderPricePill={renderPricePill}
                buildPriceLabel={buildPriceLabel}
                osImages={osImages}
                isOsImagesFetching={isOsImagesFetching}
                selectedOs={selectedOs}
                handleNumericChange={handleNumericChange}
              />

              <StorageVolumesSection
                data={data}
                ebsVolumes={ebsVolumes}
                isEbsVolumesFetching={isEbsVolumesFetching}
                itemErrors={itemErrors}
                searchTerms={searchTerms}
                setSearchTerms={setSearchTerms}
                handleSelectableChange={handleSelectableChange}
                handleNumericChange={handleNumericChange}
                addVolume={addVolume}
                removeVolume={removeVolume}
                index={index}
              />

              <NetworkingOptionsSection
                data={data}
                bandwidths={bandwidths}
                floatingIps={floatingIps}
                crossConnects={crossConnects}
                isCrossConnectsFetching={isCrossConnectsFetching}
                searchTerms={searchTerms}
                setSearchTerms={setSearchTerms}
                handleSelectableChange={handleSelectableChange}
                handleNumericChange={handleNumericChange}
                isNetworkingOpen={isNetworkingOpen}
                setIsNetworkingOpen={setIsNetworkingOpen}
              />

              <div className="flex justify-end pt-2">
                <ModernButton
                  variant="ghost"
                  className="text-red-500 hover:text-red-600 hover:bg-red-50"
                  onClick={onRemove}
                  leftIcon={<Trash2 className="h-4 w-4" />}
                >
                  Remove Workload
                </ModernButton>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </ModernCard>
  );
};

export default PricingWorkloadCard;
