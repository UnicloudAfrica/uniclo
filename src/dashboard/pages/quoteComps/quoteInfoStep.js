import React from "react";
import { Loader2 } from "lucide-react";

const QuoteInfoStep = ({
  formData,
  errors,
  updateFormData,
  clients,
  isClientsFetching,
  tenants = [],
  isTenantsFetching = false,
}) => {
  const inputClass =
    "block w-full rounded-md border-gray-300 focus:border-[#288DD1] focus:ring-[#288DD1] sm:text-sm input-field";

  return (
    <div className="space-y-6 font-Outfit w-full max-w">
      <div className="r mb-6">
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

        {/* Optional: Tenant selection (admin use). Not compulsory */}
        <div>
          <label
            htmlFor="tenant_id"
            className="block text-sm font-medium text-gray-700"
          >
            Tenant (optional)
          </label>
          <span className={`w-full input-field block transition-all`}>
            {isTenantsFetching ? (
              <div className="flex items-center">
                <Loader2 className="w-4 h-4 animate-spin mr-2 text-gray-500" />
                <span className="text-gray-500 text-sm">Loading tenants...</span>
              </div>
            ) : (
              <select
                id="tenant_id"
                value={formData.tenant_id || ""}
                onChange={(e) => updateFormData("tenant_id", e.target.value)}
                className="w-full bg-transparent outline-none"
              >
                <option value="">Select a Tenant</option>
                {tenants?.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.domain})
                  </option>
                ))}
              </select>
            )}
          </span>
        </div>

        {/* Optional: Client selection (only when a tenant is selected). Not compulsory */}
        {formData.tenant_id && (
          <div>
            <label
              htmlFor="client_id"
              className="block text-sm font-medium text-gray-700"
            >
              Client (optional)
            </label>
            <span
              className={`w-full input-field block transition-all ${
                errors.client_id ? "border-red-500 border" : ""
              }`}
            >
              {isClientsFetching ? (
                <div className="flex items-center">
                  <Loader2 className="w-4 h-4 animate-spin mr-2 text-gray-500" />
                  <span className="text-gray-500 text-sm">
                    Loading clients...
                  </span>
                </div>
              ) : (
                <select
                  id="client_id"
                  value={formData.client_id || ""}
                  onChange={(e) => updateFormData("client_id", e.target.value)}
                  className="w-full bg-transparent outline-none"
                >
                  <option value="">Select a Client</option>
                  {clients?.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.first_name} {client.last_name} ({client.email})
                    </option>
                  ))}
                </select>
              )}
            </span>
            {errors.client_id && (
              <p className="text-red-500 text-xs mt-1">{errors.client_id}</p>
            )}
          </div>
        )}

        {/* Send options (optional) */}
        <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
          {formData.tenant_id && (
            <label className="inline-flex items-center space-x-2">
              <input
                type="checkbox"
                checked={!!formData.send_to_tenant}
                onChange={(e) => updateFormData("send_to_tenant", e.target.checked)}
              />
              <span className="text-sm text-gray-700">Send invoice to selected Tenant</span>
            </label>
          )}
          {formData.client_id && (
            <label className="inline-flex items-center space-x-2">
              <input
                type="checkbox"
                checked={!!formData.send_to_client}
                onChange={(e) => updateFormData("send_to_client", e.target.checked)}
              />
              <span className="text-sm text-gray-700">Send invoice to selected Client</span>
            </label>
          )}
        </div>

        <div>
          <label
            htmlFor="bill_to_name"
            className="block text-sm font-medium text-gray-700"
          >
            Address To Name<span className="text-red-500">*</span>
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

        <div className="md:col-span-2">
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
            disabled // Email is pre-filled from profile
          />
          {errors.email && (
            <p className="text-red-500 text-xs mt-1">{errors.email}</p>
          )}
        </div>

        <div className="md:col-span-2">
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
