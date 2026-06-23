import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarClock, IdCard, Mail, MapPin, SquarePen, Trash2 } from "lucide-react";
import EditClientModal from "../../pages/clientComps/EditClient";
import DeleteClientModal from "../../pages/clientComps/DeleteClient";
import { ModernButton } from "@/shared/components/ui";
import StatusPill from "@/shared/components/ui/StatusPill";
import SetupProgressCard from "@/shared/components/projects/details/SetupProgressCard";

const accent = "var(--theme-color)";

const encodeId = (id: string) => encodeURIComponent(btoa(id));

interface ClientData {
  id?: string | number;
  identifier?: string;
  first_name?: string;
  middle_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  country?: string;
  state?: string;
  city?: string;
  address?: string;
  verified?: number | boolean;
  zip?: string;
  role?: string;
  created_at?: string;
  updated_at?: string;
  tenant?: { name?: string; identifier?: string };
  provisioning_progress?: Array<{
    id: string;
    label: string;
    status: "pending" | "in_progress" | "completed" | "failed" | string;
    updated_at: string;
    context?: unknown;
  }>;
  [key: string]: unknown;
}

interface OverviewClientProps {
  client: ClientData | null | undefined;
  openEditOnLoad?: boolean;
}

const OverviewClient: React.FC<OverviewClientProps> = ({ client, openEditOnLoad }) => {
  const navigate = useNavigate();
  const [isEditClientModalOpen, setIsEditClientModalOpen] = useState(false);
  const [isDeleteClientModalOpen, setIsDeleteClientModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<ClientData | null>(null);

  const statusLabel = client?.verified === 1 ? "Active client" : "Pending activation";
  const statusTone = client?.verified === 1 ? "success" : "warning";

  const fullName = useMemo(
    () =>
      [client?.first_name, client?.middle_name, client?.last_name].filter(Boolean).join(" ").trim(),
    [client]
  );

  const addressLine = useMemo(() => {
    const parts = [client?.address, client?.city, client?.state, client?.country]
      .filter(Boolean)
      .join(", ");
    return parts || "Address not supplied";
  }, [client]);

  const handleViewTenantDetails = (tenantIdentifier: string, tenantName: string) => {
    if (!tenantIdentifier) return;
    const encodedTenantId = encodeId(tenantIdentifier);
    const encodedTenantName = encodeURIComponent(tenantName || "");
    navigate(`/admin-dashboard/partners/details?id=${encodedTenantId}&name=${encodedTenantName}`);
  };

  const formatDateTime = (value: string) =>
    value
      ? new Date(value).toLocaleString(undefined, {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "—";

  const contactItems = [
    {
      label: "Email address",
      value: client?.email || "Not provided",
      type: "mailto",
    },
    {
      label: "Phone number",
      value: client?.phone || "Not provided",
    },
    {
      label: "Tenant",
      value: client?.tenant?.name || "Not assigned",
      action: client?.tenant?.identifier
        ? () => handleViewTenantDetails(client.tenant.identifier, client.tenant.name)
        : null,
    },
  ];

  const provisioningSteps = Array.isArray(client?.provisioning_progress)
    ? (client.provisioning_progress.map((step) => ({
        id: step.id,
        label: step.label,
        status: step.status,
        updated_at: step.updated_at,
        context: step.context as Record<string, unknown> | undefined,
      })) as unknown as Parameters<typeof SetupProgressCard>[0]["steps"])
    : [];

  const showProvisioning = provisioningSteps.length > 0;

  const openEditClientModal = (clientData: ClientData) => {
    setSelectedClient(clientData);
    setIsEditClientModalOpen(true);
  };

  useEffect(() => {
    if (openEditOnLoad && client) {
      openEditClientModal(client);
    }
  }, [client, openEditOnLoad]);

  const closeEditClientModal = () => {
    setIsEditClientModalOpen(false);
    setSelectedClient(null);
  };

  const openDeleteClientModal = (clientData: ClientData) => {
    setSelectedClient(clientData);
    setIsDeleteClientModalOpen(true);
  };

  const closeDeleteClientModal = () => {
    setIsDeleteClientModalOpen(false);
    setSelectedClient(null);
  };

  if (!client) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-10 text-center text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-900/40 dark:text-gray-400">
        No client data available.
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {showProvisioning && (
          <div className="grid grid-cols-1 gap-6">
            <SetupProgressCard
              steps={provisioningSteps}
              isLoading={client?.onboarding_status === "processing"}
            />
          </div>
        )}

        {/* Header */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
                Client Profile
              </p>
              <h2 className="mt-1 truncate text-2xl font-semibold text-gray-900 dark:text-white">
                {fullName || client.email || "Client record"}
              </h2>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <StatusPill label={statusLabel} tone={statusTone} />
                <StatusPill label={`Client ID ${client.identifier || "—"}`} tone="neutral" />
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <ModernButton
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => openEditClientModal(client)}
              >
                <SquarePen className="h-4 w-4" />
                Edit Client
              </ModernButton>
              <ModernButton
                variant="danger"
                size="sm"
                className="gap-2"
                onClick={() => openDeleteClientModal(client)}
              >
                <Trash2 className="h-4 w-4" />
                Remove
              </ModernButton>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[320px,1fr]">
          <div className="space-y-6">
            {/* Contact details */}
            <SectionCard icon={<Mail size={16} />} title="Contact Details">
              <ul className="space-y-3">
                {contactItems.map(({ label, value, type, action }) => (
                  <li key={label} className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
                      {label}
                    </p>
                    {type === "mailto" && value && value !== "Not provided" ? (
                      <a
                        href={`mailto:${value}`}
                        className="block break-all text-sm font-medium hover:underline"
                        style={{ color: accent }}
                      >
                        {value}
                      </a>
                    ) : action ? (
                      <button
                        type="button"
                        onClick={action}
                        className="block break-words text-left text-sm font-medium hover:underline"
                        style={{ color: accent }}
                      >
                        {value}
                      </button>
                    ) : (
                      <p className="break-all text-sm font-medium text-gray-900 dark:text-white">
                        {value}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </SectionCard>

            {/* Address & location */}
            <SectionCard icon={<MapPin size={16} />} title="Address & Location">
              <div className="space-y-4">
                <div className="break-words rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-900/40 dark:text-white">
                  {addressLine}
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
                      Zip / Postal
                    </p>
                    <p className="mt-0.5 break-all text-sm font-medium text-gray-900 dark:text-white">
                      {client?.zip || "—"}
                    </p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
                      Country
                    </p>
                    <p className="mt-0.5 break-words text-sm font-medium text-gray-900 dark:text-white">
                      {client?.country || "—"}
                    </p>
                  </div>
                </div>
              </div>
            </SectionCard>
          </div>

          <div className="space-y-6">
            {/* Account details */}
            <SectionCard icon={<IdCard size={16} />} title="Account Details">
              <dl className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                <DetailRow label="Identifier" value={client?.identifier || "—"} />
                <DetailRow label="Role" value={client?.role || "Client"} />
                <DetailRow label="Status" value={statusLabel} />
                <DetailRow label="Tenant reference" value={client?.tenant?.identifier || "—"} />
              </dl>
            </SectionCard>

            {/* Activity timeline */}
            <SectionCard icon={<CalendarClock size={16} />} title="Activity Timeline">
              <dl className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                <DetailRow label="Created" value={formatDateTime(client?.created_at)} />
                <DetailRow label="Updated" value={formatDateTime(client?.updated_at)} />
              </dl>
            </SectionCard>
          </div>
        </div>
      </div>

      {isEditClientModalOpen && (
        <EditClientModal
          client={selectedClient}
          onClose={closeEditClientModal}
          onClientUpdated={closeEditClientModal}
        />
      )}
      <DeleteClientModal
        isOpen={isDeleteClientModalOpen}
        onClose={closeDeleteClientModal}
        client={selectedClient}
        onDeleteConfirm={closeDeleteClientModal}
      />
    </>
  );
};

const SectionCard = ({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) => (
  <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
    <div className="mb-4 flex items-center gap-2">
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
        style={{ background: "var(--theme-color-10)", color: accent }}
      >
        {icon}
      </span>
      <h3 className="truncate text-sm font-semibold text-gray-900 dark:text-white">{title}</h3>
    </div>
    {children}
  </div>
);

const DetailRow = ({ label, value }: { label: string; value: string }) => (
  <div className="min-w-0">
    <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
      {label}
    </dt>
    <dd className="mt-0.5 break-all text-sm font-medium text-gray-900 dark:text-white">{value}</dd>
  </div>
);

export default OverviewClient;
