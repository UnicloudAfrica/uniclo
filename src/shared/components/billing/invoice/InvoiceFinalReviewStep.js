import React from "react";
import { FileText, User, Building, Phone, Mail, ShieldCheck, Tag, Package } from "lucide-react";
import { useFetchCountries } from "../../../../hooks/adminHooks/countriesHooks";
import { ModernButton, ModernCard, ModernInput, ModernTable } from "../../ui";

const selectBaseClass =
  "w-full rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm transition focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100 disabled:cursor-wait disabled:bg-slate-50";

const InvoiceFinalReviewStep = ({
  formData,
  pricingRequests,
  objectStorageRequests,
  tenants,
  updateFormData,
  errors = {},
  assignmentDetails = {},
  mode = "admin",
}) => {
  const { data: countries, isLoading: isCountriesLoading } = useFetchCountries();
  const {
    assignType: assignmentMode = "",
    tenant: assignedTenant,
    user: assignedUser,
  } = assignmentDetails || {};

  const selectedTenant =
    assignedTenant || tenants?.find((t) => String(t.id) === String(formData.tenant_id));
  const selectedUser = assignedUser || null;

  const tenantLabel = selectedTenant
    ? selectedTenant.name || selectedTenant.company_name || `Tenant ${selectedTenant.id}`
    : null;

  const userLabel = selectedUser
    ? selectedUser.business_name ||
      [selectedUser.first_name, selectedUser.last_name].filter(Boolean).join(" ") ||
      selectedUser.email ||
      `User ${selectedUser.id}`
    : null;

  const assignmentType = assignmentMode || (selectedUser ? "user" : selectedTenant ? "tenant" : "");

  const assignmentLabel =
    assignmentType === "user" && userLabel
      ? userLabel
      : assignmentType === "tenant" && tenantLabel
        ? tenantLabel
        : "Not assigned";

  const assignmentSublabel =
    assignmentType === "user"
      ? tenantLabel
        ? `User under ${tenantLabel}`
        : "User assignment"
      : assignmentType === "tenant"
        ? "Tenant assignment"
        : "Invoice remains unassigned until submission.";

  const totalInstances = pricingRequests.reduce(
    (sum, req) => sum + (req.number_of_instances || 1),
    0
  );

  const totalItems = pricingRequests.length + objectStorageRequests.length;

  return (
    <div className="space-y-8">
      <div className="space-y-2 text-center">
        <h3 className="text-lg font-semibold text-slate-900">Final Review</h3>
        <p className="text-sm text-slate-500">
          Confirm invoice details and optional lead capture before submission.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,400px)]">
        {/* Left Column: Summary Cards */}
        <div className="space-y-4">
          {/* Invoice Details */}
          <ModernCard padding="lg">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary-50 text-primary-600">
                <FileText className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-slate-900">Invoice Details</h4>
                <div className="mt-3 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Subject:</span>
                    <span className="font-medium text-slate-900">{formData.subject || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Primary Email:</span>
                    <span className="font-medium text-slate-900">{formData.email || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Bill To:</span>
                    <span className="font-medium text-slate-900">
                      {formData.bill_to_name || "N/A"}
                    </span>
                  </div>
                  {formData.invoice_date && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">Invoice Date:</span>
                      <span className="font-medium text-slate-900">{formData.invoice_date}</span>
                    </div>
                  )}
                  {formData.due_date && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">Due Date:</span>
                      <span className="font-medium text-slate-900">{formData.due_date}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </ModernCard>

          {/* Assignment */}
          <ModernCard padding="lg">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <Building className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-slate-900">Assignment</h4>
                <div className="mt-2">
                  <p className="text-sm font-medium text-slate-900">{assignmentLabel}</p>
                  <p className="text-xs text-slate-500">{assignmentSublabel}</p>
                </div>
              </div>
            </div>
          </ModernCard>

          {/* Items Summary */}
          <ModernCard padding="lg">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                <Package className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-slate-900">Items Summary</h4>
                <div className="mt-3 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Total Items:</span>
                    <span className="font-medium text-slate-900">{totalItems}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Compute Instances:</span>
                    <span className="font-medium text-slate-900">{totalInstances}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Storage Items:</span>
                    <span className="font-medium text-slate-900">
                      {objectStorageRequests.length}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </ModernCard>

          {/* Discount */}
          {formData.apply_total_discount && formData.total_discount_value && (
            <ModernCard padding="lg">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-green-50 text-green-600">
                  <Tag className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-slate-900">Discount Applied</h4>
                  <div className="mt-2">
                    <p className="text-sm font-medium text-slate-900">
                      {formData.total_discount_type === "percent"
                        ? `${formData.total_discount_value}%`
                        : `$${formData.total_discount_value}`}
                    </p>
                    {formData.total_discount_label && (
                      <p className="text-xs text-slate-500">{formData.total_discount_label}</p>
                    )}
                  </div>
                </div>
              </div>
            </ModernCard>
          )}
        </div>

        {/* Right Column: Lead Capture (Admin Only) */}
        {mode === "admin" && (
          <div>
            <ModernCard padding="xl">
              <header className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-900">Lead Capture</h4>
                  <p className="text-xs text-slate-500">Optional: Create a lead in your CRM</p>
                </div>
              </header>

              <div className="mt-6">
                <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <input
                    type="checkbox"
                    checked={formData.create_lead}
                    onChange={(e) => updateFormData("create_lead", e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-primary-500 focus:ring-primary-200"
                  />
                  <div>
                    <span className="text-sm font-medium text-slate-900">
                      Create lead from this invoice
                    </span>
                    <p className="text-xs text-slate-500">
                      Capture contact information for follow-up
                    </p>
                  </div>
                </label>

                {formData.create_lead && (
                  <div className="mt-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <ModernInput
                        label="First Name"
                        value={formData.lead_first_name}
                        onChange={(e) => updateFormData("lead_first_name", e.target.value)}
                        placeholder="John"
                        required
                        error={errors.lead_first_name}
                      />
                      <ModernInput
                        label="Last Name"
                        value={formData.lead_last_name}
                        onChange={(e) => updateFormData("lead_last_name", e.target.value)}
                        placeholder="Doe"
                        required
                        error={errors.lead_last_name}
                      />
                    </div>
                    <ModernInput
                      label="Email"
                      type="email"
                      value={formData.lead_email}
                      onChange={(e) => updateFormData("lead_email", e.target.value)}
                      placeholder="john.doe@company.com"
                      required
                      error={errors.lead_email}
                    />
                    <ModernInput
                      label="Phone"
                      type="tel"
                      value={formData.lead_phone}
                      onChange={(e) => updateFormData("lead_phone", e.target.value)}
                      placeholder="+1 (555) 123-4567"
                    />
                    <ModernInput
                      label="Company"
                      value={formData.lead_company}
                      onChange={(e) => updateFormData("lead_company", e.target.value)}
                      placeholder="Acme Corp"
                    />
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Country
                      </label>
                      <select
                        value={formData.lead_country}
                        onChange={(e) => updateFormData("lead_country", e.target.value)}
                        className={selectBaseClass}
                        disabled={isCountriesLoading}
                      >
                        <option value="">Select a country</option>
                        {countries?.map((country) => (
                          <option key={country.iso2} value={country.iso2}>
                            {country.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </ModernCard>
          </div>
        )}
      </div>
    </div>
  );
};

export default InvoiceFinalReviewStep;
