import React, { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import { useFetchTenantAdmins } from "../../../hooks/adminUserHooks";
import { useUpdateLead } from "../../../hooks/tenantHooks/leadsHook";
import ToastUtils from "../../../utils/toastUtil.ts";

const leadStatusOptions = [
  "new",
  "contacted",
  "qualified",
  "proposal_sent",
  "negotiating",
  "closed_won",
  "closed_lost",
];

const EditLead = ({ isOpen, onClose, lead }) => {
  const [formData, setFormData] = useState({
    status: "",
    notes: "",
    follow_up_date: "",
    assigned_to: "",
  });
  const [errors, setErrors] = useState({});

  const { data: admins, isLoading: isAdminsLoading } = useFetchTenantAdmins();
  const { mutate, isPending } = useUpdateLead();

  useEffect(() => {
    if (isOpen && lead) {
      setFormData({
        status: lead?.status || "",
        notes: lead?.notes || "",
        follow_up_date: lead?.follow_up_date || "",
        assigned_to: lead?.assigned_to?.id || "unassigned",
      });
      setErrors({});
    }
  }, [isOpen, lead]);

  const validateForm = () => {
    const newErrors = {};
    const today = new Date().toISOString().split("T")[0];

    if (!leadStatusOptions.includes(formData.status)) {
      newErrors.status = "Please select a valid status.";
    }

    if (formData.follow_up_date && formData.follow_up_date <= today) {
      newErrors.follow_up_date = "Follow-up date must be a future date.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const updateFormData = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();

    if (!validateForm()) return;

    if (lead?.id) {
      const updatedData = { status: formData.status };

      if (formData.notes) {
        updatedData.notes = formData.notes;
      }

      if (formData.follow_up_date) {
        updatedData.follow_up_date = formData.follow_up_date;
      }

      if (formData.assigned_to && formData.assigned_to !== "unassigned") {
        updatedData.assigned_to = formData.assigned_to;
      }

      mutate(
        { id: lead.id, leadData: updatedData },
        {
          onSuccess: () => {
            ToastUtils.success("Lead updated successfully!");
            onClose();
          },
          onError: (error) => {
            ToastUtils.error(error?.message || "Failed to update lead.");
          },
        }
      );
    } else {
      ToastUtils.error("Cannot update: Lead ID is missing.");
    }
  };

  if (!isOpen) return null;

  const formatStatusForDisplay = (status) =>
    status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000] font-Outfit">
      <div className="bg-white rounded-[24px] max-w-[650px] mx-4 w-full">
        <div className="flex justify-between items-center px-6 py-4 border-b bg-[#F2F2F2] rounded-t-[24px] w-full">
          <h2 className="text-lg font-semibold text-[#575758]">Edit Lead</h2>
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
              <label htmlFor="leadStatus" className="block text-sm font-medium text-gray-700 mb-2">
                Status<span className="text-red-500">*</span>
              </label>
              <select
                id="leadStatus"
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
                    {formatStatusForDisplay(status)}
                  </option>
                ))}
              </select>
              {errors.status && <p className="text-red-500 text-xs mt-1">{errors.status}</p>}
            </div>

            <div>
              <label htmlFor="leadNotes" className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                id="leadNotes"
                rows="3"
                value={formData.notes}
                onChange={(e) => updateFormData("notes", e.target.value)}
                placeholder="Add notes about the lead..."
                className={`w-full rounded-[10px] border px-3 py-2 text-sm input-field ${
                  errors.notes ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.notes && <p className="text-red-500 text-xs mt-1">{errors.notes}</p>}
            </div>

            <div>
              <label
                htmlFor="followUpDate"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Follow-up date
              </label>
              <input
                id="followUpDate"
                type="date"
                value={formData.follow_up_date}
                onChange={(e) => updateFormData("follow_up_date", e.target.value)}
                className={`w-full rounded-[10px] border px-3 py-2 text-sm input-field ${
                  errors.follow_up_date ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.follow_up_date && (
                <p className="text-red-500 text-xs mt-1">{errors.follow_up_date}</p>
              )}
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
                <option value="unassigned">Unassigned</option>
                {isAdminsLoading ? (
                  <option disabled>Loading admins...</option>
                ) : (
                  admins?.map((admin) => (
                    <option key={admin.id} value={admin.identifier || admin.id}>
                      {admin.first_name} {admin.last_name} ({admin.email})
                    </option>
                  ))
                )}
              </select>
              {errors.assigned_to && (
                <p className="text-red-500 text-xs mt-1">{errors.assigned_to}</p>
              )}
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
              className="px-8 py-3 bg-[--theme-color] text-white font-medium rounded-full hover:bg-[--secondary-color] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditLead;
