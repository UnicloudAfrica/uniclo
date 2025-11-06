import React, { useEffect, useMemo, useState } from "react";
import { User, Mail, Phone, Building, Loader2 } from "lucide-react";
import { useCreateNewLead } from "../../../hooks/tenantHooks/leadsHook";
import { useFetchTenantAdmins } from "../../../hooks/adminUserHooks";
import ToastUtils from "../../../utils/toastUtil";
import { useFetchCountries } from "../../../hooks/resource";
import ModernInput from "../../../adminDashboard/components/ModernInput";
import FormLayout, {
  formAccent,
  getAccentRgba,
} from "../../../adminDashboard/components/FormLayout";

const leadStatusOptions = [
  "new",
  "contacted",
  "qualified",
  "proposal_sent",
  "negotiating",
  "closed_won",
  "closed_lost",
];

const leadStageStatusOptions = [
  "pending",
  "in_progress",
  "completed",
  "skipped",
];

const leadStageNameOptions = [
  "initial_contact",
  "needs_assessment",
  "proposal_creation",
  "documentation_review",
  "contract_negotiation",
  "verification",
  "approval",
];

const DEFAULT_FORM_STATE = {
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  company: "",
  country: "",
  lead_type: "",
  status: "",
  source: "",
  notes: "",
  assigned_to: "",
  lead_stage: {
    stage_name: "",
    description: "",
    assigned_to: "",
    status: "",
  },
};

