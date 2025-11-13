import { useEffect, useMemo, useRef, useState } from "react";
import { Link2, Plus, RefreshCw, Trash2 } from "lucide-react";
import ToastUtils from "../../../utils/toastUtil";
import {
  useFetchTenantRouteTables,
  useSyncTenantRouteTables,
  useDeleteTenantRouteTable,
  useDeleteTenantRoute,
} from "../../../hooks/routeTable";
import AddRouteTableModal from "../routeTableComps/addRouteTable";
import AddRouteModal from "../routeTableComps/addRoute";
import DeleteRouteTableModal from "../routeTableComps/deleteRouteTable";
import AssociateRouteTableModal from "../routeTableComps/associateRouteTable";
import ResourceSection from "../../../adminDashboard/components/ResourceSection";
import ResourceEmptyState from "../../../adminDashboard/components/ResourceEmptyState";
import ResourceListCard from "../../../adminDashboard/components/ResourceListCard";
import ModernButton from "../../../adminDashboard/components/ModernButton";

const ITEMS_PER_PAGE = 6;

const formatAssociationLabel = (assoc) => {
  if (assoc == null) {
    return "Unknown";
  }
  if (typeof assoc === "string" || typeof assoc === "number") {
    return String(assoc);
  }
  if (typeof assoc === "object") {
    if (assoc.subnet_id) return assoc.subnet_id;
    if (assoc.network_id) return assoc.network_id;
    if (assoc.route_table_association_id) return assoc.route_table_association_id;
    if (assoc.main) {
      return `main${assoc.route_table_id ? ` (${assoc.route_table_id})` : ""}`;
    }
    if (assoc.gateway_id) return assoc.gateway_id;
    if (assoc.network_interface_id) return assoc.network_interface_id;
    return JSON.stringify(assoc);
  }
  return "Unknown";
};

const describeRouteTarget = (route = {}) => {
  if (route.gateway_id) return `Gateway ${route.gateway_id}`;
  if (route.instance_id) return `Instance ${route.instance_id}`;
  if (route.network_interface_id) return `ENI ${route.network_interface_id}`;
  if (route.nat_gateway_id) return `NAT ${route.nat_gateway_id}`;
  if (route.vpc_peering_connection_id) return `Peering ${route.vpc_peering_connection_id}`;
  return route.target || "Unknown target";
};

