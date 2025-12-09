// @ts-nocheck
import React, { useState, useEffect, useMemo } from "react";
import { Plus, RefreshCw, Sparkles, Globe, Server, Monitor, MoreHorizontal } from "lucide-react";

import Headbar from "../components/clientHeadbar";
import Sidebar from "../components/clientSidebar";
import ClientActiveTab from "../components/clientActiveTab";
import ClientPageShell from "../components/ClientPageShell";
import EmbeddedConsole, { useConsoleManager } from "../../components/Console/EmbeddedConsole";
import ToastUtils from "../../utils/toastUtil";
import { useFetchClientPurchasedInstances } from "../../hooks/clientHooks/instanceHooks";
import { ModernCard, ModernButton, ModernTable, StatusPill } from "../../shared/components/ui";
import { Column } from "../../shared/components/ui/ModernTable";

// Removed legacy imports
// import InstanceRow from "../components/InstanceRow";
// import InstanceStats from "../components/InstanceStats";
import InstanceStats from "../components/InstanceStats"; // Keeping stats for now

interface Instance {
  id: string | number;
  identifier: string;
  name: string;
  status: string;
  created_at: string;
  floating_ip?: { ip_address?: string };
  private_ip?: string;
  region?: string;
  size?: string;
  image?: string;
  [key: string]: any;
}

