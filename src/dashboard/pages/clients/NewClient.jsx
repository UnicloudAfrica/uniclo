import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import TenantPageShell from "../../components/TenantPageShell";
import ClientCreateForm from "../../../shared/components/customer-management/ClientCreateForm";
import { ModernButton } from "../../../shared/components/ui";
import { useTenantBrandingTheme } from "../../../hooks/useBrandingTheme";

const useTenantIdParam = () => {
  const location = useLocation();
  return useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get("tenantId") || null;
  }, [location.search]);
};

export default function NewClientPage() {
  const navigate = useNavigate();
  const tenantId = useTenantIdParam();
  const { data: theme } = useTenantBrandingTheme();
  const tenantName = theme?.company?.name || "Tenant";
  const goBack = () => navigate("/dashboard/clients");

  const title = tenantId ? "Add partner client" : "Add Client";
  const description = tenantId
    ? "Create a client profile and assign it to the selected partner workspace."
    : "Create a new client profile and assign the appropriate tenant.";

  return (
    <TenantPageShell
      title={title}
      description={description}
      homeHref="/dashboard/clients"
      actions={
        <ModernButton variant="outline" onClick={goBack}>
          Back to Clients
        </ModernButton>
      }
      contentClassName="space-y-6"
    >
      <ClientCreateForm
        context="tenant"
        mode="page"
        onClose={goBack}
        presetTenantId={tenantId}
        tenantName={tenantName}
      />
    </TenantPageShell>
  );
}
