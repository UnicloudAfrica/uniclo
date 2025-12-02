import React from 'react';
import { X, Package } from 'lucide-react';
import { formatRegionName } from '../../../utils/regionUtils';

const InvoiceItemQueue = ({ items = [], onRemove, onEdit, readOnly = false, type = 'compute' }) => {
    if (items.length === 0) {
        return (
            <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-8 text-center">
                <Package className="mx-auto h-12 w-12 text-slate-300" />
                <p className="mt-3 text-sm font-medium text-slate-600">
                    No items added yet
                </p>
                <p className="mt-1 text-xs text-slate-500">
                    Configure and add items using the builder above
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-slate-900">
                    {type === 'compute' ? 'Compute Configurations' : 'Storage Items'} ({items.length})
                </h4>
            </div>
            <div className="space-y-2">
                {items.map((item, index) => (
                    <div
                        key={index}
                        className="group relative rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-primary-200 hover:shadow-md"
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 space-y-2">
                                <div className="flex items-center gap-2">
                                    <span className="inline-flex items-center rounded-full bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-700">
                                        {formatRegionName(item.region)}
                                    </span>
                                    {item._display?.compute && (
                                        <span className="text-sm font-semibold text-slate-900">
                                            {item._display.compute}
                                        </span>
                                    )}
                                    {item._display?.name && (
                                        <span className="text-sm font-semibold text-slate-900">
                                            {item._display.name}
                                        </span>
                                    )}
                                </div>
                                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
                                    {item._display?.os && (
                                        <span>OS: {item._display.os}</span>
                                    )}
                                    {item.number_of_instances && (
                                        <span>
                                            {item.number_of_instances} instance{item.number_of_instances > 1 ? 's' : ''}
                                        </span>
                                    )}
                                    {item.months && (
                                        <span>
                                            {item.months} month{item.months > 1 ? 's' : ''}
                                        </span>
                                    )}
                                    {item._display?.storage && (
                                        <span>Storage: {item._display.storage}</span>
                                    )}
                                    {item._display?.quantity && (
                                        <span>{item._display.quantity}</span>
                                    )}
                                </div>
                            </div>
                            {!readOnly && (
                                <button
                                    onClick={() => onRemove(index)}
                                    className="rounded-lg p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                                    aria-label="Remove item"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default InvoiceItemQueue;
