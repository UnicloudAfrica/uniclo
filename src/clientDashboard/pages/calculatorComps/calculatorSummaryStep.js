import React, { useState } from "react";
import {
  FileText,
  Download,
  User,
  Building,
  Phone,
  Mail,
  Loader2,
  Calculator,
  CheckCircle,
} from "lucide-react";
import ToastUtils from "../../../utils/toastUtil";
import { useSharedMultiQuotes } from "../../../hooks/sharedCalculatorHooks";
import { formatRegionName } from "../../../utils/regionUtils";

const CalculatorSummaryStep = ({
  calculatorData,
  pricingResult,
  onRecalculate,
}) => {
  const [showInvoiceOptions, setShowInvoiceOptions] = useState(false);
  const [showLeadOptions, setShowLeadOptions] = useState(false);
  const [isGeneratingInvoice, setIsGeneratingInvoice] = useState(false);
  const [isCreatingLead, setIsCreatingLead] = useState(false);
  
  // Use shared multi-quotes hook
  const { mutate: createMultiQuote, isPending: isMultiQuotePending } = useSharedMultiQuotes();

  const [invoiceData, setInvoiceData] = useState({
    subject: "",
    email: "",
    bill_to_name: "",
    notes: "",
  });

  const [leadData, setLeadData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    company: "",
    country: "",
  });

  const [errors, setErrors] = useState({});

  const inputClass =
    "block w-full rounded-md border-gray-300 focus:border-[--theme-color] focus:ring-[--theme-color] sm:text-sm input-field";

  const formatCurrency = (amount, currency = "USD") => {
    if (amount === null || amount === undefined) return "N/A";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(amount);
  };

  const generateInvoice = async () => {
    // Validate invoice data
    const newErrors = {};
    if (!invoiceData.subject) newErrors.subject = "Subject is required";
    if (!invoiceData.email) newErrors.email = "Email is required";
    if (!invoiceData.bill_to_name)
      newErrors.bill_to_name = "Bill to name is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsGeneratingInvoice(true);

    try {
      const payload = {
        ...invoiceData,
        create_lead: true, // Automatically create lead when generating invoice
        lead_info: {
          first_name: invoiceData.bill_to_name ? invoiceData.bill_to_name.split(' ')[0] || '' : '',
          last_name: invoiceData.bill_to_name ? invoiceData.bill_to_name.split(' ').slice(1).join(' ') || '' : '',
          email: invoiceData.email || '',
          phone: null,
          company: null,
          country: null,
        },
        pricing_requests: calculatorData.pricing_requests.map((req) => {
          const { _display, ...rest } = req;
          return rest;
        }),
        object_storage_items: (calculatorData.object_storage_items || []).map(
          (item) => {
            const { _display, ...rest } = item;
            return rest;
          }
        ),
        country_code: calculatorData.country_code || null,
      };

      createMultiQuote(payload, {
        onSuccess: (data) => {
          ToastUtils.success("Invoice generated successfully!");
          
          // Handle PDF download if available
          if (data.invoices && data.invoices[0] && data.invoices[0].pdf) {
            downloadPdf(
              data.invoices[0].pdf,
              data.invoices[0].filename || "invoice.pdf"
            );
          }
          setIsGeneratingInvoice(false);
        },
        onError: (error) => {
          console.error('Invoice generation error:', error);
          ToastUtils.error(error.message || "Failed to generate invoice. Please try again.");
          setIsGeneratingInvoice(false);
        }
      });
    } catch (error) {
      console.error('Invoice generation error:', error);
      ToastUtils.error(error.message || "Failed to generate invoice. Please try again.");
      setIsGeneratingInvoice(false);
    }
  };

  const createLead = async () => {
    // Validate lead data
    const newErrors = {};
    if (!leadData.first_name) newErrors.first_name = "First name is required";
    if (!leadData.last_name) newErrors.last_name = "Last name is required";
    if (!leadData.email) newErrors.email = "Email is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsCreatingLead(true);

    try {
      const payload = {
        subject: `Calculator Lead - ${
          combinedTotal > 0 ? combinedTotalFormatted : "Quote Request"
        }`,
        email: leadData.email,
        bill_to_name: `${leadData.first_name} ${leadData.last_name}`,
        notes: `Lead created from advanced calculator. Total estimated cost: ${
          combinedTotal > 0 ? combinedTotalFormatted : "N/A"
        }`,
        create_lead: true,
        lead_info: {
          first_name: leadData.first_name,
          last_name: leadData.last_name,
          email: leadData.email,
          phone: leadData.phone || null,
          company: leadData.company || null,
          country: leadData.country || null,
        },
        pricing_requests: calculatorData.pricing_requests.map((req) => {
          const { _display, ...rest } = req;
          return rest;
        }),
        object_storage_items: (calculatorData.object_storage_items || []).map(
          (item) => {
            const { _display, ...rest } = item;
            return rest;
          }
        ),
        country_code: calculatorData.country_code || null,
      };

      createMultiQuote(payload, {
        onSuccess: (data) => {
          ToastUtils.success("Lead created successfully!");
          setIsCreatingLead(false);
        },
        onError: (error) => {
          console.error('Lead creation error:', error);
          ToastUtils.error(error.message || "Failed to create lead. Please try again.");
          setIsCreatingLead(false);
        }
      });
    } catch (error) {
      console.error('Lead creation error:', error);
      ToastUtils.error(error.message || "Failed to create lead. Please try again.");
      setIsCreatingLead(false);
    }
  };

  const downloadPdf = (base64String, filename) => {
    const byteCharacters = atob(base64String);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!pricingResult) {
    return (
      <div className="text-center text-gray-500">
        <Calculator className="w-16 h-16 mx-auto mb-4 text-gray-300" />
        <p>No pricing data available. Please recalculate.</p>
      </div>
    );
  }

  const pricing = pricingResult.pricing || {};
  const summary = pricingResult.summary || {
    total_items: 0,
    total_instances: 0,
    regions: [],
    has_discount: false,
  };

  const normalizeLine = (line) => ({
    name: line.name || "",
    region: line.region || line.meta?.region || null,
    quantity: Number(line.quantity || 0),
    unit_price: Number(
      line.unit_price ??
        line.unit_amount ??
        0
    ),
    total: Number(line.total || 0),
    currency: line.currency || pricing.currency || "USD",
    term_months: line.term_months ?? line.meta?.object_storage?.months ?? null,
    meta: line.meta || {},
  });

  const apiStorage = pricing.object_storage;
  const hasApiStorage =
    !!apiStorage?.included_in_totals &&
    Array.isArray(apiStorage.lines) &&
    apiStorage.lines.length > 0;

  const apiStorageLines = hasApiStorage
    ? apiStorage.lines.map(normalizeLine)
    : [];

  const storageItems = calculatorData.object_storage_items || [];
  const fallbackStorageLines = storageItems.map((item) => ({
    name: item.product_name || "Object Storage Tier",
    region: item.region,
    quantity: item.quantity,
    unit_price: Number(item.unit_price || 0),
    total: Number(item.total_price || 0),
    currency: item.currency || pricing.currency || "USD",
    term_months: item.months,
    meta: {
      object_storage: {
        quantity: item.quantity,
        months: item.months,
      },
    },
  }));

  const storageLines = hasApiStorage ? apiStorageLines : fallbackStorageLines;

  const storageSubtotal = hasApiStorage
    ? Number(apiStorage.subtotal || 0)
    : storageLines.reduce(
        (sum, line) => sum + Number(line.total || 0),
        0
      );

  const baseSubtotal = Number(pricing.subtotal || 0);
  const baseTax = Number(pricing.tax || 0);
  const basePreDiscount = Number(
    pricing.pre_discount_subtotal || baseSubtotal
  );
  const discountAmount = Number(pricing.discount || 0);

  let combinedLines = [];
  let combinedPreDiscount;
  let combinedSubtotal;
  let combinedTax;
  let combinedTotal;
  let storageTax = 0;

  if (hasApiStorage) {
    combinedLines = Array.isArray(pricing.lines)
      ? pricing.lines.map(normalizeLine)
      : storageLines;
    combinedPreDiscount = basePreDiscount;
    combinedSubtotal = baseSubtotal;
    combinedTax = baseTax;
    combinedTotal = Number(pricing.total || 0);
  } else {
    const effectiveTaxRate =
      baseSubtotal > 0 ? baseTax / baseSubtotal : 0;
    storageTax = Number((storageSubtotal * effectiveTaxRate).toFixed(2));

    combinedLines = [
      ...(Array.isArray(pricing.lines)
        ? pricing.lines.map(normalizeLine)
        : []),
      ...storageLines,
    ];
    combinedPreDiscount = basePreDiscount + storageSubtotal;
    combinedSubtotal = baseSubtotal + storageSubtotal;
    combinedTax = baseTax + storageTax;
    combinedTotal =
      Number(pricing.total || 0) + storageSubtotal + storageTax;
  }

  const displayCurrency =
    pricing.currency ||
    storageLines[0]?.currency ||
    calculatorData.currency_code ||
    "USD";
  const combinedTotalFormatted = formatCurrency(combinedTotal, displayCurrency);

  const combinedTotalItems = hasApiStorage
    ? summary.total_items
    : summary.total_items + storageLines.length;
  const combinedRegions = hasApiStorage
    ? new Set(summary.regions || [])
    : new Set([
        ...(summary.regions || []),
        ...storageItems.map((item) => item.region),
      ]);
  const showPreDiscountRow =
    basePreDiscount !== baseSubtotal || storageSubtotal > 0;

  return (
    <div className="space-y-6 w-full max-w-4xl">
      <div className="text-center mb-6">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-800">
          Pricing Calculation Complete
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          Review your pricing and optionally generate an invoice or create a
          lead.
        </p>
      </div>

      {/* Pricing Summary */}
      <div className="bg-white border rounded-lg p-6">
        <h4 className="text-lg font-semibold text-gray-800 mb-4">
          Pricing Summary
        </h4>

        {/* Line Items */}
        <div className="border rounded-lg overflow-hidden mb-4">
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 text-left">Item</th>
                <th className="p-3 text-right">Qty</th>
                <th className="p-3 text-right">Unit Price</th>
                <th className="p-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {combinedLines.map((line, idx) => (
                <tr key={idx} className="border-t">
                  <td className="p-3">
                    <div>{line.name}</div>
                    {line.region && (
                      <div className="text-xs text-gray-500">
                        Region: {formatRegionName(line.region)}
                      </div>
                    )}
                    {line.term_months && (
                      <div className="text-xs text-gray-500">
                        Term: {line.term_months} month
                        {line.term_months === 1 ? "" : "s"}
                      </div>
                    )}
                  </td>
                  <td className="p-3 text-right">{line.quantity}</td>
                  <td className="p-3 text-right">
                    {formatCurrency(
                      line.unit_price,
                      line.currency || displayCurrency
                    )}
                  </td>
                  <td className="p-3 text-right">
                    {formatCurrency(
                      line.total,
                      line.currency || displayCurrency
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end">
          <div className="w-full max-w-xs space-y-2">
            {showPreDiscountRow && (
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-600">
                  Subtotal (before discount):
                </span>
                <span className="text-sm text-gray-900">
                  {formatCurrency(combinedPreDiscount, displayCurrency)}
                </span>
              </div>
            )}

            {discountAmount > 0 && (
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-600">
                  {pricing.discount_label || "Discount"}:
                </span>
                <span className="text-sm text-green-600">
                  -{formatCurrency(discountAmount, displayCurrency)}
                </span>
              </div>
            )}

            <div className="flex justify-between py-1 border-b border-gray-100">
              <span className="text-sm font-medium text-gray-600">
                Subtotal:
              </span>
              <span className="text-sm text-gray-900">
                {formatCurrency(combinedSubtotal, displayCurrency)}
              </span>
            </div>

            <div className="flex justify-between py-1 border-b border-gray-100">
              <span className="text-sm font-medium text-gray-600">Tax:</span>
              <span className="text-sm text-gray-900">
                {formatCurrency(combinedTax, displayCurrency)}
              </span>
            </div>

            <div className="flex justify-between py-2 pt-3 border-t border-gray-300">
              <span className="font-semibold text-gray-800">Total:</span>
              <span className="font-semibold text-lg text-[--theme-color]">
                {formatCurrency(combinedTotal, displayCurrency)}
              </span>
            </div>
          </div>
        </div>

      {/* Summary Stats */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-5 gap-4 bg-gray-50 p-4 rounded-lg">
        <div>
          <div className="font-medium text-gray-600">Total Items</div>
          <div className="text-lg font-semibold text-gray-900">
            {combinedTotalItems}
          </div>
        </div>
        <div>
          <div className="font-medium text-gray-600">Total Instances</div>
          <div className="text-lg font-semibold text-blue-600">
            {summary.total_instances}
          </div>
        </div>
        <div>
          <div className="font-medium text-gray-600">Regions</div>
          <div className="text-lg font-semibold text-purple-600">
            {combinedRegions.size}
          </div>
        </div>
        <div>
          <div className="font-medium text-gray-600">Has Discount</div>
          <div className="text-lg font-semibold text-green-600">
            {discountAmount > 0 ? "Yes" : "No"}
          </div>
        </div>
        <div>
          <div className="font-medium text-gray-600">Currency</div>
          <div className="text-lg font-semibold text-gray-900">
            {displayCurrency}
          </div>
        </div>
      </div>
      </div>

      {/* Action Options */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Generate Invoice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <FileText className="w-6 h-6 text-blue-600 mr-3" />
            <h4 className="font-semibold text-gray-800">Generate Invoice</h4>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Create a professional invoice/quote with PDF download capability.
          </p>

          {!showInvoiceOptions ? (
            <button
              onClick={() => setShowInvoiceOptions(true)}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Setup Invoice Generation
            </button>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject *
                </label>
                <input
                  type="text"
                  value={invoiceData.subject}
                  onChange={(e) =>
                    setInvoiceData((prev) => ({
                      ...prev,
                      subject: e.target.value,
                    }))
                  }
                  className={`${inputClass} ${
                    errors.subject ? "border-red-500" : ""
                  }`}
                  placeholder="Infrastructure Quote"
                />
                {errors.subject && (
                  <p className="text-red-500 text-xs mt-1">{errors.subject}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={invoiceData.email}
                  onChange={(e) =>
                    setInvoiceData((prev) => ({
                      ...prev,
                      email: e.target.value,
                    }))
                  }
                  className={`${inputClass} ${
                    errors.email ? "border-red-500" : ""
                  }`}
                  placeholder="client@company.com"
                />
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bill To Name *
                </label>
                <input
                  type="text"
                  value={invoiceData.bill_to_name}
                  onChange={(e) =>
                    setInvoiceData((prev) => ({
                      ...prev,
                      bill_to_name: e.target.value,
                    }))
                  }
                  className={`${inputClass} ${
                    errors.bill_to_name ? "border-red-500" : ""
                  }`}
                  placeholder="Client Name"
                />
                {errors.bill_to_name && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.bill_to_name}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={invoiceData.notes}
                  onChange={(e) =>
                    setInvoiceData((prev) => ({
                      ...prev,
                      notes: e.target.value,
                    }))
                  }
                  className={inputClass}
                  rows="3"
                  placeholder="Additional notes..."
                />
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={generateInvoice}
                  disabled={isGeneratingInvoice}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center"
                >
                  {isGeneratingInvoice ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Generate Invoice
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowInvoiceOptions(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Create Lead */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <User className="w-6 h-6 text-green-600 mr-3" />
            <h4 className="font-semibold text-gray-800">Create Lead</h4>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Add this pricing calculation to your leads system for follow-up.
          </p>

          {!showLeadOptions ? (
            <button
              onClick={() => setShowLeadOptions(true)}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              Setup Lead Creation
            </button>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    value={leadData.first_name}
                    onChange={(e) =>
                      setLeadData((prev) => ({
                        ...prev,
                        first_name: e.target.value,
                      }))
                    }
                    className={`${inputClass} ${
                      errors.first_name ? "border-red-500" : ""
                    }`}
                    placeholder="John"
                  />
                  {errors.first_name && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.first_name}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    value={leadData.last_name}
                    onChange={(e) =>
                      setLeadData((prev) => ({
                        ...prev,
                        last_name: e.target.value,
                      }))
                    }
                    className={`${inputClass} ${
                      errors.last_name ? "border-red-500" : ""
                    }`}
                    placeholder="Doe"
                  />
                  {errors.last_name && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.last_name}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={leadData.email}
                  onChange={(e) =>
                    setLeadData((prev) => ({ ...prev, email: e.target.value }))
                  }
                  className={`${inputClass} ${
                    errors.email ? "border-red-500" : ""
                  }`}
                  placeholder="john.doe@company.com"
                />
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  value={leadData.phone}
                  onChange={(e) =>
                    setLeadData((prev) => ({ ...prev, phone: e.target.value }))
                  }
                  className={inputClass}
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company
                </label>
                <input
                  type="text"
                  value={leadData.company}
                  onChange={(e) =>
                    setLeadData((prev) => ({
                      ...prev,
                      company: e.target.value,
                    }))
                  }
                  className={inputClass}
                  placeholder="Company Name Ltd"
                />
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={createLead}
                  disabled={isCreatingLead}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center"
                >
                  {isCreatingLead ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <User className="w-4 h-4 mr-2" />
                      Create Lead
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowLeadOptions(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recalculate Option */}
      <div className="text-center">
        <button
          onClick={onRecalculate}
          className="px-6 py-2 text-[--theme-color] border border-[--theme-color] rounded-md hover:bg-[--theme-color] hover:text-white transition-colors"
        >
          <Calculator className="w-4 h-4 mr-2 inline-block" />
          Modify Configuration & Recalculate
        </button>
      </div>
    </div>
  );
};

export default CalculatorSummaryStep;
