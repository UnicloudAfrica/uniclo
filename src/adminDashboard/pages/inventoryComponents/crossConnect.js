import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  Cable,
  MapPinned,
  DollarSign,
  Pencil,
  Trash2,
  Plus,
} from "lucide-react";
import { useFetchCrossConnects } from "../../../hooks/adminHooks/crossConnectHooks";
import ResourceDataExplorer from "../../components/ResourceDataExplorer";
import AddCrossConnect from "./crossConnectSubs/addCC";
import EditCrossConnect from "./crossConnectSubs/editCC";
import DeleteCrossConnect from "./crossConnectSubs/deleteCC";
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

const formatDate = (dateString) => {
  if (!dateString) return "—";
  try {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch (error) {
    return "—";
  }
};

const CrossConnect = ({ selectedRegion, onMetricsChange }) => {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [search, setSearch] = useState("");

  const [isAddCrossConnectModalOpen, setIsAddCrossConnectModalOpen] =
    useState(false);
  const [isEditCrossConnectModalOpen, setIsEditCrossConnectModalOpen] =
    useState(false);
  const [isDeleteCrossConnectModalOpen, setIsDeleteCrossConnectModalOpen] =
    useState(false);
  const [selectedCrossConnect, setSelectedCrossConnect] = useState(null);

  useEffect(() => {
    setPage(1);
    setSearch("");
  }, [selectedRegion]);

  const { data, isFetching } = useFetchCrossConnects(
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
      rows.reduce((acc, item) => acc + Number(item.price || 0), 0) /
      rows.length
    );
  }, [rows]);

  const providerCoverage = useMemo(() => {
    return new Set(rows.map((item) => item.provider || "platform")).size;
  }, [rows]);

  useEffect(() => {
    onMetricsChange?.({
      metrics: [
        {
          label: "Cross connect SKUs",
          value: total,
          description: "Private networking offers",
          icon: <Cable className="h-5 w-5" />,
        },
        {
          label: "Providers",
          value: providerCoverage,
          description: "Carrier/IX partners covered",
          icon: <MapPinned className="h-5 w-5" />,
        },
        {
          label: "Average price",
          value: formatCurrency(averagePrice),
          description: "Typical monthly charge",
          icon: <DollarSign className="h-5 w-5" />,
        },
      ],
      description:
        "Curate partner cross-connect offers and keep pricing aligned with colocation contracts.",
    });
  }, [total, providerCoverage, averagePrice, onMetricsChange]);

  const handleAdd = () => {
    setSelectedCrossConnect(null);
    setIsAddCrossConnectModalOpen(true);
  };

  const handleEdit = (record) => {
    setSelectedCrossConnect(record);
    setIsEditCrossConnectModalOpen(true);
  };

  const handleDelete = (record) => {
    setSelectedCrossConnect(record);
    setIsDeleteCrossConnectModalOpen(true);
  };

  const columns = [
    {
      header: "Cross connect profile",
      key: "name",
      render: (item) => (
        <div className="flex flex-col">
          <span className="font-semibold text-slate-900">
            {item.name || "Cross connect"}
          </span>
          <span className="text-xs text-slate-500">
            {item.identifier || "No identifier"}
          </span>
        </div>
      ),
    },
    {
      header: "Provider",
      key: "provider",
      align: "center",
      render: (item) => (
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
          {item.provider || "Platform"}
        </span>
      ),
    },
    {
      header: "Updated",
      key: "updated_at",
      align: "right",
      render: (item) => (
        <span className="text-xs text-slate-500">
          {formatDate(item.updated_at || item.created_at)}
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
            onClick={() => handleEdit(item)}
            className="inline-flex items-center justify-center rounded-full border border-slate-200 p-2 text-slate-500 transition hover:border-primary-200 hover:text-primary-600"
            title="Edit cross connect"
            aria-label="Edit cross connect"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => handleDelete(item)}
            className="inline-flex items-center justify-center rounded-full border border-red-200 p-2 text-red-500 transition hover:border-red-300 hover:bg-red-50"
            title="Remove cross connect"
            aria-label="Remove cross connect"
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
      onClick={handleAdd}
      className="flex items-center gap-2"
    >
      <Plus className="h-4 w-4" />
      Add cross connect
    </ModernButton>
  );

  const emptyState = {
    icon: (
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-500/10 text-primary-500">
        <Cable className="h-5 w-5" />
      </span>
    ),
    title: "No cross-connect products",
    description:
      "Expose carrier cross connects so customers can bring hybrid workloads into your platform.",
    action: (
      <ModernButton onClick={handleAdd} className="flex items-center gap-2">
        <Plus className="h-4 w-4" />
        Create cross connect SKU
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
        title="Carrier cross connects"
        description="Manage dedicated network cross-connects and pricing for co-located customers."
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

      <AddCrossConnect
        isOpen={isAddCrossConnectModalOpen}
        onClose={() => setIsAddCrossConnectModalOpen(false)}
      />
      <EditCrossConnect
        isOpen={isEditCrossConnectModalOpen}
        onClose={() => setIsEditCrossConnectModalOpen(false)}
        crossConnect={selectedCrossConnect}
      />
      <DeleteCrossConnect
        isOpen={isDeleteCrossConnectModalOpen}
        onClose={() => setIsDeleteCrossConnectModalOpen(false)}
        crossConnect={selectedCrossConnect}
      />
    </>
  );
};

export default CrossConnect;
