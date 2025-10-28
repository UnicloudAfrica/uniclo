import { useEffect, useState } from "react";
import ModernModal from "../../../adminDashboard/components/ModernModal";
import ModernInput from "../../../adminDashboard/components/ModernInput";
import ToastUtils from "../../../utils/toastUtil";
import { useCreateIgw } from "../../../hooks/adminHooks/igwHooks";
import { designTokens } from "../../../styles/designTokens";

const AddIgw = ({ isOpen, onClose, projectId, region: defaultRegion = "" }) => {
  const [form, setForm] = useState({ name: "", region: defaultRegion || "" });
  const [errors, setErrors] = useState({});
  const { mutate: createIgw, isPending } = useCreateIgw();

  useEffect(() => {
    if (defaultRegion) {
      setForm((prev) => ({ ...prev, region: defaultRegion }));
    }
  }, [defaultRegion]);

  const validate = () => {
    const validationErrors = {};
    if (!form.name.trim()) validationErrors.name = "Enter a name for the gateway.";
    if (!form.region.trim()) validationErrors.region = "Specify a deployment region.";
    setErrors(validationErrors);
    return Object.keys(validationErrors).length === 0;
  };

  const updateField = (field, value) => {
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
        onError: (error) => {
          ToastUtils.error(error?.message || "Failed to create internet gateway.");
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
      label: isPending ? "Creating..." : "Create Gateway",
      variant: "primary",
      onClick: handleSubmit,
      disabled: isPending,
    },
  ];

  return (
    <ModernModal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Internet Gateway"
      actions={actions}
      loading={isPending}
      contentClassName="space-y-5"
    >
      <p
        className="text-sm leading-relaxed"
        style={{ color: designTokens.colors.neutral[600] }}
      >
        Internet gateways expose private resources to the public internet. Name
        the gateway and confirm the region that matches your VPC deployment.
      </p>
      <ModernInput
        label="Gateway Name"
        placeholder="igw-public"
        value={form.name}
        onChange={(event) => updateField("name", event.target.value)}
        error={errors.name}
        required
      />
      <ModernInput
        label="Region"
        placeholder="lagos-1"
        value={form.region}
        onChange={(event) => updateField("region", event.target.value)}
        error={errors.region}
        helper="Use the same region as your target VPC."
        required
      />
    </ModernModal>
  );
};

export default AddIgw;
