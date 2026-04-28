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

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    const domain = form.domain.trim();
    const ip = form.origin_ip.trim();
    const port = parseInt(form.origin_port, 10);

    if (!domain) {
      errors.domain = "Domain is required.";
    } else if (/\s/.test(domain)) {
      errors.domain = "Domain must not contain spaces.";
    } else if (!domain.includes(".")) {
      errors.domain = "Domain must contain at least one dot (e.g. example.com).";
    }

    if (!ip) {
      errors.origin_ip = "Origin IP is required.";
    } else {
      const ipv4 = /^(\d{1,3}\.){3}\d{1,3}$/;
      const ipv6 = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/;
      if (!ipv4.test(ip) && !ipv6.test(ip)) {
        errors.origin_ip = "Invalid IP address format.";
      }
    }

    if (isNaN(port) || port < 1 || port > 65535) {
      errors.origin_port = "Port must be between 1 and 65535.";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    createDomain.mutate(
      {
        domain: form.domain.trim(),
        origin_ip: form.origin_ip.trim(),
        origin_port: parseInt(form.origin_port, 10),
        provider: form.provider,
        protection_mode: form.protection_mode,
        ssl_type: form.ssl_type,
      },
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
        <div>
          <ModernInput
            label="Domain"
            placeholder="example.com"
            value={form.domain}
            onChange={(e) => handleChange("domain", e.target.value)}
          />
          {validationErrors.domain && (
            <p className="mt-1 text-xs text-red-600">{validationErrors.domain}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <ModernInput
              label="Origin IP"
              placeholder="192.168.1.1"
              value={form.origin_ip}
              onChange={(e) => handleChange("origin_ip", e.target.value)}
            />
            {validationErrors.origin_ip && (
              <p className="mt-1 text-xs text-red-600">{validationErrors.origin_ip}</p>
            )}
          </div>
          <div>
            <ModernInput
              label="Origin Port"
              placeholder="443"
              value={form.origin_port}
              onChange={(e) => handleChange("origin_port", e.target.value)}
            />
            {validationErrors.origin_port && (
              <p className="mt-1 text-xs text-red-600">{validationErrors.origin_port}</p>
            )}
          </div>
        </div>

        <ModernSelect
          label="Provider"
          options={PROVIDER_OPTIONS}
          value={form.provider}
          onChange={(e) => handleChange("provider", e.target.value)}
        />

        <ModernSelect
          label="Protection Mode"
          options={PROTECTION_MODE_OPTIONS}
          value={form.protection_mode}
          onChange={(e) => handleChange("protection_mode", e.target.value)}
        />

        <ModernSelect
          label="SSL"
          options={SSL_TYPE_OPTIONS}
          value={form.ssl_type}
          onChange={(e) => handleChange("ssl_type", e.target.value)}
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
