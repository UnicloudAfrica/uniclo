import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useFetchRegions } from "../../../hooks/adminHooks/regionHooks";
import { useCreateVpc } from "../../../hooks/adminHooks/vcpHooks";
import ModernModal from "../../../shared/components/ui/ModernModal";
import ModernInput from "../../../shared/components/ui/ModernInput";
import ModernSelect from "../../../shared/components/ui/ModernSelect";
import { designTokens } from "../../../styles/designTokens";
import ToastUtils from "../../../utils/toastUtil";
import { type Region } from "../../../shared/types/resource";
import { type VpcApiResponse } from "../../../shared/types/vpc";

const checkboxStyles = {
  width: "18px",
  height: "18px",
  borderRadius: designTokens.borderRadius.sm,
  border: `1px solid ${designTokens.colors.neutral[300]}`,
};

const AddVpc = ({
  isOpen,
  onClose,
  projectId = "",
}: {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
}) => {
  const queryClient = useQueryClient();
  const { isFetching: isRegionsFetching, data: regions = [] } = useFetchRegions();
  const { mutate, isPending } = useCreateVpc();

  const [formData, setFormData] = useState({
    name: "",
    region: "",
    cidr_block: "",
    is_default: false,
  });
  const [errors, setErrors] = useState<Record<string, any>>({});

  useEffect(() => {
    if (!isOpen) {
      setFormData({
        name: "",
        region: "",
        cidr_block: "",
        is_default: false,
      });
      setErrors({});
    }
  }, [isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, any> = {};
    if (!formData.name.trim()) newErrors["name"] = "A VPC name is required.";
    if (!formData.region) newErrors["region"] = "Select a region.";
    if (!formData.cidr_block.trim()) {
      newErrors["cidr_block"] = "Provide a CIDR block.";
    } else if (!/^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/.test(formData.cidr_block)) {
      newErrors["cidr_block"] = "CIDR block must be valid (for example, 10.0.0.0/16).";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const updateField = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    mutate(
      {
        project_id: projectId,
        region: formData.region,
        name: formData.name,
        cidr_block: formData.cidr_block,
        is_default: formData.is_default,
      },
      {
        onSuccess: () => {
          ToastUtils.success("VPC created successfully.");
          queryClient.invalidateQueries({ queryKey: ["vpcs", projectId] });
          onClose();
        },
        onError: (error: unknown) => {
          const apiError = error as VpcApiResponse;
          const errMsg =
            typeof apiError.message === "string"
              ? apiError.message
              : (apiError.message as any)?.message;
          ToastUtils.error(errMsg || "Failed to create the VPC. Try again.");
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
      label: isPending ? "Creating..." : "Create VPC",
      variant: "primary" as const,
      onClick: handleSubmit,
      disabled: isPending || isRegionsFetching,
    },
  ];

  return (
    <ModernModal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Virtual Private Cloud"
      subtitle="Define a network boundary for your project and optionally mark it as the default VPC."
      actions={actions}
      loading={isPending}
      size="lg"
      contentClassName="space-y-6"
    >
      <p className="text-sm leading-relaxed" style={{ color: designTokens.colors.neutral[500] }}>
        Define a network boundary for your workloads. Choose a region, supply a CIDR block, and
        optionally mark the VPC as the project default.
      </p>
      <div className="space-y-5">
        <ModernInput
          label="VPC Name"
          placeholder="Production network"
          value={formData.name}
          onChange={(event) => updateField("name", event.target.value)}
          error={errors["name"]}
          required
        />
        <ModernSelect
          label="Region"
          placeholder={isRegionsFetching ? "Loading regions..." : "Select a region"}
          value={formData.region}
          onChange={(event) => updateField("region", event.target.value)}
          disabled={isRegionsFetching}
          required
          error={errors["region"]}
          options={regions.map((region: Region) => ({
            label: region.name,
            value: region.code || String(region.id),
          }))}
        />
        <ModernInput
          label="CIDR Block"
          placeholder="10.0.0.0/16"
          value={formData.cidr_block}
          onChange={(event) => updateField("cidr_block", event.target.value)}
          error={errors["cidr_block"]}
          required
        />
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={formData.is_default}
            onChange={(event) => updateField("is_default", event.target.checked)}
            style={checkboxStyles}
          />
          <span className="text-sm" style={{ color: designTokens.colors.neutral[600] }}>
            Make this the default VPC for the project
          </span>
        </label>
      </div>
    </ModernModal>
  );
};

export default AddVpc;
