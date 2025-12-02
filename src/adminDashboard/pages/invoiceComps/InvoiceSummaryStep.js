import React from 'react';
import InvoiceStatsCard from '../../components/invoice/InvoiceStatsCard';
import InvoiceItemQueue from '../../components/invoice/InvoiceItemQueue';

const InvoiceSummaryStep = ({ pricingRequests, objectStorageRequests, formData }) => {
    const allItems = [...pricingRequests, ...objectStorageRequests];

    const discount = formData.apply_total_discount && formData.total_discount_value
        ? {
            type: formData.total_discount_type,
            value: parseFloat(formData.total_discount_value),
            label: formData.total_discount_label,
        }
        : null;

    return (
        <div className="space-y-6">
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <header className="mb-6">
                    <h3 className="text-base font-semibold text-slate-900">
                        Invoice Summary
                    </h3>
                    <p className="text-sm text-slate-500">
                        Review all items and configurations before proceeding to final review.
                    </p>
                </header>

                <InvoiceStatsCard items={allItems} discount={discount} />
            </section>

            {pricingRequests.length > 0 && (
                <section>
                    <InvoiceItemQueue
                        items={pricingRequests}
                        readOnly
                        type="compute"
                    />
                </section>
            )}

            {objectStorageRequests.length > 0 && (
                <section>
                    <InvoiceItemQueue
                        items={objectStorageRequests}
                        readOnly
                        type="storage"
                    />
                </section>
            )}

            {formData.apply_total_discount && formData.total_discount_value && (
                <div className="rounded-2xl border border-green-200 bg-green-50 p-4">
                    <p className="text-sm font-medium text-green-900">
                        Global discount active
                    </p>
                    <p className="text-xs text-green-700">
                        {formData.total_discount_type === 'percent'
                            ? `${formData.total_discount_value}% discount`
                            : `$${formData.total_discount_value} discount`}
                        {formData.total_discount_label && ` - ${formData.total_discount_label}`}
                    </p>
                </div>
            )}
        </div>
    );
};

export default InvoiceSummaryStep;
