import React, { useCallback, useEffect, useMemo, useState } from "react";
import { User, Mail, Phone, Building } from "lucide-react";
// import { useFetchAdmins } from "../../../hooks/adminHooks/adminHooks";
import { useCreateNewLead, useFetchLeadTypes } from "../../../hooks/adminHooks/leadsHook";
import ToastUtils from "../../../utils/toastUtil";
import { useFetchCountries } from "../../../hooks/resource";
import ModernInput from "../../components/ModernInput";
import FormLayout, {
  formAccent,
  getAccentRgba,
} from "../../components/FormLayout";
import {
  buildLeadTypeOptions,
  ensureLeadTypeValue,
  formatLeadTypeLabel,
} from "../../../utils/leadTypes";

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

const CreateLead = ({ isOpen = false, onClose, mode = "modal" }) => {
  const isPageMode = mode === "page";
  const [formData, setFormData] = useState({
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
  });
  const [errors, setErrors] = useState({});

  const { mutate, isPending } = useCreateNewLead();
  const {
    data: leadTypesData = [],
    isLoading: leadTypesLoading,
  } = useFetchLeadTypes();
  // const { data: admins, isLoading: adminsLoading } = useFetchAdmins();
  const adminsLoading = false;
  const {
    data: countries,
    isLoading: countriesLoading,
    isError: countriesError,
  } = useFetchCountries();

  const leadTypeOptions = useMemo(
    () => buildLeadTypeOptions(leadTypesData),
    [leadTypesData],
  );

  const leadTypeSet = useMemo(
    () => new Set(leadTypeOptions.map((option) => option.value)),
    [leadTypeOptions],
  );

  const normalizeLeadTypeValue = useCallback(
    (value) => ensureLeadTypeValue(value, leadTypeOptions),
    [leadTypeOptions],
  );

  const getLeadTypeLabel = (value) => {
    const normalized = normalizeLeadTypeValue(value);
    if (!normalized) {
      return "Not set";
    }
    const match = leadTypeOptions.find((option) => option.value === normalized);
    return match ? match.label : formatLeadTypeLabel(normalized);
  };

  useEffect(() => {
    if (!formData.lead_type) {
      return;
    }

    const normalized = normalizeLeadTypeValue(formData.lead_type);
    if (!normalized) {
      setFormData((prev) => ({ ...prev, lead_type: "" }));
      return;
    }

    if (normalized !== formData.lead_type) {
      setFormData((prev) => ({ ...prev, lead_type: normalized }));
    }
  }, [formData.lead_type, normalizeLeadTypeValue]);

  useEffect(() => {
    if (!isPageMode && isOpen) {
      setFormData({
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
      });
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
      leadTypeOptions.length > 0 &&
      (!formData.lead_type || !leadTypeSet.has(formData.lead_type))
    ) {
      newErrors.lead_type = "Lead type is required.";
    }

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
    e.preventDefault();
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
      },
      onError: (error) => {
        ToastUtils.error(error?.message || "Failed to create lead.");
      },
    });
  };

  const accent = formAccent.primary;
  const formId = "create-lead-form";
  const selectedLeadTypeLabel = getLeadTypeLabel(formData.lead_type);

  const leadSummary = useMemo(
    () => [
      {
        title: "Prospect overview",
        items: [
          {
            label: "Full name",
            value:
              [formData.first_name, formData.last_name].filter(Boolean).join(" ") ||
              "Pending",
          },
          { label: "Email", value: formData.email || "Not provided" },
          { label: "Phone", value: formData.phone || "Not provided" },
          { label: "Lead type", value: selectedLeadTypeLabel },
        ],
      },
      {
        title: "Company context",
        items: [
          { label: "Company", value: formData.company || "—" },
          { label: "Lead type", value: selectedLeadTypeLabel },
          { label: "Source", value: formData.source || "—" },
        ],
      },
      {
        title: "Stage details",
        items: [
          {
            label: "Pipeline status",
            value: formData.status ? formatDisplay(formData.status) : "Unset",
          },
          {
            label: "Stage name",
            value: formData.lead_stage.stage_name
              ? formatDisplay(formData.lead_stage.stage_name)
              : "Not captured",
          },
          {
            label: "Stage status",
            value: formData.lead_stage.status
              ? formatDisplay(formData.lead_stage.status)
              : "Not captured",
          },
        ],
      },
    ],
    [
      formData.first_name,
      formData.last_name,
      formData.email,
      formData.phone,
      formData.company,
      formData.lead_type,
      formData.source,
      formData.status,
      formData.lead_stage.stage_name,
      formData.lead_stage.status,
      selectedLeadTypeLabel,
    ]
  );

  const guidanceItems = [
    "Status determines the lead’s placement across dashboard insights.",
    "Lead type comes directly from your catalog—select the closest match.",
    "If you capture stage metadata, provide a description for downstream teams.",
    "Assigning a lead ensures accountability; leave blank when undecided.",
  ];

  const meta = [
    {
      label: "Pipeline status",
      value: formData.status ? formatDisplay(formData.status) : "Unassigned",
    },
    {
      label: "Lead type",
      value: selectedLeadTypeLabel,
    },
    {
      label: "Stage",
      value: formData.lead_stage.stage_name
        ? formatDisplay(formData.lead_stage.stage_name)
        : "Not set",
    },
    {
      label: "Country",
      value: formData.country || "Not captured",
    },
  ];

  const asideContent = (
    <>
      <div className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm backdrop-blur">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Lead summary
            </p>
            <p className="text-lg font-semibold text-slate-800">
              {[formData.first_name, formData.last_name].filter(Boolean).join(" ") ||
                "New lead"}
            </p>
          </div>
          <span
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold"
            style={{
              backgroundColor: getAccentRgba(accent.color, 0.12),
              color: accent.color,
            }}
          >
            {formData.status ? (
              formData.status.charAt(0).toUpperCase()
            ) : (
              <span aria-hidden="true">•</span>
            )}
          </span>
        </div>
        <dl className="mt-4 space-y-2 text-sm text-slate-600">
          <div className="flex items-center justify-between">
            <dt>Email</dt>
            <dd className="max-w-[160px] text-right font-medium text-slate-800">
              {formData.email || "Pending"}
            </dd>
          </div>
          <div className="flex items-center justify-between">
            <dt>Company</dt>
            <dd className="font-medium text-slate-800">
              {formData.company || "—"}
            </dd>
          </div>
          <div className="flex items-center justify-between">
            <dt>Status</dt>
            <dd className="font-medium text-slate-800">
              {formData.status ? formatDisplay(formData.status) : "Not set"}
            </dd>
          </div>
        </dl>
        <p className="mt-3 text-xs text-slate-500">
          Keep lead details concise; supplementary notes appear in the lead
          profile after creation.
        </p>
      </div>

      {leadSummary.map((section) => (
        <div
          key={section.title}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <h3 className="text-sm font-semibold text-slate-800">
            {section.title}
          </h3>
          <dl className="mt-3 space-y-3 text-sm">
            {section.items.map((item) => (
              <div
                key={`${section.title}-${item.label}`}
                className="flex items-start justify-between gap-3"
              >
                <dt className="text-slate-500">{item.label}</dt>
                <dd className="max-w-[160px] text-right font-medium text-slate-800">
                  {item.value || "—"}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      ))}

      <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-slate-100 p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-800">Creation tips</h3>
        <ul className="mt-3 space-y-2 text-sm text-slate-600">
          {guidanceItems.map((tip) => (
            <li key={tip} className="flex items-start gap-2">
              <span
                className="mt-1 h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: accent.color }}
              />
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      </div>
    </>
  );

  const footer = (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <button
        type="button"
        onClick={() => {
          if (typeof onClose === "function") {
            onClose();
          }
        }}
        disabled={isPending}
        className="w-full rounded-full border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        Cancel
      </button>
      <button
        type="submit"
        form={formId}
        disabled={isPending}
        className="inline-flex w-full items-center justify-center rounded-full bg-[#0F62FE] px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0b51d3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#0F62FE] disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
      >
        {isPending ? (
          <>
            Saving
            <span className="ml-2 inline-flex h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          </>
        ) : (
          "Create lead"
        )}
      </button>
    </div>
  );

  const shouldRender = isPageMode || isOpen;
  if (!shouldRender) {
    return null;
  }

  return (
    <FormLayout
      mode={mode}
      onClose={onClose}
      isProcessing={isPending}
      title="Create New Lead"
      description="Capture lead contact details, company information, and pipeline status to start tracking progress."
      accentGradient={accent.gradient}
      accentColor={accent.color}
      meta={meta}
      aside={asideContent}
      footer={footer}
      maxWidthClass={isPageMode ? "max-w-full" : "max-w-4xl"}
    >
      <form id={formId} className="space-y-8" onSubmit={handleSubmit}>
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <header className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Personal information
              </h3>
              <p className="text-sm text-slate-500">
                Basic contact details for following up with the prospect.
              </p>
            </div>
          </header>
          <div className="mt-6 space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <ModernInput
                label="First Name"
                type="text"
                value={formData.first_name}
                onChange={(e) => updateFormData("first_name", e.target.value)}
                placeholder="e.g., John"
                required
                error={errors.first_name}
                icon={<User />}
                autoComplete="given-name"
              />
              <ModernInput
                label="Last Name"
                type="text"
                value={formData.last_name}
                onChange={(e) => updateFormData("last_name", e.target.value)}
                placeholder="e.g., Doe"
                required
                error={errors.last_name}
                icon={<User />}
                autoComplete="family-name"
              />
              <ModernInput
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => updateFormData("email", e.target.value)}
                placeholder="e.g., john.doe@example.com"
                required
                error={errors.email}
                icon={<Mail />}
                autoComplete="email"
                autoCorrect="off"
                spellCheck="false"
              />
              <ModernInput
                label="Phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => updateFormData("phone", e.target.value)}
                placeholder="e.g., +1234567890"
                icon={<Phone />}
                autoComplete="tel"
              />
              <ModernInput
                label="Company"
                type="text"
                value={formData.company}
                onChange={(e) => updateFormData("company", e.target.value)}
                placeholder="e.g., Acme Corp"
                icon={<Building />}
                autoComplete="organization"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => updateFormData("notes", e.target.value)}
                rows={3}
                placeholder="Describe additional context"
                className="w-full rounded-[10px] border border-gray-300 px-3 py-2 text-sm input-field"
              />
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <header className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Lead qualification
              </h3>
              <p className="text-sm text-slate-500">
                Qualify the lead with pipeline status and ownership details.
              </p>
            </div>
          </header>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Country
              </label>
              <select
                value={formData.country}
                onChange={(e) => updateFormData("country", e.target.value)}
                disabled={countriesLoading}
                className={`w-full rounded-[10px] border px-3 py-2 text-sm input-field ${
                  errors.country ? "border-red-500" : "border-gray-300"
                }`}
              >
                <option value="" disabled>
                  {countriesLoading
                    ? "Loading countries..."
                    : "Select a country"}
                </option>
                {countriesError && (
                  <option value="" disabled>
                    Error loading countries
                  </option>
                )}
                {countries &&
                  countries.map((country) => (
                    <option key={country.code} value={country.name}>
                      {country.name}
                    </option>
                  ))}
              </select>
              {errors.country && (
                <p className="text-red-500 text-xs mt-1">{errors.country}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lead Type<span className="text-red-500">*</span>
              </label>
              <select
                value={formData.lead_type}
                onChange={(e) =>
                  updateFormData("lead_type", normalizeLeadTypeValue(e.target.value))
                }
                className={`w-full rounded-[10px] border px-3 py-2 text-sm input-field ${
                  errors.lead_type ? "border-red-500" : "border-gray-300"
                }`}
                disabled={leadTypesLoading && leadTypeOptions.length === 0}
              >
                <option value="">
                  {leadTypesLoading ? "Loading lead types..." : "Select a lead type"}
                </option>
                {leadTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.lead_type && (
                <p className="text-red-500 text-xs mt-1">{errors.lead_type}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Source
              </label>
              <input
                type="text"
                value={formData.source}
                onChange={(e) => updateFormData("source", e.target.value)}
                placeholder="e.g., Ad Campaign"
                className="w-full rounded-[10px] border border-gray-300 px-3 py-2 text-sm input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status<span className="text-red-500">*</span>
              </label>
              <select
                value={formData.status}
                onChange={(e) => updateFormData("status", e.target.value)}
                className={`w-full rounded-[10px] border px-3 py-2 text-sm input-field ${
                  errors.status ? "border-red-500" : "border-gray-300"
                }`}
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
                <p className="text-red-500 text-xs mt-1">{errors.status}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Assigned To (Optional)
              </label>
              <select
                value={formData.assigned_to}
                onChange={(e) => updateFormData("assigned_to", e.target.value)}
                disabled={adminsLoading}
                className={`w-full rounded-[10px] border px-3 py-2 text-sm input-field ${
                  errors.assigned_to ? "border-red-500" : "border-gray-300"
                }`}
              >
                <option value="">
                  No admin assignment (admin loading disabled)
                </option>
              </select>
              {errors.assigned_to && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.assigned_to}
                </p>
              )}
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <header className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Lead stage information
              </h3>
              <p className="text-sm text-slate-500">
                Optionally capture the current workflow stage for this lead.
              </p>
            </div>
          </header>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Stage Name
              </label>
              <select
                value={formData.lead_stage.stage_name}
                onChange={(e) =>
                  updateLeadStageFormData("stage_name", e.target.value)
                }
                className={`w-full rounded-[10px] border px-3 py-2 text-sm input-field ${
                  errors.stage_name ? "border-red-500" : "border-gray-300"
                }`}
              >
                <option value="">Select a stage name</option>
                {leadStageNameOptions.map((name) => (
                  <option key={name} value={name}>
                    {formatDisplay(name)}
                  </option>
                ))}
              </select>
              {errors.stage_name && (
                <p className="text-red-500 text-xs mt-1">{errors.stage_name}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Stage Status
              </label>
              <select
                value={formData.lead_stage.status}
                onChange={(e) => updateLeadStageFormData("status", e.target.value)}
                className={`w-full rounded-[10px] border px-3 py-2 text-sm input-field ${
                  errors.stage_status ? "border-red-500" : "border-gray-300"
                }`}
              >
                <option value="">Select a status</option>
                {leadStageStatusOptions.map((status) => (
                  <option key={status} value={status}>
                    {formatDisplay(status)}
                  </option>
                ))}
              </select>
              {errors.stage_status && (
                <p className="text-red-500 text-xs mt-1">{errors.stage_status}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Assigned to Stage
              </label>
              <select
                value={formData.lead_stage.assigned_to}
                onChange={(e) =>
                  updateLeadStageFormData("assigned_to", e.target.value)
                }
                disabled={adminsLoading}
                className={`w-full rounded-[10px] border px-3 py-2 text-sm input-field ${
                  errors.stage_assigned_to ? "border-red-500" : "border-gray-300"
                }`}
              >
                <option value="">
                  No admin assignment (admin loading disabled)
                </option>
              </select>
              {errors.stage_assigned_to && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.stage_assigned_to}
                </p>
              )}
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Stage Description
              </label>
              <textarea
                value={formData.lead_stage.description}
                onChange={(e) =>
                  updateLeadStageFormData("description", e.target.value)
                }
                rows={2}
                placeholder="Describe the stage of this lead."
                className={`w-full rounded-[10px] border px-3 py-2 text-sm input-field ${
                  errors.stage_description ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.stage_description && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.stage_description}
                </p>
              )}
            </div>
          </div>
        </section>
      </form>
    </FormLayout>
  );
};

export default CreateLead;
