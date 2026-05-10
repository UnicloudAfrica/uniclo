import React from "react";
import { Cloud } from "lucide-react";
import { ModernInput, ModernSelect, ModernTextarea } from "../ui";
import type { AutoProvisionSpecs } from "@/shared/hooks/resources/externalMigrationHooks";

interface AutoProvisionTargetStepProps {
  value: AutoProvisionSpecs;
  onChange: (value: AutoProvisionSpecs) => void;
}

const AUTH_OPTIONS = [
  { value: "key", label: "SSH key" },
  { value: "password", label: "Password" },
];

const TYPE_OPTIONS = [
  { value: "app", label: "Application" },
  { value: "database", label: "Database" },
  { value: "cache", label: "Cache" },
  { value: "load-balancer", label: "Load balancer" },
];

const AutoProvisionTargetStep: React.FC<AutoProvisionTargetStepProps> = ({
  value,
  onChange,
}) => {
  const set = <K extends keyof AutoProvisionSpecs>(
    field: K,
    next: AutoProvisionSpecs[K],
  ) => onChange({ ...value, [field]: next });

  const setSshKeyIds = (raw: string) => {
    set(
      "ssh_key_ids",
      raw
        .split(",")
        .map((item) => Number(item.trim()))
        .filter((item) => Number.isFinite(item)),
    );
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="flex items-center gap-2 text-base font-semibold text-gray-900 dark:text-gray-100">
          <Cloud size={18} />
          Auto-provision target
        </h3>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <ModernInput
          label="LeanPloy Provider ID"
          value={String(value.provider_id ?? "")}
          onChange={(event) => set("provider_id", event.target.value)}
          required
        />
        <ModernInput
          label="Provider Label"
          placeholder="aws"
          value={value.provider ?? ""}
          onChange={(event) => set("provider", event.target.value)}
        />
        <ModernInput
          label="Name"
          placeholder="prod-migration-target"
          value={value.name ?? ""}
          onChange={(event) => set("name", event.target.value)}
        />
        <ModernSelect
          label="Type"
          options={TYPE_OPTIONS}
          value={value.type ?? "app"}
          onChange={(event) =>
            set("type", event.target.value as AutoProvisionSpecs["type"])
          }
        />
        <ModernInput
          label="Region"
          placeholder="us-east-1"
          value={value.region ?? ""}
          onChange={(event) => set("region", event.target.value)}
          required
        />
        <ModernInput
          label="Size"
          placeholder="m6i.large"
          value={value.size ?? ""}
          onChange={(event) => set("size", event.target.value)}
          required
        />
        <ModernInput
          label="Image ID"
          placeholder="ami-..."
          value={value.image_id ?? ""}
          onChange={(event) => set("image_id", event.target.value)}
        />
        <ModernInput
          label="Offer ID"
          value={value.offer_id ?? ""}
          onChange={(event) => set("offer_id", event.target.value)}
        />
        <ModernInput
          label="SSH Key IDs"
          placeholder="12, 45"
          value={(value.ssh_key_ids ?? []).join(", ")}
          onChange={(event) => setSshKeyIds(event.target.value)}
        />
        <ModernInput
          label="SSH User"
          placeholder="root"
          value={value.ssh_user ?? "root"}
          onChange={(event) => set("ssh_user", event.target.value)}
        />
        <ModernSelect
          label="Auth Method"
          options={AUTH_OPTIONS}
          value={value.auth_method ?? "key"}
          onChange={(event) =>
            set("auth_method", event.target.value as AutoProvisionSpecs["auth_method"])
          }
        />
      </div>

      {(value.auth_method ?? "key") === "key" ? (
        <ModernTextarea
          label="SSH Private Key"
          rows={5}
          value={value.ssh_private_key ?? ""}
          onChange={(event) => set("ssh_private_key", event.target.value)}
          textareaClassName="font-mono text-xs"
          required
        />
      ) : (
        <ModernInput
          label="SSH Password"
          type="password"
          value={value.ssh_password ?? ""}
          onChange={(event) => set("ssh_password", event.target.value)}
          required
        />
      )}
    </div>
  );
};

export default AutoProvisionTargetStep;
