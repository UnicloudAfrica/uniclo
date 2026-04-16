/**
 * AddDomainModal — Modal for adding a new domain to Shield protection.
 */
import React, { useState } from "react";
import ModernModal from "@/shared/components/ui/ModernModal";
import ModernInput from "@/shared/components/ui/ModernInput";
import ModernSelect from "@/shared/components/ui/ModernSelect";
import ModernButton from "@/shared/components/ui/ModernButton";
import { useCreateShieldDomain } from "@/shared/hooks/resources/shieldHooks";

interface AddDomainModalProps {
  onClose: () => void;
}

const PROVIDER_OPTIONS = [
  { value: "stormwall", label: "Provider A" },
  { value: "cloudflare", label: "Provider B" },
];

const PROTECTION_MODE_OPTIONS = [
  { value: "standard", label: "Standard" },
  { value: "enhanced", label: "Enhanced" },
  { value: "under_attack", label: "Under Attack" },
];

const SSL_TYPE_OPTIONS = [
  { value: "lets_encrypt", label: "Auto-managed (Let's Encrypt)" },
  { value: "custom", label: "Custom Certificate" },
  { value: "none", label: "None" },
];

const AddDomainModal: React.FC<AddDomainModalProps> = ({ onClose }) => {
  const createDomain = useCreateShieldDomain();
  const [form, setForm] = useState({
    domain: "",
    origin_ip: "",
    origin_port: "443",
    provider: "stormwall",
    protection_mode: "standard",
    ssl_type: "lets_encrypt",
  });

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    createDomain.mutate(
      {
        domain: form.domain,
        origin_ip: form.origin_ip,
        origin_port: parseInt(form.origin_port, 10),
        provider: form.provider,
        protection_mode: form.protection_mode,
        ssl_type: form.ssl_type,
      } as never,
      {
        onSuccess: () => onClose(),
      }
    );
  };

  const isValid = form.domain.trim() !== "" && form.origin_ip.trim() !== "";

  return (
    <ModernModal
      title="Add Protected Domain"
      onClose={onClose}
      size="md"
    >
      <div className="space-y-4">
        <ModernInput
          label="Domain"
          placeholder="example.com"
          value={form.domain}
          onChange={(e) => handleChange("domain", e.target.value)}
        />

        <div className="grid grid-cols-2 gap-4">
          <ModernInput
            label="Origin IP"
            placeholder="192.168.1.1"
            value={form.origin_ip}
            onChange={(e) => handleChange("origin_ip", e.target.value)}
          />
          <ModernInput
            label="Origin Port"
            placeholder="443"
            value={form.origin_port}
            onChange={(e) => handleChange("origin_port", e.target.value)}
          />
        </div>

        <ModernSelect
          label="Provider"
          options={PROVIDER_OPTIONS}
          value={form.provider}
          onChange={(val) => handleChange("provider", val)}
        />

        <ModernSelect
          label="Protection Mode"
          options={PROTECTION_MODE_OPTIONS}
          value={form.protection_mode}
          onChange={(val) => handleChange("protection_mode", val)}
        />

        <ModernSelect
          label="SSL"
          options={SSL_TYPE_OPTIONS}
          value={form.ssl_type}
          onChange={(val) => handleChange("ssl_type", val)}
        />

        <div className="flex justify-end gap-2 pt-2">
          <ModernButton variant="secondary" onClick={onClose}>
            Cancel
          </ModernButton>
          <ModernButton
            onClick={handleSubmit}
            disabled={!isValid || createDomain.isPending}
            loading={createDomain.isPending}
          >
            Add Domain
          </ModernButton>
        </div>
      </div>
    </ModernModal>
  );
};

export default AddDomainModal;
