import React from "react";

const QuoteInfoStep = ({
  formData,
  errors,
  updateFormData,
  handleSelectChange,
}) => {
  const inputClass =
    "block w-full rounded-md border-gray-300 focus:border-[#288DD1] focus:ring-[#288DD1] sm:text-sm input-field";

  return (
    <div className="space-y-6 font-Outfit w-full max-w-3xl">
      <div className="text- mb-6">
        <h3 className="text-xl font-semibold text-gray-800">
          Quote Information
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          Provide the main details for this quote.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label
            htmlFor="subject"
            className="block text-sm font-medium text-gray-700"
          >
            Subject<span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="subject"
            value={formData.subject}
            onChange={(e) => updateFormData("subject", e.target.value)}
            className={`${inputClass} ${
              errors.subject ? "border-red-500" : ""
            }`}
            placeholder="Quote for Project X"
            required
          />
          {errors.subject && (
            <p className="text-red-500 text-xs mt-1">{errors.subject}</p>
          )}
        </div>


        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700"
          >
            Primary Email<span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            id="email"
            value={formData.email}
            onChange={(e) => updateFormData("email", e.target.value)}
            className={`${inputClass} ${errors.email ? "border-red-500" : ""}`}
            placeholder="primary@example.com"
            required
          />
          {errors.email && (
            <p className="text-red-500 text-xs mt-1">{errors.email}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="bill_to_name"
            className="block text-sm font-medium text-gray-700"
          >
            Bill To Name<span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="bill_to_name"
            value={formData.bill_to_name}
            onChange={(e) => updateFormData("bill_to_name", e.target.value)}
            className={`${inputClass} ${
              errors.bill_to_name ? "border-red-500" : ""
            }`}
            placeholder="Billing contact name"
            required
          />
          {errors.bill_to_name && (
            <p className="text-red-500 text-xs mt-1">{errors.bill_to_name}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="emails"
            className="block text-sm font-medium text-gray-700"
          >
            Additional Emails (CC)
          </label>
          <input
            type="text"
            id="emails"
            value={formData.emails}
            onChange={(e) => updateFormData("emails", e.target.value)}
            className={inputClass}
            placeholder="email1@example.com, email2@example.com"
          />
          <p className="text-xs text-gray-500 mt-1">
            Separate multiple emails with a comma.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Total Order Discount
          </label>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="apply_total_discount"
                checked={formData.apply_total_discount}
                onChange={(e) => updateFormData("apply_total_discount", e.target.checked)}
                className="rounded border-gray-300 text-[#288DD1] focus:ring-[#288DD1]"
              />
              <label htmlFor="apply_total_discount" className="text-sm text-gray-700">
                Apply discount to entire order
              </label>
            </div>
            {formData.apply_total_discount && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <select
                    value={formData.total_discount_type}
                    onChange={(e) => updateFormData("total_discount_type", e.target.value)}
                    className={inputClass}
                  >
                    <option value="percent">Percentage (%)</option>
                    <option value="fixed">Fixed Amount</option>
                  </select>
                </div>
                <div>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.total_discount_value}
                    onChange={(e) => updateFormData("total_discount_value", e.target.value)}
                    className={inputClass}
                    placeholder={formData.total_discount_type === 'percent' ? '10' : '100.00'}
                  />
                </div>
                <div className="col-span-2">
                  <input
                    type="text"
                    value={formData.total_discount_label}
                    onChange={(e) => updateFormData("total_discount_label", e.target.value)}
                    className={inputClass}
                    placeholder="Discount label (optional)"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="md:col-span-2">
          <label
            htmlFor="notes"
            className="block text-sm font-medium text-gray-700"
          >
            Notes
          </label>
          <textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => updateFormData("notes", e.target.value)}
            className={inputClass}
            placeholder="Any additional information for this quote"
            rows="4"
          />
        </div>
      </div>
    </div>
  );
};

export default QuoteInfoStep;
