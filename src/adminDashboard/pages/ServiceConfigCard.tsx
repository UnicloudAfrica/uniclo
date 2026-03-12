import React, { useState } from "react";
import { AlertCircle, Loader2, Server, Check } from "lucide-react";
import { ModernButton } from "@/shared/components/ui";
import ModernInput from "@/shared/components/ui/ModernInput";
import { SERVICE_ICONS } from "./regionEditUtils";
import type { ServiceConfigCardProps, ServiceFieldDefinition } from "./regionEditTypes";

const ServiceConfigCard = ({
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
  isExistingConnection = false, // New prop to indicate credentials already exist
}: ServiceConfigCardProps) => {
  const Icon = SERVICE_ICONS[serviceType] || Server;
  const label = serviceConfig?.label || serviceType;
  const description = serviceConfig?.description || "";
  const fields: Record<string, ServiceFieldDefinition> = serviceConfig?.fields || {};
  const [showUpdateForm, setShowUpdateForm] = useState(false);

  const getInputType = (fieldDef: ServiceFieldDefinition) => {
    if (fieldDef.type === "password") return "password";
    if (fieldDef.type === "number") return "number";
    if (fieldDef.type === "email") return "email";
    if (fieldDef.type === "url") return "url";
    return "text";
  };

  // Determine if we should show the credential form
  const hasCredentialsEntered = Object.values(credentials || {}).some((v: any) => v && v !== "");
  const shouldShowCredentialsForm =
    !isExistingConnection || showUpdateForm || hasCredentialsEntered;

  return (
    <div
      className={`rounded-2xl border-2 transition-all ${enabled ? "border-blue-500 bg-blue-50/30" : "border-gray-200 bg-white hover:border-gray-300"}`}
    >
      {/* Header with toggle */}
      <div className="flex items-center justify-between p-4 cursor-pointer" onClick={onToggle}>
        <div className="flex items-center gap-3">
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-xl ${enabled ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-500"}`}
          >
            <Icon className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900">{label}</h3>
              {/* Verified indicator - shows even when collapsed */}
              {(status === "connected" || status === "verified") && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                  <Check className="h-3 w-3" />
                  Verified
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500">{description}</p>
          </div>
        </div>
        <div
          className={`flex h-6 w-6 items-center justify-center rounded-full border-2 ${enabled ? "border-blue-500 bg-blue-500" : "border-gray-300"}`}
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
              className={`p-3 rounded-lg flex items-center gap-2 text-sm font-medium ${status === "connected" || status === "verified" ? "bg-green-50 text-green-700 border border-green-200" : "bg-gray-50 text-gray-600 border border-gray-200"}`}
            >
              {status === "connected" || status === "verified" ? (
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
                className={`flex-1 flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${fulfillmentMode === "manual" ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"}`}
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
                  className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${fulfillmentMode === "manual" ? "border-blue-500" : "border-gray-300"}`}
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

              {/* Show existing connection message when credentials are already saved */}
              {isExistingConnection && !showUpdateForm && !hasCredentialsEntered && (
                <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Check className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="text-sm font-medium text-blue-800">
                          Credentials are configured
                        </p>
                        <p className="text-xs text-blue-600">
                          Your credentials are securely stored. Click update to modify them.
                        </p>
                      </div>
                    </div>
                    <ModernButton
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowUpdateForm(true)}
                    >
                      Update Credentials
                    </ModernButton>
                  </div>
                </div>
              )}

              {/* Show form when updating or for new connections */}
              {shouldShowCredentialsForm && (
                <>
                  <div className="grid gap-3 md:grid-cols-2">
                    {Object.entries(fields).map(
                      ([fieldName, fieldDef]: [string, ServiceFieldDefinition]) => (
                        <ModernInput
                          key={fieldName}
                          label={`${fieldDef.label}${fieldDef.required ? "" : " (optional)"}`}
                          name={fieldName}
                          type={getInputType(fieldDef)}
                          value={credentials[fieldName] || ""}
                          onChange={(e) => onCredentialChange(fieldName, e.target.value)}
                          placeholder={
                            isExistingConnection
                              ? "Enter new value to update..."
                              : fieldDef.placeholder || ""
                          }
                          helper={fieldDef.help}
                          required={!isExistingConnection && fieldDef.required}
                        />
                      )
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <ModernButton
                      type="button"
                      variant={
                        status === "connected" || status === "verified" ? "outline" : "secondary"
                      }
                      className="w-full md:w-auto"
                      onClick={onTestConnection}
                      disabled={testing}
                    >
                      {testing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      {testing
                        ? "Testing..."
                        : status === "connected" || status === "verified"
                          ? "Re-test Connection"
                          : "Test Connection"}
                    </ModernButton>
                    {isExistingConnection && showUpdateForm && (
                      <ModernButton
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowUpdateForm(false)}
                      >
                        Cancel
                      </ModernButton>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ServiceConfigCard;