const RouteTables = ({
  projectId = "",
  region = "",
  actionRequest,
  onActionHandled,
  onStatsUpdate,
}) => {
  const { data: routeTables, isFetching } = useFetchTenantRouteTables(projectId, region);
  const { mutate: syncRouteTables, isPending: isSyncing } = useSyncTenantRouteTables();
  const { mutate: deleteRouteTable, isPending: isDeletingRouteTable } = useDeleteTenantRouteTable();
  const { mutate: deleteRoute, isPending: isDeletingRoute } = useDeleteTenantRoute();

  const [currentPage, setCurrentPage] = useState(1);
  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [routeModal, setRouteModal] = useState(null);
  const [deleteModal, setDeleteModal] = useState(null);
  const [associateModal, setAssociateModal] = useState(null);

  const items = useMemo(() => (Array.isArray(routeTables) ? routeTables : []), [routeTables]);
  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(Math.max(totalItems, 1) / ITEMS_PER_PAGE));
  const currentItems = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return items.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [items, currentPage]);

  const stats = useMemo(() => {
    const totalRoutes = items.reduce((sum, rt) => sum + ((rt.routes || []).length ?? 0), 0);
    const mainTablesCount = items.filter(
      (rt) =>
        rt.main ||
        rt.is_main ||
        (rt.associations || []).some((assoc) => assoc?.main)
    ).length;
    const summary = [
      {
        label: "Route Tables",
        value: items.length,
        tone: items.length ? "primary" : "neutral",
      },
      {
        label: "Routes",
        value: totalRoutes,
        tone: totalRoutes ? "info" : "neutral",
      },
    ];
    if (mainTablesCount) {
      summary.push({ label: "Main Tables", value: mainTablesCount, tone: "success" });
    }
    if (region) {
      summary.push({ label: "Region", value: region, tone: "info" });
    }
    return summary;
  }, [items, region]);

  const lastActionToken = useRef(null);
  const lastCountRef = useRef(-1);

  useEffect(() => {
    if (!isFetching) {
      const count = items.length;
      if (lastCountRef.current !== count) {
        lastCountRef.current = count;
        onStatsUpdate?.(count);
      }
    }
  }, [items, isFetching, onStatsUpdate]);

  useEffect(() => {
    if (!actionRequest || actionRequest.resource !== "routeTables") {
      return;
    }
    if (lastActionToken.current === actionRequest.token) {
      return;
    }
    lastActionToken.current = actionRequest.token;

    if (actionRequest.type === "sync") {
      handleSync();
    } else if (actionRequest.type === "create") {
      setAddModalOpen(true);
    }

    onActionHandled?.(actionRequest);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actionRequest]);

  const handleSync = () => {
    if (!projectId) {
      ToastUtils.error("Project context is required to sync route tables.");
      return;
    }

    syncRouteTables(
      { project_id: projectId, region },
      {
        onSuccess: () => ToastUtils.success("Route tables synced with provider."),
        onError: (err) => {
          console.error("Failed to sync route tables:", err);
          ToastUtils.error(err?.message || "Failed to sync route tables.");
        },
      }
    );
  };

  const handleDeleteRouteTable = () => {
    if (!deleteModal?.routeTable) return;
    const rt = deleteModal.routeTable;
    const payload = { project_id: projectId, region };
    deleteRouteTable(
      {
        id: rt.id ?? rt.provider_resource_id,
        payload,
      },
      {
        onSuccess: () => {
          ToastUtils.success("Route table deleted.");
          setDeleteModal(null);
        },
        onError: (err) => {
          console.error("Failed to delete route table:", err);
          ToastUtils.error(err?.message || "Failed to delete route table.");
          setDeleteModal(null);
        },
      }
    );
  };

  const handleDeleteRoute = (rt, route) => {
    if (!rt || !route) return;
    const payload = {
      project_id: projectId,
      region,
      route_table_id: rt.provider_resource_id || rt.id,
      destination_cidr_block: route.destination_cidr_block,
    };
    if (route.gateway_id) payload.gateway_id = route.gateway_id;
    if (route.network_interface_id) payload.network_interface_id = route.network_interface_id;
    if (route.instance_id) payload.instance_id = route.instance_id;
    if (route.nat_gateway_id) payload.nat_gateway_id = route.nat_gateway_id;

    deleteRoute(payload, {
      onSuccess: () => ToastUtils.success("Route deleted."),
      onError: (err) => {
        console.error("Failed to delete route:", err);
        ToastUtils.error(err?.message || "Failed to delete route.");
      },
    });
  };

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
  };

  const actions = [
    <ModernButton
      key="sync"
      variant="outline"
      size="sm"
      leftIcon={<RefreshCw size={16} />}
      onClick={handleSync}
      isDisabled={isSyncing || !projectId}
      isLoading={isSyncing}
    >
      {isSyncing ? "Syncing..." : "Sync Route Tables"}
    </ModernButton>,
    <ModernButton
      key="add"
      variant="primary"
      size="sm"
      leftIcon={<Plus size={16} />}
      onClick={() => setAddModalOpen(true)}
      isDisabled={!projectId}
    >
      Add Route Table
    </ModernButton>,
  ];

  const paginationControls =
    totalItems > ITEMS_PER_PAGE ? (
      <div className="mt-6 flex items-center justify-between text-sm text-gray-500">
        <ModernButton
          variant="outline"
          size="sm"
          onClick={handlePreviousPage}
          isDisabled={currentPage === 1}
        >
          Previous
        </ModernButton>
        <span>
          Page {currentPage} of {totalPages}
        </span>
        <ModernButton
          variant="outline"
          size="sm"
          onClick={handleNextPage}
          isDisabled={currentPage === totalPages}
        >
          Next
        </ModernButton>
      </div>
    ) : null;

  const emptyState = (
    <ResourceEmptyState
      title="No Route Tables"
      message="Sync from your cloud account or create a route table to control traffic flow."
      action={
        <ModernButton
          variant="primary"
          size="sm"
          onClick={() => setAddModalOpen(true)}
          isDisabled={!projectId}
        >
          Add Route Table
        </ModernButton>
      }
    />
  );

  const renderRoutesSection = (rt) => {
    const routes = rt.routes || [];
    return (
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-slate-700">Routes</h4>
        {routes.length === 0 ? (
          <p className="text-sm text-slate-500">No routes defined</p>
        ) : (
          <div className="space-y-2">
            {routes.map((route, idx) => {
              const destination =
                route.destination_cidr_block ||
                route.destination_ipv6_cidr_block ||
                "—";
              return (
                <div
                  key={`${rt.id}-route-${idx}`}
                  className="flex items-center justify-between rounded-2xl border border-slate-200 px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800">{destination}</p>
                    <p className="text-xs text-slate-500">
                      {describeRouteTarget(route)}
                    </p>
                  </div>
                  <ModernButton
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteRoute(rt, route)}
                    isDisabled={isDeletingRoute}
                  >
                    Remove
                  </ModernButton>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const renderAssociations = (rt) => {
    const associations = rt.associations || [];
    return (
      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-slate-700">Associations</h4>
        {associations.length === 0 ? (
          <p className="text-sm text-slate-500">No associations</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {associations.map((assoc, idx) => (
              <span
                key={`${rt.id}-assoc-${idx}`}
                className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600"
              >
                {formatAssociationLabel(assoc)}
              </span>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderCard = (rt) => {
    const rtId = rt.id || rt.provider_resource_id;
    const routes = rt.routes || [];
    const associations = rt.associations || [];
    const isMainTable =
      Boolean(rt.main) ||
      Boolean(rt.is_main) ||
      associations.some((assoc) => assoc?.main);
    const statusLabel = rt.status || (isMainTable ? "Main Table" : "");

    return (
      <ResourceListCard
        key={rtId}
        title={rt.name || rtId || "Route Table"}
        subtitle={rtId}
        metadata={[
          { label: "VPC", value: rt.vpc_id || "—" },
          { label: "Routes", value: routes.length },
          { label: "Associations", value: associations.length },
          region ? { label: "Region", value: region } : null,
        ].filter(Boolean)}
        statuses={
          statusLabel
            ? [
                {
                  label: statusLabel,
                  tone: isMainTable ? "primary" : "neutral",
                },
              ]
            : isMainTable
            ? [
                {
                  label: "Main Table",
                  tone: "primary",
                },
              ]
            : []
        }
        actions={[
          {
            key: "add-route",
            label: "Add Route",
            icon: <Plus size={16} />,
            onClick: () => setRouteModal({ routeTableId: rtId, routeTable: rt }),
            disabled: !projectId,
          },
          {
            key: "associate",
            label: "Associate",
            icon: <Link2 size={16} />,
            onClick: () => setAssociateModal({ routeTable: rt }),
            disabled: !projectId,
          },
          {
            key: "delete",
            label: "Delete",
            icon: <Trash2 size={16} />,
            variant: "danger",
            onClick: () => setDeleteModal({ routeTable: rt }),
            disabled: isDeletingRouteTable,
          },
        ]}
        footer={
          <div className="space-y-5">
            {renderAssociations(rt)}
            {renderRoutesSection(rt)}
          </div>
        }
      />
    );
  };

  return (
    <>
      <ResourceSection
        title="Route Tables"
        description="Control how traffic flows between subnets and the internet."
        actions={actions}
        meta={stats}
        isLoading={isFetching}
      >
        {currentItems.length > 0 ? (
          <>
            <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
              {currentItems.map(renderCard)}
            </div>
            {paginationControls}
          </>
        ) : (
          emptyState
        )}
      </ResourceSection>

      <AddRouteTableModal
        isOpen={isAddModalOpen}
        onClose={() => setAddModalOpen(false)}
        projectId={projectId}
        region={region}
      />
      <AddRouteModal
        isOpen={Boolean(routeModal)}
        onClose={() => setRouteModal(null)}
        projectId={projectId}
        region={region}
        routeTableId={routeModal?.routeTableId || routeModal?.routeTable?.id}
        routeTables={items}
      />
      <AssociateRouteTableModal
        isOpen={Boolean(associateModal)}
        onClose={() => setAssociateModal(null)}
        projectId={projectId}
        region={region}
        routeTable={associateModal?.routeTable || null}
      />
      <DeleteRouteTableModal
        isOpen={Boolean(deleteModal)}
        onClose={() => setDeleteModal(null)}
        onConfirm={handleDeleteRouteTable}
        routeTableName={
          deleteModal?.routeTable?.name ||
          deleteModal?.routeTable?.provider_resource_id ||
          deleteModal?.routeTable?.id ||
          ""
        }
        isDeleting={isDeletingRouteTable}
      />
    </>
  );
};

export default RouteTables;
