import React from 'react';
import ModernCard from '../../components/ModernCard';
import { Server, Inbox, Globe, CreditCard, HardDrive, Cpu, Monitor, Network } from 'lucide-react';

const PricingLiveSummary = ({ calculatorData, currency }) => {
    const workloadCount = calculatorData.pricing_requests?.length || 0;
    const storageCount = calculatorData.object_storage_items?.length || 0;

    const totalVolumes = calculatorData.pricing_requests?.reduce((acc, req) => {
        return acc + (req.volumes?.length || 0);
    }, 0) || 0;

    return (
        <div className="sticky top-24 space-y-4">
            <ModernCard padding="md" className="space-y-4 border-l-4 border-l-primary-500">
                <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-slate-900">Configuration Summary</h3>
                    {currency && (
                        <span className="text-xs font-medium px-2 py-1 rounded bg-slate-100 text-slate-600">
                            {currency}
                        </span>
                    )}
                </div>

                <div className="space-y-4">
                    {/* Location */}
                    <div className="flex items-start gap-3 text-sm">
                        <Globe className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                        <div>
                            <p className="font-medium text-slate-700">Location</p>
                            <p className="text-slate-500">
                                {calculatorData.country_code || "Not selected"}
                            </p>
                        </div>
                    </div>

                    <div className="h-px bg-slate-100" />

                    {/* Compute Details */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                            <Server className="h-4 w-4 text-slate-400" />
                            <span>Compute Workloads ({workloadCount})</span>
                        </div>

                        {workloadCount > 0 ? (
                            <div className="space-y-3 pl-6">
                                {calculatorData.pricing_requests.map((req, i) => (
                                    <div key={i} className="text-xs space-y-1 border-l-2 border-slate-100 pl-3 py-1">
                                        <p className="font-medium text-slate-900">
                                            Workload #{i + 1}
                                            {req.region_name && <span className="text-slate-500 font-normal"> • {req.region_name}</span>}
                                        </p>

                                        {/* Instance */}
                                        <div className="flex items-start gap-1.5 text-slate-600">
                                            <Cpu className="h-3 w-3 mt-0.5 shrink-0" />
                                            <span>
                                                {req.number_of_instances}x {req.compute_instance_name?.split('•')[0] || "Instance"}
                                            </span>
                                        </div>

                                        {/* OS */}
                                        {req.os_image_name && (
                                            <div className="flex items-start gap-1.5 text-slate-600">
                                                <Monitor className="h-3 w-3 mt-0.5 shrink-0" />
                                                <span>{req.os_image_name.split('•')[0]}</span>
                                            </div>
                                        )}

                                        {/* Volumes */}
                                        {req.volumes?.length > 0 && (
                                            <div className="flex items-start gap-1.5 text-slate-600">
                                                <HardDrive className="h-3 w-3 mt-0.5 shrink-0" />
                                                <div className="space-y-0.5">
                                                    {req.volumes.map((vol, vIdx) => (
                                                        <div key={vIdx}>
                                                            {vol.storage_size_gb}GB {vol.volume_type_name?.split('•')[0] || "Volume"}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Networking */}
                                        {(req.bandwidth_name || req.floating_ip_name || req.cross_connect_name) && (
                                            <div className="flex items-start gap-1.5 text-slate-600">
                                                <Network className="h-3 w-3 mt-0.5 shrink-0" />
                                                <div className="space-y-0.5">
                                                    {req.bandwidth_name && <div>{req.bandwidth_name}</div>}
                                                    {req.floating_ip_name && <div>{req.floating_ip_count || 1}x {req.floating_ip_name}</div>}
                                                    {req.cross_connect_name && <div>{req.cross_connect_name}</div>}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-xs text-slate-400 pl-6">No workloads configured</p>
                        )}
                    </div>

                    {/* Object Storage Details */}
                    {storageCount > 0 && (
                        <>
                            <div className="h-px bg-slate-100" />
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                                    <Inbox className="h-4 w-4 text-slate-400" />
                                    <span>Object Storage ({storageCount})</span>
                                </div>
                                <div className="space-y-2 pl-6">
                                    {calculatorData.object_storage_items.map((item, i) => (
                                        <div key={i} className="text-xs text-slate-600 border-l-2 border-slate-100 pl-3 py-1">
                                            <p className="font-medium text-slate-900">{item.product_name}</p>
                                            <p>{item.quantity} GB • {item.months} Month{item.months !== 1 ? 's' : ''}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </ModernCard>
        </div>
    );
};

export default PricingLiveSummary;
