import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Plus } from 'lucide-react';
import ModernInput from '../../components/ModernInput';
import ModernButton from '../../components/ModernButton';

const ResourceItemBuilder = ({
    formData,
    errors,
    updateFormData,
    regions = [],
    isRegionsFetching,
    computerInstances = [],
    isComputerInstancesFetching,
    osImages = [],
    isOsImagesFetching,
    ebsVolumes = [],
    isEbsVolumesFetching,
    bandwidths = [],
    isBandwidthsFetching,
    floatingIps = [],
    isFloatingIpsFetching,
    crossConnects = [],
    isCrossConnectsFetching,
    onAddRequest,
}) => {
    const [showNetworking, setShowNetworking] = useState(false);

    const selectClass =
        'w-full rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm transition focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400';

    return (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <header className="mb-6">
                <h3 className="text-base font-semibold text-slate-900">
                    Configure Resource Item
                </h3>
                <p className="text-sm text-slate-500">
                    Build a compute configuration with storage and optional networking.
                </p>
            </header>

            <div className="space-y-5">
                {/* Region */}
                <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                        Region <span className="text-red-500">*</span>
                    </label>
                    <select
                        value={formData.region}
                        onChange={(e) => updateFormData('region', e.target.value)}
                        className={`${selectClass} ${errors.region ? 'border-red-400' : ''}`}
                        disabled={isRegionsFetching}
                    >
                        <option value="">Select a region</option>
                        {regions?.map((region) => (
                            <option key={region.code} value={region.code}>
                                {region.name} ({region.code})
                            </option>
                        ))}
                    </select>
                    {errors.region && (
                        <p className="mt-1 text-xs text-red-600">{errors.region}</p>
                    )}
                </div>

                {/* Compute Instance */}
                <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                        Compute Instance <span className="text-red-500">*</span>
                    </label>
                    <select
                        value={formData.compute_instance_id || ''}
                        onChange={(e) => updateFormData('compute_instance_id', e.target.value)}
                        className={`${selectClass} ${errors.compute_instance_id ? 'border-red-400' : ''}`}
                        disabled={!formData.region || isComputerInstancesFetching}
                    >
                        <option value="">Select compute instance</option>
                        {computerInstances?.map((instance) => (
                            <option key={instance.product.productable_id} value={instance.product.productable_id}>
                                {instance.product.name}
                            </option>
                        ))}
                    </select>
                    {errors.compute_instance_id && (
                        <p className="mt-1 text-xs text-red-600">{errors.compute_instance_id}</p>
                    )}
                </div>

                {/* OS Image */}
                <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                        Operating System <span className="text-red-500">*</span>
                    </label>
                    <select
                        value={formData.os_image_id || ''}
                        onChange={(e) => updateFormData('os_image_id', e.target.value)}
                        className={`${selectClass} ${errors.os_image_id ? 'border-red-400' : ''}`}
                        disabled={!formData.region || isOsImagesFetching}
                    >
                        <option value="">Select OS image</option>
                        {osImages?.map((os) => (
                            <option key={os.product.productable_id} value={os.product.productable_id}>
                                {os.product.name}
                            </option>
                        ))}
                    </select>
                    {errors.os_image_id && (
                        <p className="mt-1 text-xs text-red-600">{errors.os_image_id}</p>
                    )}
                </div>

                {/* Term and Instances */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <ModernInput
                        label="Term (Months)"
                        type="number"
                        min="1"
                        value={formData.months}
                        onChange={(e) => updateFormData('months', e.target.value)}
                        required
                        error={errors.months}
                    />
                    <ModernInput
                        label="Number of Instances"
                        type="number"
                        min="1"
                        value={formData.number_of_instances}
                        onChange={(e) => updateFormData('number_of_instances', e.target.value)}
                        required
                        error={errors.number_of_instances}
                    />
                </div>

                {/* Storage Configuration */}
                <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4">
                    <h4 className="mb-3 text-sm font-semibold text-slate-900">Storage Configuration</h4>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700">
                                Volume Type <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={formData.volume_type_id || ''}
                                onChange={(e) => updateFormData('volume_type_id', e.target.value)}
                                className={`${selectClass} ${errors.volume_type_id ? 'border-red-400' : ''}`}
                                disabled={!formData.region || isEbsVolumesFetching}
                            >
                                <option value="">Select volume type</option>
                                {ebsVolumes?.map((volume) => (
                                    <option key={volume.product.productable_id} value={volume.product.productable_id}>
                                        {volume.product.name}
                                    </option>
                                ))}
                            </select>
                            {errors.volume_type_id && (
                                <p className="mt-1 text-xs text-red-600">{errors.volume_type_id}</p>
                            )}
                        </div>
                        <ModernInput
                            label="Storage Size (GB)"
                            type="number"
                            min="1"
                            value={formData.storage_size_gb}
                            onChange={(e) => updateFormData('storage_size_gb', e.target.value)}
                            placeholder="100"
                            required
                            error={errors.storage_size_gb}
                        />
                    </div>
                </div>

                {/* Networking - Collapsible */}
                <div className="rounded-2xl border border-slate-200 bg-white">
                    <button
                        type="button"
                        onClick={() => setShowNetworking(!showNetworking)}
                        className="flex w-full items-center justify-between p-4 text-left transition hover:bg-slate-50"
                    >
                        <div>
                            <h4 className="text-sm font-semibold text-slate-900">
                                Networking (Optional)
                            </h4>
                            <p className="text-xs text-slate-500">
                                Add bandwidth, floating IPs, or cross-connect
                            </p>
                        </div>
                        {showNetworking ? (
                            <ChevronUp className="h-5 w-5 text-slate-400" />
                        ) : (
                            <ChevronDown className="h-5 w-5 text-slate-400" />
                        )}
                    </button>

                    {showNetworking && (
                        <div className="space-y-4 border-t border-slate-200 p-4">
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700">
                                        Bandwidth
                                    </label>
                                    <select
                                        value={formData.bandwidth_id || ''}
                                        onChange={(e) => updateFormData('bandwidth_id', e.target.value)}
                                        className={selectClass}
                                        disabled={!formData.region || isBandwidthsFetching}
                                    >
                                        <option value="">None</option>
                                        {bandwidths?.map((bw) => (
                                            <option key={bw.product.productable_id} value={bw.product.productable_id}>
                                                {bw.product.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <ModernInput
                                    label="Bandwidth Count"
                                    type="number"
                                    min="0"
                                    value={formData.bandwidth_count}
                                    onChange={(e) => updateFormData('bandwidth_count', e.target.value)}
                                    placeholder="0"
                                />
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700">
                                        Floating IP
                                    </label>
                                    <select
                                        value={formData.floating_ip_id || ''}
                                        onChange={(e) => updateFormData('floating_ip_id', e.target.value)}
                                        className={selectClass}
                                        disabled={!formData.region || isFloatingIpsFetching}
                                    >
                                        <option value="">None</option>
                                        {floatingIps?.map((ip) => (
                                            <option key={ip.product.productable_id} value={ip.product.productable_id}>
                                                {ip.product.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <ModernInput
                                    label="Floating IP Count"
                                    type="number"
                                    min="0"
                                    value={formData.floating_ip_count}
                                    onChange={(e) => updateFormData('floating_ip_count', e.target.value)}
                                    placeholder="0"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-slate-700">
                                    Cross Connect
                                </label>
                                <select
                                    value={formData.cross_connect_id || ''}
                                    onChange={(e) => updateFormData('cross_connect_id', e.target.value)}
                                    className={selectClass}
                                    disabled={!formData.region || isCrossConnectsFetching}
                                >
                                    <option value="">None</option>
                                    {crossConnects?.map((cc) => (
                                        <option key={cc.product.productable_id} value={cc.product.productable_id}>
                                            {cc.product.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}
                </div>

                {/* Add Button */}
                <ModernButton
                    variant="primary"
                    size="lg"
                    className="w-full"
                    onClick={onAddRequest}
                    leftIcon={<Plus className="h-5 w-5" />}
                >
                    Add to Invoice
                </ModernButton>
            </div>
        </div>
    );
};

export default ResourceItemBuilder;
