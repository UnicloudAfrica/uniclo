import React, { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useFetchRegions } from "../../../hooks/adminHooks/regionHooks";
import { useCreateVpc } from "../../../hooks/adminHooks/vcpHooks";
import ModernModal from "../../components/ModernModal";
import ModernInput from "../../components/ModernInput";
import { designTokens } from "../../../styles/designTokens";
import ToastUtils from "../../../utils/toastUtil";

const selectStyles = {
  width: "100%",
  height: "52px",
  borderRadius: designTokens.borderRadius.lg,
  border: `1px solid ${designTokens.colors.neutral[300]}`,
  padding: "0 16px",
  fontSize: designTokens.typography.fontSize.base[0],
  fontFamily: designTokens.typography.fontFamily.sans.join(", "),
  color: designTokens.colors.neutral[800],
  backgroundColor: designTokens.colors.neutral[0],
  outline: "none",
  transition: "all 0.2s ease",
};

const checkboxStyles = {
  width: "18px",
  height: "18px",
  borderRadius: designTokens.borderRadius.sm,
  border: `1px solid ${designTokens.colors.neutral[300]}`,
};

const helperTextStyles = {
  fontSize: designTokens.typography.fontSize.xs[0],
  marginTop: "6px",
  color: designTokens.colors.error[600],
  fontFamily: designTokens.typography.fontFamily.sans.join(", "),
};

const AddVpc = ({ isOpen, onClose, projectId = "" }) => {
  const queryClient = useQueryClient();
  const { isFetching: isRegionsFetching, data: regions } = useFetchRegions();
  const { mutate, isPending } = useCreateVpc();

  const [formData, setFormData] = useState({
    name: "",
    region: "",
    cidr_block: "",
    is_default: false,
  });
  const [errors, setErrors] = useState({});

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
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "A VPC name is required.";
    if (!formData.region) newErrors.region = "Select a region.";
    if (!formData.cidr_block.trim()) {
      newErrors.cidr_block = "Provide a CIDR block.";
    } else if (!/^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/.test(formData.cidr_block)) {
      newErrors.cidr_block =
        "CIDR block must be valid (for example, 10.0.0.0/16).";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const updateField = (field, value) => {
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
        onError: (error) => {
          ToastUtils.error(
            error?.message || "Failed to create the VPC. Try again."
          );
        },
      }
    );
  };

  const actions = [
    {
      label: "Cancel",
      variant: "ghost",
      onClick: onClose,
      disabled: isPending,
    },
    {
      label: isPending ? "Creating..." : "Create VPC",
      variant: "primary",
      onClick: handleSubmit,
      disabled: isPending || isRegionsFetching,
    },
  ];

  return (
    <ModernModal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Virtual Private Cloud"
      actions={actions}
      loading={isPending}
      size="lg"
      contentClassName="space-y-6"
    >
      <p
        className="text-sm leading-relaxed"
        style={{ color: designTokens.colors.neutral[500] }}
      >
        Define a network boundary for your workloads. Choose a region, supply a
        CIDR block, and optionally mark the VPC as the project default.
      </p>
      <div className="space-y-5">
        <ModernInput
          label="VPC Name"
          placeholder="Production network"
          value={formData.name}
          onChange={(event) => updateField("name", event.target.value)}
          error={errors.name}
          required
        />
        <div>
          <label
            htmlFor="vpc-region"
            className="block text-sm font-medium"
            style={{ color: designTokens.colors.neutral[700] }}
          >
            Region <span className="text-red-500">*</span>
          </label>
          <select
            id="vpc-region"
            value={formData.region}
            onChange={(event) => updateField("region", event.target.value)}
            disabled={isRegionsFetching}
            style={selectStyles}
            onFocus={(event) => {
              event.target.style.borderColor = designTokens.colors.primary[500];
              event.target.style.boxShadow = `0 0 0 3px ${designTokens.colors.primary[100]}`;
            }}
            onBlur={(event) => {
              event.target.style.borderColor =
                designTokens.colors.neutral[300];
              event.target.style.boxShadow = "none";
            }}
          >
            <option value="" disabled>
              {isRegionsFetching ? "Loading regions..." : "Select a region"}
            </option>
            {regions?.map((region) => (
              <option key={region.code} value={region.code}>
                {region.name}
              </option>
            ))}
          </select>
          {errors.region && (
            <p style={helperTextStyles}>{errors.region}</p>
          )}
        </div>
        <ModernInput
          label="CIDR Block"
          placeholder="10.0.0.0/16"
          value={formData.cidr_block}
          onChange={(event) => updateField("cidr_block", event.target.value)}
          error={errors.cidr_block}
          required
        />
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={formData.is_default}
            onChange={(event) => updateField("is_default", event.target.checked)}
            style={checkboxStyles}
          />
          <span
            className="text-sm"
            style={{ color: designTokens.colors.neutral[600] }}
          >
            Make this the default VPC for the project
          </span>
        </label>
      </div>
    </ModernModal>
  );
};

export default AddVpc;
