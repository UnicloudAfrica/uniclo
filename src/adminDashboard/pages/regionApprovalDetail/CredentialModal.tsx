import React from "react";
import { ModernCard, ModernButton } from "@/shared/components/ui";
import type { CredentialForm } from "./types";

interface CredentialModalProps {
  credentials: CredentialForm;
  verifying: boolean;
  onCredentialsChange: (credentials: CredentialForm) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
}

const CredentialModal: React.FC<CredentialModalProps> = ({
  credentials,
  verifying,
  onCredentialsChange,
  onSubmit,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6">
      <ModernCard padding="xl" className="w-full max-w-lg space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Verify MSP Admin Credentials</h3>
          <p className="text-sm text-gray-500">
            Provide the MSP admin credentials to enable automated provisioning for this region.
          </p>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-3">
            <div>
              <label
                htmlFor="modal-username"
                className="text-xs font-medium uppercase tracking-wide text-gray-500"
              >
                Username<span className="text-red-500">*</span>
              </label>
              <input
                id="modal-username"
                type="text"
                value={credentials.username}
                onChange={(e) => onCredentialsChange({ ...credentials, username: e.target.value })}
                className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
                placeholder="MSP admin username"
                required
              />
            </div>
            <div>
              <label
                htmlFor="modal-password"
                className="text-xs font-medium uppercase tracking-wide text-gray-500"
              >
                Password<span className="text-red-500">*</span>
              </label>
              <input
                id="modal-password"
                type="password"
                value={credentials.password}
                onChange={(e) => onCredentialsChange({ ...credentials, password: e.target.value })}
                className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
                placeholder="MSP admin password"
                required
              />
            </div>
            <div>
              <label
                htmlFor="modal-domain"
                className="text-xs font-medium uppercase tracking-wide text-gray-500"
              >
                Domain<span className="text-red-500">*</span>
              </label>
              <input
                id="modal-domain"
                type="text"
                value={credentials.domain}
                onChange={(e) => onCredentialsChange({ ...credentials, domain: e.target.value })}
                className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
                placeholder="cloud_msp"
                required
              />
            </div>
            <div>
              <label
                htmlFor="modal-domain-id"
                className="text-xs font-medium uppercase tracking-wide text-gray-500"
              >
                Domain ID <span className="text-gray-400">(optional)</span>
              </label>
              <input
                id="modal-domain-id"
                type="text"
                value={credentials.domain_id}
                onChange={(e) => onCredentialsChange({ ...credentials, domain_id: e.target.value })}
                className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
                placeholder="dom-xxxxx"
              />
            </div>
          </div>

          <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-xs text-blue-700">
            <strong>Note:</strong> MSP admins authenticate using the default project token. Ensure
            the credentials include the <strong>msp_admin</strong> role.
          </div>

          <div className="flex items-center justify-end gap-3">
            <ModernButton type="button" variant="ghost" onClick={onClose} className="px-4">
              Cancel
            </ModernButton>
            <ModernButton type="submit" variant="primary" isLoading={verifying} className="px-5">
              Verify Credentials
            </ModernButton>
          </div>
        </form>
      </ModernCard>
    </div>
  );
};

export default CredentialModal;
