import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Building2,
  Loader2,
  Plus,
  ShieldCheck,
  Users,
  Users2,
} from "lucide-react";
import TenantPageShell from "../components/TenantPageShell";
import ModernCard from "../../adminDashboard/components/ModernCard";
import ModernStatsCard from "../../adminDashboard/components/ModernStatsCard";
import ModernButton from "../../adminDashboard/components/ModernButton";
import ModernInput from "../../adminDashboard/components/ModernInput";
import { useFetchTenantPartners } from "../../hooks/tenantHooks/partnerHooks";
import { useFetchClients } from "../../hooks/clientHooks";
import { useFetchTenantAdmins } from "../../hooks/adminUserHooks";
import ToastUtils from "../../utils/toastUtil";

const TABS = [
  { key: "partners", label: "Partners" },
  { key: "clients", label: "Clients" },
  { key: "users", label: "Tenant Users" },
];

const TableShell = ({
  isLoading,
  columns,
  data,
  emptyMessage = "No records found.",
  onRowClick,
  renderActions,
}) => {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
        <p className="text-sm text-slate-500">Loading records…</p>
      </div>
    );
  }

  if (!data?.length) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20">
        <Users className="h-8 w-8 text-slate-400" />
        <p className="text-sm text-slate-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-100">
        <thead className="bg-slate-50">
          <tr>
            {columns.map((column) => (
              <th
                key={column.accessor}
                className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
              >
                {column.header}
              </th>
            ))}
            {renderActions ? (
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Actions
              </th>
            ) : null}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white text-sm text-slate-600">
          {data.map((row) => (
            <tr
              key={row.id || row.identifier}
              onClick={() => onRowClick?.(row)}
              className={onRowClick ? "cursor-pointer hover:bg-slate-50" : ""}
            >
              {columns.map((column) => (
                <td key={column.accessor} className="px-4 py-3 align-middle">
                  {column.render
                    ? column.render(row[column.accessor], row)
                    : row[column.accessor] ?? "—"}
                </td>
              ))}
              {renderActions ? (
                <td
                  className="px-4 py-3 align-middle"
                  onClick={(event) => event.stopPropagation()}
                >
                  {renderActions(row)}
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default function PartnersAndClientsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryTab = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const value = params.get("tab");
    return TABS.some((tab) => tab.key === value) ? value : "partners";
  }, [location.search]);
  const [activeTab, setActiveTab] = useState(queryTab);
  useEffect(() => {
    setActiveTab(queryTab);
  }, [queryTab]);
  const [partnerSearch, setPartnerSearch] = useState("");
  const [clientSearch, setClientSearch] = useState("");

  const {
    data: partners = [],
    isFetching: isPartnersFetching,
  } = useFetchTenantPartners();
  const {
    data: clients = [],
    isFetching: isClientsFetching,
  } = useFetchClients();
  const {
    data: tenantUsers = [],
    isFetching: isTenantUsersFetching,
  } = useFetchTenantAdmins();

  const filteredPartners = useMemo(() => {
    if (!partnerSearch) return partners;
    const term = partnerSearch.toLowerCase();
    return partners.filter((partner) =>
      (partner?.name ?? "")
        .toString()
        .toLowerCase()
        .includes(term)
    );
  }, [partnerSearch, partners]);

  const filteredClients = useMemo(() => {
    if (!clientSearch) return clients;
    const term = clientSearch.toLowerCase();
    return clients.filter((client) =>
      [client?.name, client?.email]
        .filter(Boolean)
        .some((value) =>
          value
            .toString()
            .toLowerCase()
            .includes(term)
        )
    );
  }, [clientSearch, clients]);

  const partnerStats = useMemo(() => {
    const totalPartners = partners.length;
    const verifiedPartners = partners.filter((partner) => partner.verified)
      .length;
    const totalPartnerClients = partners.reduce(
      (acc, partner) => acc + (partner.statistics?.clients ?? 0),
      0
    );

    return [
      {
        key: "total-partners",
        title: "Total Partners",
        value: totalPartners.toLocaleString(),
        description: "Partners linked to your workspace",
        icon: <Building2 className="h-5 w-5" />,
        color: "primary",
      },
      {
        key: "verified-partners",
        title: "Verified Partners",
        value: verifiedPartners.toLocaleString(),
        description: `${verifiedPartners}/${totalPartners} verified`,
        icon: <ShieldCheck className="h-5 w-5" />,
        color: "success",
      },
      {
        key: "partner-clients",
        title: "Clients managed by partners",
        value: totalPartnerClients.toLocaleString(),
        description: "Across all partner workspaces",
        icon: <Users2 className="h-5 w-5" />,
        color: "info",
      },
    ];
  }, [partners]);

  const clientStats = useMemo(() => {
    const totalClients = clients.length;
    return [
      {
        key: "total-clients",
        title: "Total Clients",
        value: totalClients.toLocaleString(),
        description: "Direct clients under this tenant",
        icon: <Users className="h-5 w-5" />,
        color: "primary",
      },
    ];
  }, [clients]);

  const tenantUserStats = useMemo(() => {
    const totalUsers = tenantUsers.length;
    return [
      {
        key: "tenant-users",
        title: "Tenant Users",
        value: totalUsers.toLocaleString(),
        description: "Administrators with access to this workspace",
        icon: <Users2 className="h-5 w-5" />,
        color: "primary",
      },
    ];
  }, [tenantUsers]);

  const handlePartnerRowClick = (partner) => {
    if (!partner?.identifier) {
      ToastUtils.error("Unable to open partner – missing identifier");
      return;
    }
    navigate(`/dashboard/partners/${partner.identifier}`);
  };

  const handleClientRowClick = (client) => {
    if (!client?.identifier) {
      ToastUtils.error("Unable to open client – missing identifier");
      return;
    }
    navigate(`/dashboard/clients/${client.identifier}`);
  };

  const handleTenantUserRowClick = (user) => {
    if (!user?.identifier) {
      ToastUtils.error("Unable to open user – missing identifier");
      return;
    }
    navigate(`/dashboard/tenant-users/${user.identifier}`);
  };

  const selectTab = (tabKey) => {
    if (tabKey === activeTab) {
      return;
    }
    const params = new URLSearchParams(location.search);
    params.set("tab", tabKey);
    navigate({ pathname: "/dashboard/clients", search: params.toString() }, { replace: true });
    setActiveTab(tabKey);
  };

  const renderHeaderActions = () => {
    if (activeTab === "partners") {
      return (
        <ModernButton
          variant="primary"
          onClick={() => navigate("/dashboard/partners/new")}
          leftIcon={<Plus className="h-4 w-4" />}
        >
          New Partner
        </ModernButton>
      );
    }
    if (activeTab === "clients") {
      return (
        <ModernButton
          variant="primary"
          onClick={() => navigate("/dashboard/clients/new")}
          leftIcon={<Plus className="h-4 w-4" />}
        >
          New Client
        </ModernButton>
      );
    }
    return (
      <ModernButton
        variant="primary"
        onClick={() => navigate("/dashboard/tenant-users/new")}
        leftIcon={<Plus className="h-4 w-4" />}
      >
        Invite User
      </ModernButton>
    );
  };

  const partnerColumns = [
    { header: "Partner Name", accessor: "name" },
    {
      header: "Primary Contact",
      accessor: "primary_contact",
      render: (value) => value?.name ?? "—",
    },
    {
      header: "Email",
      accessor: "primary_contact",
      render: (value) => value?.email ?? "—",
    },
    {
      header: "Status",
      accessor: "verified",
      render: (value) => (
        <span
          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
            value
              ? "bg-emerald-100 text-emerald-700"
              : "bg-amber-100 text-amber-700"
          }`}
        >
          {value ? "Verified" : "Pending"}
        </span>
      ),
    },
    {
      header: "Clients",
      accessor: "statistics",
      render: (value) => value?.clients ?? 0,
    },
  ];

  const clientColumns = [
    { header: "Client Name", accessor: "name" },
    { header: "Email Address", accessor: "email" },
    { header: "Phone Number", accessor: "phone" },
  ];

  const tenantUserColumns = [
    {
      header: "Name",
      accessor: "full_name",
      render: (_, row) =>
        [row?.first_name, row?.last_name].filter(Boolean).join(" ") ||
        row?.email ||
        "—",
    },
    { header: "Email", accessor: "email" },
    { header: "Phone", accessor: "phone" },
  ];

  const renderActiveView = () => {
    switch (activeTab) {
      case "partners":
        return (
          <>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {partnerStats.map((stat) => (
                <ModernStatsCard key={stat.key} {...stat} />
              ))}
            </div>
            <ModernCard padding="lg" className="space-y-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">
                    Partner directory
                  </h3>
                  <p className="text-sm text-slate-500">
                    Monitor partner workspaces, contacts, and linked clients.
                  </p>
                </div>
                <div className="w-full max-w-xs">
                  <ModernInput
                    value={partnerSearch}
                    onChange={(event) => setPartnerSearch(event.target.value)}
                    placeholder="Search partners…"
                  />
                </div>
              </div>
              <TableShell
                isLoading={isPartnersFetching}
                columns={partnerColumns}
                data={filteredPartners}
                emptyMessage="No partners yet. Create your first partner to begin collaborating."
                onRowClick={handlePartnerRowClick}
                renderActions={(row) => (
                  <ModernButton
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      navigate(`/dashboard/partners/${row.identifier}`)
                    }
                  >
                    View
                  </ModernButton>
                )}
              />
            </ModernCard>
          </>
        );
      case "clients":
        return (
          <>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {clientStats.map((stat) => (
                <ModernStatsCard key={stat.key} {...stat} />
              ))}
            </div>
            <ModernCard padding="lg" className="space-y-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">
                    Client accounts
                  </h3>
                  <p className="text-sm text-slate-500">
                    Manage customer access, contact information, and lifecycle
                    status.
                  </p>
                </div>
                <div className="w-full max-w-xs">
                  <ModernInput
                    value={clientSearch}
                    onChange={(event) => setClientSearch(event.target.value)}
                    placeholder="Search clients…"
                  />
                </div>
              </div>
              <TableShell
                isLoading={isClientsFetching}
                columns={clientColumns}
                data={filteredClients}
                emptyMessage="No clients yet. Create one to start provisioning workloads."
                onRowClick={handleClientRowClick}
                renderActions={(row) => (
                  <ModernButton
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      navigate(`/dashboard/clients/${row.identifier}`)
                    }
                  >
                    View
                  </ModernButton>
                )}
              />
            </ModernCard>
          </>
        );
      default:
        return (
          <>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {tenantUserStats.map((stat) => (
                <ModernStatsCard key={stat.key} {...stat} />
              ))}
            </div>
            <ModernCard padding="lg" className="space-y-6">
              <div className="flex flex-col gap-2">
                <h3 className="text-lg font-semibold text-slate-900">
                  Tenant user directory
                </h3>
                <p className="text-sm text-slate-500">
                  Invite team members to administer this tenant. Manage roles,
                  invites, and access.
                </p>
              </div>
              <TableShell
                isLoading={isTenantUsersFetching}
                columns={tenantUserColumns}
                data={tenantUsers}
                emptyMessage="No tenant users yet. Invite your team to collaborate."
                onRowClick={handleTenantUserRowClick}
                renderActions={(row) => (
                  <ModernButton
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      navigate(`/dashboard/tenant-users/${row.identifier}`)
                    }
                  >
                    View
                  </ModernButton>
                )}
              />
            </ModernCard>
          </>
        );
    }
  };

  return (
    <TenantPageShell
      title="Partners & Clients"
      description="Collaborate with partner workspaces, manage customers, and control internal access."
      actions={renderHeaderActions()}
      contentClassName="space-y-6 lg:space-y-8"
    >
      <ModernCard padding="lg" className="flex flex-wrap gap-3">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => selectTab(tab.key)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              activeTab === tab.key
                ? "bg-primary-500 text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </ModernCard>
      {renderActiveView()}
    </TenantPageShell>
  );
}
