// @ts-nocheck
import React, { useEffect, useState } from "react";
import { ArrowUpRight, Loader2 } from "lucide-react";
import { ModernInput, ModernModal } from "../../../shared/components/ui";
import { adminSilentApi } from "../../../index/admin/api";
import ToastUtils from "../../../utils/toastUtil";

interface PromoteClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: any;
  onPromoted?: (payload: any) => void;
}

const PromoteClientModal: React.FC<PromoteClientModalProps> = ({
  isOpen,
  onClose,
  client,
  onPromoted,
}) => {
  const [tenantName, setTenantName] = useState("");
  const [domain, setDomain] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTenantName("");
      setDomain("");
    }
  }, [isOpen, client?.identifier]);

  const handlePromote = async () => {
    if (!client?.identifier) {
      ToastUtils.error("Client not selected.");
      return;
    }
    if (client?.tenant_id) {
      ToastUtils.error("Client already belongs to a tenant.");
      return;
    }

    const payload: Record<string, string> = {};
    if (tenantName.trim()) payload.tenant_name = tenantName.trim();
    if (domain.trim()) payload.domain = domain.trim();

    setIsSubmitting(true);
    try {
      const response = await adminSilentApi(
        "POST",
        `/clients/${client.identifier}/promote-to-tenant`,
        payload
      );

      ToastUtils.success("Client promoted to tenant.");
      if (onPromoted) onPromoted(response?.data ?? response);
      onClose();
    } catch (error: any) {
      const message =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        "Failed to promote client.";
      ToastUtils.error(message);
      console.error("Promote client error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModernModal
      isOpen={isOpen}
      onClose={onClose}
      title="Promote client to tenant"
      subtitle="This will create a tenant and migrate the client resources."
      size="md"
      actions={[
        {
          label: "Cancel",
          variant: "ghost",
          onClick: onClose,
          disabled: isSubmitting,
        },
        {
          label: "Promote",
          variant: "primary",
          onClick: handlePromote,
          disabled: isSubmitting,
          icon: isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ArrowUpRight className="h-4 w-4" />
          ),
        },
      ]}
    >
      <div className="space-y-4">
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Promoting moves projects, credentials, billing, onboarding, and wallet records into the
          new tenant. This action cannot be undone.
        </div>

        <ModernInput
          label="Tenant name (optional)"
          placeholder="Leave blank to use the client name"
          value={tenantName}
          onChange={(e) => setTenantName(e.target.value)}
        />

        <ModernInput
          label="Tenant domain (optional)"
          placeholder="tenant.example.com"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
        />

        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          <div className="font-semibold text-slate-700">
            {client?.first_name} {client?.last_name}
          </div>
          <div>{client?.email}</div>
        </div>
      </div>
    </ModernModal>
  );
};

export default PromoteClientModal;
