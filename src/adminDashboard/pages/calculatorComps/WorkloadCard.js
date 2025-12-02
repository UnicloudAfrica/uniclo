import React, { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
    HardDrive,
    Network,
    Plus,
    Trash2,
    Loader2,
} from "lucide-react";
import ModernCard from "../../components/ModernCard";
import ModernButton from "../../components/ModernButton";
import ModernInput from "../../components/ModernInput";
import SelectableInput from "../../components/SelectableInput.jsx";
import { useFetchProductPricing } from "../../../hooks/resource";
import { useFetchRegions } from "../../../hooks/adminHooks/regionHooks";
import { useFormattedRegions } from "../../../utils/regionUtils";

const formatCurrency = (amount, currency) => {
    if (amount === null || amount === undefined || Number.isNaN(amount)) {
        return null;
    }
    try {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: currency || "USD",
            maximumFractionDigits: 2,
        }).format(amount);
    } catch (error) {
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

const WorkloadCard = ({
    data,
    onChange,
    onRemove,
    index,
    countryCode,
    currencyCode,
    errors = {},
}) => {
    const [searchTerms, setSearchTerms] = useState(createInitialSearchState);
    const [isNetworkingOpen, setIsNetworkingOpen] = useState(false);
    const [itemErrors, setItemErrors] = useState(errors);

    useEffect(() => {
        setItemErrors(errors);
    }, [errors]);

    const { data: rawRegions, isFetching: isRegionsFetching } = useFetchRegions();
    const regions = useFormattedRegions(rawRegions);

    const { data: computerInstances, isFetching: isComputerInstancesFetching } =
        useFetchProductPricing(data.region, "compute_instance", {
            enabled: !!data.region,
            countryCode,
        });

    const { data: osImages, isFetching: isOsImagesFetching } = useFetchProductPricing(
        data.region,
        "os_image",
        { enabled: !!data.region, countryCode }
    );

    const { data: ebsVolumes, isFetching: isEbsVolumesFetching } = useFetchProductPricing(
        data.region,
        "volume_type",
        { enabled: !!data.region, countryCode }
    );

    const { data: bandwidths, isFetching: isBandwidthsFetching } = useFetchProductPricing(
        data.region,
        "bandwidth",
        { enabled: !!data.region, countryCode }
    );

    const { data: floatingIps, isFetching: isFloatingIpsFetching } = useFetchProductPricing(
        data.region,
        "ip",
        { enabled: !!data.region, countryCode }
    );

    const { data: crossConnects, isFetching: isCrossConnectsFetching } =
        useFetchProductPricing(data.region, "cross_connect", {
            enabled: !!data.region,
            countryCode,
        });

    const findSelectedItem = (collection, id) =>
        collection?.find(({ product }) => String(product.productable_id) === String(id));

    const selectedCompute = findSelectedItem(computerInstances, data.compute_instance_id);
    const selectedOs = findSelectedItem(osImages, data.os_image_id);
    const selectedVolume = findSelectedItem(ebsVolumes, data.volume_type_id);
    const selectedBandwidth = findSelectedItem(bandwidths, data.bandwidth_id);
    const selectedFloatingIp = findSelectedItem(floatingIps, data.floating_ip_id);
    const selectedCrossConnect = findSelectedItem(crossConnects, data.cross_connect_id);

    const renderPricePill = (label) =>
        label ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 shadow-sm">
                {label}
            </span>
        ) : null;

    const updateField = (field, value) => {
        onChange({ ...data, [field]: value });
        setItemErrors((prev) => ({ ...prev, [field]: null }));
    };

    const handleNumericChange = (field, min = 0) => (event) => {
        const rawValue = event.target.value;
        if (rawValue === "") {
            updateField(field, "");
            return;
        }
        const numericValue = Number(rawValue);
        if (Number.isNaN(numericValue)) return;
        updateField(field, Math.max(numericValue, min));
    };

    const handleSelectableChange = (field) => (option = null) => {
        const value = option ? String(option.id) : null;

        if (field === 'region') {
            onChange({
                ...data,
                region: value,
                compute_instance_id: null,
                os_image_id: null,
                volume_type_id: null,
                volumes: [],
                bandwidth_id: null,
                bandwidth_count: "",
                floating_ip_id: null,
                floating_ip_count: "",
                cross_connect_id: null,
            });
            // Reset other search terms but keep region
            setSearchTerms({
                ...createInitialSearchState(),
                region: option ? option.name : "",
            });
            return;
        }

        updateField(field, value);

        setSearchTerms((prev) => ({
            ...prev,
            [
                field === "compute_instance_id"
                    ? "compute"
                    : field === "os_image_id"
                        ? "os"
                        : field === "volume_type_id"
                            ? "volume"
                            : field === "bandwidth_id"
                                ? "bandwidth"
                                : field === "floating_ip_id"
                                    ? "floatingIp"
                                    : "crossConnect"
            ]: option ? option.name : "",
        }));

        if (["bandwidth_id", "floating_ip_id", "cross_connect_id"].includes(field)) {
            setIsNetworkingOpen((prev) => prev || Boolean(option));
        }
    };

    const validateVolumeInput = () => {
        const newErrors = {};
        if (!data.volume_type_id) newErrors.volume_type_id = "Volume type is required.";
        if (!data.storage_size_gb || data.storage_size_gb < 1)
            newErrors.storage_size_gb = "Storage size must be at least 1 GB.";

        setItemErrors((prev) => ({ ...prev, ...newErrors }));
        return Object.keys(newErrors).length === 0;
    };

    const addVolume = () => {
        if (!validateVolumeInput()) return;

        const newVolume = {
            volume_type_id: data.volume_type_id,
            storage_size_gb: data.storage_size_gb,
        };

        onChange({
            ...data,
            volumes: [...(data.volumes || []), newVolume],
            volume_type_id: null,
            storage_size_gb: 50,
        });

        setSearchTerms((prev) => ({ ...prev, volume: "" }));
    };

    const removeVolume = (volIndex) => {
        onChange({
            ...data,
            volumes: data.volumes.filter((_, i) => i !== volIndex),
        });
    };

    return (
        <div className="space-y-6">
            <ModernCard padding="lg" className="space-y-6 relative">
                <div className="absolute top-4 right-4">
                    <ModernButton
                        size="sm"
                        variant="ghost"
                        className="text-red-500 hover:text-red-600"
                        onClick={onRemove}
                        leftIcon={<Trash2 className="h-4 w-4" />}
                    >
                        Remove Workload
                    </ModernButton>
                </div>

                <div className="space-y-1 pr-32">
                    <h3 className="text-lg font-semibold text-slate-900">Virtual machine workload #{index + 1}</h3>
                    <p className="text-sm text-slate-500">
                        Choose the location, compute profile, operating system, and runtime term for this VM bundle.
                    </p>
                </div>

                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-slate-700">
                            Region<span className="text-red-500">*</span>
                        </label>
                        {isRegionsFetching && (
                            <span className="flex items-center gap-1 text-xs text-slate-500">
                                <Loader2 className="h-3 w-3 animate-spin" /> Loading
                            </span>
                        )}
                    </div>
                    <SelectableInput
                        options={
                            regions?.map((region) => ({
                                id: region.code,
                                name: region.name,
                            })) || []
                        }
                        value={data.region}
                        searchValue={searchTerms.region}
                        onSearchChange={(value) =>
                            setSearchTerms((prev) => ({ ...prev, region: value }))
                        }
                        onSelect={handleSelectableChange("region")}
                        placeholder="Search regions"
                        isLoading={isRegionsFetching}
                        disabled={isRegionsFetching}
                        hasError={Boolean(itemErrors.region)}
                        emptyMessage="No regions found"
                    />
                    {itemErrors.region && (
                        <p className="text-xs font-medium text-red-600">{itemErrors.region}</p>
                    )}
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium text-slate-700">
                                Compute instance<span className="text-red-500">*</span>
                            </label>
                            {renderPricePill(
                                formatCurrency(
                                    selectedCompute?.pricing?.effective?.price_local,
                                    selectedCompute?.pricing?.effective?.currency
                                ) && `${formatCurrency(
                                    selectedCompute?.pricing?.effective?.price_local,
                                    selectedCompute?.pricing?.effective?.currency
                                )}/mo`
                            )}
                        </div>
                        <SelectableInput
                            options={
                                computerInstances?.map(({ product, pricing }) => ({
                                    id: product.productable_id,
                                    name: `${product.name} • ${formatCurrency(
                                        pricing?.effective?.price_local,
                                        pricing?.effective?.currency
                                    ) || "N/A"
                                        }`,
                                })) || []
                            }
                            value={data.compute_instance_id}
                            searchValue={searchTerms.compute}
                            onSearchChange={(value) =>
                                setSearchTerms((prev) => ({ ...prev, compute: value }))
                            }
                            onSelect={handleSelectableChange("compute_instance_id")}
                            placeholder="Search compute profiles"
                            disabled={!data.region}
                            isLoading={isComputerInstancesFetching}
                            hasError={Boolean(itemErrors.compute_instance_id)}
                            emptyMessage="No compute options"
                        />
                        {itemErrors.compute_instance_id && (
                            <p className="text-xs font-medium text-red-600">
                                {itemErrors.compute_instance_id}
                            </p>
                        )}
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium text-slate-700">
                                OS image<span className="text-red-500">*</span>
                            </label>
                            {renderPricePill(
                                formatCurrency(
                                    selectedOs?.pricing?.effective?.price_local,
                                    selectedOs?.pricing?.effective?.currency
                                ) && `${formatCurrency(
                                    selectedOs?.pricing?.effective?.price_local,
                                    selectedOs?.pricing?.effective?.currency
                                )}/mo`
                            )}
                        </div>
                        <SelectableInput
                            options={
                                osImages?.map(({ product, pricing }) => ({
                                    id: product.productable_id,
                                    name: `${product.name} • ${formatCurrency(
                                        pricing?.effective?.price_local,
                                        pricing?.effective?.currency
                                    ) || "N/A"
                                        }`,
                                })) || []
                            }
                            value={data.os_image_id}
                            searchValue={searchTerms.os}
                            onSearchChange={(value) =>
                                setSearchTerms((prev) => ({ ...prev, os: value }))
                            }
                            onSelect={handleSelectableChange("os_image_id")}
                            placeholder="Search OS images"
                            disabled={!data.region}
                            isLoading={isOsImagesFetching}
                            hasError={Boolean(itemErrors.os_image_id)}
                            emptyMessage="No OS images"
                        />
                        {itemErrors.os_image_id && (
                            <p className="text-xs font-medium text-red-600">
                                {itemErrors.os_image_id}
                            </p>
                        )}
                    </div>
                    <ModernInput
                        label="Term (months)"
                        type="number"
                        min="1"
                        value={data.months}
                        onChange={handleNumericChange("months", 1)}
                        error={itemErrors.months}
                        helper="Min 1 month"
                    />
                    <ModernInput
                        label="Number of instances"
                        type="number"
                        min="1"
                        value={data.number_of_instances}
                        onChange={handleNumericChange("number_of_instances", 1)}
                        error={itemErrors.number_of_instances}
                        helper="Min 1 instance"
                    />

                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium text-slate-700">
                                Volumes
                            </label>
                            {data.volumes?.length > 0 && (
                                <span className="text-xs text-slate-500">
                                    {data.volumes.length} added
                                </span>
                            )}
                        </div>

                        {/* List of added volumes */}
                        {data.volumes?.length > 0 && (
                            <div className="space-y-2 mb-3">
                                {data.volumes.map((vol, idx) => {
                                    const volProduct = ebsVolumes?.find(
                                        (v) => String(v.product.productable_id) === String(vol.volume_type_id)
                                    );
                                    return (
                                        <div
                                            key={idx}
                                            className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
                                        >
                                            <div className="flex items-center gap-2">
                                                <HardDrive className="h-4 w-4 text-slate-400" />
                                                <span className="font-medium text-slate-700">
                                                    {volProduct?.product?.name || "Volume"}
                                                </span>
                                                <span className="text-slate-400">•</span>
                                                <span className="text-slate-600">{vol.storage_size_gb} GB</span>
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

                        {/* Volume Input Fields */}
                        <div className="rounded-xl border border-slate-200 p-3 space-y-3 bg-slate-50/50">
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                                        Add Volume
                                    </label>
                                    {renderPricePill(
                                        formatCurrency(
                                            selectedVolume?.pricing?.effective?.price_local,
                                            selectedVolume?.pricing?.effective?.currency
                                        ) && `${formatCurrency(
                                            selectedVolume?.pricing?.effective?.price_local,
                                            selectedVolume?.pricing?.effective?.currency
                                        )}/GB`
                                    )}
                                </div>
                                <SelectableInput
                                    options={
                                        ebsVolumes?.map(({ product, pricing }) => ({
                                            id: product.productable_id,
                                            name: `${product.name} • ${formatCurrency(
                                                pricing?.effective?.price_local,
                                                pricing?.effective?.currency
                                            ) || "N/A"
                                                }`,
                                        })) || []
                                    }
                                    value={data.volume_type_id}
                                    searchValue={searchTerms.volume}
                                    onSearchChange={(value) =>
                                        setSearchTerms((prev) => ({ ...prev, volume: value }))
                                    }
                                    onSelect={handleSelectableChange("volume_type_id")}
                                    placeholder="Search volume types"
                                    disabled={!data.region}
                                    isLoading={isEbsVolumesFetching}
                                    hasError={Boolean(itemErrors.volume_type_id)}
                                    emptyMessage="No volume types"
                                />
                                {itemErrors.volume_type_id && (
                                    <p className="text-xs font-medium text-red-600">
                                        {itemErrors.volume_type_id}
                                    </p>
                                )}
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="flex-1">
                                    <ModernInput
                                        label="Storage size (GB)"
                                        type="number"
                                        min="1"
                                        value={data.storage_size_gb}
                                        onChange={handleNumericChange("storage_size_gb", 1)}
                                        error={itemErrors.storage_size_gb}
                                        helper="Min 1 GB"
                                    />
                                </div>
                                <div className="mt-7">
                                    <ModernButton
                                        variant="secondary"
                                        size="sm"
                                        onClick={addVolume}
                                        disabled={!data.volume_type_id}
                                        leftIcon={<Plus className="h-4 w-4" />}
                                    >
                                        Add
                                    </ModernButton>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </ModernCard>

            <ModernCard padding="lg" className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-1 items-start gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                            <Network className="h-5 w-5" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-slate-900">
                                Networking (optional)
                            </h3>
                            <p className="text-sm text-slate-500">
                                Attach bandwidth, floating IPs, and cross connects when needed.
                            </p>
                        </div>
                    </div>
                    <ModernButton
                        size="sm"
                        variant="ghost"
                        onClick={() => setIsNetworkingOpen((prev) => !prev)}
                    >
                        {isNetworkingOpen ? "Hide" : "Configure"}
                    </ModernButton>
                </div>
                <AnimatePresence initial={false}>
                    {isNetworkingOpen ? (
                        <motion.div
                            key="networking-expanded"
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25, ease: "easeOut" }}
                            className="space-y-4 overflow-hidden"
                        >
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <label className="text-sm font-medium text-slate-700">
                                            Bandwidth
                                        </label>
                                        {renderPricePill(
                                            formatCurrency(
                                                selectedBandwidth?.pricing?.effective?.price_local,
                                                selectedBandwidth?.pricing?.effective?.currency
                                            ) && `${formatCurrency(
                                                selectedBandwidth?.pricing?.effective?.price_local,
                                                selectedBandwidth?.pricing?.effective?.currency
                                            )}/unit`
                                        )}
                                    </div>
                                    <SelectableInput
                                        options={
                                            bandwidths?.map(({ product, pricing }) => ({
                                                id: product.productable_id,
                                                name: `${product.name} • ${formatCurrency(
                                                    pricing?.effective?.price_local,
                                                    pricing?.effective?.currency
                                                ) || "N/A"
                                                    }`,
                                            })) || []
                                        }
                                        value={data.bandwidth_id}
                                        searchValue={searchTerms.bandwidth}
                                        onSearchChange={(value) =>
                                            setSearchTerms((prev) => ({ ...prev, bandwidth: value }))
                                        }
                                        onSelect={handleSelectableChange("bandwidth_id")}
                                        placeholder="Attach bandwidth"
                                        disabled={!data.region}
                                        isLoading={isBandwidthsFetching}
                                        emptyMessage="No bandwidth options"
                                    />
                                    <ModernInput
                                        label="Bandwidth units"
                                        type="number"
                                        min="0"
                                        value={data.bandwidth_count}
                                        onChange={handleNumericChange("bandwidth_count", 0)}
                                        helper="Leave blank to skip"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <label className="text-sm font-medium text-slate-700">
                                            Floating IPs
                                        </label>
                                        {renderPricePill(
                                            formatCurrency(
                                                selectedFloatingIp?.pricing?.effective?.price_local,
                                                selectedFloatingIp?.pricing?.effective?.currency
                                            ) && `${formatCurrency(
                                                selectedFloatingIp?.pricing?.effective?.price_local,
                                                selectedFloatingIp?.pricing?.effective?.currency
                                            )}/unit`
                                        )}
                                    </div>
                                    <SelectableInput
                                        options={
                                            floatingIps?.map(({ product, pricing }) => ({
                                                id: product.productable_id,
                                                name: `${product.name} • ${formatCurrency(
                                                    pricing?.effective?.price_local,
                                                    pricing?.effective?.currency
                                                ) || "N/A"
                                                    }`,
                                            })) || []
                                        }
                                        value={data.floating_ip_id}
                                        searchValue={searchTerms.floatingIp}
                                        onSearchChange={(value) =>
                                            setSearchTerms((prev) => ({ ...prev, floatingIp: value }))
                                        }
                                        onSelect={handleSelectableChange("floating_ip_id")}
                                        placeholder="Attach floating IP"
                                        disabled={!data.region}
                                        isLoading={isFloatingIpsFetching}
                                        emptyMessage="No floating IP options"
                                    />
                                    <ModernInput
                                        label="Floating IP count"
                                        type="number"
                                        min="0"
                                        value={data.floating_ip_count}
                                        onChange={handleNumericChange("floating_ip_count", 0)}
                                        helper="Leave blank to skip"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <label className="text-sm font-medium text-slate-700">
                                            Cross Connect
                                        </label>
                                        {renderPricePill(
                                            formatCurrency(
                                                selectedCrossConnect?.pricing?.effective?.price_local,
                                                selectedCrossConnect?.pricing?.effective?.currency
                                            ) && `${formatCurrency(
                                                selectedCrossConnect?.pricing?.effective?.price_local,
                                                selectedCrossConnect?.pricing?.effective?.currency
                                            )}/mo`
                                        )}
                                    </div>
                                    <SelectableInput
                                        options={
                                            crossConnects?.map(({ product, pricing }) => ({
                                                id: product.productable_id,
                                                name: `${product.name} • ${formatCurrency(
                                                    pricing?.effective?.price_local,
                                                    pricing?.effective?.currency
                                                ) || "N/A"
                                                    }`,
                                            })) || []
                                        }
                                        value={data.cross_connect_id}
                                        searchValue={searchTerms.crossConnect}
                                        onSearchChange={(value) =>
                                            setSearchTerms((prev) => ({ ...prev, crossConnect: value }))
                                        }
                                        onSelect={handleSelectableChange("cross_connect_id")}
                                        placeholder="Attach cross connect"
                                        disabled={!data.region}
                                        isLoading={isCrossConnectsFetching}
                                        emptyMessage="No cross connect options"
                                    />
                                </div>
                            </div>
                        </motion.div>
                    ) : null}
                </AnimatePresence>
            </ModernCard>
        </div>
    );
};

export default WorkloadCard;
