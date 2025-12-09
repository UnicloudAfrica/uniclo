import React from "react";
import { Option } from "../../../hooks/objectStorageUtils";

export interface ObjectStorageWorkflowStepProps {
  // Mode
  mode: string;
  onModeChange: (mode: string) => void;

  // Customer Context - only show for admin
  showCustomerContext?: boolean;
  contextType: string;
  onContextTypeChange: (type: string) => void;
  selectedTenantId: string;
  onTenantChange: (id: string) => void;
  selectedUserId: string;
  onUserChange: (id: string) => void;
  tenantOptions: Option[];
  clientOptions: Option[];
  isTenantsFetching?: boolean;
  isUsersFetching?: boolean;

  // Country
  countryCode: string;
  onCountryChange: (code: string) => void;
  countryOptions: Option[];
  isCountryLocked?: boolean;
  isCountriesLoading?: boolean;

  // Dashboard context
  dashboardContext: "admin" | "tenant" | "client";
}

export const ObjectStorageWorkflowStep: React.FC<ObjectStorageWorkflowStepProps> = ({
  mode,
  onModeChange,
  showCustomerContext = true,
  contextType,
  onContextTypeChange,
  selectedTenantId,
  onTenantChange,
  selectedUserId,
  onUserChange,
  tenantOptions,
  clientOptions,
  isTenantsFetching,
  isUsersFetching,
  countryCode,
  onCountryChange,
  countryOptions,
  isCountryLocked,
  isCountriesLoading,
  dashboardContext,
}) => {
  return (
    <div className="workflow-step">
      <div className="step-header">
        <h2 className="step-title">Workflow & Assignment</h2>
        <p className="step-description">
          Choose your provisioning mode and who this request is for.
        </p>
      </div>

      {/* Provisioning Mode */}
      <div className="form-section">
        <h3 className="section-title">Provisioning Mode</h3>
        <div className="mode-selector">
          <div
            className={`mode-card ${mode === "standard" ? "selected" : ""}`}
            onClick={() => onModeChange("standard")}
          >
            <div className="mode-icon">📋</div>
            <div className="mode-content">
              <div className="mode-name">Standard Workflow</div>
              <div className="mode-desc">Configure, price, and generate payment link.</div>
            </div>
            <div className="mode-radio">
              <input
                type="radio"
                name="provisioning-mode"
                checked={mode === "standard"}
                onChange={() => onModeChange("standard")}
              />
            </div>
          </div>

          <div
            className={`mode-card ${mode === "fast-track" ? "selected" : ""}`}
            onClick={() => onModeChange("fast-track")}
          >
            <div className="mode-icon">⚡</div>
            <div className="mode-content">
              <div className="mode-name">Fast-Track</div>
              <div className="mode-desc">Skip payment and provision immediately.</div>
            </div>
            <div className="mode-radio">
              <input
                type="radio"
                name="provisioning-mode"
                checked={mode === "fast-track"}
                onChange={() => onModeChange("fast-track")}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Customer Context - Only for Admin */}
      {showCustomerContext && dashboardContext === "admin" && (
        <div className="form-section">
          <h3 className="section-title">Customer Context</h3>
          <p className="section-description">Select who you are performing this action for.</p>

          <div className="context-selector">
            <label className="context-option">
              <input
                type="radio"
                name="context-type"
                value=""
                checked={contextType === ""}
                onChange={() => onContextTypeChange("")}
              />
              <span>Unassigned</span>
            </label>
            <label className="context-option">
              <input
                type="radio"
                name="context-type"
                value="tenant"
                checked={contextType === "tenant"}
                onChange={() => onContextTypeChange("tenant")}
              />
              <span>Tenant</span>
            </label>
            <label className="context-option">
              <input
                type="radio"
                name="context-type"
                value="user"
                checked={contextType === "user"}
                onChange={() => onContextTypeChange("user")}
              />
              <span>User</span>
            </label>
          </div>

          {/* Tenant Selection */}
          {contextType === "tenant" && (
            <div className="form-group">
              <label>Select Tenant</label>
              <select
                className="form-control"
                value={selectedTenantId}
                onChange={(e) => onTenantChange(e.target.value)}
                disabled={isTenantsFetching}
              >
                <option value="">{isTenantsFetching ? "Loading..." : "Select a tenant..."}</option>
                {tenantOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* User Selection */}
          {contextType === "user" && (
            <div className="form-group">
              <label>Select User</label>
              <select
                className="form-control"
                value={selectedUserId}
                onChange={(e) => onUserChange(e.target.value)}
                disabled={isUsersFetching}
              >
                <option value="">{isUsersFetching ? "Loading..." : "Select a user..."}</option>
                {clientOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      {/* Billing Country */}
      <div className="form-section">
        <h3 className="section-title">Billing Country</h3>
        <div className="form-group">
          <select
            className="form-control"
            value={countryCode}
            onChange={(e) => onCountryChange(e.target.value)}
            disabled={isCountryLocked || isCountriesLoading}
          >
            <option value="">{isCountriesLoading ? "Loading..." : "Select country..."}</option>
            {countryOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {isCountryLocked && (
            <small className="form-text text-muted">
              Country is locked based on customer selection.
            </small>
          )}
          <small className="form-text text-muted">
            Used for tax calculation and currency selection.
          </small>
        </div>
      </div>
    </div>
  );
};
