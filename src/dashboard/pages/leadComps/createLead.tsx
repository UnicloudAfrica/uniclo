import { useCallback, useMemo } from "react";
import { useCreateNewLead, useFetchLeadTypes } from "../../../hooks/tenantHooks/leadsHook";
import { useFetchTenantAdmins } from "../../../hooks/adminUserHooks";
import ToastUtils from "../../../utils/toastUtil";
import { useFetchCountries } from "../../../hooks/resource";
import CreateLeadForm, {
  type CountryOption,
  type LeadCreatePayload,
} from "../../../shared/components/leads/CreateLeadForm";
import { type LeadAssigneeOption } from "../../../shared/components/leads/EditLeadModal";

type TenantAdmin = {
  id?: string | number;
  identifier?: string | number;
  first_name?: string;
  last_name?: string;
  email?: string;
};

type CreateLeadProps = {
  isOpen?: boolean;
  onClose?: () => void;
  mode?: "modal" | "page";
};

const CreateLead = ({ isOpen = false, onClose, mode = "modal" }: CreateLeadProps) => {
  const { mutate, isPending } = useCreateNewLead();
  const { data: leadTypesData = [], isLoading: leadTypesLoading } = useFetchLeadTypes();
  const { data: admins = [], isLoading: adminsLoading } = useFetchTenantAdmins();
  const {
    data: countriesData,
    isLoading: countriesLoading,
    isError: countriesError,
  } = useFetchCountries();

  const countries = useMemo(
    () => (Array.isArray(countriesData) ? (countriesData as CountryOption[]) : []),
    [countriesData]
  );

  const assignees = useMemo<LeadAssigneeOption[]>(() => {
    if (!Array.isArray(admins)) return [];
    return (admins as TenantAdmin[])
      .map((admin) => {
        const valueCandidate = admin.identifier ?? admin.id;
        const value =
          valueCandidate !== undefined && valueCandidate !== null ? String(valueCandidate) : "";
        const name = [admin.first_name, admin.last_name].filter(Boolean).join(" ");
        const label = name || admin.email || value;
        return { value, label };
      })
      .filter((option) => option.value !== "" && option.label !== "");
  }, [admins]);

  const handleSubmit = useCallback(
    (payload: LeadCreatePayload) => {
      mutate(payload, {
        onSuccess: () => {
          ToastUtils.success("Lead created successfully!");
          if (typeof onClose === "function") {
            onClose();
          }
        },
        onError: (error: unknown) => {
          const message =
            error instanceof Error
              ? error.message
              : typeof error === "string"
                ? error
                : "Failed to create lead.";
          ToastUtils.error(message);
        },
      });
    },
    [mutate, onClose]
  );

  return (
    <CreateLeadForm
      isOpen={isOpen}
      onClose={onClose}
      mode={mode}
      leadTypesData={leadTypesData}
      leadTypesLoading={leadTypesLoading}
      countries={countries}
      countriesLoading={countriesLoading}
      countriesError={Boolean(countriesError)}
      assignees={assignees}
      isAssigneesLoading={adminsLoading}
      assigneePlaceholder="Unassigned"
      assigneeLoadingPlaceholder="Loading owners..."
      stageAssigneePlaceholder="Unassigned"
      stageAssigneeLoadingPlaceholder="Loading owners..."
      onSubmit={handleSubmit}
      isSubmitting={isPending}
      pageMaxWidthClass="max-w-8xl"
      modalMaxWidthClass="max-w-4xl"
    />
  );
};

export default CreateLead;
