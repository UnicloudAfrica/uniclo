import React from "react";
import type { DestinationType } from "@/shared/hooks/resources/integrationHooks";

type AnyRecord = Record<string, unknown>;

interface DestinationConfigFieldsProps {
  type: DestinationType | "";
  config: AnyRecord;
  onChange: (config: AnyRecord) => void;
}

interface FieldDef {
  key: string;
  label: string;
  required?: boolean;
  placeholder?: string;
  type?: "text" | "password" | "number" | "textarea";
  hint?: string;
}

const FIELDS_BY_TYPE: Record<DestinationType, FieldDef[]> = {
  s3: [
    { key: "bucket", label: "Bucket", required: true, placeholder: "unicloud-backups" },
    { key: "endpoint", label: "Endpoint URL", required: true, placeholder: "https://s3.amazonaws.com" },
    { key: "access_key", label: "Access Key", required: true, type: "password", placeholder: "AKIA..." },
    { key: "secret_key", label: "Secret Key", required: true, type: "password", placeholder: "wJalrXUt..." },
    { key: "region", label: "Region", placeholder: "us-east-1" },
  ],
  ssh: [
    { key: "host", label: "Host", required: true, placeholder: "192.168.1.100" },
    { key: "port", label: "Port", type: "number", placeholder: "22" },
    { key: "username", label: "Username", required: true, placeholder: "backup-user" },
    { key: "password", label: "Password", type: "password", placeholder: "Leave blank for key-based auth" },
    { key: "private_key", label: "Private Key", type: "textarea", placeholder: "-----BEGIN RSA PRIVATE KEY-----" },
    { key: "path", label: "Remote Path", required: true, placeholder: "/backups/unicloud" },
  ],
  object_storage: [
    { key: "endpoint", label: "Endpoint URL", required: true, placeholder: "https://objects.example.com" },
    { key: "access_key", label: "Access Key", required: true, type: "password", placeholder: "Access Key ID" },
    { key: "secret_key", label: "Secret Key", required: true, type: "password", placeholder: "Secret Access Key" },
    { key: "bucket", label: "Bucket", required: true, placeholder: "backup-bucket" },
  ],
  swift: [
    { key: "auth_url", label: "Auth URL", required: true, placeholder: "https://identity.example.com/v3" },
    { key: "username", label: "Username", required: true, placeholder: "swift-user" },
    { key: "password", label: "Password", required: true, type: "password", placeholder: "Swift password" },
    { key: "container", label: "Container", required: true, placeholder: "unicloud-backups" },
    { key: "tenant_name", label: "Tenant / Project Name", placeholder: "my-project" },
    { key: "region", label: "Region", placeholder: "RegionOne" },
    { key: "domain", label: "Domain", placeholder: "Default" },
  ],
  azure_blob: [
    { key: "account_name", label: "Account Name", required: true, placeholder: "mystorageaccount" },
    { key: "container", label: "Container", required: true, placeholder: "backups" },
    { key: "account_key", label: "Account Key", type: "password", placeholder: "Base64 account key", hint: "Provide one of: Account Key, Connection String, or SAS Token" },
    { key: "connection_string", label: "Connection String", type: "password", placeholder: "DefaultEndpointsProtocol=https;..." },
    { key: "sas_token", label: "SAS Token", type: "password", placeholder: "sv=2021-06-08&ss=bfqt..." },
    { key: "endpoint", label: "Custom Endpoint", placeholder: "https://mystorageaccount.blob.core.windows.net" },
  ],
  gcs: [
    { key: "project_id", label: "Project ID", required: true, placeholder: "my-gcp-project-123" },
    { key: "bucket", label: "Bucket", required: true, placeholder: "unicloud-gcs-backups" },
    { key: "credentials_json", label: "Credentials JSON", type: "textarea", placeholder: '{"type":"service_account",...}', hint: "Provide either Credentials JSON or Key File Path" },
    { key: "key_file_path", label: "Key File Path", placeholder: "/etc/gcloud/service-account.json" },
    { key: "region", label: "Region", placeholder: "us-central1" },
  ],
};

const inputClass =
  "w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none text-sm";

const DestinationConfigFields: React.FC<DestinationConfigFieldsProps> = ({
  type,
  config,
  onChange,
}) => {
  if (!type) return null;

  const fields = FIELDS_BY_TYPE[type] ?? [];

  const handleFieldChange = (key: string, value: string) => {
    onChange({ ...config, [key]: value });
  };

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
        Connection Settings
      </p>
      {fields.map((field) => (
        <div key={field.key}>
          <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5">
            {field.label} {field.required && "*"}
          </label>
          {field.type === "textarea" ? (
            <textarea
              value={(config[field.key] as string) || ""}
              onChange={(e) => handleFieldChange(field.key, e.target.value)}
              placeholder={field.placeholder}
              rows={3}
              className={`${inputClass} font-mono text-xs`}
            />
          ) : (
            <input
              type={field.type || "text"}
              value={(config[field.key] as string) || ""}
              onChange={(e) => handleFieldChange(field.key, e.target.value)}
              placeholder={field.placeholder}
              className={`${inputClass} ${field.type === "password" ? "font-mono" : ""}`}
            />
          )}
          {field.hint && (
            <p className="mt-1 text-[10px] text-gray-400">{field.hint}</p>
          )}
        </div>
      ))}
    </div>
  );
};

export default DestinationConfigFields;
