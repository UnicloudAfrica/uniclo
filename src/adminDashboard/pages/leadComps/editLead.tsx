import { useMemo } from "react";
import { useFetchAdmins } from "../../../hooks/adminHooks/adminHooks";
import { useUpdateLead } from "../../../hooks/adminHooks/leadsHook";
import ToastUtils from "../../../utils/toastUtil";
import EditLeadModal, {
  type LeadAssigneeOption,
  type LeadEditLead,
  type LeadUpdatePayload,
} from "../../../shared/components/leads/EditLeadModal";

type AdminUser = {
  id?: string | number;
  first_name?: string;
  last_name?: string;
  email?: string;
};

type EditLeadProps = {
  isOpen: boolean;
  onClose: () => void;
  lead?: LeadEditLead | null;
};

const EditLead = ({ isOpen, onClose, lead }: EditLeadProps) => {
  const { data: admins, isLoading: isAdminsLoading } = useFetchAdmins();
  const { mutate, isPending } = useUpdateLead();

  const assignees = useMemo<LeadAssigneeOption[]>(() => {
    if (!Array.isArray(admins)) return [];
    return (admins as AdminUser[])
      .map((admin) => {
        const value = admin.id !== undefined && admin.id !== null ? String(admin.id) : "";
        const labelParts = [admin.first_name || "", admin.last_name || ""].filter(Boolean);
        const label = `${labelParts.join(" ")}${admin.email ? ` (${admin.email})` : ""}`.trim();
        return { value, label };
      })
      .filter((option) => option.value !== "" && option.label !== "");
  }, [admins]);

  const handleSubmit = (payload: LeadUpdatePayload) => {
    if (!lead?.id) {
      return;
    }

    mutate(
      { id: lead.id, leadData: payload },
      {
        onSuccess: () => {
          ToastUtils.success("Lead updated successfully!");
          onClose();
        },
        onError: () => {
          // Intentionally silent to match existing admin behavior.
        },
      }
    );
  };

  return (
    <EditLeadModal
      isOpen={isOpen}
      onClose={onClose}
      lead={lead}
      assignees={assignees}
      isAssigneesLoading={isAdminsLoading}
      isSubmitting={isPending}
      onSubmit={handleSubmit}
    />
  );
};

export default EditLead;