const CreateLead = ({ isOpen = false, onClose, mode = "modal" }) => {
  const isPageMode = mode === "page";
  const [formData, setFormData] = useState(DEFAULT_FORM_STATE);
  const [errors, setErrors] = useState({});

  const { mutate, isPending } = useCreateNewLead();
  const { data: admins, isLoading: adminsLoading } = useFetchTenantAdmins();
  const {
    data: countries,
    isLoading: countriesLoading,
    isError: countriesError,
  } = useFetchCountries();

  useEffect(() => {
    if (!isPageMode && isOpen) {
      setFormData(DEFAULT_FORM_STATE);
      setErrors({});
    }
  }, [isOpen, isPageMode]);

  const formatDisplay = (str) =>
    str.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  const validateForm = () => {
    const newErrors = {};
    if (!formData.first_name.trim())
      newErrors.first_name = "First name is required.";
    if (!formData.last_name.trim())
      newErrors.last_name = "Last name is required.";
    if (!formData.email.trim()) newErrors.email = "Email is required.";
    if (!formData.status) newErrors.status = "Status is required.";

    if (
      formData.lead_stage.stage_name ||
      formData.lead_stage.description ||
      formData.lead_stage.assigned_to ||
      formData.lead_stage.status
    ) {
      if (!formData.lead_stage.stage_name)
        newErrors.stage_name = "Stage name is required if providing a stage.";
      if (!formData.lead_stage.description)
        newErrors.stage_description = "Stage description is required.";
      if (!formData.lead_stage.status)
        newErrors.stage_status = "Stage status is required.";
    }

    setErrors(newErrors);
    const isValid = Object.keys(newErrors).length === 0;
    if (!isValid) {
      ToastUtils.warning("Please correct the highlighted form errors.");
    }
    return isValid;
  };

  const updateFormData = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const updateLeadStageFormData = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      lead_stage: { ...prev.lead_stage, [field]: value },
    }));
    setErrors((prev) => ({ ...prev, [`stage_${field}`]: null }));
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (!validateForm()) {
      return;
    }

    const leadData = {
      ...formData,
      lead_stage: formData.lead_stage.stage_name
        ? formData.lead_stage
        : undefined,
    };

    mutate(leadData, {
      onSuccess: () => {
        ToastUtils.success("Lead created successfully!");
        if (typeof onClose === "function") {
          onClose();
        }
        if (!isPageMode) {
          setFormData(DEFAULT_FORM_STATE);
        }
      },
      onError: (error) => {
        ToastUtils.error(error?.message || "Failed to create lead.");
      },
    });
  };

  const countryOptions = useMemo(() => {
    if (countriesError) {
      return [];
    }

    return (countries || []).map((country) => ({
      value: country.iso2 || country.code,
      label: country.name,
    }));
  }, [countries, countriesError]);

  return (
    <FormLayout
      title="Lead details"
      description="Capture the essentials so your team can nurture and convert this opportunity."
      accentColor={formAccent.cyan}
      footer={
        <div className="flex justify-end gap-3">
          {!isPageMode && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
              disabled={isPending}
            >
              Cancel
            </button>
          )}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-full bg-[--theme-color] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[--secondary-color] disabled:opacity-60"
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Create lead
          </button>
        </div>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr),minmax(0,1fr)]">
        <section className="space-y-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div>
            <h3 className="text-base font-semibold text-gray-900">
              Contact information
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Let us know who you&apos;re speaking with so we can tailor the
              onboarding path.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <ModernInput
              label="First name"
              value={formData.first_name}
              onChange={(e) => updateFormData("first_name", e.target.value)}
              placeholder="Jane"
              icon={User}
              required
              error={errors.first_name}
            />
            <ModernInput
              label="Last name"
              value={formData.last_name}
              onChange={(e) => updateFormData("last_name", e.target.value)}
              placeholder="Doe"
              icon={User}
              required
              error={errors.last_name}
            />
            <ModernInput
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => updateFormData("email", e.target.value)}
              placeholder="jane@example.com"
              icon={Mail}
              required
              error={errors.email}
            />
            <ModernInput
              label="Phone"
              value={formData.phone}
              onChange={(e) => updateFormData("phone", e.target.value)}
              placeholder="+1 234 567 8900"
              icon={Phone}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <ModernInput
              label="Company"
              value={formData.company}
              onChange={(e) => updateFormData("company", e.target.value)}
              placeholder="Acme Inc."
              icon={Building}
            />
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Country
              </label>
              <select
                className={`w-full rounded-lg border px-3 py-2 text-sm ${
                  errors.country ? "border-red-500" : "border-gray-300"
                }`}
                value={formData.country}
                onChange={(e) => updateFormData("country", e.target.value)}
                disabled={countriesLoading}
              >
                <option value="">
                  {countriesLoading ? "Loading..." : "Select country"}
                </option>
                {countryOptions.map((country) => (
                  <option key={country.value} value={country.value}>
                    {country.label}
                  </option>
                ))}
              </select>
              {errors.country && (
                <p className="mt-1 text-xs text-red-500">{errors.country}</p>
              )}
            </div>
          </div>
        </section>

        <section
          className="space-y-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
          style={{
            backgroundColor: getAccentRgba(formAccent.cyan, 0.05),
            borderColor: getAccentRgba(formAccent.cyan, 0.12),
          }}
        >
          <div>
            <h3 className="text-base font-semibold text-gray-900">
              Lead profiling
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Outline how this partner entered your pipeline and what type of
              opportunity they represent.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Lead status<span className="text-red-500">*</span>
              </label>
              <select
                className={`w-full rounded-lg border px-3 py-2 text-sm ${
                  errors.status ? "border-red-500" : "border-gray-300"
                }`}
                value={formData.status}
                onChange={(e) => updateFormData("status", e.target.value)}
              >
                <option value="" disabled>
                  Select a status
                </option>
                {leadStatusOptions.map((status) => (
                  <option key={status} value={status}>
                    {formatDisplay(status)}
                  </option>
                ))}
              </select>
              {errors.status && (
                <p className="mt-1 text-xs text-red-500">{errors.status}</p>
              )}
            </div>

            <ModernInput
              label="Lead type"
              value={formData.lead_type}
              onChange={(e) => updateFormData("lead_type", e.target.value)}
              placeholder="e.g. Cloud migration"
            />
            <ModernInput
              label="Source"
              value={formData.source}
              onChange={(e) => updateFormData("source", e.target.value)}
              placeholder="e.g. Referral, Marketplace"
            />

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Owner (optional)
              </label>
              <select
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                value={formData.assigned_to}
                onChange={(e) => updateFormData("assigned_to", e.target.value)}
                disabled={adminsLoading}
              >
                <option value="">Unassigned</option>
                {adminsLoading ? (
                  <option disabled>Loading owners...</option>
                ) : (
                  admins?.map((admin) => (
                    <option key={admin.id} value={admin.identifier || admin.id}>
                      {admin.first_name} {admin.last_name} ({admin.email})
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>
        </section>
      </div>

      <section className="space-y-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <div>
          <h3 className="text-base font-semibold text-gray-900">
            Optional stage setup
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Create the first milestone you expect to achieve with this lead.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Stage name
            </label>
            <select
              className={`w-full rounded-lg border px-3 py-2 text-sm ${
                errors.stage_name ? "border-red-500" : "border-gray-300"
              }`}
              value={formData.lead_stage.stage_name}
              onChange={(e) =>
                updateLeadStageFormData("stage_name", e.target.value)
              }
            >
              <option value="">Select a stage</option>
              {leadStageNameOptions.map((stage) => (
                <option key={stage} value={stage}>
                  {formatDisplay(stage)}
                </option>
              ))}
            </select>
            {errors.stage_name && (
              <p className="mt-1 text-xs text-red-500">{errors.stage_name}</p>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Stage status
            </label>
            <select
              className={`w-full rounded-lg border px-3 py-2 text-sm ${
                errors.stage_status ? "border-red-500" : "border-gray-300"
              }`}
              value={formData.lead_stage.status}
              onChange={(e) =>
                updateLeadStageFormData("status", e.target.value)
              }
            >
              <option value="">Select status</option>
              {leadStageStatusOptions.map((status) => (
                <option key={status} value={status}>
                  {formatDisplay(status)}
                </option>
              ))}
            </select>
            {errors.stage_status && (
              <p className="mt-1 text-xs text-red-500">
                {errors.stage_status}
              </p>
            )}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Stage description
            </label>
            <textarea
              rows={3}
              className={`w-full rounded-lg border px-3 py-2 text-sm ${
                errors.stage_description ? "border-red-500" : "border-gray-300"
              }`}
              value={formData.lead_stage.description}
              onChange={(e) =>
                updateLeadStageFormData("description", e.target.value)
              }
              placeholder="Outline the goals or expected outcome for this stage."
            />
            {errors.stage_description && (
              <p className="mt-1 text-xs text-red-500">
                {errors.stage_description}
              </p>
            )}
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Stage owner (optional)
            </label>
            <select
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              value={formData.lead_stage.assigned_to}
              onChange={(e) =>
                updateLeadStageFormData("assigned_to", e.target.value)
              }
              disabled={adminsLoading}
            >
              <option value="">Unassigned</option>
              {adminsLoading ? (
                <option disabled>Loading owners...</option>
              ) : (
                admins?.map((admin) => (
                  <option key={admin.id} value={admin.identifier || admin.id}>
                    {admin.first_name} {admin.last_name} ({admin.email})
                  </option>
                ))
              )}
            </select>
          </div>
        </div>
      </section>
    </FormLayout>
  );
};

export default CreateLead;
