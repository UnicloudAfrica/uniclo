import { useMemo } from "react";
import { useFetchTenantAdmins } from "@/hooks/adminUserHooks";
import { useUpdateLead } from "@/hooks/tenantHooks/leadsHooks";
import ToastUtils from "@/utils/toastUtil";
import EditLeadModal, {
  type LeadAssigneeOption,
  type LeadEditLead,
  type LeadUpdatePayload,
} from "@/shared/components/leads/EditLeadModal";

type TenantAdmin = {
  id?: string | number;
  identifier?: string | number;
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
  const { data: admins, isLoading: isAdminsLoading } = useFetchTenantAdmins();
  const { mutate, isPending } = useUpdateLead();

  const assignees = useMemo<LeadAssigneeOption[]>(() => {
    if (!Array.isArray(admins)) return [];
    return (admins as TenantAdmin[])
      .map((admin) => {
        const valueCandidate = admin.identifier ?? admin.id;
        const value =
          valueCandidate !== undefined && valueCandidate !== null ? String(valueCandidate) : "";
        const labelParts = [admin.first_name || "", admin.last_name || ""].filter(Boolean);
        const label = `${labelParts.join(" ")}${admin.email ? ` (${admin.email})` : ""}`.trim();
        return { value, label };
      })
      .filter((option) => option.value !== "" && option.label !== "");
  }, [admins]);

  const handleSubmit = (payload: LeadUpdatePayload) => {
    if (!lead?.id) {
      ToastUtils.error("Cannot update: Lead ID is missing.");
      return;
    }

    mutate(
      { id: String(lead.id) as any, leadData: payload },
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
      submitLabel="Save changes"
      followUpLabel="Follow-up date"
      submitButtonClassName="px-8 py-3 bg-[--theme-color] text-white font-medium rounded-full hover:bg-[--secondary-color] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
      spinnerPosition="start"
    />
  );
};

export default EditLead;
