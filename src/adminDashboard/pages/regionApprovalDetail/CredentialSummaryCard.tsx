import React from "react";
import { CheckCircle, AlertCircle, Lock, KeyRound } from "lucide-react";
import { ModernCard, ModernButton } from "@/shared/components/ui";
import type { CredentialSummary, RegionApproval } from "./types";

interface CredentialSummaryCardProps {
  region: RegionApproval;
  credentialSummary: CredentialSummary;
  hasMspCredentials: boolean;
  onManageCredentials: () => void;
}

const CredentialSummaryCard: React.FC<CredentialSummaryCardProps> = ({
  region,
  credentialSummary,
  hasMspCredentials,
  onManageCredentials,
}) => {
  return (
    <ModernCard padding="lg" className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Credential Summary</h2>
          <p className="text-sm text-gray-500">
            MSP administrative credentials used for automated provisioning.
          </p>
        </div>
        {region.fulfillment_mode === "automated" && (
          <ModernButton
            variant="outline"
            size="sm"
            onClick={onManageCredentials}
            className="flex items-center gap-2"
          >
            <Lock size={16} />
            Manage Credentials
          </ModernButton>
        )}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-gray-100 px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Domain</p>
          <p className="mt-1 text-sm font-semibold text-gray-900">
            {credentialSummary.domain || "\u2014"}
          </p>
        </div>
        <div className="rounded-xl border border-gray-100 px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Default Project
          </p>
          <p className="mt-1 text-sm font-semibold text-gray-900">
            {credentialSummary.default_project || "\u2014"}
          </p>
        </div>
        <div className="rounded-xl border border-gray-100 px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Credentials Stored
          </p>
          <p className="mt-1 text-sm font-semibold text-gray-900">
            {hasMspCredentials ? "Yes" : "No"}
          </p>
        </div>
        <div className="rounded-xl border border-gray-100 px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Username Preview
          </p>
          <p className="mt-1 text-sm font-semibold text-gray-900">
            {credentialSummary.username_preview || "\u2014"}
          </p>
        </div>
      </div>

      {region.fulfillment_mode === "automated" && (
        <div
          className={`rounded-xl border px-4 py-3 ${
            region.msp_credentials_verified_at
              ? "border-green-200 bg-green-50 text-green-700"
              : "border-yellow-200 bg-yellow-50 text-yellow-700"
          }`}
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              {region.msp_credentials_verified_at ? (
                <CheckCircle size={18} />
              ) : (
                <AlertCircle size={18} />
              )}
              <div>
                <p className="text-sm font-semibold">
                  {region.msp_credentials_verified_at
                    ? "Credentials Verified"
                    : "Credentials Not Verified"}
                </p>
                <p className="text-xs">
                  {region.msp_credentials_verified_at
                    ? `Last verified: ${new Date(
                        region.msp_credentials_verified_at
                      ).toLocaleString()}`
                    : "Automated provisioning requires verified MSP admin credentials."}
                </p>
              </div>
            </div>
            {!region.msp_credentials_verified_at && (
              <ModernButton
                variant="primary"
                size="sm"
                onClick={onManageCredentials}
                className="flex items-center gap-2"
              >
                <KeyRound size={16} />
                Verify Credentials
              </ModernButton>
            )}
          </div>
        </div>
      )}
    </ModernCard>
  );
};

export default CredentialSummaryCard;
