// @ts-nocheck
import React, { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import { useFetchAdmins } from "../../../hooks/adminHooks/adminHooks";
import ToastUtils from "../../../utils/toastUtil";
import { useCreateCustomStage } from "../../../hooks/adminHooks/leadsHook";

const stageOptions = [
  "initial_contact",
  "needs_assessment",
  "proposal_creation",
  "documentation_review",
  "contract_negotiation",
  "verification",
  "approval",
];

const AddLeadStage = ({ isOpen, onClose }: any) => {
  const [leadId, setLeadId] = useState(null);
  const [formData, setFormData] = useState({
    stage_name: "",
    description: "",
    assigned_to: "",
  });
  const [errors, setErrors] = useState({});

  const { data: admins, isLoading: isAdminsLoading } = useFetchAdmins();
  const { mutate, isPending } = useCreateCustomStage();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const encodedId = params.get("id");
    if (encodedId) {
      try {
        const decodedId = atob(decodeURIComponent(encodedId));
        setLeadId(decodedId);
      } catch (error) {
        console.error("Failed to decode lead ID from URL:", error);
      }
    }
    if (isOpen) {
      setFormData({
        stage_name: "",
        description: "",
        assigned_to: "",
      });
      setErrors({});
    }
  }, [isOpen]);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.stage_name) {
      newErrors.stage_name = "Please select a stage name.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const updateFormData = (field: any, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const handleSubmit = (e: any) => {
    if (e) e.preventDefault();

    if (!validateForm()) return;
    if (!leadId) {
      ToastUtils.error("Lead ID is missing. Cannot add stage.");
      return;
    }

    const stageData = {
      lead_id: leadId,
      stage_name: formData.stage_name,
      description: formData.description,
    };

    mutate(stageData, {
      onSuccess: () => {
        ToastUtils.success("Lead stage added successfully!");
        onClose();
      },
      onError: () => {
        // ToastUtils.error("Failed to add lead stage. Please try again.");
      },
    });
  };

  if (!isOpen) return null;

  const formatStageNameForDisplay = (name: any) => {
    return name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000] font-Outfit">
      <div className="bg-white rounded-[24px] max-w-[650px] mx-4 w-full">
        <div className="flex justify-between items-center px-6 py-4 border-b bg-[#F2F2F2] rounded-t-[24px] w-full">
          <h2 className="text-lg font-semibold text-[#575758]">Add Lead Stage</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-[#1E1E1EB2] font-medium transition-colors"
            disabled={isPending}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-6 py-6 w-full overflow-y-auto flex flex-col items-center max-h-[400px] justify-start">
          <div className="space-y-4 w-full">
            <div>
              <label htmlFor="stageName" className="block text-sm font-medium text-gray-700 mb-2">
                Stage Name<span className="text-red-500">*</span>
              </label>
              <select
                id="stageName"
                value={formData.stage_name}
                onChange={(e) => updateFormData("stage_name", e.target.value)}
                className={`w-full rounded-[10px] border px-3 py-2 text-sm input-field ${
                  errors.stage_name ? "border-red-500" : "border-gray-300"
                }`}
              >
                <option value="" disabled>
                  Select a stage
                </option>
                {stageOptions.map((stage: any) => (
                  <option key={stage} value={stage}>
                    {formatStageNameForDisplay(stage)}
                  </option>
                ))}
              </select>
              {errors.stage_name && (
                <p className="text-red-500 text-xs mt-1">{errors.stage_name}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="stageDescription"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Description (optional)
              </label>
              <textarea
                id="stageDescription"
                rows="3"
                value={formData.description}
                onChange={(e) => updateFormData("description", e.target.value)}
                placeholder="Add a description for this stage..."
                className={`w-full rounded-[10px] border px-3 py-2 text-sm input-field ${
                  errors.description ? "border-red-500" : "border-gray-300"
                }`}
              />
            </div>

            <div>
              <label htmlFor="assignedTo" className="block text-sm font-medium text-gray-700 mb-2">
                Assigned To (optional)
              </label>
              <select
                id="assignedTo"
                value={formData.assigned_to}
                onChange={(e) => updateFormData("assigned_to", e.target.value)}
                className={`w-full rounded-[10px] border px-3 py-2 text-sm input-field ${
                  errors.assigned_to ? "border-red-500" : "border-gray-300"
                }`}
                disabled={isAdminsLoading}
              >
                <option value="">Unassigned</option>
                {isAdminsLoading ? (
                  <option disabled>Loading admins...</option>
                ) : (
                  admins?.map((admin: any) => (
                    <option key={admin.identifier} value={admin.identifier}>
                      {admin.first_name} {admin.last_name} ({admin.email})
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end px-6 py-4 border-t rounded-b-[24px]">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2 text-[#676767] bg-[#FAFAFA] border border-[#ECEDF0] rounded-[30px] font-medium hover:text-gray-800 transition-colors"
              disabled={isPending}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isPending}
              className="px-8 py-3 bg-[#288DD1] text-white font-medium rounded-full hover:bg-[#1976D2] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              Add Stage
              {isPending && <Loader2 className="w-4 h-4 ml-2 text-white animate-spin" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddLeadStage;
