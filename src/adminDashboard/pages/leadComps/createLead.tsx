import { useCallback, useMemo } from "react";
import { useCreateNewLead, useFetchLeadTypes } from "../../../hooks/adminHooks/leadsHook";
import ToastUtils from "../../../utils/toastUtil";
import { useFetchCountries } from "../../../hooks/resource";
import CreateLeadForm from "../../../shared/components/leads/CreateLeadForm";
import type { CountryOption } from "../../../shared/components/leads/CreateLeadForm";
import type { LeadCreatePayload } from "../../../hooks/adminHooks/leadsHook";

interface CreateLeadProps {
  isOpen?: boolean;
  onClose?: () => void;
  mode?: "modal" | "page";
}

const CreateLead = ({ isOpen = false, onClose, mode = "modal" }: CreateLeadProps) => {
  const { mutate, isPending } = useCreateNewLead();
  const { data: leadTypesData = [], isLoading: leadTypesLoading } = useFetchLeadTypes();
  const {
    data: countriesData,
    isLoading: countriesLoading,
    isError: countriesError,
  } = useFetchCountries();

  const countries = useMemo(
    () => (Array.isArray(countriesData) ? (countriesData as CountryOption[]) : []),
    [countriesData]
  );

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
      assignees={[]}
      isAssigneesLoading={false}
      assigneePlaceholder="No admin assignment (admin loading disabled)"
      stageAssigneePlaceholder="No admin assignment (admin loading disabled)"
      onSubmit={handleSubmit}
      isSubmitting={isPending}
      pageMaxWidthClass="max-w-full"
      modalMaxWidthClass="max-w-4xl"
    />
  );
};

export default CreateLead;
