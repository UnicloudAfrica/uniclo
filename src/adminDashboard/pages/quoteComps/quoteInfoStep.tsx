// @ts-nocheck
import React from "react";
import ModernInput from "../../../shared/components/ui/ModernInput";

const selectBaseClass =
  "w-full rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm transition focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400";

const QuoteInfoStep = ({ formData, errors, updateFormData }: any) => {
  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <header className="flex flex-col gap-1">
          <h3 className="text-base font-semibold text-slate-900">Quote Information</h3>
          <p className="text-sm text-slate-500">
            Capture key recipients and give the quote a recognizable label.
          </p>
        </header>

        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
          <ModernInput
            label="Subject"
            value={formData.subject}
            onChange={(e) => updateFormData("subject", e.target.value)}
            placeholder="Quote for Lagos expansion"
            required
            error={errors.subject}
          />
          <ModernInput
            label="Primary Email"
            type="email"
            value={formData.email}
            onChange={(e) => updateFormData("email", e.target.value)}
            placeholder="primary@email.com"
            required
            error={errors.email}
          />
          <ModernInput
            label="Bill To Name"
            value={formData.bill_to_name}
            onChange={(e) => updateFormData("bill_to_name", e.target.value)}
            placeholder="Billing contact name"
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
        </div>

        <div className="mt-8 space-y-4 rounded-3xl border border-slate-100 bg-slate-50/70 p-5">
          <div className="flex flex-col gap-1">
            <h4 className="text-sm font-semibold text-slate-900">Order Discount</h4>
            <p className="text-sm text-slate-500">
              Apply an optional global discount before priming the quote for review.
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
                Apply discount to entire order
              </span>
              <p className="text-xs text-slate-500">
                Discount is applied across every configuration to keep pricing consistent.
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
                  placeholder="Optional note visible on the generated quote"
                />
              </div>
            </div>
          )}
        </div>

        <div className="mt-8">
          <label htmlFor="quote-notes" className="mb-2 block text-sm font-medium text-slate-700">
            Notes
          </label>
          <textarea
            id="quote-notes"
            value={formData.notes}
            onChange={(e) => updateFormData("notes", e.target.value)}
            rows={4}
            placeholder="Include any context that will help your team follow through on this quote."
            className="w-full rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm leading-relaxed text-slate-900 transition focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
          />
        </div>
      </section>
    </div>
  );
};

export default QuoteInfoStep;
