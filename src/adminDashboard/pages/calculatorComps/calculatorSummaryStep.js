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
  Briefcase,
  ArrowRight,
  HardDrive,
} from "lucide-react";
import ModernCard from "../../components/ModernCard";
import ModernButton from "../../components/ModernButton";
import ModernInput from "../../components/ModernInput";
import StatusPill from "../../components/StatusPill";
import ToastUtils from "../../../utils/toastUtil";
import { useSharedMultiQuotes } from "../../../hooks/sharedCalculatorHooks";
import { formatRegionName } from "../../../utils/regionUtils";
import { useFetchCountries } from "../../../hooks/resource";

const selectClass =
  "w-full rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm transition focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100";

const formatCurrency = (amount, currency = "USD") => {
  if (amount === null || amount === undefined) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
};

const CalculatorSummaryStep = ({ calculatorData, pricingResult, onRecalculate }) => {
  const [showInvoiceOptions, setShowInvoiceOptions] = useState(false);
  const [showLeadOptions, setShowLeadOptions] = useState(false);
  const [isGeneratingInvoice, setIsGeneratingInvoice] = useState(false);
  const [isCreatingLead, setIsCreatingLead] = useState(false);

  const { mutate: createMultiQuote, isPending: isMultiQuotePending } =
    useSharedMultiQuotes();

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

  const [formErrors, setFormErrors] = useState({});

  const pricingMeta = pricingResult?.pricing || {};
  const summaryMeta = pricingResult?.summary || {
    total_items: 0,
    total_instances: 0,
    regions: [],
    has_discount: false,
  };
  const primaryCurrency =
    pricingMeta?.currency || calculatorData.currency_code || "USD";

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
    currency: line.currency || primaryCurrency,
    term_months: line.term_months ?? line.meta?.object_storage?.months ?? null,
    meta: line.meta || {},
  });

  const storageItems = calculatorData.object_storage_items || [];
  const fallbackStorageLines = storageItems.map((item) => ({
    name: item.product_name || "Object Storage Tier",
    region: item.region,
    quantity: item.quantity,
    unit_price: Number(item.unit_price || 0),
    total: Number(item.total_price || 0),
    currency: item.currency || primaryCurrency,
    term_months: item.months,
    meta: {
      object_storage: {
        quantity: item.quantity,
        months: item.months,
      },
    },
  }));

  const apiStorage = pricingMeta.object_storage;
  const hasApiStorage =
    !!apiStorage?.included_in_totals &&
    Array.isArray(apiStorage.lines) &&
    apiStorage.lines.length > 0;

  const apiStorageLines = hasApiStorage
    ? apiStorage.lines.map(normalizeLine)
    : [];

  const storageLines = hasApiStorage ? apiStorageLines : fallbackStorageLines;

  const storageSubtotal = hasApiStorage
    ? Number(apiStorage.subtotal || 0)
    : storageLines.reduce(
      (sum, line) => sum + Number(line.total || 0),
      0
    );

  const baseSubtotal = Number(pricingMeta?.subtotal || 0);
  const baseTax = Number(pricingMeta?.tax || 0);
  const basePreDiscount = Number(pricingMeta?.pre_discount_subtotal || baseSubtotal);
  const discountAmount = Number(pricingMeta?.discount || 0);

  let storageTax = 0;
  let combinedSubtotal;
  let combinedTax;
  let combinedPreDiscount;
  let combinedTotal;

  if (hasApiStorage) {
    combinedSubtotal = baseSubtotal;
    combinedTax = baseTax;
    combinedPreDiscount = basePreDiscount;
    combinedTotal = Number(pricingMeta?.total || 0);
  } else {
    const effectiveTaxRate = baseSubtotal > 0 ? baseTax / baseSubtotal : 0;
    storageTax = Number((storageSubtotal * effectiveTaxRate).toFixed(2));
    combinedSubtotal = baseSubtotal + storageSubtotal;
    combinedTax = baseTax + storageTax;
    combinedPreDiscount = basePreDiscount + storageSubtotal;
    combinedTotal = Number(pricingMeta?.total || 0) + storageSubtotal + storageTax;
  }

  const effectiveTaxRate = baseSubtotal > 0 ? baseTax / baseSubtotal : 0;

  const storageMonthly = storageLines.reduce((sum, line) => {
    const months = line.term_months || line.meta?.object_storage?.months || 1;
    return sum + (months > 0 ? Number(line.total || 0) / months : Number(line.total || 0));
  }, 0);

  // Apply tax to storage monthly
  const storageMonthlyWithTax = storageMonthly * (1 + effectiveTaxRate);

  const combinedMonthly =
    Number(pricingMeta?.monthly_total || 0) + storageMonthlyWithTax;
  const combinedTotalFormatted = formatCurrency(combinedTotal, primaryCurrency);

  const {
    data: countries = [],
    isFetching: isCountriesFetching,
  } = useFetchCountries();
  const countryOptions = Array.isArray(countries)
    ? countries
      .map((country, index) => {
        if (!country) return null;
        if (typeof country === "string") {
          return {
            key: `country-${index}-${country}`,
            value: country,
            label: country,
          };
        }
        const name =
          country.name || country.country || country.code || country.iso2;
        if (!name) return null;
        const emoji = country.emoji || country.flag || null;
        const label = [emoji, name].filter(Boolean).join(" ").trim();
        return {
          key: country.id || country.code || name || `country-${index}`,
          value: name,
          label: label || name,
        };
      })
      .filter(Boolean)
    : [];

  const computeConfigurations = calculatorData.pricing_requests.length;
  const storageConfigurationCount = hasApiStorage
    ? storageLines.length
    : storageItems.length;
  const totalConfigurations = computeConfigurations + storageConfigurationCount;
  const totalRegions = hasApiStorage
    ? new Set(summaryMeta.regions || []).size
    : new Set([
      ...calculatorData.pricing_requests.map((req) => req.region),
      ...storageItems.map((item) => item.region),
    ]).size;

  const invoicePayloadBase = (additional = {}) => {
    const payload = {
      ...additional,
      pricing_requests: calculatorData.pricing_requests.map((req) => {
        const { _display, volumes, ...rest } = req;
        return {
          ...rest,
          volume_types: volumes?.map((vol) => ({
            volume_type_id: vol.volume_type_id,
            storage_size_gb: vol.storage_size_gb,
          })) || [],
        };
      }),
    };

    if (calculatorData.object_storage_items?.length) {
      payload.object_storage_items = calculatorData.object_storage_items.map(
        (item) => {
          const { _display, ...rest } = item;
          return {
            ...rest,
            productable_id: item.tier_id,
          };
        }
      );
    }

    if (calculatorData.country_code) {
      payload.country_code = calculatorData.country_code;
    }

    if (
      calculatorData.apply_total_discount &&
      calculatorData.total_discount_value
    ) {
      payload.total_discount = {
        type: calculatorData.total_discount_type,
        value: parseFloat(calculatorData.total_discount_value),
        label: calculatorData.total_discount_label || null,
      };
    }
    return payload;
  };

  const generateInvoice = () => {
    const errors = {};
    if (!invoiceData.subject) errors.subject = "Subject is required";
    if (!invoiceData.email) errors.email = "Recipient email is required";
    if (!invoiceData.bill_to_name) errors.bill_to_name = "Bill-to contact is required";

    if (Object.keys(errors).length) {
      setFormErrors((prev) => ({ ...prev, invoice: errors }));
      return;
    }

    setFormErrors((prev) => ({ ...prev, invoice: {} }));
    setIsGeneratingInvoice(true);

    const payload = invoicePayloadBase({
      subject: invoiceData.subject,
      email: invoiceData.email,
      bill_to_name: invoiceData.bill_to_name,
      notes: invoiceData.notes,
      tenant_id: calculatorData.tenant_id || null,
      create_lead: true,
      // Add root level fields to prevent backend errors with empty strings
      first_name: invoiceData.bill_to_name?.split(" ")[0] || "",
      last_name: invoiceData.bill_to_name?.split(" ").slice(1).join(" ") || "",
      lead_info: {
        first_name: invoiceData.bill_to_name?.split(" ")[0] || "",
        last_name: invoiceData.bill_to_name?.split(" ").slice(1).join(" ") || "",
        email: invoiceData.email,
        phone: null,
        company: null,
        country: null,
      },
    });

    createMultiQuote(payload, {
      onSuccess: (data) => {
        ToastUtils.success("Invoice generated successfully!");
        if (data.invoices?.[0]?.pdf) {
          const { pdf, filename = "invoice.pdf" } = data.invoices[0];
          const byteCharacters = atob(pdf);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const blob = new Blob([new Uint8Array(byteNumbers)], {
            type: "application/pdf",
          });
          const url = URL.createObjectURL(blob);
          const anchor = document.createElement("a");
          anchor.href = url;
          anchor.download = filename;
          anchor.click();
          URL.revokeObjectURL(url);
        }
        setIsGeneratingInvoice(false);
      },
      onError: (error) => {
        ToastUtils.error(
          error.message || "Failed to generate invoice. Please try again."
        );
        setIsGeneratingInvoice(false);
      },
    });
  };

  const createLead = () => {
    const errors = {};
    if (!leadData.first_name) errors.first_name = "First name required";
    if (!leadData.last_name) errors.last_name = "Last name required";
    if (!leadData.email) errors.email = "Email required";

    if (Object.keys(errors).length) {
      setFormErrors((prev) => ({ ...prev, lead: errors }));
      return;
    }

    setFormErrors((prev) => ({ ...prev, lead: {} }));
    setIsCreatingLead(true);

    const payload = invoicePayloadBase({
      tenant_id: calculatorData.tenant_id || null,
      subject: `Calculator Lead - ${combinedTotal > 0 ? combinedTotalFormatted : "Quote Request"
        }`,
      email: leadData.email,
      bill_to_name: `${leadData.first_name} ${leadData.last_name}`,
      notes: leadData.company
        ? `Lead created from advanced calculator for ${leadData.company}. Estimated total: ${combinedTotalFormatted}.`
        : `Lead created from advanced calculator. Estimated total: ${combinedTotalFormatted}.`,
      create_lead: true,
      // Add root level fields to prevent backend errors with empty strings
      first_name: leadData.first_name,
      last_name: leadData.last_name,
      phone: leadData.phone,
      company: leadData.company,
      lead_info: {
        first_name: leadData.first_name,
        last_name: leadData.last_name,
        email: leadData.email,
        phone: leadData.phone || null,
        company: leadData.company || null,
        country: leadData.country || null,
      },
    });

    createMultiQuote(payload, {
      onSuccess: () => {
        ToastUtils.success("Lead created successfully!");
        setIsCreatingLead(false);
      },
      onError: (error) => {
        ToastUtils.error(error.message || "Failed to create lead. Try again.");
        setIsCreatingLead(false);
      },
    });
  };

  const statTiles = [
    {
      label: "Total items",
      value: totalConfigurations,
      tone: "primary",
    },
    {
      label: "Object storage tiers",
      value: storageConfigurationCount,
    },
    {
      label: "Regions",
      value: totalRegions,
    },
    {
      label: "Currency",
      value: primaryCurrency,
    },
    {
      label: "Discount",
      value:
        calculatorData.apply_total_discount && calculatorData.total_discount_value
          ? calculatorData.total_discount_type === "percent"
            ? `${calculatorData.total_discount_value}%`
            : formatCurrency(
              calculatorData.total_discount_value,
              primaryCurrency
            )
          : "None",
      tone: calculatorData.apply_total_discount ? "success" : undefined,
    },
  ];

  return (
    <div className="space-y-8">
      <ModernCard padding="lg" className="space-y-6">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary-50 text-primary-600">
              <Calculator className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Pricing result
              </h3>
              <p className="text-sm text-slate-500">
                Review the calculated totals, adjust anything that looks off, and optionally create follow-up actions.
              </p>
            </div>
          </div>
          <ModernButton
            variant="ghost"
            size="sm"
            onClick={onRecalculate}
            leftIcon={<ArrowRight className="h-4 w-4" />}
          >
            Re-run configuration
          </ModernButton>
        </header>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-400">
              Total cost
            </p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">
              {combinedTotal > 0 ? combinedTotalFormatted : "—"}
            </p>
            <p className="text-xs text-slate-500">Includes tax & adjustments</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-xs uppercase tracking-wide text-slate-400">
              Monthly
            </p>
            <p className="mt-1 text-lg font-semibold text-slate-900">
              {combinedMonthly > 0
                ? formatCurrency(combinedMonthly, primaryCurrency)
                : "—"}
            </p>
            <p className="text-xs text-slate-500">Recurring projection</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-xs uppercase tracking-wide text-slate-400">
              Currency
            </p>
            <p className="mt-1 text-lg font-semibold text-slate-900">
              {primaryCurrency}
            </p>
            <p className="text-xs text-slate-500">Based on tenant settings</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {statTiles.map((tile) => (
            <div
              key={tile.label}
              className="rounded-2xl border border-slate-200 bg-white p-4"
            >
              <p className="text-xs uppercase tracking-wide text-slate-400">
                {tile.label}
              </p>
              <p className="mt-1 text-lg font-semibold text-slate-900">
                {tile.value}
              </p>
            </div>
          ))}
        </div>

        {(calculatorData.pricing_requests.length > 0 || storageItems.length > 0) && (
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-xs uppercase tracking-wide text-slate-400">
              Included configurations
            </p>
            <div className="mt-2 space-y-2">
              {calculatorData.pricing_requests.map((item, idx) => (
                <div
                  key={`${item.region}-${idx}`}
                  className="rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-500"
                >
                  <span className="font-semibold text-slate-700">
                    {item._display?.compute || "Compute"}
                  </span>{" "}
                  • {formatRegionName(item.region)} • {item.number_of_instances}{" "}
                  instance{item.number_of_instances === 1 ? "" : "s"}
                  {item.volume_types?.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-2">
                      {item.volume_types.map((vol, vIdx) => (
                        <span key={vIdx} className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                          <HardDrive className="h-3 w-3" />
                          {vol.storage_size_gb}GB
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {storageItems.map((item, idx) => (
                <div
                  key={`storage-${item.region}-${idx}`}
                  className="rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-700"
                >
                  <span className="font-semibold">
                    {item.product_name || "Object Storage Tier"}
                  </span>{" "}
                  • {formatRegionName(item.region)} • {item.quantity} allocation
                  {item.quantity === 1 ? "" : "s"} • {item.months} month
                  {item.months === 1 ? "" : "s"}
                </div>
              ))}
            </div>
          </div>
        )}
      </ModernCard>

      <div className="grid gap-6 lg:grid-cols-2">
        <ModernCard padding="lg" className="space-y-5">
          <header className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  Generate invoice
                </h3>
                <p className="text-xs text-slate-500">
                  Create a branded invoice or quote based on this calculation.
                </p>
              </div>
            </div>
            <ModernButton
              variant="outline"
              size="sm"
              onClick={() => setShowInvoiceOptions((prev) => !prev)}
            >
              {showInvoiceOptions ? "Hide form" : "Fill details"}
            </ModernButton>
          </header>

          {showInvoiceOptions ? (
            <div className="space-y-4">
              <ModernInput
                label="Subject"
                placeholder="e.g., Infrastructure quote • March 2025"
                value={invoiceData.subject}
                onChange={(e) =>
                  setInvoiceData((prev) => ({
                    ...prev,
                    subject: e.target.value,
                  }))
                }
                required
                error={formErrors.invoice?.subject}
              />
              <ModernInput
                label="Recipient email"
                type="email"
                placeholder="billing@client.com"
                value={invoiceData.email}
                onChange={(e) =>
                  setInvoiceData((prev) => ({
                    ...prev,
                    email: e.target.value,
                  }))
                }
                required
                error={formErrors.invoice?.email}
                icon={<Mail className="h-4 w-4" />}
              />
              <ModernInput
                label="Bill-to name"
                placeholder="Acme Corp Billing Contact"
                value={invoiceData.bill_to_name}
                onChange={(e) =>
                  setInvoiceData((prev) => ({
                    ...prev,
                    bill_to_name: e.target.value,
                  }))
                }
                required
                error={formErrors.invoice?.bill_to_name}
                icon={<User className="h-4 w-4" />}
              />
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
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
                  rows={3}
                  className={selectClass}
                  placeholder="Add context for the recipient (optional)"
                />
              </div>
              <ModernButton
                variant="primary"
                onClick={generateInvoice}
                isLoading={isGeneratingInvoice || isMultiQuotePending}
                leftIcon={<Download className="h-4 w-4" />}
              >
                {isGeneratingInvoice || isMultiQuotePending
                  ? "Generating..."
                  : "Generate invoice"}
              </ModernButton>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-sm text-slate-500">
              Add subject, recipient, and notes to generate an invoice-ready PDF.
            </div>
          )}
        </ModernCard>

        <ModernCard padding="lg" className="space-y-5">
          <header className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                <Briefcase className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  Create lead
                </h3>
                <p className="text-xs text-slate-500">
                  Send calculation context to the CRM for follow-up.
                </p>
              </div>
            </div>
            <ModernButton
              variant="outline"
              size="sm"
              onClick={() => setShowLeadOptions((prev) => !prev)}
            >
              {showLeadOptions ? "Hide form" : "Capture lead"}
            </ModernButton>
          </header>

          {showLeadOptions ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <ModernInput
                  label="First name"
                  placeholder="Jane"
                  value={leadData.first_name}
                  onChange={(e) =>
                    setLeadData((prev) => ({
                      ...prev,
                      first_name: e.target.value,
                    }))
                  }
                  required
                  error={formErrors.lead?.first_name}
                  icon={<User className="h-4 w-4" />}
                />
                <ModernInput
                  label="Last name"
                  placeholder="Doe"
                  value={leadData.last_name}
                  onChange={(e) =>
                    setLeadData((prev) => ({
                      ...prev,
                      last_name: e.target.value,
                    }))
                  }
                  required
                  error={formErrors.lead?.last_name}
                  icon={<User className="h-4 w-4" />}
                />
                <ModernInput
                  label="Email"
                  type="email"
                  placeholder="jane.doe@client.com"
                  value={leadData.email}
                  onChange={(e) =>
                    setLeadData((prev) => ({
                      ...prev,
                      email: e.target.value,
                    }))
                  }
                  required
                  error={formErrors.lead?.email}
                  icon={<Mail className="h-4 w-4" />}
                />
                <ModernInput
                  label="Phone"
                  placeholder="+234 800 000 0000"
                  value={leadData.phone}
                  onChange={(e) =>
                    setLeadData((prev) => ({
                      ...prev,
                      phone: e.target.value,
                    }))
                  }
                  icon={<Phone className="h-4 w-4" />}
                />
              </div>

              <ModernInput
                label="Company"
                placeholder="Client company name"
                value={leadData.company}
                onChange={(e) =>
                  setLeadData((prev) => ({
                    ...prev,
                    company: e.target.value,
                  }))
                }
                icon={<Building className="h-4 w-4" />}
              />

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Country
                </label>
                <select
                  value={leadData.country}
                  onChange={(e) =>
                    setLeadData((prev) => ({
                      ...prev,
                      country: e.target.value,
                    }))
                  }
                  className={selectClass}
                  disabled={isCountriesFetching}
                >
                  <option value="">
                    {isCountriesFetching ? "Loading countries..." : "Select country"}
                  </option>
                  {countryOptions.map((option) => (
                    <option key={option.key} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <ModernButton
                variant="success"
                onClick={createLead}
                isLoading={isCreatingLead || isMultiQuotePending}
                leftIcon={<CheckCircle className="h-4 w-4" />}
              >
                {isCreatingLead || isMultiQuotePending
                  ? "Creating lead..."
                  : "Create lead"}
              </ModernButton>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-sm text-slate-500">
              Capture lead details to sync this calculation with the opportunity pipeline.
            </div>
          )}
        </ModernCard>
      </div>

      <ModernCard padding="lg" variant="outlined" className="space-y-4">
        <h4 className="text-sm font-semibold text-slate-900">What happens next?</h4>
        <ul className="grid grid-cols-1 gap-3 text-sm text-slate-600 md:grid-cols-2">
          <li className="rounded-2xl border border-slate-200 bg-white p-4">
            <StatusPill label="Download" tone="info" />
            <p className="mt-2">Generate a PDF invoice or quote using the data above.</p>
          </li>
          <li className="rounded-2xl border border-slate-200 bg-white p-4">
            <StatusPill label="Email" tone="neutral" />
            <p className="mt-2">
              Share directly with customers—recipient and CCs are pre-populated.
            </p>
          </li>
          <li className="rounded-2xl border border-slate-200 bg-white p-4">
            <StatusPill label="Leads" tone="success" />
            <p className="mt-2">
              Push the calculation into the CRM when you capture lead details.
            </p>
          </li>
          <li className="rounded-2xl border border-slate-200 bg-white p-4">
            <StatusPill label="Iterate" tone="warning" />
            <p className="mt-2">
              Re-run the configuration from this screen if the scope needs adjustments.
            </p>
          </li>
        </ul>
      </ModernCard>
    </div>
  );
};

export default CalculatorSummaryStep;
