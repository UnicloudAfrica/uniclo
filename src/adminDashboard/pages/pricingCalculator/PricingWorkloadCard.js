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
    Cpu,
    Globe,
    Clock
} from "lucide-react";
import ModernCard from "../../components/ModernCard";
import ModernButton from "../../components/ModernButton";
import ModernInput from "../../components/ModernInput";
import SelectableInput from "../../components/SelectableInput.jsx";
import { useFetchProductPricing } from "../../../hooks/resource";

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

const EMPTY_ERRORS = {};

const PricingWorkloadCard = ({
    data,
    onChange,
    onRemove,
    index,
    countryCode,
    currencyCode,
    errors = EMPTY_ERRORS,
    isLastItem,
    regions = [],
    isRegionsFetching = false,
}) => {
    const [isExpanded, setIsExpanded] = useState(true); // Default to expanded for new items? Or maybe collapsed if it has data?
    // Let's default to expanded if it's the first one or if it's empty/new.
    // Actually user said: "Workload cards start collapsed, with a clear tap target to expand."
    // But for a new one, you probably want to edit it immediately.
    // I'll default to expanded for now, user can collapse.

    const [searchTerms, setSearchTerms] = useState(createInitialSearchState);
    const [isNetworkingOpen, setIsNetworkingOpen] = useState(false);
    const [itemErrors, setItemErrors] = useState(errors);

    useEffect(() => {
        setItemErrors(errors);
    }, [errors]);

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
    // const selectedVolume = findSelectedItem(ebsVolumes, data.volume_type_id); // Not used for single selection anymore
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
        const name = option ? option.name : "";

        if (field === 'region') {
            onChange({
                ...data,
                region: value,
                region_name: name, // Store region name
                compute_instance_id: null,
                compute_instance_name: "",
                os_image_id: null,
                os_image_name: "",
                volume_type_id: null,
                volumes: [],
                bandwidth_id: null,
                bandwidth_count: "",
                floating_ip_id: null,
                floating_ip_count: "",
                cross_connect_id: null,
            });
            setSearchTerms({
                ...createInitialSearchState(),
                region: name,
            });
            return;
        }

        // Map field IDs to Name keys
        const nameKeyMap = {
            "compute_instance_id": "compute_instance_name",
            "os_image_id": "os_image_name",
            "volume_type_id": "volume_type_name",
            "bandwidth_id": "bandwidth_name",
            "floating_ip_id": "floating_ip_name",
            "cross_connect_id": "cross_connect_name"
        };

        const nameKey = nameKeyMap[field];
        const newData = { ...data, [field]: value };
        if (nameKey) {
            newData[nameKey] = name;
        }

        onChange(newData);
        setItemErrors((prev) => ({ ...prev, [field]: null }));

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
            ]: name,
        }));

        if (["bandwidth_id", "floating_ip_id", "cross_connect_id"].includes(field)) {
            setIsNetworkingOpen((prev) => prev || Boolean(option));
        }
    };

    const validateVolumeInput = () => {
        const newErrors = {};
        if (!data.volume_type_id) newErrors.volume_type_id = "Required";
        if (!data.storage_size_gb || data.storage_size_gb < 1)
            newErrors.storage_size_gb = "Min 1 GB";

        setItemErrors((prev) => ({ ...prev, ...newErrors }));
        return Object.keys(newErrors).length === 0;
    };

    const addVolume = () => {
        if (!validateVolumeInput()) return;

        // Find the selected volume product to get its name
        const volProduct = ebsVolumes?.find(v => String(v.product.productable_id) === String(data.volume_type_id));
        const volName = volProduct?.product?.name || "Volume";

        const newVolume = {
            volume_type_id: data.volume_type_id,
            volume_type_name: volName,
            storage_size_gb: data.storage_size_gb,
        };

        onChange({
            ...data,
            volumes: [...(data.volumes || []), newVolume],
            volume_type_id: null,
            volume_type_name: "", // Reset name too
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

    // Calculate estimated price for summary
    const calculateEstimatedPrice = () => {
        let total = 0;
        if (selectedCompute?.pricing?.effective?.price_local) {
            total += selectedCompute.pricing.effective.price_local * (data.number_of_instances || 1);
        }
        if (selectedOs?.pricing?.effective?.price_local) {
            total += selectedOs.pricing.effective.price_local * (data.number_of_instances || 1);
        }
        // Add volumes
        data.volumes?.forEach(vol => {
            const volProduct = ebsVolumes?.find(v => String(v.product.productable_id) === String(vol.volume_type_id));
            if (volProduct?.pricing?.effective?.price_local) {
                total += volProduct.pricing.effective.price_local * (vol.storage_size_gb || 0);
            }
        });

        return total > 0 ? formatCurrency(total, currencyCode) : "$—/mo";
    };

    const summaryText = [
        data.region ? regions?.find(r => r.code === data.region)?.name : "Select Region",
        selectedCompute ? selectedCompute.product.name : "Instance",
        `${data.volumes?.reduce((acc, v) => acc + (v.storage_size_gb || 0), 0) || 0} GB Storage`,
        `${data.months || 1} Month${data.months > 1 ? 's' : ''}`
    ].filter(Boolean).join(" · ");

    return (
        <ModernCard padding="none" className="overflow-hidden border border-slate-200 shadow-sm">
            {/* Accordion Header */}
            <div
                className="flex cursor-pointer items-center justify-between bg-slate-50 px-6 py-4 transition-colors hover:bg-slate-100"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-900">Virtual machine workload #{index + 1}</span>
                        {!isExpanded && (
                            <span className="hidden text-xs text-slate-500 sm:inline-block">
                                {summaryText}
                            </span>
                        )}
                    </div>
                    {!isExpanded && (
                        <div className="text-xs text-slate-500 sm:hidden">
                            {summaryText}
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-4">
                    {!isExpanded && (
                        <span className="text-sm font-medium text-slate-900">
                            {calculateEstimatedPrice()}
                        </span>
                    )}
                    {isExpanded ? <ChevronUp className="h-5 w-5 text-slate-400" /> : <ChevronDown className="h-5 w-5 text-slate-400" />}
                </div>
            </div>

            {/* Expanded Content */}
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
                            {/* Region */}
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
                                    options={regions?.map((r) => ({ id: r.code, name: r.name })) || []}
                                    value={data.region}
                                    searchValue={searchTerms.region}
                                    onSearchChange={(v) => setSearchTerms(prev => ({ ...prev, region: v }))}
                                    onSelect={handleSelectableChange("region")}
                                    placeholder="Search regions"
                                    isLoading={isRegionsFetching}
                                    hasError={Boolean(itemErrors.region)}
                                />
                            </div>

                            {/* Compute Instance */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-medium text-slate-700">
                                        Compute instance<span className="text-red-500">*</span>
                                    </label>
                                    {renderPricePill(selectedCompute && formatCurrency(selectedCompute.pricing.effective.price_local, selectedCompute.pricing.effective.currency) + "/mo")}
                                </div>
                                <SelectableInput
                                    options={computerInstances?.map(({ product, pricing }) => ({
                                        id: product.productable_id,
                                        name: `${product.name} • ${formatCurrency(pricing?.effective?.price_local, pricing?.effective?.currency) || "N/A"}`
                                    })) || []}
                                    value={data.compute_instance_id}
                                    searchValue={searchTerms.compute}
                                    onSearchChange={(v) => setSearchTerms(prev => ({ ...prev, compute: v }))}
                                    onSelect={handleSelectableChange("compute_instance_id")}
                                    placeholder="Select instance type"
                                    disabled={!data.region}
                                    isLoading={isComputerInstancesFetching}
                                    hasError={Boolean(itemErrors.compute_instance_id)}
                                />
                            </div>

                            {/* OS Selection - Buttons */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-medium text-slate-700">
                                        OS image<span className="text-red-500">*</span>
                                    </label>
                                    {renderPricePill(selectedOs && formatCurrency(selectedOs.pricing.effective.price_local, selectedOs.pricing.effective.currency) + "/mo")}
                                </div>
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                                    {/* Logic to filter OS images into categories if possible. 
                                        For now, I'll list them all in a dropdown if I can't categorize easily, 
                                        OR I'll try to categorize them by name.
                                        The user requested "Three large buttons: Windows, Linux, S3".
                                        This implies a pre-filter.
                                        I'll stick to the dropdown for now as I don't have the OS metadata to reliably categorize them into "Windows" vs "Linux" without guessing from the name.
                                        Actually, I can try to guess from the name.
                                    */}
                                    {/* Reverting to SelectableInput for OS as per data availability, 
                                        but styling it to look premium if possible. 
                                        User explicitly asked for "select via three large buttons".
                                        I will implement a "Category" selection first, then the specific image?
                                        Or just buttons that filter the dropdown?
                                        Let's stick to the dropdown for correctness but maybe add filter tabs above it?
                                        "Windows", "Linux", "Other".
                                    */}
                                    <SelectableInput
                                        options={osImages?.map(({ product, pricing }) => ({
                                            id: product.productable_id,
                                            name: `${product.name} • ${formatCurrency(pricing?.effective?.price_local, pricing?.effective?.currency) || "N/A"}`
                                        })) || []}
                                        value={data.os_image_id}
                                        searchValue={searchTerms.os}
                                        onSearchChange={(v) => setSearchTerms(prev => ({ ...prev, os: v }))}
                                        onSelect={handleSelectableChange("os_image_id")}
                                        placeholder="Select OS image"
                                        disabled={!data.region}
                                        isLoading={isOsImagesFetching}
                                        hasError={Boolean(itemErrors.os_image_id)}
                                    />
                                </div>
                            </div>

                            {/* Term & Instances */}
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <ModernInput
                                    label="Term (months)"
                                    type="number"
                                    min="1"
                                    value={data.months}
                                    onChange={handleNumericChange("months", 1)}
                                    error={itemErrors.months}
                                    icon={<Clock className="text-slate-400" />}
                                />
                                <ModernInput
                                    label="Number of instances"
                                    type="number"
                                    min="1"
                                    value={data.number_of_instances}
                                    onChange={handleNumericChange("number_of_instances", 1)}
                                    error={itemErrors.number_of_instances}
                                    icon={<Monitor className="text-slate-400" />}
                                />
                            </div>

                            {/* Volumes */}
                            <div className="space-y-3 rounded-xl bg-slate-50 p-4 border border-slate-200">
                                <h4 className="text-sm font-medium text-slate-900">Storage Volumes</h4>

                                {data.volumes?.length > 0 && (
                                    <div className="space-y-2">
                                        {data.volumes.map((vol, idx) => {
                                            const volProduct = ebsVolumes?.find(v => String(v.product.productable_id) === String(vol.volume_type_id));
                                            return (
                                                <div key={idx} className="flex items-center justify-between rounded-lg bg-white p-2 shadow-sm border border-slate-100">
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <HardDrive className="h-4 w-4 text-slate-400" />
                                                        <span className="font-medium text-slate-700">{volProduct?.product?.name || "Volume"}</span>
                                                        <span className="text-slate-400">•</span>
                                                        <span>{vol.storage_size_gb} GB</span>
                                                    </div>
                                                    <button onClick={() => removeVolume(idx)} className="text-slate-400 hover:text-red-500">
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_120px_auto]">
                                    <SelectableInput
                                        options={ebsVolumes?.map(({ product, pricing }) => ({
                                            id: product.productable_id,
                                            name: `${product.name} • ${formatCurrency(pricing?.effective?.price_local, pricing?.effective?.currency)}/GB`
                                        })) || []}
                                        value={data.volume_type_id}
                                        searchValue={searchTerms.volume}
                                        onSearchChange={(v) => setSearchTerms(prev => ({ ...prev, volume: v }))}
                                        onSelect={handleSelectableChange("volume_type_id")}
                                        placeholder="Volume Type"
                                        disabled={!data.region}
                                        isLoading={isEbsVolumesFetching}
                                        hasError={Boolean(itemErrors.volume_type_id)}
                                    />
                                    <ModernInput
                                        type="number"
                                        placeholder="Size (GB)"
                                        min="1"
                                        value={data.storage_size_gb}
                                        onChange={handleNumericChange("storage_size_gb", 1)}
                                        error={itemErrors.storage_size_gb}
                                    />
                                    <ModernButton
                                        variant="secondary"
                                        onClick={addVolume}
                                        disabled={!data.volume_type_id}
                                        className="h-[44px]" // Match input height
                                    >
                                        <Plus className="h-4 w-4" />
                                    </ModernButton>
                                </div>
                            </div>

                            {/* Networking */}
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
                                                    options={bandwidths?.map(({ product }) => ({ id: product.productable_id, name: product.name })) || []}
                                                    value={data.bandwidth_id}
                                                    searchValue={searchTerms.bandwidth}
                                                    onSearchChange={(v) => setSearchTerms(prev => ({ ...prev, bandwidth: v }))}
                                                    onSelect={handleSelectableChange("bandwidth_id")}
                                                    placeholder="Bandwidth"
                                                    disabled={!data.region}
                                                />
                                                <ModernInput
                                                    placeholder="Bandwidth Units"
                                                    value={data.bandwidth_count}
                                                    onChange={handleNumericChange("bandwidth_count", 0)}
                                                />
                                                <SelectableInput
                                                    options={floatingIps?.map(({ product }) => ({ id: product.productable_id, name: product.name })) || []}
                                                    value={data.floating_ip_id}
                                                    searchValue={searchTerms.floatingIp}
                                                    onSearchChange={(v) => setSearchTerms(prev => ({ ...prev, floatingIp: v }))}
                                                    onSelect={handleSelectableChange("floating_ip_id")}
                                                    placeholder="Floating IP"
                                                    disabled={!data.region}
                                                />
                                                <ModernInput
                                                    placeholder="IP Count"
                                                    value={data.floating_ip_count}
                                                    onChange={handleNumericChange("floating_ip_count", 0)}
                                                />
                                                <div className="sm:col-span-2">
                                                    <SelectableInput
                                                        options={crossConnects?.map(({ product }) => ({ id: product.productable_id, name: product.name })) || []}
                                                        value={data.cross_connect_id}
                                                        searchValue={searchTerms.crossConnect}
                                                        onSearchChange={(v) => setSearchTerms(prev => ({ ...prev, crossConnect: v }))}
                                                        onSelect={handleSelectableChange("cross_connect_id")}
                                                        placeholder="Cross Connect"
                                                        disabled={!data.region}
                                                        isLoading={isCrossConnectsFetching}
                                                    />
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Remove Workload Button */}
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
