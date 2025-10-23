import { useEffect, useRef, useState } from "react";
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

const formatAssociationLabel = (assoc) => {
  if (assoc == null) {
    return "unknown";
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

  return "unknown";
};

const RouteTables = ({
  projectId = "",
  region = "",
  actionRequest,
  onActionHandled,
  onStatsUpdate,
}) => {
  const { data: routeTables, isFetching } = useFetchTenantRouteTables(
    projectId,
    region
  );
  const { mutate: syncRouteTables, isPending: isSyncing } =
    useSyncTenantRouteTables();
  const { mutate: deleteRouteTable, isPending: isDeletingRouteTable } =
    useDeleteTenantRouteTable();
  const { mutate: deleteRoute, isPending: isDeletingRoute } =
    useDeleteTenantRoute();

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [routeModal, setRouteModal] = useState(null); // { routeTable }
  const [deleteModal, setDeleteModal] = useState(null); // { routeTable }
  const [associateModal, setAssociateModal] = useState(null); // { routeTable }

  const items = routeTables || [];
  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = items.slice(startIndex, startIndex + itemsPerPage);

  const handlePreviousPage = () => {
    if (currentPage > 1) setCurrentPage((prev) => prev - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage((prev) => prev + 1);
  };

  const handleSync = () => {
    if (!projectId) {
      ToastUtils.error("Project context is required to sync route tables.");
      return;
    }

    syncRouteTables(
      { project_id: projectId, region },
      {
        onSuccess: () => {
          ToastUtils.success("Route tables synced with provider.");
        },
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
    const payload = {
      project_id: projectId,
      region,
    };
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

  const lastActionToken = useRef(null);
  const lastCountRef = useRef(-1);

  useEffect(() => {
    const count = Array.isArray(items) ? items.length : 0;
    if (lastCountRef.current !== count) {
      lastCountRef.current = count;
      onStatsUpdate?.(count);
    }
  }, [items, onStatsUpdate]);

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

  const handleDeleteRoute = (rt, route) => {
    if (!rt || !route) return;
    const payload = {
      project_id: projectId,
      region,
      route_table_id: rt.provider_resource_id || rt.id,
      destination_cidr_block: route.destination_cidr_block,
    };
    if (route.gateway_id) payload.gateway_id = route.gateway_id;
    if (route.network_interface_id)
      payload.network_interface_id = route.network_interface_id;
    if (route.instance_id) payload.instance_id = route.instance_id;
    if (route.nat_gateway_id) payload.nat_gateway_id = route.nat_gateway_id;

    deleteRoute(payload, {
      onSuccess: () => {
        ToastUtils.success("Route deleted.");
      },
      onError: (err) => {
        console.error("Failed to delete route:", err);
        ToastUtils.error(err?.message || "Failed to delete route.");
      },
    });
  };

  if (isFetching) {
    return (
      <div className="flex items-center justify-center p-6 bg-gray-50 rounded-[10px] font-Outfit">
        <p className="text-gray-500 text-sm">Loading Route Tables...</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 rounded-[10px] font-Outfit">
      <div className="flex justify-end items-center gap-3 mb-6">
        <button
          onClick={handleSync}
          disabled={isSyncing || !projectId}
          className="rounded-[30px] py-3 px-6 border border-[#288DD1] text-[#288DD1] bg-white font-normal text-base hover:bg-[#288DD1] hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSyncing ? "Syncing..." : "Sync Route Tables"}
        </button>
        <button
          onClick={() => setAddModalOpen(true)}
          className="rounded-[30px] py-3 px-9 bg-[#288DD1] text-white font-normal text-base hover:bg-[#1976D2] transition-colors"
          disabled={!projectId}
        >
          Add Route Table
        </button>
      </div>

      {currentItems.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentItems.map((rt) => (
              <div
                key={rt.id}
                className="p-4 bg-white rounded-[10px] shadow-sm border border-gray-200 flex flex-col justify-between"
              >
                <div className="flex-grow space-y-2 text-sm text-gray-500">
                  <h3
                    className="font-medium text-gray-800 truncate"
                    title={rt.name || rt.provider_resource_id}
                  >
                    {rt.name || rt.provider_resource_id || "Unnamed Route Table"}
                  </h3>
                  <p>
                    Provider:{" "}
                    {typeof rt.provider === "string" && rt.provider.trim() !== ""
                      ? rt.provider.toUpperCase()
                      : "N/A"}
                  </p>
                  <p>Region: {rt.region || "N/A"}</p>
                  <div>
                    <p className="font-medium text-xs text-gray-600 mb-1">
                      Routes
                    </p>
                    <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                      {(rt.routes || []).map((route, idx) => (
                        <div
                          key={`${route.destination_cidr_block}-${idx}`}
                          className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded px-2 py-1 text-xs"
                        >
                          <span className="text-gray-700">
                            {route.destination_cidr_block}
                          </span>
                          <button
                            onClick={() => handleDeleteRoute(rt, route)}
                            className="text-red-500 hover:text-red-600"
                            disabled={isDeletingRoute}
                            title="Delete route"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                      {(!rt.routes || rt.routes.length === 0) && (
                        <p className="text-xs text-gray-500">No routes</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="font-medium text-xs text-gray-600 mb-1">
                      Associations
                    </p>
                    <div className="space-y-1 max-h-20 overflow-y-auto pr-1 text-xs">
                      {(rt.associations || []).map((assoc, idx) => {
                        const label = formatAssociationLabel(assoc);
                        return (
                          <div
                            key={`${label}-${idx}`}
                            className="bg-gray-50 border border-gray-200 rounded px-2 py-1 text-gray-600"
                          >
                            {label}
                          </div>
                        );
                      })}
                      {(!rt.associations || rt.associations.length === 0) && (
                        <p className="text-xs text-gray-500">No associations</p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t flex flex-wrap gap-2">
                  <button
                    onClick={() => setRouteModal({ routeTable: rt })}
                    className="px-3 py-1 rounded-full text-xs border border-[#288DD1] text-[#288DD1] hover:bg-[#E6F2FA] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!projectId}
                  >
                    Add Route
                  </button>
                  <button
                    onClick={() => setAssociateModal({ routeTable: rt })}
                    className="px-3 py-1 rounded-full text-xs border border-amber-500 text-amber-600 hover:bg-amber-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!projectId || !region}
                  >
                    Associate Subnet
                  </button>
                  <button
                    onClick={() => setDeleteModal({ routeTable: rt })}
                    disabled={isDeletingRouteTable}
                    className="px-3 py-1 rounded-full text-xs border border-red-500 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <button
                onClick={handlePreviousPage}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-[#288DD1] text-white rounded-[30px] font-medium text-sm hover:bg-[#1976D2] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <div className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </div>
              <button
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-[#288DD1] text-white rounded-[30px] font-medium text-sm hover:bg-[#1976D2] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </>
      ) : (
        <p className="text-gray-500 text-sm">
          No Route Tables found for this project.
        </p>
      )}
      <AddRouteTableModal
        isOpen={isAddModalOpen}
        onClose={() => setAddModalOpen(false)}
        projectId={projectId}
        region={region}
      />
      <AddRouteModal
        isOpen={!!routeModal}
        onClose={() => setRouteModal(null)}
        projectId={projectId}
        region={region}
        routeTableId={
          routeModal?.routeTable?.provider_resource_id ||
          routeModal?.routeTable?.id
        }
        routeTables={items}
      />
      <DeleteRouteTableModal
        isOpen={!!deleteModal}
        onClose={() => setDeleteModal(null)}
        routeTableName={
          deleteModal?.routeTable?.name ||
          deleteModal?.routeTable?.provider_resource_id ||
          ""
        }
        onConfirm={handleDeleteRouteTable}
        isDeleting={isDeletingRouteTable}
      />
      <AssociateRouteTableModal
        isOpen={!!associateModal}
        onClose={() => setAssociateModal(null)}
        projectId={projectId}
        region={region}
        routeTable={associateModal?.routeTable}
      />
    </div>
  );
};

export default RouteTables;
