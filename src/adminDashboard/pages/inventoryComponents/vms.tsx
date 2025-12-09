// @ts-nocheck
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Server, Cpu, Gauge, Pencil, Trash2, Plus } from "lucide-react";
import { useFetchVmInstances } from "../../../hooks/adminHooks/vmHooks";
import ResourceDataExplorer from "../../components/ResourceDataExplorer";
import AddVMModal from "./vmSubs/addVms";
import EditVMModal from "./vmSubs/editVms";
import DeleteVMModal from "./vmSubs/deleteVms";
import { ModernButton } from "../../../shared/components/ui";

const formatMemory = (memoryMb: any) => {
  if (memoryMb === null || memoryMb === undefined) return "—";
  return `${Math.round(Number(memoryMb) / 1024)} GiB`;
};

const Vms = ({ selectedRegion, onMetricsChange }: any) => {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [search, setSearch] = useState("");

  const [isAddVMModalOpen, setIsAddVMModalOpen] = useState(false);
  const [isEditVMModalOpen, setIsEditVMModalOpen] = useState(false);
  const [isDeleteVMModalOpen, setIsDeleteVMModalOpen] = useState(false);
  const [selectedVM, setSelectedVM] = useState(null);

  useEffect(() => {
    setPage(1);
    setSearch("");
  }, [selectedRegion]);

  const { data, isFetching } = useFetchVmInstances(
    selectedRegion,
    { page, perPage, search },
    { enabled: Boolean(selectedRegion), keepPreviousData: true }
  );

  const rows = data?.data ?? [];
  const meta = data?.meta ?? null;
  const total = meta?.total ?? rows.length;

  const totalVCpus = useMemo(() => {
    if (!rows.length) return 0;
    return rows.reduce((acc, vm) => acc + Number(vm.vcpus || 0), 0);
  }, [rows]);

  const avgMemory = useMemo(() => {
    if (!rows.length) return 0;
    const sum = rows.reduce((acc, vm) => acc + Number(vm.memory_mb || 0), 0);
    return sum / rows.length;
  }, [rows]);

  useEffect(() => {
    onMetricsChange?.({
      metrics: [
        {
          label: "Compute classes",
          value: total,
          description: "Provisionable VM profiles",
          icon: <Server className="h-5 w-5" />,
        },
        {
          label: "Total vCPUs",
          value: totalVCpus,
          description: "Across available flavours",
          icon: <Cpu className="h-5 w-5" />,
        },
        {
          label: "Avg memory",
          value: formatMemory(avgMemory),
          description: "Mean memory across classes",
          icon: <Gauge className="h-5 w-5" />,
        },
      ],
      description:
        "Craft VM catalogues that span entry to performance tiers. Keep compute, memory, and sockets balanced for customer workloads.",
    });
  }, [total, totalVCpus, avgMemory, onMetricsChange]);

  const handleAddVM = () => {
    setSelectedVM(null);
    setIsAddVMModalOpen(true);
  };

  const handleEditVM = (vm: any) => {
    setSelectedVM(vm);
    setIsEditVMModalOpen(true);
  };

  const handleDeleteVM = (vm: any) => {
    setSelectedVM(vm);
    setIsDeleteVMModalOpen(true);
  };

  const columns = [
    {
      header: "Compute profile",
      key: "name",
      render: (vm) => (
        <div className="flex flex-col">
          <span className="font-semibold text-slate-900">{vm.name || "Unnamed profile"}</span>
          <span className="text-xs text-slate-500">
            {vm.provider_label || vm.provider || "Provider unspecified"}
          </span>
        </div>
      ),
    },
    {
      header: "Memory",
      key: "memory_mb",
      align: "center",
      render: (vm) => (
        <span className="font-semibold text-slate-800">{formatMemory(vm.memory_mb)}</span>
      ),
    },
    {
      header: "vCPU / cores",
      key: "vcpus",
      align: "center",
      render: (vm) => (
        <div className="flex flex-col items-center text-xs text-slate-500">
          <span className="font-medium text-slate-700">{vm.vcpus ?? "—"} vCPU</span>
          <span>
            {vm.cores ?? "—"} cores · {vm.sockets ?? "—"} sockets · {vm.threads ?? "—"} threads
          </span>
        </div>
      ),
    },
    {
      header: "",
      key: "actions",
      align: "right",
      render: (vm) => (
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => handleEditVM(vm)}
            className="inline-flex items-center justify-center rounded-full border border-slate-200 p-2 text-slate-500 transition hover:border-primary-200 hover:text-primary-600"
            title="Edit compute class"
            aria-label="Edit compute class"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => handleDeleteVM(vm)}
            className="inline-flex items-center justify-center rounded-full border border-red-200 p-2 text-red-500 transition hover:border-red-300 hover:bg-red-50"
            title="Remove compute class"
            aria-label="Remove compute class"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ),
    },
  ];

  const primaryAction = (
    <ModernButton size="sm" onClick={handleAddVM} className="flex items-center gap-2">
      <Plus className="h-4 w-4" />
      Add compute class
    </ModernButton>
  );

  const emptyState = {
    icon: (
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-500/10 text-primary-500">
        <Server className="h-5 w-5" />
      </span>
    ),
    title: "No VM classes configured",
    description: "Define compute templates so tenants can provision workloads in this region.",
    action: (
      <ModernButton onClick={handleAddVM} className="flex items-center gap-2">
        <Plus className="h-4 w-4" />
        Create compute class
      </ModernButton>
    ),
  };

  const handleSearch = useCallback((value) => {
    setSearch(value);
    setPage(1);
  }, []);

  return (
    <>
      <ResourceDataExplorer
        title="Compute catalogue"
        description="Balance CPU, memory, and sockets to deliver consistent performance tiers for customers."
        columns={columns}
        rows={rows}
        loading={isFetching}
        page={meta?.current_page ?? page}
        perPage={meta?.per_page ?? perPage}
        total={total}
        meta={meta}
        onPageChange={setPage}
        onPerPageChange={(next) => {
          setPerPage(next);
          setPage(1);
        }}
        searchValue={search}
        onSearch={handleSearch}
        toolbarSlot={primaryAction}
        emptyState={emptyState}
      />

      <AddVMModal isOpen={isAddVMModalOpen} onClose={() => setIsAddVMModalOpen(false)} />
      <EditVMModal
        isOpen={isEditVMModalOpen}
        onClose={() => setIsEditVMModalOpen(false)}
        vm={selectedVM}
      />
      <DeleteVMModal
        isOpen={isDeleteVMModalOpen}
        onClose={() => setIsDeleteVMModalOpen(false)}
        vm={selectedVM}
      />
    </>
  );
};

export default Vms;
