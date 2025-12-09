// @ts-nocheck
import React, { useEffect, useState } from "react";
import { ModernModal, ModernInput } from "../../../shared/components/ui";
import ToastUtils from "../../../utils/toastUtil";
import { useCreateClientIgw } from "../../../hooks/clientHooks/igwHooks";
import { designTokens } from "../../../styles/designTokens";

interface AddIgwProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  region?: string;
}

const AddIgw: React.FC<AddIgwProps> = ({
  isOpen,
  onClose,
  projectId,
  region: defaultRegion = "",
}) => {
  const [form, setForm] = useState({ name: "", region: defaultRegion || "" });
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const { mutate: createIgw, isPending } = useCreateClientIgw();

  useEffect(() => {
    if (defaultRegion) {
      setForm((prev) => ({ ...prev, region: defaultRegion }));
    }
  }, [defaultRegion]);

  const validate = () => {
    const validationErrors: Record<string, string> = {};
    if (!form.name.trim()) {
      validationErrors.name = "Enter a name for the gateway.";
    }
    if (!form.region.trim()) {
      validationErrors.region = "Specify a deployment region.";
    }
    setErrors(validationErrors);
    return Object.keys(validationErrors).length === 0;
  };

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const handleSubmit = () => {
    if (!validate()) return;

    createIgw(
      {
        project_id: projectId,
        region: form.region,
        name: form.name,
      },
      {
        onSuccess: () => {
          ToastUtils.success("Internet gateway created successfully.");
          onClose();
        },
        onError: (error: any) => {
          ToastUtils.error(error?.message || "Failed to create internet gateway.");
        },
      }
    );
  };

  const actions = [
    {
      label: "Cancel",
      variant: "ghost" as const,
      onClick: onClose,
      disabled: isPending,
    },
    {
      label: isPending ? "Creating..." : "Create Gateway",
      variant: "primary" as const,
      onClick: handleSubmit,
      disabled: isPending,
    },
  ];

  return (
    <ModernModal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Internet Gateway"
      subtitle="Expose resources in your VPC to the public internet."
      actions={actions}
      loading={isPending}
      contentClassName="space-y-5"
    >
      <p className="text-sm leading-relaxed" style={{ color: designTokens.colors.neutral[600] }}>
        Internet gateways expose private resources to the public internet. Name the gateway and
        confirm the region that matches your VPC deployment.
      </p>
      <ModernInput
        label="Gateway Name"
        placeholder="igw-public"
        value={form.name}
        onChange={(event) => updateField("name", event.target.value)}
        error={errors.name || undefined}
        required
      />
      <ModernInput
        label="Region"
        placeholder="lagos-1"
        value={form.region}
        onChange={(event) => updateField("region", event.target.value)}
        error={errors.region || undefined}
        helper="Use the same region as your target VPC."
        required
      />
    </ModernModal>
  );
};

export default AddIgw;
