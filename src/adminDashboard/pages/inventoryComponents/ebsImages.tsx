// @ts-nocheck
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Database, Gauge, Activity, Pencil, Trash2, Plus } from "lucide-react";
import { useFetchEbsVolumes } from "../../../hooks/adminHooks/ebsHooks";
import ResourceDataExplorer from "../../components/ResourceDataExplorer";
import AddEBSModal from "./ebsSubs/addEbs";
import EditEBSModal from "./ebsSubs/editEbs";
import DeleteEBSModal from "./ebsSubs/deleteEbs";
import { ModernButton } from "../../../shared/components/ui";

const formatMetric = (value: any, unit: any) => {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "—";
  }
  return `${Number(value).toLocaleString()} ${unit}`;
};

const EBSVolumes = ({ selectedRegion, onMetricsChange }: any) => {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [search, setSearch] = useState("");

  const [isAddEBSModalOpen, setIsAddEBSModalOpen] = useState(false);
  const [isEditEBSModalOpen, setIsEditEBSModalOpen] = useState(false);
  const [isDeleteEBSModalOpen, setIsDeleteEBSModalOpen] = useState(false);
  const [selectedEBSVolume, setSelectedEBSVolume] = useState(null);

  useEffect(() => {
    setPage(1);
    setSearch("");
  }, [selectedRegion]);

  const { data, isFetching } = useFetchEbsVolumes(
    selectedRegion,
    { page, perPage, search },
    { enabled: Boolean(selectedRegion), keepPreviousData: true }
  );

  const rows = data?.data ?? [];
  const meta = data?.meta ?? null;
  const total = meta?.total ?? rows.length;

  const avgReadIOPS = useMemo(() => {
    if (!rows.length) return 0;
    return rows.reduce((acc, volume) => acc + Number(volume.read_iops_limit || 0), 0) / rows.length;
  }, [rows]);

  const avgWriteIOPS = useMemo(() => {
    if (!rows.length) return 0;
    return (
      rows.reduce((acc, volume) => acc + Number(volume.write_iops_limit || 0), 0) / rows.length
    );
  }, [rows]);

  useEffect(() => {
    onMetricsChange?.({
      metrics: [
        {
          label: "Volume types",
          value: total,
          description: "Provisionable volume SKUs",
          icon: <Database className="h-5 w-5" />,
        },
        {
          label: "Avg read IOPS",
          value: formatMetric(Math.round(avgReadIOPS), "IOPS"),
          description: "Across configured SKUs",
          icon: <Gauge className="h-5 w-5" />,
        },
        {
          label: "Avg write IOPS",
          value: formatMetric(Math.round(avgWriteIOPS), "IOPS"),
          description: "Sustained performance",
          icon: <Activity className="h-5 w-5" />,
        },
      ],
      description:
        "Keep volume throughput aligned with tenant SLAs. Adjust IOPS and bandwidth as performance tiers evolve.",
    });
  }, [total, avgReadIOPS, avgWriteIOPS, onMetricsChange]);

  const handleAddEBSVolume = () => {
    setSelectedEBSVolume(null);
    setIsAddEBSModalOpen(true);
  };

  const handleEditEBSVolume = (volume: any) => {
    setSelectedEBSVolume(volume);
    setIsEditEBSModalOpen(true);
  };

  const handleDeleteEBSVolume = (volume: any) => {
    setSelectedEBSVolume(volume);
    setIsDeleteEBSModalOpen(true);
  };

  const columns = [
    {
      header: "Volume profile",
      key: "name",
      render: (volume) => (
        <div className="flex flex-col">
          <span className="font-semibold text-slate-900">{volume.name || "Unnamed volume"}</span>
          <span className="text-xs text-slate-500">
            {volume.description || "No description provided"}
          </span>
        </div>
      ),
    },
    {
      header: "IOPS (R/W)",
      key: "read_iops_limit",
      align: "center",
      render: (volume) => (
        <div className="flex flex-col items-center text-xs text-slate-500">
          <span className="font-medium text-slate-700">
            {formatMetric(volume.read_iops_limit, "IOPS")}
          </span>
          <span>{formatMetric(volume.write_iops_limit, "IOPS")}</span>
        </div>
      ),
    },
    {
      header: "Bandwidth (R/W)",
      key: "read_bandwidth_limit",
      align: "center",
      render: (volume) => (
        <div className="flex flex-col items-center text-xs text-slate-500">
          <span className="font-medium text-slate-700">
            {formatMetric(volume.read_bandwidth_limit, "MB/s")}
          </span>
          <span>{formatMetric(volume.write_bandwidth_limit, "MB/s")}</span>
        </div>
      ),
    },
    {
      header: "",
      key: "actions",
      align: "right",
      render: (volume) => (
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => handleEditEBSVolume(volume)}
            className="inline-flex items-center justify-center rounded-full border border-slate-200 p-2 text-slate-500 transition hover:border-primary-200 hover:text-primary-600"
            title="Edit storage profile"
            aria-label="Edit storage profile"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => handleDeleteEBSVolume(volume)}
            className="inline-flex items-center justify-center rounded-full border border-red-200 p-2 text-red-500 transition hover:border-red-300 hover:bg-red-50"
            title="Remove storage profile"
            aria-label="Remove storage profile"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ),
    },
  ];

  const primaryAction = (
    <ModernButton size="sm" onClick={handleAddEBSVolume} className="flex items-center gap-2">
      <Plus className="h-4 w-4" />
      Add volume profile
    </ModernButton>
  );

  const emptyState = {
    icon: (
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-500/10 text-primary-500">
        <Database className="h-5 w-5" />
      </span>
    ),
    title: "No volume profiles yet",
    description:
      "Provisioning needs volume templates per region. Add a profile to unlock VM provisioning.",
    action: (
      <ModernButton onClick={handleAddEBSVolume} className="flex items-center gap-2">
        <Plus className="h-4 w-4" />
        Create volume profile
      </ModernButton>
    ),
  };

  const handleSearch = useCallback(
    (value) => {
      setSearch(value);
      setPage(1);
    },
    [setSearch, setPage]
  );

  return (
    <>
      <ResourceDataExplorer
        title="Volume catalog"
        description="Control volume performance tiers and ensure workloads hit the right throughput."
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

      <AddEBSModal isOpen={isAddEBSModalOpen} onClose={() => setIsAddEBSModalOpen(false)} />
      <EditEBSModal
        isOpen={isEditEBSModalOpen}
        onClose={() => setIsEditEBSModalOpen(false)}
        ebsVolume={selectedEBSVolume}
      />
      <DeleteEBSModal
        isOpen={isDeleteEBSModalOpen}
        onClose={() => setIsDeleteEBSModalOpen(false)}
        ebsVolume={selectedEBSVolume}
      />
    </>
  );
};

export default EBSVolumes;
