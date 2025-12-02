import React, { useState, useEffect, useMemo } from "react";
import {
  Plus,
  Search,
  RefreshCw,
  Sparkles,
  ChevronDown,
} from "lucide-react";

import Headbar from "../components/clientHeadbar";
import Sidebar from "../components/clientSidebar";
import ClientActiveTab from "../components/clientActiveTab";
import ClientPageShell from "../components/ClientPageShell";
import EmbeddedConsole, {
  useConsoleManager,
} from "../../components/Console/EmbeddedConsole";
import ToastUtils from "../../utils/toastUtil";
import { useFetchClientPurchasedInstances } from "../../hooks/clientHooks/instanceHooks";
import ModernCard from "../../components/modern/ModernCard";
import ModernButton from "../../components/modern/ModernButton";
import ModernInput from "../../components/modern/ModernInput";

import InstanceRow from "../components/InstanceRow";
import InstanceStats from "../components/InstanceStats";

export default function ClientInstances() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const {
    isFetching: isInstancesFetching,
    data: instancesResponse,
    refetch,
  } = useFetchClientPurchasedInstances();

  const emptyInstances = useMemo(() => [], []);
  const instances = instancesResponse?.data || emptyInstances;

  const [filteredInstances, setFilteredInstances] = useState([]);
  const [selectedInstances, setSelectedInstances] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState("desc");

  useEffect(() => {
    let filtered = [...instances];

    if (searchTerm) {
      filtered = filtered.filter(
        (instance) =>
          (instance.name &&
            instance.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (instance.identifier &&
            instance.identifier.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (instance.floating_ip?.ip_address &&
            instance.floating_ip.ip_address.includes(searchTerm)) ||
          (instance.private_ip && instance.private_ip.includes(searchTerm))
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((instance) => instance.status === statusFilter);
    }

    filtered.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      if (sortBy === "created_at") {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }

      if (typeof aValue === "string") {
        aValue = aValue.toLowerCase();
        bValue = bValue?.toLowerCase() || "";
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      }
      return aValue < bValue ? 1 : -1;
    });

    setFilteredInstances(filtered);
  }, [instances, searchTerm, statusFilter, sortBy, sortOrder]);

  const { consoles, openConsole, closeConsole } = useConsoleManager();

  const handleInstanceSelect = (instanceId) => {
    const updated = new Set(selectedInstances);
    if (updated.has(instanceId)) {
      updated.delete(instanceId);
    } else {
      updated.add(instanceId);
    }
    setSelectedInstances(updated);
  };

  const handleSelectAll = () => {
    if (selectedInstances.size === filteredInstances.length) {
      setSelectedInstances(new Set());
    } else {
      setSelectedInstances(new Set(filteredInstances.map((instance) => instance.id)));
    }
  };

  const executeInstanceAction = async (instanceId, action) => {
    ToastUtils.warning(
      `Instance actions (${action}) have been removed. Please use the instance details page for basic operations.`
    );
  };

  const executeBulkAction = async (action) => {
    if (selectedInstances.size === 0) {
      ToastUtils.warning("Please select instances first");
      return;
    }

    ToastUtils.warning(
      `Bulk actions (${action}) have been removed. Please manage instances individually.`
    );
    setSelectedInstances(new Set());
  };

  const navigateToInstanceDetails = (instance) => {
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

  const handleConsoleAccess = (instanceId) => {
    openConsole(instanceId);
  };

  const toggleMobileMenu = () => setIsMobileMenuOpen((prev) => !prev);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const uniqueStatuses = [...new Set(instances.map((instance) => instance.status))].filter(
    Boolean
  );

  const provisioningCount = instances.filter((instance) =>
    ["provisioning", "building", "reboot", "hard_reboot"].includes(
      (instance.status || "").toLowerCase()
    )
  ).length;

  const actionLoading = useMemo(() => ({}), []);

  const selectedInstanceList = filteredInstances.filter((instance) =>
    selectedInstances.has(instance.id)
  );

  const headerActions = (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <ModernButton
        variant="ghost"
        size="sm"
        onClick={() => refetch()}
        isDisabled={isInstancesFetching}
        leftIcon={
          <RefreshCw
            className={`h-4 w-4 ${isInstancesFetching ? "animate-spin" : ""}`}
          />
        }
      >
        Refresh
      </ModernButton>
      <ModernButton
        variant="primary"
        size="sm"
        onClick={() =>
          (window.location.href = "/client-dashboard/multi-instance-creation")
        }
        leftIcon={<Plus className="h-4 w-4" />}
      >
        New Instance
      </ModernButton>
    </div>
  );

  return (
    <>
      <Headbar onMenuClick={toggleMobileMenu} />
      <Sidebar
        isMobileMenuOpen={isMobileMenuOpen}
        onCloseMobileMenu={closeMobileMenu}
      />
      <ClientActiveTab />

      <ClientPageShell
        title="Instance Management"
        description="Manage and monitor your cloud instances."
        actions={headerActions}
        contentClassName="space-y-6 lg:space-y-8"
        breadcrumbs={[
          { label: "Home", href: "/client-dashboard" },
          { label: "Instances" },
        ]}
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
                  Stay responsive with live health indicators, instant lifecycle actions, and deep visibility
                  into utilisation across your entire compute fleet.
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
                    ? `${consoles.length} session${consoles.length === 1 ? "" : "s"
                    } active`
                    : "Ready for on-demand access"}
                </p>
              </div>
              <div className="rounded-2xl border border-white/40 bg-white/15 px-4 py-3 backdrop-blur">
                <p className="text-xs font-semibold uppercase tracking-wide text-white/70">
                  Provisioning Pulse
                </p>
                <p className="mt-2 text-lg font-semibold text-white">
                  {provisioningCount
                    ? `${provisioningCount} in flight`
                    : "No builds running"}
                </p>
              </div>
            </div>
          </div>
        </div>

        <InstanceStats instances={instances} />

        <div className="grid gap-6 2xl:grid-cols-[minmax(0,1fr)_minmax(280px,340px)] 2xl:items-start">
          <ModernCard padding="lg" className="space-y-6">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
              <div className="w-full max-w-xl">
                <ModernInput
                  label="Search fleet"
                  placeholder="Search by name, identifier, or IP"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  icon={<Search className="h-4 w-4" />}
                />
              </div>
              <div className="flex flex-wrap items-end gap-3">
                <div>
                  <label className="mb-2 block text-xs font-medium text-slate-500">
                    Status
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value)}
                    className="w-40 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
                  >
                    <option value="all">All</option>
                    {uniqueStatuses.map((status) => (
                      <option key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-xs font-medium text-slate-500">
                    Sort by
                  </label>
                  <select
                    value={sortBy}
                    onChange={(event) => setSortBy(event.target.value)}
                    className="w-36 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
                  >
                    <option value="created_at">Created date</option>
                    <option value="name">Name</option>
                    <option value="status">Status</option>
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-xs font-medium text-slate-500">
                    Direction
                  </label>
                  <select
                    value={sortOrder}
                    onChange={(event) => setSortOrder(event.target.value)}
                    className="w-32 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
                  >
                    <option value="desc">Newest first</option>
                    <option value="asc">Oldest first</option>
                  </select>
                </div>
                <ModernButton
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchTerm("");
                    setStatusFilter("all");
                    setSortBy("created_at");
                    setSortOrder("desc");
                  }}
                  className="mb-0.5"
                >
                  Reset
                </ModernButton>
              </div>
            </div>

            {selectedInstances.size > 0 && (
              <div className="flex items-center justify-between rounded-xl border border-primary-100 bg-primary-50 px-4 py-3 text-primary-900">
                <span className="text-sm font-medium">
                  {selectedInstances.size} instance
                  {selectedInstances.size === 1 ? "" : "s"} selected
                </span>
                <div className="flex items-center gap-2">
                  <ModernButton
                    variant="white"
                    size="xs"
                    onClick={() => executeBulkAction("start")}
                    className="text-primary-700"
                  >
                    Start
                  </ModernButton>
                  <ModernButton
                    variant="white"
                    size="xs"
                    onClick={() => executeBulkAction("stop")}
                    className="text-primary-700"
                  >
                    Stop
                  </ModernButton>
                  <ModernButton
                    variant="white"
                    size="xs"
                    onClick={() => executeBulkAction("reboot")}
                    className="text-primary-700"
                  >
                    Reboot
                  </ModernButton>
                  <div className="mx-1 h-4 w-px bg-primary-200" />
                  <ModernButton
                    variant="ghost"
                    size="xs"
                    onClick={() => setSelectedInstances(new Set())}
                    className="text-primary-700 hover:bg-primary-100"
                  >
                    Clear
                  </ModernButton>
                </div>
              </div>
            )}

            <div className="overflow-hidden rounded-2xl border border-slate-200">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1000px]">
                  <thead>
                    <tr className="bg-slate-50/50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      <th className="w-12 px-5 py-4">
                        <button
                          onClick={handleSelectAll}
                          className="text-slate-300 transition hover:text-primary-500"
                        >
                          <ChevronDown className="h-4 w-4" />
                        </button>
                      </th>
                      <th className="w-8 px-3 py-4"></th>
                      <th className="px-5 py-4">Instance</th>
                      <th className="px-5 py-4">Status</th>
                      <th className="px-5 py-4">Compute</th>
                      <th className="px-5 py-4">Specs</th>
                      <th className="px-5 py-4">IP Address</th>
                      <th className="px-5 py-4">Created</th>
                      <th className="px-5 py-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {isInstancesFetching ? (
                      <tr>
                        <td colSpan="9" className="px-5 py-12 text-center">
                          <div className="flex flex-col items-center justify-center">
                            <RefreshCw className="mb-4 h-8 w-8 animate-spin text-primary-500" />
                            <p className="text-sm font-medium text-slate-600">
                              Loading instances...
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : filteredInstances.length === 0 ? (
                      <tr>
                        <td colSpan="9" className="px-5 py-12 text-center">
                          <div className="flex flex-col items-center justify-center">
                            <div className="mb-4 rounded-full bg-slate-100 p-3">
                              <Search className="h-6 w-6 text-slate-400" />
                            </div>
                            <p className="text-sm font-medium text-slate-900">
                              No instances found
                            </p>
                            <p className="mt-1 text-sm text-slate-500">
                              Try adjusting your filters or create a new instance.
                            </p>
                            <ModernButton
                              variant="outline"
                              size="sm"
                              className="mt-4"
                              onClick={() => {
                                setSearchTerm("");
                                setStatusFilter("all");
                              }}
                            >
                              Clear Filters
                            </ModernButton>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredInstances.map((instance) => (
                        <InstanceRow
                          key={instance.id}
                          instance={instance}
                          isSelected={selectedInstances.has(instance.id)}
                          onSelect={handleInstanceSelect}
                          onAction={executeInstanceAction}
                          onConsoleAccess={handleConsoleAccess}
                          onNavigateToDetails={navigateToInstanceDetails}
                          actionLoading={actionLoading}
                        />
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <div className="border-t border-slate-200 bg-slate-50 px-5 py-3 text-xs text-slate-500">
                Showing {filteredInstances.length} of {instances.length} instances
              </div>
            </div>
          </ModernCard>

          {/* Sidebar/Details Panel could go here if needed */}
        </div>
      </ClientPageShell>

      {/* Console Overlay */}
      {consoles.map((consoleId) => (
        <EmbeddedConsole
          key={consoleId}
          instanceId={consoleId}
          onClose={() => closeConsole(consoleId)}
        />
      ))}
    </>
  );
}
