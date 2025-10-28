import React, { useEffect, useState } from "react";
import { Clipboard, Download } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useFetchRegions } from "../../../hooks/adminHooks/regionHooks";
import { useCreateKeyPair } from "../../../hooks/adminHooks/keyPairHooks";
import ModernModal from "../../components/ModernModal";
import ModernInput from "../../components/ModernInput";
import ModernButton from "../../components/ModernButton";
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

const helperTextStyles = {
  fontSize: designTokens.typography.fontSize.xs[0],
  marginTop: "6px",
  color: designTokens.colors.error[600],
  fontFamily: designTokens.typography.fontFamily.sans.join(", "),
};

const AddKeyPair = ({
  isOpen,
  onClose,
  projectId = "",
  region: projectRegion = "",
}) => {
  const queryClient = useQueryClient();
  const { isFetching: isRegionsFetching, data: regions } = useFetchRegions();
  const { mutate, isPending } = useCreateKeyPair();

  const [formData, setFormData] = useState({
    name: "",
    region: "",
    public_key: "",
  });

  const [errors, setErrors] = useState({});
  const [successState, setSuccessState] = useState({
    isSuccess: false,
    material: "",
  });

  useEffect(() => {
    if (isOpen && projectRegion && !formData.region) {
      setFormData((prev) => ({ ...prev, region: projectRegion }));
    }
    if (!isOpen) {
      setFormData({ name: "", region: "", public_key: "" });
      setErrors({});
      setSuccessState({ isSuccess: false, material: "" });
    }
  }, [isOpen, projectRegion, formData.region]);

  const validateForm = () => {
    const validationErrors = {};
    if (!formData.name.trim()) validationErrors.name = "Enter a key pair name.";
    if (!formData.region) validationErrors.region = "Choose a region.";
    setErrors(validationErrors);
    return Object.keys(validationErrors).length === 0;
  };

  const updateFormData = (field, value) => {
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
        public_key: formData.public_key.trim() || null,
      },
      {
        onSuccess: (response) => {
          setSuccessState({
            isSuccess: true,
            material: response.material || "",
          });
          ToastUtils.success("Key pair generated successfully.");
        },
        onError: (error) => {
          ToastUtils.error(
            error?.message || "Failed to create key pair. Try again."
          );
        },
      }
    );
  };

  const handleDone = () => {
    setFormData({ name: "", region: "", public_key: "" });
    setSuccessState({ isSuccess: false, material: "" });
    queryClient.invalidateQueries({ queryKey: ["keyPairs"] });
    onClose();
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(successState.material);
      ToastUtils.success("Private key copied to clipboard.");
    } catch (error) {
      ToastUtils.error("Unable to copy the private key.");
    }
  };

  const handleDownload = () => {
    if (!successState.material) return;
    try {
      const blob = new Blob([successState.material], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${
        formData.name.replace(/[^a-zA-Z0-9-_]/g, "_") || "keypair"
      }.pem`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      ToastUtils.error("Unable to download the private key.");
    }
  };

  const handleCancel = () => {
    setFormData({ name: "", region: "", public_key: "" });
    setErrors({});
    setSuccessState({ isSuccess: false, material: "" });
    onClose();
  };

  const actions = successState.isSuccess
    ? [
        {
          label: "Done",
          variant: "primary",
          onClick: handleDone,
        },
      ]
    : [
        {
          label: "Cancel",
          variant: "ghost",
          onClick: handleCancel,
          disabled: isPending,
        },
        {
          label: isPending ? "Creating..." : "Create Key Pair",
          variant: "primary",
          onClick: handleSubmit,
          disabled: isPending || isRegionsFetching,
        },
      ];

  return (
    <ModernModal
      isOpen={isOpen}
      onClose={handleCancel}
      title={
        successState.isSuccess ? "Key Pair Created" : "Add Project Key Pair"
      }
      actions={actions}
      size="lg"
      loading={isPending}
      contentClassName="space-y-6"
    >
      {successState.isSuccess ? (
        <div className="space-y-4">
          <p
            className="text-sm leading-relaxed"
            style={{ color: designTokens.colors.neutral[600] }}
          >
            Store this private key securely. UniCloud cannot display it again.
            Copy it to your clipboard or download it as a PEM file.
          </p>
          <div className="rounded-2xl border border-dashed px-4 py-4">
            <textarea
              value={successState.material}
              readOnly
              className="min-h-[180px] w-full resize-y rounded-xl bg-slate-900/90 px-4 py-3 text-xs font-mono text-slate-100"
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <ModernButton
              variant="outline"
              leftIcon={<Clipboard size={16} />}
              onClick={handleCopy}
            >
              Copy Private Key
            </ModernButton>
            <ModernButton
              variant="primary"
              leftIcon={<Download size={16} />}
              onClick={handleDownload}
              isDisabled={!successState.material}
            >
              Download PEM
            </ModernButton>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          <ModernInput
            label="Key Pair Name"
            placeholder="production-admin"
            value={formData.name}
            onChange={(event) => updateFormData("name", event.target.value)}
            error={errors.name}
            required
          />
          <div>
            <label
              htmlFor="keypair-region"
              className="block text-sm font-medium"
              style={{ color: designTokens.colors.neutral[700] }}
            >
              Region <span className="text-red-500">*</span>
            </label>
            <select
              id="keypair-region"
              value={formData.region}
              onChange={(event) =>
                updateFormData("region", event.target.value)
              }
              disabled={isRegionsFetching}
              style={selectStyles}
              onFocus={(event) => {
                event.target.style.borderColor =
                  designTokens.colors.primary[500];
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
            label="Public Key (optional)"
            placeholder="Paste an existing public key"
            value={formData.public_key}
            onChange={(event) =>
              updateFormData("public_key", event.target.value)
            }
            variant="filled"
            helper="Leave empty to generate a key pair and download the private material."
          />
        </div>
      )}
    </ModernModal>
  );
};

export default AddKeyPair;
