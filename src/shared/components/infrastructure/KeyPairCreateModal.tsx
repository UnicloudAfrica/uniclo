import React, { useEffect, useMemo, useState } from "react";
import { Clipboard, Download } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useApiContext } from "../../../hooks/useApiContext";
import { useCreateKeyPair } from "../../hooks/keyPairsHooks";
import ModernModal from "../ui/ModernModal";
import ModernInput from "../ui/ModernInput";
import ModernSelect from "../ui/ModernSelect";
import ModernTextarea from "../ui/ModernTextarea";
import { ModernButton } from "../ui";
import { designTokens } from "../../../styles/designTokens";
import ToastUtils from "../../../utils/toastUtil";

interface KeyPairCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId?: string;
  region?: string;
  showRegionSelect?: boolean;
}

interface RegionOption {
  label: string;
  value: string;
}

const getRegionEndpoint = (context: string) => {
  if (context === "client") return "/business/cloud-regions";
  return "/regions";
};

const extractRegions = (payload: any) => {
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload)) return payload;
  return [];
};

const buildRegionOptions = (items: any[]): RegionOption[] => {
  return items
    .map((region) => {
      const value =
        region?.code ?? region?.region ?? region?.id ?? region?.name ?? region?.label ?? "";
      if (!value) return null;
      const label = region?.label ?? region?.name ?? region?.region ?? region?.code ?? value;
      return { value: String(value), label: String(label) };
    })
    .filter(Boolean) as RegionOption[];
};

const KeyPairCreateModal: React.FC<KeyPairCreateModalProps> = ({
  isOpen,
  onClose,
  projectId = "",
  region: projectRegion = "",
  showRegionSelect = true,
}) => {
  const { apiBaseUrl, context, authHeaders } = useApiContext();
  const { mutate, isPending } = useCreateKeyPair();

  const [formData, setFormData] = useState({
    name: "",
    region: "",
    public_key: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successState, setSuccessState] = useState({
    isSuccess: false,
    material: "",
  });

  const shouldFetchRegions = isOpen && showRegionSelect;
  const { data: regions = [], isFetching: isRegionsFetching } = useQuery({
    queryKey: ["keyPairRegions", context],
    queryFn: async () => {
      const { data } = await axios.get(`${apiBaseUrl}${getRegionEndpoint(context)}`, {
        headers: authHeaders,
        withCredentials: true,
      });
      return extractRegions(data);
    },
    enabled: shouldFetchRegions,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });

  const regionOptions = useMemo(() => buildRegionOptions(regions), [regions]);

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
    const validationErrors: Record<string, string> = {};
    if (!formData.name.trim()) validationErrors.name = "Enter a key pair name.";
    if (!formData.region) validationErrors.region = "Choose a region.";
    setErrors(validationErrors);
    return Object.keys(validationErrors).length === 0;
  };

  const updateFormData = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleSubmit = () => {
    if (!projectId) {
      ToastUtils.error("Provide a project before creating a key pair.");
      return;
    }
    if (!validateForm()) return;

    mutate(
      {
        project_id: projectId,
        region: formData.region,
        name: formData.name,
        public_key: formData.public_key.trim() || null,
      },
      {
        onSuccess: (response: any) => {
          setSuccessState({
            isSuccess: true,
            material: response?.material || "",
          });
          ToastUtils.success("Key pair generated successfully.");
        },
        onError: (error: any) => {
          ToastUtils.error(error?.message || "Failed to create key pair. Try again.");
        },
      }
    );
  };

  const handleDone = () => {
    setFormData({ name: "", region: "", public_key: "" });
    setSuccessState({ isSuccess: false, material: "" });
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
      anchor.download = `${formData.name.replace(/[^a-zA-Z0-9-_]/g, "_") || "keypair"}.pem`;
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
          disabled: isPending || (showRegionSelect && isRegionsFetching),
        },
      ];

  return (
    <ModernModal
      isOpen={isOpen}
      onClose={handleCancel}
      title={successState.isSuccess ? "Key Pair Created" : "Add Project Key Pair"}
      subtitle={
        successState.isSuccess
          ? "Store this private key securely."
          : "Generate a new SSH key pair or register an existing public key for this project."
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
            Store this private key securely. UniCloud cannot display it again. Copy it to your
            clipboard or download it as a PEM file.
          </p>
          <div className="rounded-2xl border border-dashed px-4 py-4">
            <textarea
              value={successState.material}
              readOnly
              className="min-h-[180px] w-full resize-y rounded-xl bg-slate-900/90 px-4 py-3 text-xs font-mono text-slate-100"
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <ModernButton variant="outline" leftIcon={<Clipboard size={16} />} onClick={handleCopy}>
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
          {showRegionSelect && (
            <ModernSelect
              label="Region"
              placeholder={isRegionsFetching ? "Loading regions..." : "Select a region"}
              value={formData.region}
              onChange={(event) => updateFormData("region", event.target.value)}
              error={errors.region}
              required
              disabled={isRegionsFetching}
              options={regionOptions}
            />
          )}
          <ModernTextarea
            label="Public Key (Optional)"
            placeholder="ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQC..."
            value={formData.public_key}
            onChange={(event: any) => updateFormData("public_key", event.target.value)}
            rows={4}
            helper="Leave blank to generate a new key pair. Paste an OpenSSH public key to import it."
          />
        </div>
      )}
    </ModernModal>
  );
};

export default KeyPairCreateModal;
