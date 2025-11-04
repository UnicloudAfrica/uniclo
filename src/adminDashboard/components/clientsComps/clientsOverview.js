import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarClock, SquarePen, Trash2 } from "lucide-react";
import { EditClientModal } from "../../pages/clientComps/editClient";
import DeleteClientModal from "../../pages/clientComps/deleteClient";
import ModernButton from "../ModernButton";
import StatusPill from "../StatusPill";
import IconBadge from "../IconBadge";

const encodeId = (id) => encodeURIComponent(btoa(id));

const OverviewClient = ({ client }) => {
  const navigate = useNavigate();
  const [isEditClientModalOpen, setIsEditClientModalOpen] = useState(false);
  const [isDeleteClientModalOpen, setIsDeleteClientModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);

  const statusLabel = client?.verified === 1 ? "Active client" : "Pending activation";
  const statusTone = client?.verified === 1 ? "success" : "warning";

  const fullName = useMemo(
    () =>
      [client?.first_name, client?.middle_name, client?.last_name]
        .filter(Boolean)
        .join(" ")
        .trim(),
    [client]
  );

  const addressLine = useMemo(() => {
    const parts = [client?.address, client?.city, client?.state, client?.country]
      .filter(Boolean)
      .join(", ");
    return parts || "Address not supplied";
  }, [client]);

  const handleViewTenantDetails = (tenantIdentifier, tenantName) => {
    if (!tenantIdentifier) return;
    const encodedTenantId = encodeId(tenantIdentifier);
    const encodedTenantName = encodeURIComponent(tenantName || "");
    navigate(
      `/admin-dashboard/partners/details?id=${encodedTenantId}&name=${encodedTenantName}`
    );
  };

  const formatDateTime = (value) =>
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
      iconKey: "contact.email",
      tone: "primary",
      type: "mailto",
    },
    {
      label: "Phone number",
      value: client?.phone || "Not provided",
      iconKey: "contact.phone",
      tone: "indigo",
    },
    {
      label: "Tenant",
      value: client?.tenant?.name || "Not assigned",
      iconKey: "business.companyType",
      tone: "slate",
      action: client?.tenant?.identifier
        ? () =>
            handleViewTenantDetails(
              client.tenant.identifier,
              client.tenant.name
            )
        : null,
    },
  ];

  const openEditClientModal = (clientData) => {
    setSelectedClient(clientData);
    setIsEditClientModalOpen(true);
  };

  const closeEditClientModal = () => {
    setIsEditClientModalOpen(false);
    setSelectedClient(null);
  };

  const openDeleteClientModal = (clientData) => {
    setSelectedClient(clientData);
    setIsDeleteClientModalOpen(true);
  };

  const closeDeleteClientModal = () => {
    setIsDeleteClientModalOpen(false);
    setSelectedClient(null);
  };

  if (!client) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50/70 p-10 text-center text-sm text-slate-500">
        No client data available.
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="rounded-3xl border border-[#EAECF0] bg-gradient-to-br from-white via-[#F5F8FB] to-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Client Profile
              </p>
              <h2 className="mt-1 text-2xl font-semibold text-slate-900">
                {fullName || client.email || "Client record"}
              </h2>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <StatusPill label={statusLabel} tone={statusTone} />
                <StatusPill
                  label={`Client ID ${client.identifier || "—"}`}
                  tone="neutral"
                />
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

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <InfoStat label="Account status" value={statusLabel} />
            <InfoStat label="Tenant" value={client?.tenant?.name || "Not assigned"} />
            <InfoStat label="Created" value={formatDateTime(client?.created_at)} />
            <InfoStat label="Updated" value={formatDateTime(client?.updated_at)} />
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[320px,1fr]">
          <div className="space-y-6">
            <div className="rounded-3xl border border-[#EAECF0] bg-white p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-900">
                Contact Details
              </h3>
              <ul className="mt-4 space-y-3">
                {contactItems.map(({ label, value, iconKey, tone, type, action }) => (
                  <li key={label} className="flex items-start gap-3 text-sm">
                    <IconBadge iconKey={iconKey} tone={tone} size="sm" className="mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        {label}
                      </p>
                      {type === "mailto" && value && value !== "Not provided" ? (
                        <a
                          href={`mailto:${value}`}
                          className="text-sm font-semibold text-[#288DD1] hover:underline"
                        >
                          {value}
                        </a>
                      ) : action ? (
                        <button
                          type="button"
                          onClick={action}
                          className="text-sm font-semibold text-[#288DD1] hover:underline"
                        >
                          {value}
                        </button>
                      ) : (
                        <p className="text-sm font-semibold text-slate-800">
                          {value}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-3xl border border-[#EAECF0] bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2">
                <IconBadge
                  iconKey="business.registeredAddress"
                  tone="slate"
                  size="sm"
                />
                <h3 className="text-sm font-semibold text-slate-900">
                  Address & Location
                </h3>
              </div>
              <dl className="mt-4 space-y-4">
                <div className="rounded-2xl border border-[#EEF2F6] bg-[#F9FAFB] p-3 text-sm text-slate-800">
                  {addressLine}
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs text-slate-600">
                  <div>
                    <p className="font-semibold uppercase tracking-wide">
                      Zip / Postal
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-800">
                      {client?.zip || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold uppercase tracking-wide">
                      Country
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-800">
                      {client?.country || "—"}
                    </p>
                  </div>
                </div>
              </dl>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-[#EAECF0] bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2">
                <IconBadge iconKey="contact.accountId" tone="primary" size="sm" />
                <h3 className="text-sm font-semibold text-slate-900">
                  Account Details
                </h3>
              </div>
              <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                <DetailRow label="Identifier" value={client?.identifier || "—"} />
                <DetailRow label="Role" value={client?.role || "Client"} />
                <DetailRow label="Status" value={statusLabel} />
                <DetailRow
                  label="Tenant reference"
                  value={client?.tenant?.identifier || "—"}
                />
              </dl>
            </div>

            <div className="rounded-3xl border border-[#EAECF0] bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2">
                <CalendarClock className="h-5 w-5 text-[#288DD1]" />
                <h3 className="text-sm font-semibold text-slate-900">
                  Activity Timeline
                </h3>
              </div>
              <dl className="mt-4 space-y-3 text-sm">
                <TimelineRow label="Created" value={formatDateTime(client?.created_at)} />
                <TimelineRow label="Updated" value={formatDateTime(client?.updated_at)} />
              </dl>
            </div>
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

const InfoStat = ({ label, value }) => (
  <div className="rounded-2xl border border-[#EEF2F6] bg-white p-4 shadow-sm">
    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
      {label}
    </p>
    <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
  </div>
);

const DetailRow = ({ label, value }) => (
  <div>
    <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
      {label}
    </dt>
    <dd className="mt-1 text-sm font-semibold text-slate-800">{value}</dd>
  </div>
);

const TimelineRow = ({ label, value }) => (
  <div className="flex items-center justify-between rounded-2xl border border-[#EEF2F6] bg-[#F9FAFB] px-4 py-3">
    <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
      {label}
    </dt>
    <dd className="text-sm font-semibold text-slate-800">{value}</dd>
  </div>
);

export default OverviewClient;
