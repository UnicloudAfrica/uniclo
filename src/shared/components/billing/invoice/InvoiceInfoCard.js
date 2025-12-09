import React, { useMemo, useEffect } from "react";
import { CreditCard, Globe } from "lucide-react";
import { ModernInput } from "../../ui";
import { useFetchCountries } from "../../../../hooks/adminHooks/countriesHooks";

const InvoiceInfoCard = ({
  formData,
  errors,
  updateFormData,
  mode = "admin",
  countryCode,
  currencyCode,
  onCurrencyChange,
}) => {
  const selectBaseClass =
    "w-full rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm transition focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400";

  const { data: countries = [], isFetching: isCountriesFetching } = useFetchCountries();

  // Calculate default dates
  const today = new Date().toISOString().split("T")[0];
  const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const resolveCurrencyForCountry = useMemo(() => {
    return (code) => {
      if (!code || !Array.isArray(countries)) {
        return "USD";
      }

      const match = countries.find((country) => {
        const iso2 = (country.iso2 || country.code || "").toUpperCase();
        return iso2 === code.toUpperCase();
      });

      if (!match) {
        return "USD";
      }

      return (
        match.currency_code ||
        match.currency ||
        match.currencyCode ||
        match.currency_symbol ||
        match.currencySymbol ||
        "USD"
      ).toUpperCase();
    };
  }, [countries]);

  const handleCountrySelect = (value) => {
    if (!onCurrencyChange) return;
    const upper = value ? value.toUpperCase() : "";
    onCurrencyChange(upper, resolveCurrencyForCountry(upper));
  };

  // Ensure currency is set if not already
  useEffect(() => {
    if (!isCountriesFetching && countryCode && !currencyCode && onCurrencyChange) {
      handleCountrySelect(countryCode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCountriesFetching, countryCode, currencyCode]);

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <header className="flex flex-col gap-1">
        <h3 className="text-base font-semibold text-slate-900">Invoice Information</h3>
        <p className="text-sm text-slate-500">
          Capture key recipients and billing details for this invoice.
        </p>
      </header>

      {/* Billing Settings */}
      <div className="mt-6 rounded-2xl bg-slate-50 p-4 border border-slate-100">
        <div className="flex items-center gap-2 mb-4">
          <Globe className="h-4 w-4 text-slate-500" />
          <h4 className="text-sm font-medium text-slate-900">Billing Settings</h4>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Country<span className="text-red-500">*</span>
            </label>
            <select
              value={countryCode || ""}
              onChange={(event) => handleCountrySelect(event.target.value)}
              className={selectBaseClass}
              disabled={isCountriesFetching}
            >
              <option value="">Select country</option>
              {Array.isArray(countries) &&
                countries.map((country) => {
                  const value = (country.iso2 || country.code || "").toUpperCase();
                  const label = country.name || country.label || value;
                  return (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  );
                })}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Currency</label>
            <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 h-[38px]">
              <CreditCard className="h-4 w-4 text-slate-400" />
              {currencyCode || "USD"}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
        <ModernInput
          label="Invoice Title / Subject"
          value={formData.subject}
          onChange={(e) => updateFormData("subject", e.target.value)}
          placeholder="Infrastructure invoice - Q1 2025"
          required
          error={errors.subject}
        />
        <ModernInput
          label="Primary Email"
          type="email"
          value={formData.email}
          onChange={(e) => updateFormData("email", e.target.value)}
          placeholder="billing@client.com"
          required
          error={errors.email}
        />
        <ModernInput
          label="Bill To Name"
          value={formData.bill_to_name}
          onChange={(e) => updateFormData("bill_to_name", e.target.value)}
          placeholder="Client Company Name"
          required
          error={errors.bill_to_name}
        />
        <ModernInput
          label="Additional Emails (CC)"
          value={formData.emails}
          onChange={(e) => updateFormData("emails", e.target.value)}
          placeholder="email1@example.com, email2@example.com"
          helper="Separate multiple emails with a comma"
        />
        <ModernInput
          label="Invoice Date"
          type="date"
          value={formData.invoice_date || today}
          onChange={(e) => updateFormData("invoice_date", e.target.value)}
        />
        <ModernInput
          label="Due Date"
          type="date"
          value={formData.due_date || dueDate}
          onChange={(e) => updateFormData("due_date", e.target.value)}
        />
      </div>

      {/* Discount Section - Admin Only */}
      {mode === "admin" && (
        <div className="mt-8 space-y-4 rounded-3xl border border-slate-100 bg-slate-50/70 p-5">
          <div className="flex flex-col gap-1">
            <h4 className="text-sm font-semibold text-slate-900">Invoice Discount</h4>
            <p className="text-sm text-slate-500">
              Apply an optional global discount to the entire invoice.
            </p>
          </div>

          <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <input
              type="checkbox"
              checked={formData.apply_total_discount}
              onChange={(e) => updateFormData("apply_total_discount", e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-slate-300 text-primary-500 focus:ring-primary-200"
            />
            <div>
              <span className="text-sm font-medium text-slate-900">
                Apply discount to entire invoice
              </span>
              <p className="text-xs text-slate-500">
                Discount is applied across all line items to keep pricing consistent.
              </p>
            </div>
          </label>

          {formData.apply_total_discount && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Discount Type
                </label>
                <select
                  value={formData.total_discount_type}
                  onChange={(e) => updateFormData("total_discount_type", e.target.value)}
                  className={selectBaseClass}
                >
                  <option value="percent">Percentage (%)</option>
                  <option value="fixed">Fixed amount</option>
                </select>
              </div>
              <ModernInput
                label="Discount Value"
                type="number"
                min="0"
                step="0.01"
                value={formData.total_discount_value}
                onChange={(e) => updateFormData("total_discount_value", e.target.value)}
                placeholder={formData.total_discount_type === "percent" ? "10" : "100.00"}
                error={errors.total_discount_value}
              />
              <div className="sm:col-span-2">
                <ModernInput
                  label="Discount Label"
                  value={formData.total_discount_label}
                  onChange={(e) => updateFormData("total_discount_label", e.target.value)}
                  placeholder="Optional note visible on the generated invoice"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Notes */}
      <div className="mt-8">
        <label htmlFor="invoice-notes" className="mb-2 block text-sm font-medium text-slate-700">
          Notes
        </label>
        <textarea
          id="invoice-notes"
          value={formData.notes}
          onChange={(e) => updateFormData("notes", e.target.value)}
          rows={4}
          placeholder="Include any context that will help your team follow through on this invoice."
          className="w-full rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm leading-relaxed text-slate-900 transition focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
        />
      </div>
    </section>
  );
};

export default InvoiceInfoCard;
