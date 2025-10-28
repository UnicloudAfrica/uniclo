import { useMemo, useState } from "react";
import { RefreshCw, Plus } from "lucide-react";
import {
  useFetchRouteTables,
  useCreateRouteTableAssociation,
  useDeleteRoute,
  syncRouteTablesFromProvider,
} from "../../../hooks/adminHooks/routeTableHooks";
import { useFetchSubnets } from "../../../hooks/adminHooks/subnetHooks";
import { useFetchIgws } from "../../../hooks/adminHooks/igwHooks";
import ToastUtils from "../../../utils/toastUtil";
import { useQueryClient } from "@tanstack/react-query";
import AddRouteTable from "../routeTableComps/addRouteTable";
import AddRoute from "../routeTableComps/addRoute";
import ResourceSection from "../../components/ResourceSection";
import ResourceEmptyState from "../../components/ResourceEmptyState";
import ResourceListCard from "../../components/ResourceListCard";
import ModernButton from "../../components/ModernButton";

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

const RouteTables = ({ projectId = "", region = "" }) => {
  const queryClient = useQueryClient();
  const { data: routeTables, isFetching } = useFetchRouteTables(projectId, region);
  const { mutate: associateRouteTable, isPending: associating } = useCreateRouteTableAssociation();
  const { mutate: deleteRoute } = useDeleteRoute();
  const [assocForm, setAssocForm] = useState({ route_table_id: "", subnet_id: "" });
  const [isCreateModalOpen, setCreateModal] = useState(false);
  const [isAddRouteOpen, setAddRouteOpen] = useState(false);
  const [selectedRtId, setSelectedRtId] = useState("");
  const { data: subnets } = useFetchSubnets(projectId, region, { enabled: !!projectId && !!region });
  const { data: igws } = useFetchIgws(projectId, region, { enabled: !!projectId && !!region });
  const [igwChoice, setIgwChoice] = useState({});
  const [isSyncing, setIsSyncing] = useState(false);

  const tables = useMemo(() => routeTables || [], [routeTables]);
  const stats = useMemo(() => {
    const totalRoutes = tables.reduce(
      (sum, rt) => sum + ((rt.routes || []).length ?? 0),
      0
    );
    const mainTablesCount = tables.filter(
      (rt) =>
        rt.main ||
        rt.is_main ||
        (rt.associations || []).some((assoc) => assoc?.main)
    ).length;
    const summary = [
      {
        label: "Route Tables",
        value: tables.length,
        tone: tables.length ? "primary" : "neutral",
      },
      {
        label: "Routes",
        value: totalRoutes,
        tone: totalRoutes ? "info" : "neutral",
      },
    ];
    if (mainTablesCount) {
      summary.push({
        label: "Main Tables",
        value: mainTablesCount,
        tone: "success",
      });
    }
    if (region) {
      summary.push({
        label: "Region",
        value: region,
        tone: "info",
      });
    }
    return summary;
  }, [tables, region]);

  const handleAssociate = (e) => {
    e.preventDefault();
    if (!assocForm.route_table_id || !assocForm.subnet_id) {
      ToastUtils.error("Select both a route table and subnet");
      return;
    }

    associateRouteTable(
      {
        project_id: projectId,
        region,
        route_table_id: assocForm.route_table_id,
        subnet_id: assocForm.subnet_id,
      },
      {
        onSuccess: () => {
          ToastUtils.success("Route table associated");
          setAssocForm({ route_table_id: "", subnet_id: "" });
        },
      }
    );
  };

  const handleAddRoute = (routeTableId) => {
    setSelectedRtId(routeTableId);
    setAddRouteOpen(true);
  };

  const handleSync = async () => {
    if (!projectId || !region) {
      ToastUtils.error("Project and region required to sync route tables");
      return;
    }

    setIsSyncing(true);
    try {
      await syncRouteTablesFromProvider({ project_id: projectId, region });
      await queryClient.invalidateQueries({ queryKey: ["routeTables", { projectId, region }] });
      ToastUtils.success("Route tables synced successfully!");
    } catch (error) {
      console.error("Failed to sync route tables:", error);
      ToastUtils.error(error?.message || "Failed to sync route tables.");
    } finally {
      setIsSyncing(false);
    }
  };

  const syncButton = (
    <ModernButton
      key="sync"
      variant="outline"
      size="sm"
      leftIcon={<RefreshCw size={16} />}
      onClick={handleSync}
      isDisabled={isSyncing || !projectId || !region}
      isLoading={isSyncing}
    >
      {isSyncing ? "Syncing..." : "Sync Route Tables"}
    </ModernButton>
  );

  const addButton = (
    <ModernButton
      key="add"
      variant="primary"
      size="sm"
      leftIcon={<Plus size={16} />}
      onClick={() => setCreateModal(true)}
    >
      Add Route Table
    </ModernButton>
  );

  const emptyState = (
    <ResourceEmptyState
      title="No Route Tables"
      message="Sync from your cloud account or create a route table to control traffic flow."
      action={addButton}
    />
  );

  return (
    <ResourceSection
      title="Route Tables"
      description="Control how traffic flows between subnets and the internet."
      actions={[syncButton, addButton]}
      meta={stats}
      isLoading={isFetching}
    >
      <div className="mb-6 rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-800">
              Associate Route Table to Subnet
            </h3>
            <p className="text-xs text-slate-500">
              Project {projectId || "—"}
              {region ? ` • ${region}` : ""}
            </p>
          </div>
        </div>
        <form
          onSubmit={handleAssociate}
          className="mt-4 grid gap-3 md:grid-cols-[minmax(0,2fr),minmax(0,2fr),minmax(0,1fr)]"
        >
          <select
            className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
            value={assocForm.route_table_id}
            onChange={(e) =>
              setAssocForm({ ...assocForm, route_table_id: e.target.value })
            }
          >
            <option value="">Select Route Table</option>
            {tables.map((rt) => (
              <option key={rt.id} value={rt.id}>
                {rt.name || rt.id}
              </option>
            ))}
          </select>
          <select
            className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
            value={assocForm.subnet_id}
            onChange={(e) =>
              setAssocForm({ ...assocForm, subnet_id: e.target.value })
            }
          >
            <option value="">Select Subnet</option>
            {(subnets || []).map((sn) => (
              <option key={sn.id} value={sn.id}>
                {sn.name || sn.id} ({sn.cidr || sn.cidr_block || "—"})
              </option>
            ))}
          </select>
          <ModernButton
            type="submit"
            variant="primary"
            size="sm"
            isDisabled={associating}
            isLoading={associating}
          >
            {associating ? "Associating..." : "Associate"}
          </ModernButton>
        </form>
      </div>

      {tables.length === 0 ? (
        emptyState
      ) : (
        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {tables.map((rt) => {
            const rtId = rt.id;
            const routes = rt.routes || [];
            const associations = rt.associations || [];
            const gatewayPreference = igwChoice[rtId] || "";
            const isMainTable =
              Boolean(rt.main) ||
              Boolean(rt.is_main) ||
              associations.some((assoc) => assoc?.main);
            const statusLabel = rt.status || (isMainTable ? "Main Table" : "");
            const statuses = [];
            if (statusLabel) {
              statuses.push({
                label: statusLabel,
                tone: isMainTable ? "primary" : "neutral",
              });
            } else if (isMainTable) {
              statuses.push({ label: "Main Table", tone: "primary" });
            }

            return (
              <ResourceListCard
                key={rtId}
                title={rt.name || rtId}
                subtitle={rtId}
                metadata={[
                  { label: "VPC", value: rt.vpc_id || "—" },
                  { label: "Routes", value: routes.length },
                  { label: "Associations", value: associations.length },
                  region ? { label: "Region", value: region } : null,
                ].filter(Boolean)}
                statuses={statuses}
                actions={[
                  {
                    key: "addRoute",
                    label: "Add Route",
                    icon: <Plus size={16} />,
                    variant: "primary",
                    onClick: () => handleAddRoute(rtId),
                  },
                ]}
                footer={
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Gateway preference
                      </label>
                      <select
                        value={gatewayPreference}
                        onChange={(e) =>
                          setIgwChoice((prev) => ({
                            ...prev,
                            [rtId]: e.target.value,
                          }))
                        }
                        className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-100"
                      >
                        <option value="">Auto select</option>
                        {(igws || []).map((g) => (
                          <option key={g.id} value={g.id}>
                            {g.name || g.id}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold text-slate-700">
                        Routes
                      </h4>
                      {routes.length === 0 ? (
                        <p className="text-sm text-slate-500">
                          No routes defined
                        </p>
                      ) : (
                        <ul className="space-y-2">
                          {routes.map((route, idx) => {
                            const destination =
                              route.destination_cidr_block ||
                              route.destination_prefix_list_id ||
                              `Route ${idx + 1}`;
                            const target =
                              route.gateway_id ||
                              route.nat_gateway_id ||
                              route.instance_id ||
                              route.network_interface_id ||
                              "—";
                            return (
                              <li
                                key={`${destination}-${idx}`}
                                className="flex flex-col gap-2 rounded-2xl border border-slate-200 px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
                              >
                                <div className="min-w-0 space-y-1">
                                  <p className="text-sm font-medium text-slate-800">
                                    {destination}
                                  </p>
                                  <p className="text-xs text-slate-500">
                                    Target: {target}
                                  </p>
                                </div>
                                <ModernButton
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-500 hover:text-red-600"
                                  onClick={() =>
                                    deleteRoute(
                                      {
                                        project_id: projectId,
                                        region,
                                        route_table_id: rtId,
                                        destination_cidr_block:
                                          route.destination_cidr_block,
                                        gateway_id: route.gateway_id,
                                        network_interface_id:
                                          route.network_interface_id,
                                        instance_id: route.instance_id,
                                        nat_gateway_id: route.nat_gateway_id,
                                      },
                                      {
                                        onSuccess: () =>
                                          ToastUtils.success("Route removed"),
                                      }
                                    )
                                  }
                                >
                                  Remove
                                </ModernButton>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold text-slate-700">
                        Associations
                      </h4>
                      {associations.length === 0 ? (
                        <p className="text-sm text-slate-500">
                          No associations
                        </p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {associations.map((assoc, idx) => (
                            <span
                              key={`${rtId}-assoc-${idx}`}
                              className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600"
                            >
                              {formatAssociationLabel(assoc)}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                }
              />
            );
          })}
        </div>
      )}

      <AddRouteTable
        isOpen={isCreateModalOpen}
        onClose={() => setCreateModal(false)}
        projectId={projectId}
        region={region}
      />

      <AddRoute
        isOpen={isAddRouteOpen}
        onClose={() => setAddRouteOpen(false)}
        routeTableId={selectedRtId}
        projectId={projectId}
        region={region}
        routeTables={tables}
        defaultGatewayId={igwChoice[selectedRtId] || ""}
      />
    </ResourceSection>
  );
};

export default RouteTables;
