import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  Globe,
  MapPin,
  DollarSign,
  Pencil,
  Trash2,
  Plus,
} from "lucide-react";
import { useFetchFloatingIPs } from "../../../hooks/adminHooks/floatingIPHooks";
import ResourceDataExplorer from "../../components/ResourceDataExplorer";
import AddFloatingIP from "./ipSubs/addFloatingIP";
import EditFloatingIP from "./ipSubs/editFloatingIP";
import DeleteFloatingIP from "./ipSubs/deleteFloatingIP";
import ModernButton from "../../components/ModernButton";

const formatCurrency = (amount, currency = "USD") => {
  if (amount === null || amount === undefined || Number.isNaN(amount)) {
    return "—";
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(amount));
};

const FloatingIP = ({ selectedRegion, onMetricsChange }) => {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [search, setSearch] = useState("");

  const [isAddIPsModalOpen, setIsAddIPsModalOpen] = useState(false);
  const [isEditIPsModalOpen, setIsEditIPsModalOpen] = useState(false);
  const [isDeleteIPsModalOpen, setIsDeleteIPsModalOpen] = useState(false);
  const [selectedIPs, setSelectedIPs] = useState(null);

  useEffect(() => {
    setPage(1);
    setSearch("");
  }, [selectedRegion]);

  const { data, isFetching } = useFetchFloatingIPs(
    selectedRegion,
    { page, perPage, search },
    { enabled: Boolean(selectedRegion), keepPreviousData: true }
  );

  const rows = data?.data ?? [];
  const meta = data?.meta ?? null;
  const total = meta?.total ?? rows.length;

  const averagePrice = useMemo(() => {
    if (!rows.length) return 0;
    return (
      rows.reduce((acc, ip) => acc + Number(ip.price || 0), 0) /
      rows.length
    );
  }, [rows]);

  const regionalCoverage = useMemo(() => {
    return new Set(rows.map((ip) => ip.region || "global")).size;
  }, [rows]);

  useEffect(() => {
    onMetricsChange?.({
      metrics: [
        {
          label: "Floating IP pools",
          value: total,
          description: "Routable IP resources",
          icon: <Globe className="h-5 w-5" />,
        },
        {
          label: "Regions covered",
          value: regionalCoverage,
          description: "Distinct regional pools",
          icon: <MapPin className="h-5 w-5" />,
        },
        {
          label: "Average price",
          value: formatCurrency(averagePrice),
          description: "Typical monthly cost",
          icon: <DollarSign className="h-5 w-5" />,
        },
      ],
      description:
        "Keep external connectivity balanced across data centres and price tiers that match carrier costs.",
    });
  }, [total, regionalCoverage, averagePrice, onMetricsChange]);

  const handleAddIPs = () => {
    setSelectedIPs(null);
    setIsAddIPsModalOpen(true);
  };

  const handleEditIPs = (ip) => {
    setSelectedIPs(ip);
    setIsEditIPsModalOpen(true);
  };

  const handleDeleteIPs = (ip) => {
    setSelectedIPs(ip);
    setIsDeleteIPsModalOpen(true);
  };

  const columns = [
    {
      header: "IP SKU",
      key: "name",
      render: (ip) => (
        <div className="flex flex-col">
          <span className="font-semibold text-slate-900">
            {ip.name || "Floating IP"}
          </span>
          <span className="text-xs text-slate-500">
            {ip.identifier || "No identifier assigned"}
          </span>
        </div>
      ),
    },
    {
      header: "Region",
      key: "region",
      align: "center",
      render: (ip) => (
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
          {ip.region || "global"}
        </span>
      ),
    },
    {
      header: "",
      key: "actions",
      align: "right",
      render: (ip) => (
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => handleEditIPs(ip)}
            className="inline-flex items-center justify-center rounded-full border border-slate-200 p-2 text-slate-500 transition hover:border-primary-200 hover:text-primary-600"
            title="Edit floating IP"
            aria-label="Edit floating IP"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => handleDeleteIPs(ip)}
            className="inline-flex items-center justify-center rounded-full border border-red-200 p-2 text-red-500 transition hover:border-red-300 hover:bg-red-50"
            title="Remove floating IP"
            aria-label="Remove floating IP"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ),
    },
  ];

  const primaryAction = (
    <ModernButton
      size="sm"
      onClick={handleAddIPs}
      className="flex items-center gap-2"
    >
      <Plus className="h-4 w-4" />
      Add Floating IP
    </ModernButton>
  );

  const emptyState = {
    icon: (
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-500/10 text-primary-500">
        <Globe className="h-5 w-5" />
      </span>
    ),
    title: "No floating IP pools defined",
    description:
      "Create routing pools to enable public connectivity for tenant workloads in this region.",
    action: (
      <ModernButton onClick={handleAddIPs} className="flex items-center gap-2">
        <Plus className="h-4 w-4" />
        Create floating IP pool
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
        title="Floating IP catalogue"
        description="Manage routable IP pools and cost structures that back tenant networking."
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

      <AddFloatingIP
        isOpen={isAddIPsModalOpen}
        onClose={() => setIsAddIPsModalOpen(false)}
      />
      <EditFloatingIP
        isOpen={isEditIPsModalOpen}
        onClose={() => setIsEditIPsModalOpen(false)}
        ip={selectedIPs}
      />
      <DeleteFloatingIP
        isOpen={isDeleteIPsModalOpen}
        onClose={() => setIsDeleteIPsModalOpen(false)}
        ip={selectedIPs}
      />
    </>
  );
};

export default FloatingIP;
