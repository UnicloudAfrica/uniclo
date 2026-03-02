import { useEffect, useMemo, useState } from "react";
import { X, Loader2 } from "lucide-react";

import {
  type Lead,
  type LeadUpdateData,
  type LeadAssigneeOption,
} from "../../../hooks/adminHooks/leadsHook";

export type { LeadAssigneeOption };
export type LeadUpdatePayload = LeadUpdateData;

const leadStatusOptions = [
  "new",
  "contacted",
  "qualified",
  "proposal_sent",
  "negotiating",
  "closed_won",
  "closed_lost",
] as const;

type LeadStatus = (typeof leadStatusOptions)[number];

export type LeadEditLead = Partial<Lead>;

type LeadFormData = {
  status: LeadStatus | "";
  notes: string;
  follow_up_date: string;
  assigned_to: string;
};

type LeadFormErrors = Partial<Record<keyof LeadFormData, string>>;

export type EditLeadModalProps = {
  isOpen: boolean;
  onClose: () => void;
  lead?: LeadEditLead | null;
  assignees?: LeadAssigneeOption[];
  isAssigneesLoading?: boolean;
  isSubmitting?: boolean;
  onSubmit: (payload: LeadUpdateData) => void;
  submitLabel?: string;
  followUpLabel?: string;
  submitButtonClassName?: string;
  cancelButtonClassName?: string;
  spinnerPosition?: "start" | "end";
};

const resolveAssigneeValue = (assignedTo: unknown): string => {
  if (assignedTo === null || assignedTo === undefined) {
    return "unassigned";
  }
  if (typeof assignedTo === "string" || typeof assignedTo === "number") {
    return String(assignedTo);
  }
  if (typeof assignedTo === "object") {
    const record = assignedTo as Record<string, unknown>;
    const value = record["identifier"] ?? record["id"];
    if (typeof value === "string" || typeof value === "number") {
      return String(value);
    }
  }
  return "unassigned";
};

const formatStatusForDisplay = (status: string) =>
  status.replaceAll("_", " ").replaceAll(/\b\w/g, (c) => c.toUpperCase());

const defaultSubmitButtonClassName =
  "px-8 py-3 bg-[var(--theme-color)] text-white font-medium rounded-full hover:bg-[var(--theme-color)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center";

const defaultCancelButtonClassName =
  "px-6 py-2 text-[var(--theme-text-color)] bg-[var(--theme-surface-alt)] border border-[var(--theme-surface-alt)] rounded-[30px] font-medium hover:text-gray-800 transition-colors";

const EditLeadModal = ({
  isOpen,
  onClose,
  lead,
  assignees = [],
  isAssigneesLoading = false,
  isSubmitting = false,
  onSubmit,
  submitLabel = "Save Changes",
  followUpLabel = "Follow-up Date",
  submitButtonClassName = defaultSubmitButtonClassName,
  cancelButtonClassName = defaultCancelButtonClassName,
  spinnerPosition = "end",
}: EditLeadModalProps) => {
  const [formData, setFormData] = useState<LeadFormData>({
    status: "",
    notes: "",
    follow_up_date: "",
    assigned_to: "unassigned",
  });
  const [errors, setErrors] = useState<LeadFormErrors>({});

  const availableAssignees = useMemo(
    () => assignees.filter((assignee) => assignee.value !== ""),
    [assignees]
  );

  useEffect(() => {
    if (isOpen && lead) {
      setFormData({
        status: (lead.status as LeadStatus) || "",
        notes: lead.notes || "",
        follow_up_date: lead.follow_up_date || "",
        assigned_to: resolveAssigneeValue(lead.assigned_to),
      });
      setErrors({});
    }
  }, [isOpen, lead]);

  const validateForm = () => {
    const newErrors: LeadFormErrors = {};
    const today = new Date().toISOString().substring(0, 10);

    if (!leadStatusOptions.includes(formData.status as LeadStatus)) {
      newErrors.status = "Please select a valid status.";
    }

    if (formData.follow_up_date && formData.follow_up_date <= today) {
      newErrors.follow_up_date = "Follow-up date must be a future date.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const updateFormData = (field: keyof LeadFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    const updatedData: LeadUpdateData = { status: formData.status };

    if (formData.notes) {
      updatedData.notes = formData.notes;
    }

    if (formData.follow_up_date) {
      updatedData.follow_up_date = formData.follow_up_date;
    }

    if (formData.assigned_to && formData.assigned_to !== "unassigned") {
      updatedData.assigned_to = formData.assigned_to;
    }

    onSubmit(updatedData);
  };

  if (!isOpen) return null;

  const spinner = (
    <Loader2 className={`h-4 w-4 animate-spin ${spinnerPosition === "start" ? "mr-2" : "ml-2"}`} />
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000] font-Outfit">
      <div className="bg-white rounded-[24px] max-w-[650px] mx-4 w-full">
        <div className="flex justify-between items-center px-6 py-4 border-b bg-[var(--theme-surface-alt)] rounded-t-[24px] w-full">
          <h2 className="text-lg font-semibold text-[var(--theme-text-color)]">Edit Lead</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-[rgb(var(--theme-neutral-900) / 0.7)] font-medium transition-colors"
            disabled={isSubmitting}
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
                className={`w-full rounded-[10px] border px-3 py-2 text-sm input-field ${errors.status ? "border-red-500" : "border-gray-300"}`}
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
                rows={3}
                value={formData.notes}
                onChange={(e) => updateFormData("notes", e.target.value)}
                placeholder="Add notes about the lead..."
                className={`w-full rounded-[10px] border px-3 py-2 text-sm input-field ${errors.notes ? "border-red-500" : "border-gray-300"}`}
              />
              {errors.notes && <p className="text-red-500 text-xs mt-1">{errors.notes}</p>}
            </div>

            <div>
              <label
                htmlFor="followUpDate"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                {followUpLabel}
              </label>
              <input
                id="followUpDate"
                type="date"
                value={formData.follow_up_date}
                onChange={(e) => updateFormData("follow_up_date", e.target.value)}
                className={`w-full rounded-[10px] border px-3 py-2 text-sm input-field ${errors.follow_up_date ? "border-red-500" : "border-gray-300"}`}
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
                className={`w-full rounded-[10px] border px-3 py-2 text-sm input-field ${errors.assigned_to ? "border-red-500" : "border-gray-300"}`}
                disabled={isAssigneesLoading}
              >
                <option value="unassigned">Unassigned</option>
                {isAssigneesLoading ? (
                  <option disabled>Loading admins...</option>
                ) : (
                  availableAssignees.map((admin) => (
                    <option key={admin.value} value={admin.value}>
                      {admin.label}
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
            <button onClick={onClose} className={cancelButtonClassName} disabled={isSubmitting}>
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className={submitButtonClassName}
            >
              {spinnerPosition === "start" && isSubmitting && spinner}
              {submitLabel}
              {spinnerPosition === "end" && isSubmitting && spinner}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditLeadModal;
