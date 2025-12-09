// @ts-nocheck
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { X, Loader2 } from "lucide-react";
import { useCreateNewLead, useFetchLeadTypes } from "../../../hooks/tenantHooks/leadsHook";
import ToastUtils from "../../../utils/toastUtil";
import { useFetchCountries } from "../../../hooks/resource";
import { buildLeadTypeOptions, ensureLeadTypeValue } from "../../../utils/leadTypes";

const leadStatusOptions = [
  "new",
  "contacted",
  "qualified",
  "proposal_sent",
  "negotiating",
  "closed_won",
  "closed_lost",
];

const leadStageStatusOptions = ["pending", "in_progress", "completed", "skipped"];

const leadStageNameOptions = [
  "initial_contact",
  "needs_assessment",
  "proposal_creation",
  "documentation_review",
  "contract_negotiation",
  "verification",
  "approval",
];

const CreateLead = ({ onClose }: any) => {
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
  const { data: leadTypesData = [], isLoading: leadTypesLoading } = useFetchLeadTypes();
  const {
    data: countries,
    isLoading: countriesLoading,
    isError: countriesError,
  } = useFetchCountries();

  useEffect(() => {
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
  }, []);

  const leadTypeOptions = useMemo(() => buildLeadTypeOptions(leadTypesData), [leadTypesData]);

  const leadTypeSet = useMemo(
    () => new Set(leadTypeOptions.map((option: any) => option.value)),
    [leadTypeOptions]
  );

  const normalizeLeadTypeValue = useCallback(
    (value) => ensureLeadTypeValue(value, leadTypeOptions),
    [leadTypeOptions]
  );

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

  const formatDisplay = (str: any) => {
    return str.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.first_name.trim()) newErrors.first_name = "First name is required.";
    if (!formData.last_name.trim()) newErrors.last_name = "Last name is required.";
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
      if (!formData.lead_stage.status) newErrors.stage_status = "Stage status is required.";
    }

    setErrors(newErrors);
    const isValid = Object.keys(newErrors).length === 0;

    if (!isValid) {
      ToastUtils.warning("Please correct the highlighted form errors.");
    }

    return isValid;
  };

  const updateFormData = (field: any, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const updateLeadStageFormData = (field: any, value: any) => {
    setFormData((prev) => ({
      ...prev,
      lead_stage: { ...prev.lead_stage, [field]: value },
    }));
    setErrors((prev) => ({ ...prev, [`stage_${field}`]: null }));
  };

  const handleSubmit = (e: any) => {
    e.preventDefault();
    if (!validateForm()) return;

    const leadData = {
      ...formData,
      lead_stage: formData.lead_stage.stage_name ? formData.lead_stage : undefined,
    };

    mutate(leadData, {
      onSuccess: () => {
        ToastUtils.success("Lead created successfully!");
        onClose();
      },
      onError: (error) => {
        ToastUtils.error(error?.message || "Failed to create lead.");
      },
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000] font-Outfit">
      <div className="bg-white rounded-[24px] max-w-[650px] mx-4 w-full">
        <div className="flex justify-between items-center px-6 py-4 border-b bg-[#F2F2F2] rounded-t-[24px] w-full">
          <h2 className="text-lg font-semibold text-[#575758]">Create New Lead</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-[#1E1E1EB2] font-medium transition-colors"
            disabled={isPending}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-6 w-full overflow-y-auto flex flex-col max-h-[400px]">
          <form className="space-y-4 w-full" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name<span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.first_name}
                  onChange={(e) => updateFormData("first_name", e.target.value)}
                  placeholder="e.g., John"
                  className={`w-full rounded-[10px] border px-3 py-2 text-sm input-field ${
                    errors.first_name ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {errors.first_name && (
                  <span className="text-red-500 text-xs">{errors.first_name}</span>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name<span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.last_name}
                  onChange={(e) => updateFormData("last_name", e.target.value)}
                  placeholder="e.g., Doe"
                  className={`w-full rounded-[10px] border px-3 py-2 text-sm input-field ${
                    errors.last_name ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {errors.last_name && (
                  <span className="text-red-500 text-xs">{errors.last_name}</span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email<span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateFormData("email", e.target.value)}
                  placeholder="john.doe@example.com"
                  className={`w-full rounded-[10px] border px-3 py-2 text-sm input-field ${
                    errors.email ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {errors.email && <span className="text-red-500 text-xs">{errors.email}</span>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => updateFormData("phone", e.target.value)}
                  placeholder="+1 (555) 123-4567"
                  className="w-full rounded-[10px] border border-gray-300 px-3 py-2 text-sm input-field"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                <input
                  type="text"
                  value={formData.company}
                  onChange={(e) => updateFormData("company", e.target.value)}
                  placeholder="Company Name"
                  className="w-full rounded-[10px] border border-gray-300 px-3 py-2 text-sm input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                <select
                  value={formData.country}
                  onChange={(e) => updateFormData("country", e.target.value)}
                  className="w-full rounded-[10px] border border-gray-300 px-3 py-2 text-sm input-field"
                  disabled={countriesLoading}
                >
                  <option value="">Select Country</option>
                  {countries?.map((country: any) => (
                    <option key={country.id} value={country.name}>
                      {country.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  {leadTypeOptions.map((option: any) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {errors.lead_type && (
                  <span className="text-red-500 text-xs">{errors.lead_type}</span>
                )}
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
                  <option value="">Select Status</option>
                  {leadStatusOptions.map((status: any) => (
                    <option key={status} value={status}>
                      {formatDisplay(status)}
                    </option>
                  ))}
                </select>
                {errors.status && <span className="text-red-500 text-xs">{errors.status}</span>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
              <input
                type="text"
                value={formData.source}
                onChange={(e) => updateFormData("source", e.target.value)}
                placeholder="e.g., Website, Referral, Cold Call"
                className="w-full rounded-[10px] border border-gray-300 px-3 py-2 text-sm input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => updateFormData("notes", e.target.value)}
                placeholder="Additional notes about the lead..."
                rows={3}
                className="w-full rounded-[10px] border border-gray-300 px-3 py-2 text-sm input-field"
              />
            </div>

            {/* Lead Stage Section */}
            <div className="border-t pt-4">
              <h4 className="text-md font-medium text-gray-700 mb-3">Lead Stage (Optional)</h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stage Name</label>
                  <select
                    value={formData.lead_stage.stage_name}
                    onChange={(e) => updateLeadStageFormData("stage_name", e.target.value)}
                    className={`w-full rounded-[10px] border px-3 py-2 text-sm input-field ${
                      errors.stage_name ? "border-red-500" : "border-gray-300"
                    }`}
                  >
                    <option value="">Select Stage</option>
                    {leadStageNameOptions.map((stage: any) => (
                      <option key={stage} value={stage}>
                        {formatDisplay(stage)}
                      </option>
                    ))}
                  </select>
                  {errors.stage_name && (
                    <span className="text-red-500 text-xs">{errors.stage_name}</span>
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
                    <option value="">Select Status</option>
                    {leadStageStatusOptions.map((status: any) => (
                      <option key={status} value={status}>
                        {formatDisplay(status)}
                      </option>
                    ))}
                  </select>
                  {errors.stage_status && (
                    <span className="text-red-500 text-xs">{errors.stage_status}</span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Stage Description
                </label>
                <textarea
                  value={formData.lead_stage.description}
                  onChange={(e) => updateLeadStageFormData("description", e.target.value)}
                  placeholder="Describe the current stage..."
                  rows={2}
                  className={`w-full rounded-[10px] border px-3 py-2 text-sm input-field ${
                    errors.stage_description ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {errors.stage_description && (
                  <span className="text-red-500 text-xs">{errors.stage_description}</span>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 rounded-[30px] border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                disabled={isPending}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-[#288DD1] text-white rounded-[30px] hover:bg-[#1976D2] transition-colors flex items-center space-x-2"
                disabled={isPending}
              >
                {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{isPending ? "Creating..." : "Create Lead"}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateLead;
