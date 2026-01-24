// @ts-nocheck
import React from "react";
import {
  FileText,
  Download,
  User,
  Building,
  Phone,
  Mail,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { useFetchCountries } from "../../../hooks/adminHooks/countriesHooks";
import ModernCard from "../../../shared/components/ui/ModernCard";
import ModernInput from "../../../shared/components/ui/ModernInput";
import { ModernButton } from "../../../shared/components/ui";

const selectBaseClass =
  "w-full rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm transition focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100 disabled:cursor-wait disabled:bg-slate-50";

const QuoteFinalReviewStep = ({
  formData,
  pricingRequests,
  objectStorageRequests,
  tenants,
  updateFormData,
  errors = {},
  assignmentDetails = {},
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
        : "Quote remains unassigned until submission.";

  const totalInstances = pricingRequests.reduce(
    (sum, req) => sum + (req.number_of_instances || 1),
    0
  );

  const regionCount = new Set(pricingRequests.map((req: any) => req.region).filter(Boolean)).size;

  return (
    <div className="space-y-8">
      <div className="space-y-2 text-center">
        <h3 className="text-lg font-semibold text-slate-900">Final Review & Handoff</h3>
        <p className="text-sm text-slate-500">
          Confirm recipients, optional lead capture, and invoice preferences before generating the
          quote.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,400px)]">
        <div className="space-y-6">
          <ModernCard padding="xl" className="space-y-5">
            <header className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary-50 text-primary-600">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-900">Quote details</h4>
                <p className="text-xs text-slate-500">
                  Primary delivery information for the generated document.
                </p>
              </div>
            </header>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-400">Subject</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {formData.subject || "—"}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-400">Primary email</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{formData.email || "—"}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-400">Bill to</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {formData.bill_to_name || "—"}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-400">Assignment</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{assignmentLabel}</p>
                <p className="text-xs text-slate-500">{assignmentSublabel}</p>
              </div>
            </div>

            {formData.emails?.trim() && (
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-xs uppercase tracking-wide text-slate-400">CC recipients</p>
                <p className="mt-1 text-sm text-slate-600">{formData.emails}</p>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center">
                <p className="text-xs uppercase tracking-wide text-slate-400">Configurations</p>
                <p className="mt-1 text-lg font-semibold text-slate-900">
                  {pricingRequests.length}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center">
                <p className="text-xs uppercase tracking-wide text-slate-400">Instances</p>
                <p className="mt-1 text-lg font-semibold text-slate-900">{totalInstances}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center">
                <p className="text-xs uppercase tracking-wide text-slate-400">Regions</p>
                <p className="mt-1 text-lg font-semibold text-slate-900">{regionCount}</p>
              </div>
            </div>

            {formData.apply_total_discount && formData.total_discount_value && (
              <div className="rounded-2xl border border-dashed border-amber-200 bg-amber-50 p-4">
                <p className="text-xs uppercase tracking-wide text-amber-500">Discount applied</p>
                <p className="mt-1 text-sm font-semibold text-amber-700">
                  {formData.total_discount_type === "percent"
                    ? `${formData.total_discount_value}% off`
                    : `-${formData.total_discount_value} flat discount`}
                  {formData.total_discount_label ? ` • ${formData.total_discount_label}` : ""}
                </p>
              </div>
            )}

            {formData.notes?.trim() && (
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-xs uppercase tracking-wide text-slate-400">Internal notes</p>
                <p className="mt-1 text-sm text-slate-600 whitespace-pre-wrap">{formData.notes}</p>
              </div>
            )}
          </ModernCard>

          <ModernCard padding="xl" className="space-y-5">
            <header className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-slate-900">Lead capture (optional)</h4>
                <p className="text-xs text-slate-500">
                  Create a trackable record in the CRM when this quote is sent.
                </p>
              </div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={formData.create_lead || false}
                  onChange={(e) => updateFormData("create_lead", e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-primary-500 focus:ring-primary-200"
                />
                Enable
              </label>
            </header>

            {formData.create_lead && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <ModernInput
                    label="First name"
                    value={formData.lead_first_name || ""}
                    onChange={(e) => updateFormData("lead_first_name", e.target.value)}
                    required
                    error={errors.lead_first_name}
                    icon={<User className="h-4 w-4" />}
                  />
                  <ModernInput
                    label="Last name"
                    value={formData.lead_last_name || ""}
                    onChange={(e) => updateFormData("lead_last_name", e.target.value)}
                    required
                    error={errors.lead_last_name}
                    icon={<User className="h-4 w-4" />}
                  />
                  <ModernInput
                    label="Contact email"
                    type="email"
                    value={formData.lead_email || formData.email}
                    onChange={(e) => updateFormData("lead_email", e.target.value)}
                    required
                    error={errors.lead_email}
                    icon={<Mail className="h-4 w-4" />}
                  />
                  <ModernInput
                    label="Phone"
                    value={formData.lead_phone || ""}
                    onChange={(e) => updateFormData("lead_phone", e.target.value)}
                    icon={<Phone className="h-4 w-4" />}
                  />
                </div>
                <ModernInput
                  label="Company"
                  value={formData.lead_company || ""}
                  onChange={(e) => updateFormData("lead_company", e.target.value)}
                  icon={<Building className="h-4 w-4" />}
                />

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Country<span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={formData.lead_country || ""}
                      onChange={(e) => updateFormData("lead_country", e.target.value)}
                      disabled={isCountriesLoading}
                      className={`${selectBaseClass} ${
                        errors.lead_country ? "border-red-400" : ""
                      }`}
                      required
                    >
                      <option value="">
                        {isCountriesLoading ? "Loading countries..." : "Select a country"}
                      </option>
                      {countries?.map((country: any) => (
                        <option key={country.id} value={country.name}>
                          {country.emoji} {country.name}
                        </option>
                      ))}
                    </select>
                    {isCountriesLoading && (
                      <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-slate-400" />
                    )}
                  </div>
                  {errors.lead_country && (
                    <p className="mt-2 text-xs font-medium text-red-600">{errors.lead_country}</p>
                  )}
                  <p className="mt-2 text-xs text-slate-500">
                    Used to contextualize taxes and regulation in follow-up.
                  </p>
                </div>
              </div>
            )}
          </ModernCard>
        </div>

        <div className="space-y-6">
          <ModernCard padding="xl" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900">
                Items ({pricingRequests.length + (objectStorageRequests?.length || 0)})
              </h3>
              <ModernButton
                variant="ghost"
                size="sm"
                className="text-primary-600 hover:text-primary-700"
              >
                Edit
              </ModernButton>
            </div>
            <div className="space-y-3">
              {pricingRequests.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-900">{item._display?.compute}</p>
                    <p className="text-xs text-slate-500">
                      {item.region} • {item.number_of_instances} instance
                      {item.number_of_instances === 1 ? "" : "s"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-slate-900">{item._display?.storage}</p>
                    <p className="text-xs text-slate-500">Storage</p>
                  </div>
                </div>
              ))}
              {objectStorageRequests?.map((item, idx) => (
                <div
                  key={`os-${idx}`}
                  className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {item._display?.name || "Silo Storage"}
                    </p>
                    <p className="text-xs text-slate-500">
                      {item.region} • {item.quantity} GB
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-slate-900">{item.months} mo</p>
                    <p className="text-xs text-slate-500">Term</p>
                  </div>
                </div>
              ))}
            </div>
            <header className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                <Download className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-900">Document handoff</h4>
                <p className="text-xs text-slate-500">After submission you will be able to:</p>
              </div>
            </header>
            <ul className="space-y-3 text-sm text-slate-600">
              <li className="flex items-center gap-3">
                <FileText className="h-4 w-4 text-primary-500" />
                Generate a branded PDF quote immediately
              </li>
              <li className="flex items-center gap-3">
                <Download className="h-4 w-4 text-slate-500" />
                Download or email the document to clients
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-emerald-500" />
                Share to multiple recipients in one action
              </li>
              {formData.create_lead && (
                <li className="flex items-center gap-3">
                  <User className="h-4 w-4 text-amber-500" />
                  Track follow-up in the CRM automatically
                </li>
              )}
            </ul>
          </ModernCard>

          <ModernCard padding="xl" variant="outlined" className="space-y-4">
            <header>
              <h4 className="text-sm font-semibold text-slate-900">Delivery checklist</h4>
              <p className="text-xs text-slate-500">
                Quick summary of the configurations included.
              </p>
            </header>
            <div className="space-y-3 text-sm text-slate-600">
              <div className="flex items-center justify-between">
                <span>Compute bundles</span>
                <span className="font-semibold text-slate-900">{pricingRequests.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Total instances</span>
                <span className="font-semibold text-slate-900">{totalInstances}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Regions covered</span>
                <span className="font-semibold text-slate-900">{regionCount}</span>
              </div>
            </div>
            <p className="text-center text-xs text-slate-500">
              Once generated, quotes include delivery-ready messaging and a PDF attachment.
            </p>
          </ModernCard>
        </div>
      </div>
    </div>
  );
};

export default QuoteFinalReviewStep;
