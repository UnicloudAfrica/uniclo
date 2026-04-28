/**
 * EndpointStep — Steps 2 & 3: Select or register an external endpoint (source or target).
 *
 * Reused for both source and target selection.
 */
import React, { useMemo, useState } from "react";
import { Wifi, CheckCircle2, XCircle, Plus } from "lucide-react";
import { ModernInput, ModernSelect } from "../ui";
import {
  useFetchExternalEndpoints,
  useCreateExternalEndpoint,
  useTestEndpointConnection,
} from "@/shared/hooks/resources";
import type { ExternalEndpoint } from "@/shared/hooks/resources/externalEndpointHooks";

interface EndpointStepProps {
  label: "Source" | "Target";
  resourceType: string;
  selectedEndpointId: string;
  onSelect: (endpointId: string) => void;
  excludeEndpointId?: string;
}

const PROVIDER_OPTIONS = [
  { value: "aws", label: "AWS" },
  { value: "azure", label: "Azure" },
  { value: "gcp", label: "GCP" },
  { value: "on_prem", label: "On-Premises" },
  { value: "other", label: "Other" },
];

const EndpointStep: React.FC<EndpointStepProps> = ({
  label,
  resourceType,
  selectedEndpointId,
  onSelect,
  excludeEndpointId,
}) => {
  const [mode, setMode] = useState<"existing" | "new">("existing");
  const { data: endpoints } = useFetchExternalEndpoints();
  const createEndpoint = useCreateExternalEndpoint();
  const _testConnection = useTestEndpointConnection();

  // New endpoint form state
  const [formData, setFormData] = useState({
    name: "",
    host: "",
    port: "",
    provider: "",
    region: "",
    os_family: "linux",
    engine: "postgresql",
    ssh_user: "",
    ssh_key_private: "",
    db_username: "",
    db_password: "",
    db_name: "",
    access_key: "",
    secret_key: "",
    bucket: "",
  });

  const filteredEndpoints = useMemo(() => {
    if (!endpoints || !Array.isArray(endpoints)) return [];
    return endpoints.filter(
      (e: ExternalEndpoint) =>
        e.resource_type === resourceType && e.id !== excludeEndpointId,
    );
  }, [endpoints, resourceType, excludeEndpointId]);

  const handleFieldChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreateAndSelect = async () => {
    const credentials: Record<string, string> = {};
    if (resourceType === "vm") {
      credentials.ssh_user = formData.ssh_user;
      credentials.ssh_key_private = formData.ssh_key_private;
    } else if (resourceType === "database") {
      credentials.username = formData.db_username;
      credentials.password = formData.db_password;
      credentials.database = formData.db_name;
    } else {
      credentials.access_key = formData.access_key;
      credentials.secret_key = formData.secret_key;
      if (formData.bucket) credentials.bucket = formData.bucket;
    }

    createEndpoint.mutate(
      {
        resource_type: resourceType,
        name: formData.name,
        host: formData.host,
        port: formData.port ? parseInt(formData.port) : undefined,
        provider: formData.provider || undefined,
        region: formData.region || undefined,
        os_family: resourceType === "vm" ? formData.os_family : undefined,
        engine: resourceType === "database" ? formData.engine : undefined,
        credentials,
      },
      {
        onSuccess: (data: unknown) => {
          const endpoint = data as ExternalEndpoint;
          if (endpoint?.id) {
            onSelect(endpoint.id);
            setMode("existing");
          }
        },
      },
    );
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
          {label}: Where is the data{" "}
          {label === "Source" ? "now" : "going"}?
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Select an existing endpoint or register a new one.
        </p>
      </div>

      {/* Mode Toggle */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setMode("existing")}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
            mode === "existing"
              ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400"
          }`}
        >
          Select Existing
        </button>
        <button
          type="button"
          onClick={() => setMode("new")}
          className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
            mode === "new"
              ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400"
          }`}
        >
          <Plus size={14} />
          Register New
        </button>
      </div>

      {/* Existing Endpoint List */}
      {mode === "existing" && (
        <div className="max-h-64 space-y-2 overflow-y-auto">
          {filteredEndpoints.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No {resourceType} endpoints registered.
              </p>
              <button
                type="button"
                onClick={() => setMode("new")}
                className="mt-2 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
              >
                Register one now
              </button>
            </div>
          ) : (
            filteredEndpoints.map((ep) => (
              <button
                key={ep.id}
                type="button"
                onClick={() => onSelect(ep.id)}
                className={`flex w-full items-center justify-between rounded-lg border-2 p-3 text-left transition ${
                  selectedEndpointId === ep.id
                    ? "border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-900/20"
                    : "border-gray-200 bg-white hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800"
                }`}
              >
                <div>
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {ep.name}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {ep.host}
                    {ep.port ? `:${ep.port}` : ""} &middot;{" "}
                    {ep.provider ?? "Unknown"}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {ep.connection_status === "connected" ? (
                    <CheckCircle2
                      size={16}
                      className="text-emerald-500"
                    />
                  ) : ep.connection_status === "failed" ? (
                    <XCircle size={16} className="text-red-500" />
                  ) : (
                    <Wifi size={16} className="text-gray-400" />
                  )}
                  {selectedEndpointId === ep.id && (
                    <div className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      )}

      {/* New Endpoint Form */}
      {mode === "new" && (
        <div className="space-y-3 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
          <div className="grid gap-3 sm:grid-cols-2">
            <ModernInput
              label="Name"
              placeholder="My Server"
              value={formData.name}
              onChange={(e) => handleFieldChange("name", e.target.value)}
            />
            <ModernInput
              label="Host / IP"
              placeholder="192.168.1.100"
              value={formData.host}
              onChange={(e) => handleFieldChange("host", e.target.value)}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <ModernInput
              label="Port"
              placeholder={resourceType === "database" ? "5432" : "22"}
              value={formData.port}
              onChange={(e) => handleFieldChange("port", e.target.value)}
            />
            <ModernSelect
              label="Provider"
              options={PROVIDER_OPTIONS}
              value={formData.provider}
              onChange={(e) => handleFieldChange("provider", e.target.value)}
            />
            <ModernInput
              label="Region"
              placeholder="us-east-1"
              value={formData.region}
              onChange={(e) => handleFieldChange("region", e.target.value)}
            />
          </div>

          {/* VM Credentials */}
          {resourceType === "vm" && (
            <div className="space-y-3 border-t border-gray-100 pt-3 dark:border-gray-700">
              <div className="grid gap-3 sm:grid-cols-2">
                <ModernInput
                  label="SSH User"
                  placeholder="root"
                  value={formData.ssh_user}
                  onChange={(e) =>
                    handleFieldChange("ssh_user", e.target.value)
                  }
                />
                <ModernSelect
                  label="OS Family"
                  options={[
                    { value: "linux", label: "Linux" },
                    { value: "windows", label: "Windows" },
                  ]}
                  value={formData.os_family}
                  onChange={(e) => handleFieldChange("os_family", e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                  SSH Private Key
                </label>
                <textarea
                  className="w-full rounded-lg border border-gray-200 bg-white p-2 font-mono text-xs text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                  rows={4}
                  placeholder="-----BEGIN RSA PRIVATE KEY-----"
                  value={formData.ssh_key_private}
                  onChange={(e) =>
                    handleFieldChange("ssh_key_private", e.target.value)
                  }
                />
              </div>
            </div>
          )}

          {/* Database Credentials */}
          {resourceType === "database" && (
            <div className="space-y-3 border-t border-gray-100 pt-3 dark:border-gray-700">
              <ModernSelect
                label="Engine"
                options={[
                  { value: "postgresql", label: "PostgreSQL" },
                  { value: "mysql", label: "MySQL" },
                  { value: "mongodb", label: "MongoDB" },
                  { value: "redis", label: "Redis" },
                  { value: "mariadb", label: "MariaDB" },
                ]}
                value={formData.engine}
                onChange={(e) => handleFieldChange("engine", e.target.value)}
              />
              <div className="grid gap-3 sm:grid-cols-3">
                <ModernInput
                  label="Username"
                  placeholder="admin"
                  value={formData.db_username}
                  onChange={(e) =>
                    handleFieldChange("db_username", e.target.value)
                  }
                />
                <ModernInput
                  label="Password"
                  type="password"
                  placeholder="********"
                  value={formData.db_password}
                  onChange={(e) =>
                    handleFieldChange("db_password", e.target.value)
                  }
                />
                <ModernInput
                  label="Database"
                  placeholder="mydb"
                  value={formData.db_name}
                  onChange={(e) =>
                    handleFieldChange("db_name", e.target.value)
                  }
                />
              </div>
            </div>
          )}

          {/* Storage Credentials */}
          {resourceType === "storage" && (
            <div className="space-y-3 border-t border-gray-100 pt-3 dark:border-gray-700">
              <div className="grid gap-3 sm:grid-cols-2">
                <ModernInput
                  label="Access Key"
                  placeholder="AKIAIOSFODNN7EXAMPLE"
                  value={formData.access_key}
                  onChange={(e) =>
                    handleFieldChange("access_key", e.target.value)
                  }
                />
                <ModernInput
                  label="Secret Key"
                  type="password"
                  placeholder="********"
                  value={formData.secret_key}
                  onChange={(e) =>
                    handleFieldChange("secret_key", e.target.value)
                  }
                />
              </div>
              <ModernInput
                label="Bucket"
                placeholder="my-bucket"
                value={formData.bucket}
                onChange={(e) =>
                  handleFieldChange("bucket", e.target.value)
                }
              />
            </div>
          )}

          <div className="flex justify-end gap-2 border-t border-gray-100 pt-3 dark:border-gray-700">
            <button
              type="button"
              onClick={() => setMode("existing")}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={
                !formData.name || !formData.host || createEndpoint.isPending
              }
              onClick={handleCreateAndSelect}
              className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
            >
              {createEndpoint.isPending ? "Registering..." : "Register & Select"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EndpointStep;
