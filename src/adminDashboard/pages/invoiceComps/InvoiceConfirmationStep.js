import React from 'react';
import { Download, CheckCircle, FileText, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ModernCard from '../../components/ModernCard';
import ModernButton from '../../components/ModernButton';

const formatCurrency = (amount, currency = 'USD') => {
    if (amount === null || amount === undefined) return '—';
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
    }).format(amount);
};

const downloadPdf = (base64String, filename) => {
    if (!base64String) {
        console.error('No PDF data available');
        return;
    }

    try {
        const byteCharacters = atob(base64String);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = filename;
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Error downloading PDF:', error);
        alert('Unable to download PDF. The file may not be ready yet.');
    }
};

const TotalsCard = ({ amounts }) => (
    <div className="w-full space-y-2 rounded-3xl border border-slate-200 bg-gradient-to-br from-primary-50 to-white p-6">
        {amounts.pre_discount_subtotal &&
            amounts.pre_discount_subtotal !== amounts.subtotal && (
                <div className="flex items-center justify-between text-sm text-slate-500">
                    <span>Subtotal before discount</span>
                    <span className="font-medium text-slate-700">
                        {formatCurrency(amounts.pre_discount_subtotal, amounts.currency)}
                    </span>
                </div>
            )}
        {amounts.discount > 0 && (
            <div className="flex items-center justify-between text-sm text-green-600">
                <span>{amounts.discount_label || 'Discount'}</span>
                <span className="font-semibold">
                    -{formatCurrency(amounts.discount, amounts.currency)}
                </span>
            </div>
        )}
        <div className="flex items-center justify-between border-t border-slate-200 pt-2 text-sm text-slate-600">
            <span>Subtotal</span>
            <span className="font-semibold">
                {formatCurrency(amounts.subtotal, amounts.currency)}
            </span>
        </div>
        <div className="flex items-center justify-between text-sm text-slate-600">
            <span>Tax</span>
            <span className="font-semibold">
                {formatCurrency(amounts.tax, amounts.currency)}
            </span>
        </div>
        <div className="flex items-center justify-between border-t-2 border-slate-300 pt-3 text-lg font-bold text-slate-900">
            <span>Total</span>
            <span className="text-primary-600">
                {formatCurrency(amounts.total, amounts.currency)}
            </span>
        </div>
    </div>
);

const InvoiceConfirmationStep = ({ apiResponse }) => {
    const navigate = useNavigate();

    console.log('API Response:', apiResponse); // Debug log

    if (!apiResponse?.invoices?.length) {
        return (
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-8 text-center text-sm text-slate-500">
                No invoice details available yet.
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Success Header */}
            <div className="space-y-3 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 ring-4 ring-emerald-100">
                    <CheckCircle className="h-9 w-9" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">
                    Invoice Generated Successfully
                </h3>
                <p className="text-sm text-slate-500">
                    Your invoice has been created and is ready to download or share.
                </p>
            </div>

            {/* Invoice Cards */}
            <div className="space-y-6">
                {apiResponse.invoices.map((invoiceData) => {
                    const invoice = invoiceData.payload;
                    const currency = invoice.amounts?.currency || invoice.currency_code || invoice.currency || 'USD';

                    console.log('Invoice:', invoice); // Debug log
                    console.log('Currency:', currency); // Debug log

                    return (
                        <ModernCard
                            key={invoice.invoice_number}
                            padding="xl"
                            className="space-y-6"
                        >
                            {/* Invoice Header */}
                            <div className="flex items-start justify-between border-b border-slate-200 pb-6">
                                <div className="flex items-start gap-4">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 text-primary-600">
                                        <FileText className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-semibold text-slate-900">
                                            {invoice.subject || 'Invoice'}
                                        </h4>
                                        <p className="text-sm text-slate-500">
                                            Invoice #{invoice.invoice_number}
                                        </p>
                                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
                                            <span>Bill To: {invoice.bill_to?.name || invoice.bill_to_name}</span>
                                            {invoice.issued_at && (
                                                <span>Issued: {new Date(invoice.issued_at).toLocaleDateString()}</span>
                                            )}
                                            {invoice.due_at && (
                                                <span>Due: {new Date(invoice.due_at).toLocaleDateString()}</span>
                                            )}
                                            <span>Currency: {currency}</span>
                                        </div>
                                    </div>
                                </div>
                                <ModernButton
                                    variant="primary"
                                    size="sm"
                                    leftIcon={<Download className="h-4 w-4" />}
                                    onClick={() =>
                                        downloadPdf(
                                            invoiceData.pdf,
                                            invoiceData.filename || `invoice-${invoice.invoice_number}.pdf`
                                        )
                                    }
                                >
                                    Download PDF
                                </ModernButton>
                            </div>

                            {/* Line Items */}
                            {invoice.line_items?.length > 0 && (
                                <div>
                                    <h5 className="mb-3 text-sm font-semibold text-slate-900">
                                        Line Items
                                    </h5>
                                    <div className="overflow-hidden rounded-2xl border border-slate-200">
                                        <table className="w-full text-sm">
                                            <thead className="bg-slate-50">
                                                <tr>
                                                    <th className="px-4 py-3 text-left font-medium text-slate-700">
                                                        Description
                                                    </th>
                                                    <th className="px-4 py-3 text-right font-medium text-slate-700">
                                                        Quantity
                                                    </th>
                                                    <th className="px-4 py-3 text-right font-medium text-slate-700">
                                                        Unit Price
                                                    </th>
                                                    <th className="px-4 py-3 text-right font-medium text-slate-700">
                                                        Total
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-200 bg-white">
                                                {invoice.line_items.map((item, idx) => (
                                                    <tr key={idx} className="hover:bg-slate-50">
                                                        <td className="px-4 py-3 text-slate-900">
                                                            {item.name || item.description || 'N/A'}
                                                        </td>
                                                        <td className="px-4 py-3 text-right text-slate-600">
                                                            {item.quantity || '—'}
                                                        </td>
                                                        <td className="px-4 py-3 text-right text-slate-600">
                                                            {formatCurrency(item.unit_amount || item.unit_price, item.currency || currency)}
                                                        </td>
                                                        <td className="px-4 py-3 text-right font-medium text-slate-900">
                                                            {formatCurrency(item.total, item.currency || currency)}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* Totals */}
                            <div className="flex justify-end">
                                <TotalsCard amounts={{
                                    currency: currency,
                                    pre_discount_subtotal: invoice.amounts?.pre_discount_subtotal,
                                    discount: invoice.amounts?.discount || 0,
                                    subtotal: invoice.amounts?.subtotal,
                                    tax: invoice.amounts?.tax,
                                    total: invoice.amounts?.total
                                }} />
                            </div>
                        </ModernCard>
                    );
                })}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                <ModernButton
                    variant="outline"
                    size="lg"
                    leftIcon={<Plus className="h-5 w-5" />}
                    onClick={() => window.location.reload()}
                >
                    Create Another Invoice
                </ModernButton>
                <ModernButton
                    variant="primary"
                    size="lg"
                    onClick={() => navigate('/admin-dashboard')}
                >
                    Back to Dashboard
                </ModernButton>
            </div>
        </div>
    );
};

export default InvoiceConfirmationStep;
