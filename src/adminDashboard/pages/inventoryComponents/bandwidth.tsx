// @ts-nocheck
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Wifi, Pencil, Trash2, Plus, TrendingUp, DollarSign } from "lucide-react";
import { useFetchBandwidthProducts } from "../../../hooks/adminHooks/bandwidthHooks";
import ResourceDataExplorer from "../../components/ResourceDataExplorer";
import AddBandwidthModal from "./bandwidthSubs/addBandWidth";
import EditBandwidthModal from "./bandwidthSubs/editBandwidth";
import DeleteBandwidthModal from "./bandwidthSubs/deleteBandWidth";
import { ModernButton } from "../../../shared/components/ui";

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

const BandWidth = ({ selectedRegion, onMetricsChange }: any) => {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [search, setSearch] = useState("");

  const [isAddBandwidthModalOpen, setIsAddBandwidthModalOpen] = useState(false);
  const [isEditBandwidthModalOpen, setIsEditBandwidthModalOpen] = useState(false);
  const [isDeleteBandwidthModalOpen, setIsDeleteBandwidthModalOpen] = useState(false);
  const [selectedBandwidth, setSelectedBandwidth] = useState(null);

  useEffect(() => {
    setPage(1);
    setSearch("");
  }, [selectedRegion]);

  const { data, isFetching } = useFetchBandwidthProducts(
    selectedRegion,
    { page, perPage, search },
    { enabled: Boolean(selectedRegion), keepPreviousData: true }
  );

  const rows = data?.data ?? [];
  const meta = data?.meta ?? null;
  const total = meta?.total ?? rows.length;

  const averagePrice = useMemo(() => {
    if (!rows.length) return 0;
    const sum = rows.reduce((acc, item) => acc + Number(item.price || 0), 0);
    return sum / rows.length;
  }, [rows]);

  const highestPrice = useMemo(() => {
    if (!rows.length) return 0;
    return Math.max(...rows.map((item: any) => Number(item.price || 0)));
  }, [rows]);

  useEffect(() => {
    onMetricsChange?.({
      metrics: [
        {
          label: "Bandwidth SKUs",
          value: total,
          description: "Available throughput tiers",
          icon: <Wifi className="h-5 w-5" />,
        },
        {
          label: "Median price (USD)",
          value: formatCurrency(averagePrice),
          description: "Average monthly cost per SKU",
          icon: <DollarSign className="h-5 w-5" />,
        },
        {
          label: "Premium tier",
          value: formatCurrency(highestPrice),
          description: "Highest configured SKU",
          icon: <TrendingUp className="h-5 w-5" />,
        },
      ],
      description:
        "Monitor and tune network throughput offers by region to keep provisioning aligned with customer demand.",
    });
  }, [total, averagePrice, highestPrice, onMetricsChange]);

  const handleAddBandwidth = () => {
    setSelectedBandwidth(null);
    setIsAddBandwidthModalOpen(true);
  };

  const handleEditBandwidth = (bandwidth: any) => {
    setSelectedBandwidth(bandwidth);
    setIsEditBandwidthModalOpen(true);
  };

  const handleDeleteBandwidth = (bandwidth: any) => {
    setSelectedBandwidth(bandwidth);
    setIsDeleteBandwidthModalOpen(true);
  };

  const columns = [
    {
      header: "SKU",
      key: "identifier",
      render: (item) => (
        <div className="flex flex-col">
          <span className="font-semibold text-slate-900">{item.name || "Unnamed"}</span>
          <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
            {item.identifier || "—"}
          </span>
        </div>
      ),
    },
    {
      header: "Billing cadence",
      key: "billing_frequency",
      align: "center",
      render: (item) => (
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
          {item.billing_frequency?.replace(/_/g, " ") || "monthly"}
        </span>
      ),
    },
    {
      header: "",
      key: "actions",
      align: "right",
      render: (item) => (
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => handleEditBandwidth(item)}
            className="inline-flex items-center justify-center rounded-full border border-slate-200 p-2 text-slate-500 transition hover:border-primary-200 hover:text-primary-600"
            title="Edit bandwidth"
            aria-label="Edit bandwidth"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => handleDeleteBandwidth(item)}
            className="inline-flex items-center justify-center rounded-full border border-red-200 p-2 text-red-500 transition hover:border-red-300 hover:bg-red-50"
            title="Remove bandwidth"
            aria-label="Remove bandwidth"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ),
    },
  ];

  const primaryAction = (
    <ModernButton size="sm" onClick={handleAddBandwidth} className="flex items-center gap-2">
      <Plus className="h-4 w-4" />
      Add bandwidth
    </ModernButton>
  );

  const emptyState = {
    icon: (
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-500/10 text-primary-500">
        <Wifi className="h-5 w-5" />
      </span>
    ),
    title: "No bandwidth products yet",
    description:
      "Add throughput tiers to power tenant provisioning flows and quotes for this region.",
    action: (
      <ModernButton onClick={handleAddBandwidth} className="flex items-center gap-2">
        <Plus className="h-4 w-4" />
        Create bandwidth SKU
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
        title="Bandwidth catalog"
        description="Fine-tune bandwidth tiers and keep pricing aligned with infrastructure cost."
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

      <AddBandwidthModal
        isOpen={isAddBandwidthModalOpen}
        onClose={() => setIsAddBandwidthModalOpen(false)}
      />
      <EditBandwidthModal
        isOpen={isEditBandwidthModalOpen}
        onClose={() => setIsEditBandwidthModalOpen(false)}
        bandwidth={selectedBandwidth}
      />
      <DeleteBandwidthModal
        isOpen={isDeleteBandwidthModalOpen}
        onClose={() => setIsDeleteBandwidthModalOpen(false)}
        bandwidth={selectedBandwidth}
      />
    </>
  );
};

export default BandWidth;
