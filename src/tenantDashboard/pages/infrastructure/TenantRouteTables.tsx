import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Route as RouteIcon,
  Plus,
  Trash2,
  Network,
  Link as LinkIcon,
  Unlink,
  Globe,
  Zap,
} from "lucide-react";
import TenantPageShell from "../../components/TenantPageShell";
import ModernCard from "../../../shared/components/ui/ModernCard";
import ModernButton from "../../../shared/components/ui/ModernButton";
import {
  useRouteTables,
  useCreateRoute,
  useDeleteRoute,
  useAssociateRouteTable,
  useDisassociateRouteTable,
  useSubnets,
  useInternetGateways,
  useNatGateways,
} from "../../../hooks/adminHooks/vpcInfraHooks";

interface RouteEntry {
  destination_cidr_block?: string;
  gateway_id?: string;
  nat_gateway_id?: string;
  state?: string;
}

interface Association {
  route_table_association_id: string;
  subnet_id?: string;
  main?: boolean;
}

interface RouteTable {
  id: string;
  name?: string;
  vpc_id?: string;
  routes?: RouteEntry[];
  associations?: Association[];
}

const TenantRouteTables: React.FC = () => {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("project") || "";

  const [activeTab, setActiveTab] = useState<"routes" | "associations">("routes");
  const [selectedRtId, setSelectedRtId] = useState<string | null>(null);
  const [showAddRoute, setShowAddRoute] = useState(false);
  const [showAssociate, setShowAssociate] = useState(false);

  const [newRoute, setNewRoute] = useState({
    destination_cidr_block: "0.0.0.0/0",
    gateway_id: "",
    nat_gateway_id: "",
  });

  const [associationPayload, setAssociationPayload] = useState({
    subnet_id: "",
  });

  const { data: routeTables = [], isLoading } = useRouteTables(projectId);
  const { data: subnets = [] } = useSubnets(projectId);
  const { data: igws = [] } = useInternetGateways(projectId);
  const { data: nats = [] } = useNatGateways(projectId);

  const createRouteMutation = useCreateRoute();
  const deleteRouteMutation = useDeleteRoute();
  const associateMutation = useAssociateRouteTable();
  const disassociateMutation = useDisassociateRouteTable();

  const selectedRt = routeTables.find((rt: RouteTable) => rt.id === selectedRtId) || routeTables[0];

  const handleCreateRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRt) return;

    await createRouteMutation.mutateAsync({
      projectId,
      payload: {
        ...newRoute,
        route_table_id: selectedRt.id,
      },
    });
    setShowAddRoute(false);
    setNewRoute({ destination_cidr_block: "0.0.0.0/0", gateway_id: "", nat_gateway_id: "" });
  };

  const handleDeleteRoute = async (destination: string) => {
    if (!selectedRt) return;
    if (window.confirm(`Delete route to ${destination}?`)) {
      await deleteRouteMutation.mutateAsync({
        projectId,
        payload: {
          route_table_id: selectedRt.id,
          destination_cidr_block: destination,
        },
      });
    }
  };

  const handleAssociate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRt) return;

    await associateMutation.mutateAsync({
      projectId,
      routeTableId: selectedRt.id,
      subnetId: associationPayload.subnet_id,
    });
    setShowAssociate(false);
    setAssociationPayload({ subnet_id: "" });
  };

  const handleDisassociate = async (assocId: string) => {
    if (window.confirm("Disassociate this subnet from the route table?")) {
      await disassociateMutation.mutateAsync({
        projectId,
        associationId: assocId,
      });
    }
  };

  return (
    <TenantPageShell
      title={
        <span className="flex items-center gap-2">
          <RouteIcon className="w-5 h-5 text-indigo-600" />
          Route Tables
        </span>
      }
      description="Manage routing rules for your VPC subnets"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel: List of Route Tables */}
        <div className="lg:col-span-1 space-y-3">
          <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 px-1">
            Select Route Table
          </div>
          {isLoading ? (
            <div className="py-8 text-center">
              <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : routeTables.length === 0 ? (
            <ModernCard className="p-6 text-center text-gray-400 text-sm">
              No route tables
            </ModernCard>
          ) : (
            routeTables.map((rt: RouteTable) => (
              <button
                key={rt.id}
                onClick={() => {
                  setSelectedRtId(rt.id);
                  setShowAddRoute(false);
                  setShowAssociate(false);
                }}
                className={`w-full text-left p-4 rounded-xl border transition-all ${
                  selectedRtId === rt.id || (!selectedRtId && rt === routeTables[0])
                    ? "bg-indigo-50 border-indigo-200 ring-2 ring-indigo-500/10 shadow-sm"
                    : "bg-white border-gray-100 hover:border-gray-300 hover:shadow-sm"
                }`}
              >
                <div className="font-bold text-gray-900 truncate">{rt.name || "Unnamed RT"}</div>
                <div className="text-[10px] font-mono text-gray-400 mt-1 uppercase tracking-tight">
                  {rt.id}
                </div>
                <div className="flex items-center gap-3 mt-3">
                  <div className="flex items-center gap-1 text-[10px] font-bold text-indigo-600 bg-indigo-100 px-1.5 py-0.5 rounded uppercase">
                    <RouteIcon size={10} /> {rt.routes?.length || 0} Routes
                  </div>
                  <div className="flex items-center gap-1 text-[10px] font-bold text-teal-600 bg-teal-100 px-1.5 py-0.5 rounded uppercase">
                    <LinkIcon size={10} /> {rt.associations?.length || 0} Subnets
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Right Panel: Details/Management */}
        <div className="lg:col-span-2">
          {!selectedRt && !isLoading ? (
            <ModernCard className="h-full flex flex-col items-center justify-center p-12 text-center text-gray-400">
              <RouteIcon className="w-12 h-12 mb-4 opacity-20" />
              Select a route table to view details
            </ModernCard>
          ) : (
            <div className="space-y-6">
              {/* Header Info */}
              <ModernCard className="p-6 bg-gradient-to-br from-indigo-50 to-white">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      {selectedRt?.name || "Route Table Details"}
                    </h2>
                    <p className="text-xs text-gray-500 font-mono mt-1">{selectedRt?.id}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[10px] font-bold text-gray-400 uppercase">VPC:</span>
                      <span className="text-xs font-mono text-gray-600">{selectedRt?.vpc_id}</span>
                    </div>
                  </div>
                  <div className="flex bg-white p-1 rounded-lg border border-gray-200">
                    <button
                      onClick={() => setActiveTab("routes")}
                      className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${
                        activeTab === "routes"
                          ? "bg-indigo-600 text-white"
                          : "text-gray-500 hover:bg-gray-50"
                      }`}
                    >
                      Routes
                    </button>
                    <button
                      onClick={() => setActiveTab("associations")}
                      className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${
                        activeTab === "associations"
                          ? "bg-indigo-600 text-white"
                          : "text-gray-500 hover:bg-gray-50"
                      }`}
                    >
                      Subnets
                    </button>
                  </div>
                </div>
              </ModernCard>

              {/* Tab Content: Routes */}
              {activeTab === "routes" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-gray-700 uppercase tracking-widest">
                      Routing Table Entries
                    </h3>
                    <ModernButton
                      size="sm"
                      variant="primary"
                      onClick={() => setShowAddRoute(!showAddRoute)}
                    >
                      <Plus size={14} /> Add Route
                    </ModernButton>
                  </div>

                  {showAddRoute && (
                    <ModernCard className="p-4 bg-indigo-50 border-indigo-200 slide-down">
                      <form
                        onSubmit={handleCreateRoute}
                        className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full"
                      >
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-500 uppercase">
                            Destination CIDR
                          </label>
                          <input
                            required
                            type="text"
                            value={newRoute.destination_cidr_block}
                            onChange={(e) =>
                              setNewRoute({ ...newRoute, destination_cidr_block: e.target.value })
                            }
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500"
                            placeholder="0.0.0.0/0"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-500 uppercase">
                            Target Gateway (IGW)
                          </label>
                          <select
                            value={newRoute.gateway_id}
                            onChange={(e) =>
                              setNewRoute({
                                ...newRoute,
                                gateway_id: e.target.value,
                                nat_gateway_id: "",
                              })
                            }
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500"
                          >
                            <option value="">None / LOCAL</option>
                            {igws.map((igw: any) => (
                              <option key={igw.id} value={igw.id}>
                                {igw.name || igw.id}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-500 uppercase">
                            Target NAT Gateway
                          </label>
                          <select
                            value={newRoute.nat_gateway_id}
                            onChange={(e) =>
                              setNewRoute({
                                ...newRoute,
                                nat_gateway_id: e.target.value,
                                gateway_id: "",
                              })
                            }
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500"
                          >
                            <option value="">None</option>
                            {nats.map((nat: any) => (
                              <option key={nat.id} value={nat.id}>
                                {nat.name || nat.id}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="md:col-span-3 flex justify-end gap-2 mt-2">
                          <ModernButton
                            size="sm"
                            variant="secondary"
                            onClick={() => setShowAddRoute(false)}
                          >
                            Cancel
                          </ModernButton>
                          <ModernButton
                            size="sm"
                            variant="primary"
                            type="submit"
                            disabled={createRouteMutation.isPending}
                          >
                            {createRouteMutation.isPending ? "Adding..." : "Save Route"}
                          </ModernButton>
                        </div>
                      </form>
                    </ModernCard>
                  )}

                  <ModernCard className="overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="text-left py-4 px-6 font-semibold text-gray-600 uppercase tracking-tighter">
                            Destination
                          </th>
                          <th className="text-left py-4 px-6 font-semibold text-gray-600 uppercase tracking-tighter">
                            Target
                          </th>
                          <th className="text-left py-4 px-6 font-semibold text-gray-600 uppercase tracking-tighter">
                            Status
                          </th>
                          <th className="text-right py-4 px-6 font-semibold text-gray-600 uppercase tracking-tighter">
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {selectedRt?.routes?.map((route: RouteEntry, i: number) => (
                          <tr key={i} className="hover:bg-gray-50">
                            <td className="py-4 px-6 font-mono font-medium text-gray-900">
                              {route.destination_cidr_block}
                            </td>
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-2">
                                {route.gateway_id ? (
                                  <>
                                    <Globe size={14} className="text-blue-500" />{" "}
                                    <span className="text-xs font-mono">{route.gateway_id}</span>
                                  </>
                                ) : route.nat_gateway_id ? (
                                  <>
                                    <Zap size={14} className="text-yellow-500" />{" "}
                                    <span className="text-xs font-mono">
                                      {route.nat_gateway_id}
                                    </span>
                                  </>
                                ) : (
                                  <span className="text-xs font-bold text-gray-400 italic">
                                    local
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                  route.state === "active"
                                    ? "bg-green-100 text-green-700"
                                    : "bg-gray-100 text-gray-500"
                                }`}
                              >
                                {route.state || "unknown"}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-right">
                              {route.destination_cidr_block !== "10.0.0.0/16" && ( // Example protected local route
                                <button
                                  disabled={deleteRouteMutation.isPending}
                                  onClick={() =>
                                    handleDeleteRoute(route.destination_cidr_block || "")
                                  }
                                  className="text-gray-400 hover:text-red-600 p-1 rounded hover:bg-red-50"
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </ModernCard>
                </div>
              )}

              {/* Tab Content: Associations */}
              {activeTab === "associations" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-gray-700 uppercase tracking-widest">
                      Subnet Associations
                    </h3>
                    <ModernButton
                      size="sm"
                      variant="primary"
                      onClick={() => setShowAssociate(!showAssociate)}
                    >
                      <LinkIcon size={14} /> Edit Subnet Association
                    </ModernButton>
                  </div>

                  {showAssociate && (
                    <ModernCard className="p-4 bg-teal-50 border-teal-200">
                      <form
                        onSubmit={handleAssociate}
                        className="flex flex-col md:flex-row items-end gap-3"
                      >
                        <div className="flex-1 space-y-1 w-full">
                          <label className="text-[10px] font-bold text-gray-500 uppercase">
                            Select Subnet to Associate
                          </label>
                          <select
                            required
                            value={associationPayload.subnet_id}
                            onChange={(e) => setAssociationPayload({ subnet_id: e.target.value })}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-teal-500"
                          >
                            <option value="">Choose Subnet...</option>
                            {subnets.map((s: any) => (
                              <option key={s.id} value={s.id}>
                                {s.name || s.id} ({s.cidr_block})
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="flex gap-2">
                          <ModernButton
                            size="sm"
                            variant="secondary"
                            onClick={() => setShowAssociate(false)}
                          >
                            Cancel
                          </ModernButton>
                          <ModernButton
                            size="sm"
                            variant="primary"
                            type="submit"
                            disabled={associateMutation.isPending}
                          >
                            {associateMutation.isPending ? "Associating..." : "Associate"}
                          </ModernButton>
                        </div>
                      </form>
                    </ModernCard>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedRt?.associations?.map(
                      (assoc: Association) =>
                        assoc.subnet_id && (
                          <ModernCard
                            key={assoc.route_table_association_id}
                            className="p-4 flex items-center justify-between"
                          >
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-indigo-50 rounded-lg">
                                <Network size={16} className="text-indigo-600" />
                              </div>
                              <div>
                                <div className="text-sm font-bold text-gray-900">
                                  {subnets.find((s: any) => s.id === assoc.subnet_id)?.name ||
                                    "Subnet"}
                                  {assoc.main && (
                                    <span className="ml-2 px-1.5 py-0.5 bg-indigo-600 text-[10px] text-white rounded">
                                      MAIN
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10px] font-mono text-gray-400">
                                  {assoc.subnet_id}
                                </div>
                              </div>
                            </div>
                            {!assoc.main && (
                              <button
                                onClick={() => handleDisassociate(assoc.route_table_association_id)}
                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                                title="Disassociate"
                              >
                                <Unlink size={16} />
                              </button>
                            )}
                          </ModernCard>
                        )
                    )}
                    {(!selectedRt?.associations || selectedRt.associations.length === 0) && (
                      <div className="md:col-span-2 py-8 text-center text-gray-400 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                        No direct subnet associations found.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </TenantPageShell>
  );
};

export default TenantRouteTables;
