import React from 'react';
import { TrendingUp, Package, MapPin, DollarSign, Tag, Receipt } from 'lucide-react';

const InvoiceStatsCard = ({ items = [], discount = null, totals = null }) => {
    const computeItems = items.filter(item => item.compute_instance_id);
    const storageItems = items.filter(item => item.productable_id);

    const totalInstances = computeItems.reduce(
        (sum, item) => sum + (item.number_of_instances || 0),
        0
    );

    const uniqueRegions = Array.from(
        new Set(items.map(item => item.region).filter(Boolean))
    );

    const stats = [
        {
            label: 'Total Items',
            value: items.length,
            icon: Package,
            color: 'primary',
        },
        {
            label: 'Compute Instances',
            value: totalInstances,
            icon: TrendingUp,
            color: 'blue',
        },
        {
            label: 'Storage Items',
            value: storageItems.length,
            icon: Receipt,
            color: 'amber',
        },
        {
            label: 'Regions',
            value: uniqueRegions.length,
            icon: MapPin,
            color: 'emerald',
        },
    ];

    if (discount && discount.value > 0) {
        stats.push({
            label: 'Discount',
            value: discount.type === 'percent' ? `${discount.value}%` : `$${discount.value}`,
            icon: Tag,
            color: 'green',
        });
    }

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                {stats.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                        <div
                            key={index}
                            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                        >
                            <div className="flex items-center gap-3">
                                <div className={`rounded-xl bg-${stat.color}-50 p-2`}>
                                    <Icon className={`h-5 w-5 text-${stat.color}-600`} />
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500">{stat.label}</p>
                                    <p className="text-lg font-semibold text-slate-900">
                                        {stat.value}
                                    </p>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {totals && (
                <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-primary-50 to-white p-6 shadow-sm">
                    <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-600">Subtotal</span>
                            <span className="font-medium text-slate-900">
                                ${totals.subtotal?.toFixed(2) || '0.00'}
                            </span>
                        </div>
                        {totals.discount > 0 && (
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-600">Discount</span>
                                <span className="font-medium text-green-600">
                                    -${totals.discount?.toFixed(2) || '0.00'}
                                </span>
                            </div>
                        )}
                        {totals.tax > 0 && (
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-600">Tax</span>
                                <span className="font-medium text-slate-900">
                                    ${totals.tax?.toFixed(2) || '0.00'}
                                </span>
                            </div>
                        )}
                        <div className="border-t border-slate-200 pt-3">
                            <div className="flex items-center justify-between">
                                <span className="text-base font-semibold text-slate-900">Total</span>
                                <span className="text-2xl font-bold text-primary-600">
                                    ${totals.total?.toFixed(2) || '0.00'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InvoiceStatsCard;
