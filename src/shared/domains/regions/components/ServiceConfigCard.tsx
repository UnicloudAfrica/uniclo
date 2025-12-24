/**
 * Service Configuration Card
 * Reusable component for enabling/configuring a service in a region
 */
// @ts-nocheck
import React from "react";
import { Server, Database, Globe, Check, AlertCircle, Loader2 } from "lucide-react";
import ModernInput from "../../../components/ui/ModernInput";
import { ModernButton } from "../../../components/ui";
import type {
  ServiceDefinition,
  FieldDefinition,
  ServiceConnectionStatus,
} from "../types/serviceConfig.types";

/** Service type to icon mapping */
const SERVICE_ICONS: Record<string, React.ElementType> = {
  compute: Server,
  object_storage: Database,
  network: Globe,
};

export interface ServiceConfigCardProps {
  serviceType: string;
  serviceConfig: ServiceDefinition;
  enabled: boolean;
  onToggle: () => void;
  fulfillmentMode: "manual" | "automated";
  onModeChange: (mode: "manual" | "automated") => void;
  credentials: Record<string, string>;
  onCredentialChange: (field: string, value: string) => void;
  onTestConnection: () => void;
  status?: ServiceConnectionStatus;
  testing?: boolean;
}

const getInputType = (fieldDef: FieldDefinition): string => {
  if (fieldDef.type === "password") return "password";
  if (fieldDef.type === "number") return "number";
  if (fieldDef.type === "email") return "email";
  if (fieldDef.type === "url") return "url";
  return "text";
};

const ServiceConfigCard: React.FC<ServiceConfigCardProps> = ({
  serviceType,
  serviceConfig,
  enabled,
  onToggle,
  fulfillmentMode,
  onModeChange,
  credentials,
  onCredentialChange,
  onTestConnection,
  status = "not_configured",
  testing = false,
}) => {
  const Icon = SERVICE_ICONS[serviceType] || Server;
  const label = serviceConfig?.label || serviceType;
  const description = serviceConfig?.description || "";
  const fields = serviceConfig?.fields || {};

  return (
    <div
      className={`rounded-2xl border-2 transition-all ${
        enabled ? "border-blue-500 bg-blue-50/30" : "border-gray-200 bg-white hover:border-gray-300"
      }`}
    >
      {/* Header with toggle */}
      <div className="flex items-center justify-between p-4 cursor-pointer" onClick={onToggle}>
        <div className="flex items-center gap-3">
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-xl ${
              enabled ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-500"
            }`}
          >
            <Icon className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{label}</h3>
            <p className="text-sm text-gray-500">{description}</p>
          </div>
        </div>
        <div
          className={`flex h-6 w-6 items-center justify-center rounded-full border-2 ${
            enabled ? "border-blue-500 bg-blue-500" : "border-gray-300"
          }`}
        >
          {enabled && <Check className="h-4 w-4 text-white" />}
        </div>
      </div>

      {/* Expanded configuration when enabled */}
      {enabled && (
        <div className="border-t border-blue-200 p-4 space-y-4">
          {/* Status Banner */}
          {fulfillmentMode === "automated" && (
            <div
              className={`p-3 rounded-lg flex items-center gap-2 text-sm font-medium ${
                status === "connected"
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : "bg-gray-50 text-gray-600 border border-gray-200"
              }`}
            >
              {status === "connected" ? (
                <>
                  <Check className="h-4 w-4" />
                  <span>Connection Verified</span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-4 w-4" />
                  <span>Not Connected</span>
                </>
              )}
            </div>
          )}

          {/* Fulfillment Mode */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Fulfillment Mode</p>
            <div className="flex gap-4">
              <label
                className={`flex-1 flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                  fulfillmentMode === "manual"
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <input
                  type="radio"
                  name={`${serviceType}-mode`}
                  value="manual"
                  checked={fulfillmentMode === "manual"}
                  onChange={() => onModeChange("manual")}
                  className="sr-only"
                />
                <div
                  className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                    fulfillmentMode === "manual" ? "border-blue-500" : "border-gray-300"
                  }`}
                >
                  {fulfillmentMode === "manual" && (
                    <div className="h-2 w-2 rounded-full bg-blue-500" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-900">Manual</p>
                  <p className="text-xs text-gray-500">Process orders manually</p>
                </div>
              </label>

              <label
                className={`flex-1 flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                  fulfillmentMode === "automated"
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <input
                  type="radio"
                  name={`${serviceType}-mode`}
                  value="automated"
                  checked={fulfillmentMode === "automated"}
                  onChange={() => onModeChange("automated")}
                  className="sr-only"
                />
                <div
                  className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                    fulfillmentMode === "automated" ? "border-blue-500" : "border-gray-300"
                  }`}
                >
                  {fulfillmentMode === "automated" && (
                    <div className="h-2 w-2 rounded-full bg-blue-500" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-900">Automated</p>
                  <p className="text-xs text-gray-500">Requires credentials</p>
                </div>
              </label>
            </div>
          </div>

          {/* Credentials Form (only for automated) */}
          {fulfillmentMode === "automated" && Object.keys(fields).length > 0 && (
            <div className="space-y-3 pt-2">
              <p className="text-sm font-medium text-gray-700">Credentials</p>
              <div className="grid gap-3 md:grid-cols-2">
                {Object.entries(fields).map(([fieldName, fieldDef]) => (
                  <ModernInput
                    key={fieldName}
                    label={`${fieldDef.label}${fieldDef.required ? "" : " (optional)"}`}
                    name={fieldName}
                    type={getInputType(fieldDef)}
                    value={credentials[fieldName] || ""}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      onCredentialChange(fieldName, e.target.value)
                    }
                    placeholder={fieldDef.placeholder || ""}
                    helper={fieldDef.help}
                    required={fieldDef.required}
                  />
                ))}
              </div>
              <div className="flex items-center gap-3">
                <ModernButton
                  type="button"
                  variant={status === "connected" ? "outline" : "secondary"}
                  className="w-full md:w-auto"
                  onClick={onTestConnection}
                  disabled={testing}
                >
                  {testing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  {testing
                    ? "Testing..."
                    : status === "connected"
                      ? "Re-test Connection"
                      : "Test Connection"}
                </ModernButton>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ServiceConfigCard;
