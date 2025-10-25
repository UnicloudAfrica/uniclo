import { useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
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
    <button
      onClick={handleSync}
      disabled={isSyncing || !projectId || !region}
      className="flex items-center gap-2 rounded-full py-2.5 px-5 bg-white border border-[#288DD1] text-[#288DD1] text-sm hover:bg-[#288DD1] hover:text-white transition-colors disabled:opacity-50"
    >
      <RefreshCw className={`w-4 h-4 ${isSyncing ? "animate-spin" : ""}`} />
      {isSyncing ? "Syncing..." : "Sync Route Tables"}
    </button>
  );

  const addButton = (
    <button
      onClick={() => setCreateModal(true)}
      className="rounded-full py-3 px-9 bg-[#288DD1] text-white font-medium text-sm hover:bg-[#1976D2] transition-colors"
    >
      Add Route Table
    </button>
  );

  const emptyState = (
    <ResourceEmptyState
      title="No Route Tables"
      message="Sync from the provider or create a route table to control traffic flow."
      action={addButton}
    />
  );

  return (
    <ResourceSection
      title="Route Tables"
      description="Control how traffic flows between subnets and the internet."
      actions={[syncButton, addButton]}
      isLoading={isFetching}
    >
      <section className="bg-white border border-gray-100 rounded-xl p-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold text-gray-700">Associate Route Table to Subnet</h3>
            <p className="text-xs text-gray-500">Project {projectId || "—"} {region && `• ${region}`}</p>
          </div>
        </div>
        <form onSubmit={handleAssociate} className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <select
            className="border rounded px-3 py-2"
            value={assocForm.route_table_id}
            onChange={(e) => setAssocForm({ ...assocForm, route_table_id: e.target.value })}
          >
            <option value="">Select Route Table</option>
            {tables.map((rt) => (
              <option key={rt.id} value={rt.id}>
                {rt.name || rt.id}
              </option>
            ))}
          </select>
          <select
            className="border rounded px-3 py-2"
            value={assocForm.subnet_id}
            onChange={(e) => setAssocForm({ ...assocForm, subnet_id: e.target.value })}
          >
            <option value="">Select Subnet</option>
            {(subnets || []).map((sn) => (
              <option key={sn.id} value={sn.id}>
                {sn.name || sn.id} ({sn.cidr || sn.cidr_block})
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={associating}
            className="bg-[#288DD1] text-white rounded-full px-4 py-2 text-sm disabled:opacity-50"
          >
            {associating ? "Associating..." : "Associate"}
          </button>
        </form>
      </section>

      {tables.length === 0 ? (
        emptyState
      ) : (
        <div className="grid gap-4">
          {tables.map((rt) => {
            const rtId = rt.id;
            const routes = rt.routes || [];
            const associations = rt.associations || [];
            return (
              <div key={rtId} className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-800">{rt.name || rtId}</h3>
                    <p className="text-xs text-gray-500">ID: {rtId}</p>
                  </div>
                  {rt.vpc_id && (
                    <span className="text-xs text-gray-500">VPC: {rt.vpc_id}</span>
                  )}
                </div>

                <div className="mt-4 border-t pt-3">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold">Routes</h4>
                    <div className="flex items-center gap-2">
                      <select
                        value={igwChoice[rtId] || ""}
                        onChange={(e) => setIgwChoice((prev) => ({ ...prev, [rtId]: e.target.value }))}
                        className="border rounded px-2 py-1 text-xs"
                      >
                        <option value="">IGW: Auto</option>
                        {(igws || []).map((g) => (
                          <option key={g.id} value={g.id}>
                            {g.name || g.id}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => handleAddRoute(rtId)}
                        className="rounded-full px-3 py-1.5 bg-[#288DD1] text-white text-xs"
                      >
                        Add Route
                      </button>
                    </div>
                  </div>
                  <ul className="space-y-2 text-sm">
                    {routes.length === 0 && (
                      <li className="text-gray-500">No routes defined</li>
                    )}
                    {routes.map((route, idx) => (
                      <li key={`${route.destination_cidr_block}-${idx}`} className="flex items-center justify-between">
                        <div>
                          <p className="text-gray-800">
                            {route.destination_cidr_block}
                          </p>
                          <p className="text-xs text-gray-500">
                            Target: {route.gateway_id || route.nat_gateway_id || route.instance_id || "—"}
                          </p>
                        </div>
                        <button
                          onClick={() =>
                            deleteRoute(
                              {
                                project_id: projectId,
                                region,
                                route_table_id: rtId,
                                destination_cidr_block: route.destination_cidr_block,
                                gateway_id: route.gateway_id,
                                network_interface_id: route.network_interface_id,
                                instance_id: route.instance_id,
                                nat_gateway_id: route.nat_gateway_id,
                              },
                              {
                                onSuccess: () => ToastUtils.success("Route removed"),
                              }
                            )
                          }
                          className="text-xs text-red-500"
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-4 border-t pt-3">
                  <h4 className="text-sm font-semibold mb-2">Associations</h4>
                  <ul className="text-sm list-disc ml-4">
                    {associations.length === 0 && <li className="text-gray-500">No associations</li>}
                    {associations.map((assoc, idx) => (
                      <li key={`${rtId}-assoc-${idx}`}>{formatAssociationLabel(assoc)}</li>
                    ))}
                  </ul>
                </div>
              </div>
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
