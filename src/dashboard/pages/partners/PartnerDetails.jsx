import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Building2, Loader2, Mail, Phone, ShieldCheck, Users2 } from "lucide-react";
import TenantPageShell from "../../components/TenantPageShell";
import { ModernCard } from "../../../shared/components/ui";
import { ModernButton } from "../../../shared/components/ui";
import { StatusPill } from "../../../shared/components/ui";
import ToastUtils from "../../../utils/toastUtil.ts";
import {
  useDeleteTenantPartner,
  useFetchTenantPartnerById,
  useFetchTenantPartnerClients,
} from "../../../hooks/tenantHooks/partnerHooks";

const InfoRow = ({ label, value }) => (
  <div className="flex flex-col gap-1">
    <span className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</span>
    <span className="text-sm font-semibold text-slate-900">{value ?? "—"}</span>
  </div>
);

const SimpleTable = ({ isLoading, data, onRowClick }) => {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16">
        <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
        <p className="text-sm text-slate-500">Loading clients…</p>
      </div>
    );
  }

  if (!data?.length) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <Users2 className="h-8 w-8 text-slate-400" />
        <p className="text-sm text-slate-500">No clients linked to this partner yet.</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-slate-100">
      {data.map((client) => (
        <button
          key={client.id || client.identifier}
          type="button"
          className="flex w-full flex-col gap-1 px-4 py-3 text-left transition hover:bg-slate-50"
          onClick={() => onRowClick?.(client)}
        >
          <span className="text-sm font-semibold text-slate-900">
            {client.name || client.email || "Client"}
          </span>
          <span className="text-xs text-slate-500">{client.email ?? "—"}</span>
        </button>
      ))}
    </div>
  );
};

export default function PartnerDetailsPage() {
  const navigate = useNavigate();
  const { partnerId } = useParams();

  const { data: partner, isFetching: isPartnerFetching } = useFetchTenantPartnerById(partnerId);
  const { data: partnerClients = [], isFetching: isClientsFetching } =
    useFetchTenantPartnerClients(partnerId);
  const { mutateAsync: deletePartner, isPending: isDeleting } = useDeleteTenantPartner();

  const statistics = useMemo(() => {
    if (!partner) return [];

    return [
      {
        label: "Status",
        value: partner.verified ? "Verified" : "Pending verification",
        tone: partner.verified ? "success" : "warning",
        icon: ShieldCheck,
      },
      {
        label: "Total clients",
        value: partner.statistics?.clients ?? 0,
        tone: "neutral",
        icon: Users2,
      },
    ];
  }, [partner]);

  const handleDelete = async () => {
    if (!partnerId) return;
    const confirm = window.confirm("Are you sure you want to remove this partner workspace?");
    if (!confirm) return;

    try {
      await deletePartner(partnerId);
      ToastUtils.success("Partner removed.");
      navigate("/dashboard/clients");
    } catch (error) {
      ToastUtils.error(error?.response?.data?.message || "Failed to remove partner.");
    }
  };

  const handleCreateClient = () => {
    if (!partner?.id) {
      ToastUtils.error("Unable to create client for this partner.");
      return;
    }
    navigate(`/dashboard/clients/new?tenantId=${partner.id}`);
  };

  const renderContent = () => {
    if (isPartnerFetching) {
      return (
        <ModernCard padding="xl" className="flex flex-col items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
          <p className="text-sm text-slate-500">Fetching partner details…</p>
        </ModernCard>
      );
    }

    if (!partner) {
      return (
        <ModernCard padding="xl" className="text-center text-slate-500">
          Unable to find partner details.
        </ModernCard>
      );
    }

    const primaryContact = partner.primary_contact;
    const business = partner.business ?? {};

    return (
      <div className="space-y-6">
        <ModernCard padding="lg" className="space-y-6">
          <div className="flex flex-col gap-2">
            <StatusPill
              label={partner.verified ? "Verified workspace" : "Awaiting verification"}
              tone={partner.verified ? "success" : "warning"}
            />
            <h2 className="text-2xl font-semibold text-slate-900">
              {partner.name || "Partner workspace"}
            </h2>
            <p className="text-sm text-slate-500">
              Manage {partner.name || "this partner"}’s workspace, linked clients, and core contact
              details.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <InfoRow label="Workspace domain" value={partner.domain} />
            <InfoRow label="Company type" value={business.company_type} />
            <InfoRow label="Registration" value={business.registration_number} />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <InfoRow label="Primary contact" value={primaryContact?.name} />
            <InfoRow label="Email" value={primaryContact?.email} />
            <InfoRow label="Phone" value={primaryContact?.phone} />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <InfoRow label="Industry" value={business.industry} />
            <InfoRow label="Country" value={business.country} />
            <InfoRow label="City" value={business.city} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {statistics.map((stat) => (
              <ModernCard
                key={stat.label}
                padding="md"
                className="flex items-center justify-between border border-slate-100 bg-slate-50"
              >
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    {stat.label}
                  </p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">{stat.value}</p>
                </div>
                <div className="rounded-full bg-white p-2 text-primary-500 shadow-sm">
                  <stat.icon className="h-5 w-5" />
                </div>
              </ModernCard>
            ))}
          </div>
        </ModernCard>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Partner clients</h3>
            <p className="text-sm text-slate-500">
              These clients belong to the partner workspace. Launching a new client will switch
              context to the partner automatically.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <ModernButton
              variant="outline"
              onClick={() => navigate(`/dashboard/partners/${partner.identifier}/edit`)}
            >
              Edit partner
            </ModernButton>
            <ModernButton
              variant="outline"
              tone="destructive"
              onClick={handleDelete}
              isDisabled={isDeleting}
              isLoading={isDeleting}
            >
              Remove partner
            </ModernButton>
            <ModernButton variant="primary" onClick={handleCreateClient}>
              Add client
            </ModernButton>
          </div>
        </div>

        <ModernCard>
          <SimpleTable
            isLoading={isClientsFetching}
            data={partnerClients}
            onRowClick={(client) => navigate(`/dashboard/clients/${client.identifier}`)}
          />
        </ModernCard>
      </div>
    );
  };

  return (
    <TenantPageShell
      title="Partner details"
      description="Review workspace information, clients, and administrators for this partner."
      homeHref="/dashboard/clients"
      contentClassName="space-y-8"
    >
      {renderContent()}
    </TenantPageShell>
  );
}
