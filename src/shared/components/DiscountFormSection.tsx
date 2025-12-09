// @ts-nocheck
import React, { useState } from "react";
import { Calendar, Percent, DollarSign, ToggleLeft, ToggleRight, Info } from "lucide-react";

interface DiscountFormData {
  enabled: boolean;
  type: "percent" | "fixed_amount";
  value: string;
  isPermanent: boolean;
  startsAt: string;
  endsAt: string;
  notes: string;
}

interface DiscountFormSectionProps {
  formData: DiscountFormData;
  onChange: (data: Partial<DiscountFormData>) => void;
  errors?: Record<string, string>;
}

const DiscountFormSection: React.FC<DiscountFormSectionProps> = ({
  formData,
  onChange,
  errors = {},
}) => {
  const handleChange = (field: keyof DiscountFormData, value: any) => {
    onChange({ [field]: value });
  };

  return (
    <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
      {/* Header with Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Percent className="w-5 h-5 text-green-600" />
          <h3 className="font-semibold text-gray-900">Default Discount</h3>
        </div>
        <button
          type="button"
          onClick={() => handleChange("enabled", !formData.enabled)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            formData.enabled ? "bg-green-600" : "bg-gray-300"
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              formData.enabled ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
      </div>

      {formData.enabled && (
        <div className="space-y-4 mt-4">
          {/* Info Banner */}
          <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <Info className="w-4 h-4 text-blue-600 mt-0.5" />
            <p className="text-sm text-blue-700">
              This discount will be automatically applied to all purchases made by this user/tenant.
            </p>
          </div>

          {/* Discount Type & Value */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Discount Type</label>
              <select
                value={formData.type}
                onChange={(e) => handleChange("type", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="percent">Percentage (%)</option>
                <option value="fixed_amount">Fixed Amount ($)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Discount Value</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                  {formData.type === "percent" ? "%" : "$"}
                </span>
                <input
                  type="number"
                  min="0"
                  step={formData.type === "percent" ? "1" : "0.01"}
                  max={formData.type === "percent" ? "100" : undefined}
                  value={formData.value}
                  onChange={(e) => handleChange("value", e.target.value)}
                  placeholder={formData.type === "percent" ? "50" : "10.00"}
                  className={`w-full pl-8 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.value ? "border-red-500" : "border-gray-300"
                  }`}
                />
              </div>
              {errors.value && <p className="text-red-500 text-xs mt-1">{errors.value}</p>}
            </div>
          </div>

          {/* Permanent Toggle */}
          <div className="flex items-center justify-between py-2">
            <div>
              <span className="text-sm font-medium text-gray-700">Permanent Discount</span>
              <p className="text-xs text-gray-500">No expiration date</p>
            </div>
            <button
              type="button"
              onClick={() => handleChange("isPermanent", !formData.isPermanent)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                formData.isPermanent ? "bg-green-600" : "bg-gray-300"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  formData.isPermanent ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {/* Date Range (if not permanent) */}
          {!formData.isPermanent && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={formData.startsAt}
                  onChange={(e) => handleChange("startsAt", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="date"
                  value={formData.endsAt}
                  onChange={(e) => handleChange("endsAt", e.target.value)}
                  min={formData.startsAt}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.endsAt ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {errors.endsAt && <p className="text-red-500 text-xs mt-1">{errors.endsAt}</p>}
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
              placeholder="Reason for discount, promotional campaign, etc."
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Preview */}
          {formData.value && parseFloat(formData.value) > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm text-green-800 font-medium">
                Discount Preview:
                {formData.type === "percent" ? (
                  <span className="ml-1">{formData.value}% off all purchases</span>
                ) : (
                  <span className="ml-1">
                    ${parseFloat(formData.value).toFixed(2)} off each purchase
                  </span>
                )}
                {formData.isPermanent ? (
                  <span className="ml-1 text-green-600">(Permanent)</span>
                ) : formData.endsAt ? (
                  <span className="ml-1 text-green-600">
                    (Until {new Date(formData.endsAt).toLocaleDateString()})
                  </span>
                ) : null}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DiscountFormSection;

// Export the default form data for initialization
export const getDefaultDiscountFormData = (): DiscountFormData => ({
  enabled: false,
  type: "percent",
  value: "",
  isPermanent: true,
  startsAt: "",
  endsAt: "",
  notes: "",
});

export type { DiscountFormData, DiscountFormSectionProps };
