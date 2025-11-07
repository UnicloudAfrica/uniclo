import { useNavigate, useParams } from "react-router-dom";
import TenantPageShell from "../../components/TenantPageShell";
import ModernCard from "../../../adminDashboard/components/ModernCard";
import ModernButton from "../../../adminDashboard/components/ModernButton";
import StatusPill from "../../../adminDashboard/components/StatusPill";
import ToastUtils from "../../../utils/toastUtil";
import { useFetchClientById, useDeleteClient } from "../../../hooks/clientHooks";

const InfoRow = ({ label, value }) => (
  <div className="space-y-1">
    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
      {label}
    </p>
    <p className="text-sm font-semibold text-slate-900">{value ?? "—"}</p>
  </div>
);

export default function ClientDetailsPage() {
  const navigate = useNavigate();
  const { clientId } = useParams();

  const {
    data: client,
    isFetching: isLoading,
  } = useFetchClientById(clientId);
  const { mutateAsync: deleteClient, isPending: isDeleting } = useDeleteClient();

  const handleDelete = async () => {
    if (!clientId) return;
    const confirm = window.confirm(
      "Removing this client will revoke their access to the workspace. Continue?"
    );
    if (!confirm) return;

    try {
      await deleteClient(clientId);
      ToastUtils.success("Client removed.");
      navigate("/dashboard/clients");
    } catch (error) {
      ToastUtils.error(
        error?.response?.data?.message || "Failed to remove client."
      );
    }
  };

  return (
    <TenantPageShell
      title="Client details"
      description="Review contact information and manage client lifecycle."
      homeHref="/dashboard/clients"
      actions={
        <ModernButton variant="outline" onClick={() => navigate(-1)}>
          Back
        </ModernButton>
      }
      contentClassName="space-y-6"
    >
      <ModernCard padding="lg" className="space-y-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-12 text-sm text-slate-500">
            Loading client…
          </div>
        ) : client ? (
          <>
            <div className="flex flex-col gap-2">
              <StatusPill
                label={client.verified ? "Verified" : "Pending verification"}
                tone={client.verified ? "success" : "warning"}
              />
              <h2 className="text-2xl font-semibold text-slate-900">
                {client.name || `${client.first_name ?? ""} ${client.last_name ?? ""}`.trim() || "Client"}
              </h2>
              <p className="text-sm text-slate-500">
                Manage access and contact details for this customer.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <InfoRow label="Email" value={client.email} />
              <InfoRow label="Phone" value={client.phone} />
              <InfoRow label="Workspace ID" value={client.identifier} />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <InfoRow label="Country" value={client.country} />
              <InfoRow label="State" value={client.state} />
              <InfoRow label="City" value={client.city} />
            </div>

            <div className="flex flex-wrap gap-2">
              <ModernButton
                variant="primary"
                onClick={() => navigate(`/dashboard/clients/${clientId}/edit`)}
              >
                Edit client
              </ModernButton>
              <ModernButton
                variant="outline"
                tone="destructive"
                onClick={handleDelete}
                isDisabled={isDeleting}
                isLoading={isDeleting}
              >
                Remove client
              </ModernButton>
            </div>
          </>
        ) : (
          <div className="py-12 text-center text-sm text-slate-500">
            Client not found.
          </div>
        )}
      </ModernCard>
    </TenantPageShell>
  );
}
