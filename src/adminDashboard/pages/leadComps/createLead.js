import React, { useState, useEffect } from "react";
import { X, User, Mail, Phone, Building } from "lucide-react";
import { useFetchAdmins } from "../../../hooks/adminHooks/adminHooks";
import { useCreateNewLead } from "../../../hooks/adminHooks/leadsHook";
import ToastUtils from "../../../utils/toastUtil";
import { useFetchCountries } from "../../../hooks/resource";
import ModernInput from "../../components/ModernInput";
import ModernButton from "../../components/ModernButton";

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

const CreateLead = ({ isOpen, onClose }) => {
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
  const { data: admins, isLoading: adminsLoading } = useFetchAdmins();
  const {
    data: countries,
    isLoading: countriesLoading,
    isError: countriesError,
  } = useFetchCountries();

  useEffect(() => {
    if (isOpen) {
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
  }, [isOpen]);

  const formatDisplay = (str) => {
    return str.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.first_name.trim())
      newErrors.first_name = "First name is required.";
    if (!formData.last_name.trim())
      newErrors.last_name = "Last name is required.";
    if (!formData.email.trim()) newErrors.email = "Email is required.";
    if (!formData.status) newErrors.status = "Status is required.";
    if (!formData.assigned_to) newErrors.assigned_to = "Assignee is required.";

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
      if (!formData.lead_stage.assigned_to)
        newErrors.stage_assigned_to = "Stage assignee is required.";
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
    if (!validateForm()) return;

    const leadData = {
      ...formData,
      lead_stage: formData.lead_stage.stage_name
        ? formData.lead_stage
        : undefined,
    };

    mutate(leadData, {
      onSuccess: () => {
        // ToastUtils.success("Lead created successfully!");
        onClose();
      },
      onError: () => {
        // ToastUtils.error("Failed to create lead. Please try again.");
        // console.error("Failed to create lead.");
      },
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000] font-Outfit">
      <div className="bg-white rounded-[24px] max-w-[650px] mx-4 w-full max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center px-6 py-4 border-b bg-gradient-to-r from-gray-50 to-gray-100 rounded-t-[24px] w-full">
          <h2 className="text-lg font-semibold text-gray-800">
            Create New Lead
          </h2>
          <ModernButton
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={isPending}
          >
            <X className="w-5 h-5" />
          </ModernButton>
        </div>

        <div className="px-6 py-6 w-full overflow-y-auto max-h-[60vh]">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Personal Information Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <ModernInput
                    label="First Name"
                    type="text"
                    value={formData.first_name}
                    onChange={(e) => updateFormData("first_name", e.target.value)}
                    placeholder="e.g., John"
                    required
                    error={errors.first_name}
                    icon={<User />}
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
                  />
                  <ModernInput
                    label="Phone"
                    type="text"
                    value={formData.phone}
                    onChange={(e) => updateFormData("phone", e.target.value)}
                    placeholder="e.g., +1234567890"
                    icon={<Phone />}
                  />
                  <ModernInput
                    label="Company"
                    type="text"
                    value={formData.company}
                    onChange={(e) => updateFormData("company", e.target.value)}
                    placeholder="e.g., Acme Corp"
                    icon={<Building />}
                  />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Country
                    </label>
                    <select
                      value={formData.country}
                      onChange={(e) => updateFormData("country", e.target.value)}
                      disabled={countriesLoading}
                      className={`w-full rounded-[10px] border px-3 py-2 text-sm input-field ${errors.country ? "border-red-500" : "border-gray-300"
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
                      Lead Type
                    </label>
                    <input
                      type="text"
                      value={formData.lead_type}
                      onChange={(e) => updateFormData("lead_type", e.target.value)}
                      placeholder="e.g., Web Lead"
                      className="w-full rounded-[10px] border border-gray-300 px-3 py-2 text-sm input-field"
                    />
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
                      className={`w-full rounded-[10px] border px-3 py-2 text-sm input-field ${errors.status ? "border-red-500" : "border-gray-300"
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
                      Assigned To<span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.assigned_to}
                      onChange={(e) =>
                        updateFormData("assigned_to", e.target.value)
                      }
                      disabled={adminsLoading}
                      className={`w-full rounded-[10px] border px-3 py-2 text-sm input-field ${errors.assigned_to ? "border-red-500" : "border-gray-300"
                        }`}
                    >
                      <option value="" disabled>
                        {adminsLoading ? "Loading admins..." : "Select an admin"}
                      </option>
                      {admins &&
                        admins.map((admin) => (
                          <option key={admin.id} value={admin.id}>
                            {admin.first_name} {admin.last_name}
                          </option>
                        ))}
                    </select>
                    {errors.assigned_to && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.assigned_to}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => updateFormData("notes", e.target.value)}
                    placeholder="Add any additional notes about the lead..."
                    rows="3"
                    className="w-full rounded-[10px] border border-gray-300 px-3 py-2 text-sm input-field"
                  />
                </div>

                <div className="bg-gray-50 rounded-[16px] p-4 border border-dashed border-gray-200">
                  <h3 className="text-md font-semibold text-gray-700 mb-4">
                    Optional: Add an Initial Lead Stage
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Stage Name
                      </label>
                      <select
                        value={formData.lead_stage.stage_name}
                        onChange={(e) =>
                          updateLeadStageFormData("stage_name", e.target.value)
                        }
                        className={`w-full rounded-[10px] border px-3 py-2 text-sm input-field ${errors.stage_name ? "border-red-500" : "border-gray-300"
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
                        <p className="text-red-500 text-xs mt-1">
                          {errors.stage_name}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Stage Status
                      </label>
                      <select
                        value={formData.lead_stage.status}
                        onChange={(e) =>
                          updateLeadStageFormData("status", e.target.value)
                        }
                        className={`w-full rounded-[10px] border px-3 py-2 text-sm input-field ${errors.stage_status ? "border-red-500" : "border-gray-300"
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
                        <p className="text-red-500 text-xs mt-1">
                          {errors.stage_status}
                        </p>
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
                        className={`w-full rounded-[10px] border px-3 py-2 text-sm input-field ${errors.stage_assigned_to
                          ? "border-red-500"
                          : "border-gray-300"
                          }`}
                      >
                        <option value="">
                          {adminsLoading ? "Loading admins..." : "Select an admin"}
                        </option>
                        {admins &&
                          admins.map((admin) => (
                            <option key={admin.id} value={admin.id}>
                              {admin.first_name} {admin.last_name}
                            </option>
                          ))}
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
                        rows="2"
                        placeholder="Describe the stage of this lead."
                        className={`w-full rounded-[10px] border px-3 py-2 text-sm input-field ${errors.stage_description
                          ? "border-red-500"
                          : "border-gray-300"
                          }`}
                      />
                      {errors.stage_description && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.stage_description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <ModernButton
                variant="outline"
                onClick={onClose}
                disabled={isPending}
                type="button"
              >
                Cancel
              </ModernButton>
              <ModernButton
                variant="primary"
                disabled={isPending}
                isLoading={isPending}
                type="submit"
              >
                Create Lead
              </ModernButton>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateLead;