const ClientInstances: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const {
    isFetching: isInstancesFetching,
    data: instancesResponse,
    refetch,
  } = useFetchClientPurchasedInstances();

  const emptyInstances = useMemo<Instance[]>(() => [], []);
  const instances: Instance[] = instancesResponse?.data || emptyInstances;

  /* 
       We can leverage ModernTable's internal state for basic filtering/sorting 
       or control it. For simplicity and consistency with other refactors, 
       we'll let ModernTable handle client-side sorting/filtering 
       but we need to format the data for it.
    */

  const { consoles, openConsole, closeConsole } = useConsoleManager();

  const toggleMobileMenu = () => setIsMobileMenuOpen((prev) => !prev);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const provisioningCount = instances.filter((instance: any) =>
    ["provisioning", "building", "reboot", "hard_reboot"].includes(
      (instance.status || "").toLowerCase()
    )
  ).length;

  const navigateToInstanceDetails = (instance: Instance) => {
    if (!instance?.identifier) {
      ToastUtils.error("Instance identifier missing.");
      return;
    }
    const encodedId = encodeURIComponent(btoa(instance.identifier));
    const instanceName = encodeURIComponent(
      instance.name || `Instance-${instance.identifier.slice(-8)}`
    );
    window.location.href = `/client-dashboard/instances/details?id=${encodedId}&name=${instanceName}`;
  };

  const handleConsoleAccess = (instanceId: string | number) => {
    openConsole(instanceId);
  };

  const columns: Column<Instance>[] = useMemo(
    () => [
      {
        key: "name",
        header: "Instance",
        render: (name: string, row) => (
          <div className="flex flex-col">
            <span
              className="font-medium text-primary-600 hover:text-primary-700 cursor-pointer"
              onClick={() => navigateToInstanceDetails(row)}
            >
              {name || row.identifier}
            </span>
            <span className="text-xs text-slate-500">{row.identifier}</span>
          </div>
        ),
        sortable: true,
      },
      {
        key: "status",
        header: "Status",
        render: (status: string) => <StatusPill status={status} />,
        sortable: true,
      },
      {
        key: "ip_address",
        header: "IP Address",
        render: (_, row) => (
          <div className="flex flex-col gap-1 text-sm">
            {row.floating_ip?.ip_address && (
              <div className="flex items-center gap-1.5 text-slate-700">
                <Globe size={12} className="text-slate-400" />
                {row.floating_ip.ip_address}
              </div>
            )}
            {row.private_ip && (
              <div className="flex items-center gap-1.5 text-slate-500">
                <Server size={12} className="text-slate-400" />
                {row.private_ip}
              </div>
            )}
            {!row.floating_ip?.ip_address && !row.private_ip && (
              <span className="text-slate-400 italic">No IP assigned</span>
            )}
          </div>
        ),
      },
      {
        key: "created_at",
        header: "Created",
        render: (date: string) => (
          <span className="text-slate-600">{new Date(date).toLocaleDateString()}</span>
        ),
        sortable: true,
      },
      {
        key: "actions",
        header: "Actions",
        render: (_, row) => (
          <div className="flex items-center gap-2">
            {row.status === "active" && (
              <ModernButton
                variant="ghost"
                size="xs"
                onClick={(e) => {
                  e.stopPropagation();
                  handleConsoleAccess(row.id);
                }}
                title="Open Console"
              >
                <Monitor size={14} className="text-slate-500 hover:text-primary-600" />
              </ModernButton>
            )}
            <ModernButton
              variant="ghost"
              size="xs"
              onClick={(e) => {
                e.stopPropagation();
                navigateToInstanceDetails(row);
              }}
            >
              <span className="text-xs font-medium text-slate-600 hover:text-primary-600">
                Manage
              </span>
            </ModernButton>
          </div>
        ),
      },
    ],
    []
  );

  const headerActions = (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <ModernButton
        variant="ghost"
        size="sm"
        onClick={() => refetch()}
        isDisabled={isInstancesFetching}
        leftIcon={<RefreshCw className={`h-4 w-4 ${isInstancesFetching ? "animate-spin" : ""}`} />}
      >
        Refresh
      </ModernButton>
      <ModernButton
        variant="primary"
        size="sm"
        onClick={() => (window.location.href = "/client-dashboard/create-instance")}
        leftIcon={<Plus className="h-4 w-4" />}
      >
        New Instance
      </ModernButton>
    </div>
  );

  return (
    <>
      <Headbar onMenuClick={toggleMobileMenu} />
      <Sidebar isMobileMenuOpen={isMobileMenuOpen} onCloseMobileMenu={closeMobileMenu} />
      <ClientActiveTab />

      <ClientPageShell
        title="Instance Management"
        description="Manage and monitor your cloud instances."
        actions={headerActions}
        contentClassName="space-y-6 lg:space-y-8"
        breadcrumbs={[{ label: "Home", href: "/client-dashboard" }, { label: "Instances" }]}
      >
        <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-[#0F172A] via-[#1E3A8A] to-[#1D4ED8] text-white shadow-2xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.16),_transparent_55%)]" />
          <div className="relative flex flex-col gap-8 p-6 sm:p-8 lg:flex-row lg:items-center lg:justify-between lg:p-10">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-white/70">
                <Sparkles size={14} />
                Fleet Control
              </div>
              <div className="space-y-2">
                <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                  Orchestrate every workload with confidence
                </h2>
                <p className="max-w-2xl text-sm text-white/80 sm:text-base">
                  Stay responsive with live health indicators, instant lifecycle actions, and deep
                  visibility into utilisation across your entire compute fleet.
                </p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              <div className="rounded-2xl border border-white/40 bg-white/15 px-4 py-3 backdrop-blur">
                <p className="text-xs font-semibold uppercase tracking-wide text-white/70">
                  Live consoles
                </p>
                <p className="mt-2 text-lg font-semibold text-white">
                  {consoles.length
                    ? `${consoles.length} session${consoles.length === 1 ? "" : "s"} active`
                    : "Ready for on-demand access"}
                </p>
              </div>
              <div className="rounded-2xl border border-white/40 bg-white/15 px-4 py-3 backdrop-blur">
                <p className="text-xs font-semibold uppercase tracking-wide text-white/70">
                  Provisioning Pulse
                </p>
                <p className="mt-2 text-lg font-semibold text-white">
                  {provisioningCount ? `${provisioningCount} in flight` : "No builds running"}
                </p>
              </div>
            </div>
          </div>
        </div>

        <InstanceStats instances={instances} />

        <ModernCard padding="none" className="overflow-hidden">
          <ModernTable
            data={instances}
            columns={columns}
            title="Your Instances"
            loading={isInstancesFetching}
            searchable={true}
            searchPlaceholder="Search instances..."
            searchKeys={["name", "identifier", "status", "private_ip", "floating_ip.ip_address"]}
            filterable={true}
            sortable={true}
            paginated={true}
            pageSize={10}
            emptyMessage={
              <div className="flex flex-col items-center justify-center p-8 text-center text-slate-500">
                <Server className="mb-4 h-12 w-12 opacity-20" />
                <p className="text-lg font-medium text-slate-900">No instances found</p>
                <p className="max-w-xs text-sm">
                  Deploy a new instance to get started with your cloud infrastructure.
                </p>
                <ModernButton
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => (window.location.href = "/client-dashboard/create-instance")}
                >
                  Launch Instance
                </ModernButton>
              </div>
            }
          />
        </ModernCard>
      </ClientPageShell>

      {/* Console Overlay */}
      {consoles.map((consoleId: any) => (
        <EmbeddedConsole
          key={consoleId}
          instanceId={consoleId}
          isVisible={true}
          onClose={() => closeConsole(consoleId)}
        />
      ))}
    </>
  );
};

export default ClientInstances;
