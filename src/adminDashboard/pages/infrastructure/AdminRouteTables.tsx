import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Plus,
  Trash2,
  RefreshCw,
  Route,
  Link,
  Unlink,
  Globe,
  Zap,
  Network,
  ChevronRight,
} from "lucide-react";
import AdminHeadbar from "../../components/adminHeadbar";
import AdminSidebar from "../../components/AdminSidebar";
import AdminPageShell from "../../components/AdminPageShell";
import ModernButton from "../../../shared/components/ui/ModernButton";
import ModernCard from "../../../shared/components/ui/ModernCard";
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
  destination_cidr_block: string;
  gateway_id?: string;
  nat_gateway_id?: string;
  state?: string;
}

interface Association {
  route_table_association_id: string;
  subnet_id?: string;
  is_main?: boolean;
}

interface RouteTable {
  id: string;
  name?: string;
  vpc_id?: string;
  is_main?: boolean;
  routes?: RouteEntry[];
  associations?: Association[];
}

const AdminRouteTables: React.FC = () => {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("project") || "";

  const [selectedRtId, setSelectedRtId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"routes" | "subnets">("routes");
  const [showAddRoute, setShowAddRoute] = useState(false);
  const [showAssociate, setShowAssociate] = useState(false);

  const [newRoute, setNewRoute] = useState({
    destination_cidr_block: "0.0.0.0/0",
    gateway_id: "",
    nat_gateway_id: "",
  });

  const [assocSubnetId, setAssocSubnetId] = useState("");

  const { data: routeTables = [], isLoading, refetch } = useRouteTables(projectId);
  const { data: subnets = [] } = useSubnets(projectId);
  const { data: igws = [] } = useInternetGateways(projectId);
  const { data: nats = [] } = useNatGateways(projectId);

  const createRouteMutation = useCreateRoute();
  const deleteRouteMutation = useDeleteRoute();
  const associateMutation = useAssociateRouteTable();
  const disassociateMutation = useDisassociateRouteTable();

  const selectedRt = routeTables.find((rt: RouteTable) => rt.id === selectedRtId);

  const handleCreateRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRt) return;
    await createRouteMutation.mutateAsync({
      projectId,
      payload: { ...newRoute, route_table_id: selectedRt.id },
    });
    setShowAddRoute(false);
    setNewRoute({ destination_cidr_block: "0.0.0.0/0", gateway_id: "", nat_gateway_id: "" });
  };

  const handleDeleteRoute = async (dest: string) => {
    if (!selectedRt) return;
    if (confirm(`Delete route to ${dest}?`)) {
      await deleteRouteMutation.mutateAsync({
        projectId,
        payload: { route_table_id: selectedRt.id, destination_cidr_block: dest },
      });
    }
  };

  const handleAssociate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRt || !assocSubnetId) return;
    await associateMutation.mutateAsync({
      projectId,
      routeTableId: selectedRt.id,
      subnetId: assocSubnetId,
    });
    setShowAssociate(false);
    setAssocSubnetId("");
  };

  const handleDisassociate = async (assocId: string) => {
    if (confirm("Disassociate this subnet?")) {
      await disassociateMutation.mutateAsync({
        projectId,
        associationId: assocId,
      });
    }
  };

  return (
    <>
      <AdminHeadbar />
      <AdminSidebar />
      <AdminPageShell
        title="Route Tables"
        description="Manage network traffic routing across subnets and gateways"
        icon={<Route className="w-6 h-6 text-indigo-600" />}
        breadcrumbs={[
          { label: "Home", href: "/admin-dashboard" },
          { label: "Infrastructure", href: "/admin-dashboard/projects" },
          { label: "Route Tables" },
        ]}
        actions={
          <ModernButton
            variant="secondary"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </ModernButton>
        }
      >
        <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-280px)]">
          {/* Left Panel: List */}
          <div className="w-full lg:w-1/3 flex flex-col gap-4 overflow-y-auto pr-2">
            {isLoading ? (
              <div className="py-12 text-center">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto text-indigo-500" />
              </div>
            ) : routeTables.length === 0 ? (
              <div className="py-12 text-center text-gray-400">No route tables found</div>
            ) : (
              routeTables.map((rt: RouteTable) => (
                <button
                  key={rt.id}
                  onClick={() => setSelectedRtId(rt.id)}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${
                    selectedRtId === rt.id
                      ? "bg-indigo-50 border-indigo-200 shadow-sm"
                      : "bg-white border-transparent hover:border-gray-200"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-bold text-gray-900 truncate">{rt.name || "Unnamed"}</div>
                    {rt.is_main && (
                      <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[9px] font-bold rounded uppercase">
                        Main
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-gray-400 font-mono mb-2">{rt.id}</div>
                  <div className="flex items-center gap-4 text-[10px] text-gray-500 font-bold uppercase">
                    <span className="flex items-center gap-1">
                      <Route size={10} /> {rt.routes?.length || 0} Routes
                    </span>
                    <span className="flex items-center gap-1">
                      <Network size={10} />{" "}
                      {rt.associations?.filter((a: Association) => a.subnet_id).length || 0} Subnets
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Right Panel: Details */}
          <div className="w-full lg:w-2/3">
            {selectedRt ? (
              <div className="flex flex-col h-full gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex bg-gray-100 p-1 rounded-lg">
                    <button
                      onClick={() => setActiveTab("routes")}
                      className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${activeTab === "routes" ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                    >
                      Routes
                    </button>
                    <button
                      onClick={() => setActiveTab("subnets")}
                      className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${activeTab === "subnets" ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                    >
                      Subnet Associations
                    </button>
                  </div>
                  <ModernButton
                    variant="primary"
                    size="sm"
                    onClick={() =>
                      activeTab === "routes" ? setShowAddRoute(true) : setShowAssociate(true)
                    }
                  >
                    <Plus size={14} /> {activeTab === "routes" ? "Add Route" : "Associate Subnet"}
                  </ModernButton>
                </div>

                <ModernCard className="flex-1 overflow-hidden relative">
                  {activeTab === "routes" ? (
                    <div className="h-full flex flex-col">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b">
                          <tr>
                            <th className="text-left py-3 px-6 text-[10px] font-bold text-gray-500 uppercase">
                              Destination
                            </th>
                            <th className="text-left py-3 px-6 text-[10px] font-bold text-gray-500 uppercase">
                              Target
                            </th>
                            <th className="text-left py-3 px-6 text-[10px] font-bold text-gray-500 uppercase">
                              Status
                            </th>
                            <th className="text-right py-3 px-6 text-[10px] font-bold text-gray-500 uppercase">
                              Action
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 overflow-y-auto">
                          {selectedRt.routes?.map((route: RouteEntry, i: number) => (
                            <tr key={i} className="hover:bg-gray-50">
                              <td className="py-4 px-6 font-mono font-medium text-gray-900">
                                {route.destination_cidr_block}
                              </td>
                              <td className="py-4 px-6">
                                {route.gateway_id ? (
                                  <div className="flex items-center gap-2 text-indigo-600 font-medium">
                                    <Globe size={14} /> {route.gateway_id}
                                  </div>
                                ) : route.nat_gateway_id ? (
                                  <div className="flex items-center gap-2 text-blue-600 font-medium">
                                    <Zap size={14} /> {route.nat_gateway_id}
                                  </div>
                                ) : (
                                  <div className="text-gray-400 italic">local</div>
                                )}
                              </td>
                              <td className="py-4 px-6">
                                <span className="px-2 py-0.5 bg-green-50 text-green-700 text-[10px] font-bold rounded uppercase italic">
                                  {route.state || "active"}
                                </span>
                              </td>
                              <td className="py-4 px-6 text-right">
                                {route.destination_cidr_block !== "local" && (
                                  <button
                                    onClick={() => handleDeleteRoute(route.destination_cidr_block)}
                                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedRt.associations
                        ?.filter((a: Association) => a.subnet_id)
                        .map(
                          (assoc: Association) =>
                            assoc.subnet_id && (
                              <div
                                key={assoc.route_table_association_id}
                                className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100"
                              >
                                <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-gray-100 shadow-sm text-indigo-600">
                                    <Network size={20} />
                                  </div>
                                  <div>
                                    <div className="font-bold text-gray-900">
                                      {subnets.find((s: any) => s.id === assoc.subnet_id)?.name ||
                                        "Subnet"}
                                    </div>
                                    <div className="text-[10px] text-gray-400 font-mono">
                                      {assoc.subnet_id}
                                    </div>
                                  </div>
                                </div>
                                {!assoc.is_main && (
                                  <button
                                    onClick={() =>
                                      handleDisassociate(assoc.route_table_association_id)
                                    }
                                    className="flex items-center gap-2 px-3 py-1.5 bg-white text-red-600 text-[10px] font-bold rounded-lg border border-red-100 hover:bg-red-50"
                                  >
                                    <Unlink size={12} /> DISASSOCIATE
                                  </button>
                                )}
                              </div>
                            )
                        )}
                      {selectedRt.associations?.filter((a: Association) => a.subnet_id).length ===
                        0 && (
                        <div className="py-12 text-center text-gray-400 italic">
                          No subnets associated with this route table
                        </div>
                      )}
                    </div>
                  )}

                  {/* Forms Overlays */}
                  {showAddRoute && (
                    <div className="absolute inset-0 bg-white/95 backdrop-blur-sm z-10 p-6">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold text-gray-900 flex items-center gap-2">
                          <Plus size={18} className="text-indigo-600" /> Add New Route
                        </h3>
                        <button
                          onClick={() => setShowAddRoute(false)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <Plus className="w-6 h-6 rotate-45" />
                        </button>
                      </div>
                      <form onSubmit={handleCreateRoute} className="space-y-4 max-w-md">
                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5 tracking-widest">
                            Destination CIDR
                          </label>
                          <input
                            required
                            type="text"
                            value={newRoute.destination_cidr_block}
                            onChange={(e) =>
                              setNewRoute({ ...newRoute, destination_cidr_block: e.target.value })
                            }
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono text-sm outline-none"
                            placeholder="0.0.0.0/0"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5 tracking-widest">
                            Target Internet Gateway (Optional)
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
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm outline-none bg-white"
                          >
                            <option value="">Select Gateway (Optional)</option>
                            {igws.map((igw: any) => (
                              <option key={igw.id} value={igw.id}>
                                {igw.name || igw.id}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5 tracking-widest">
                            Target NAT Gateway (Optional)
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
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm outline-none bg-white"
                          >
                            <option value="">Select NAT (Optional)</option>
                            {nats.map((nat: any) => (
                              <option key={nat.id} value={nat.id}>
                                {nat.name || nat.id}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="pt-2">
                          <ModernButton
                            type="submit"
                            variant="primary"
                            className="w-full"
                            disabled={createRouteMutation.isPending}
                          >
                            {createRouteMutation.isPending ? "Creating..." : "Add Route"}
                          </ModernButton>
                        </div>
                      </form>
                    </div>
                  )}

                  {showAssociate && (
                    <div className="absolute inset-0 bg-white/95 backdrop-blur-sm z-10 p-6">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold text-gray-900 flex items-center gap-2">
                          <Link size={18} className="text-indigo-600" /> Associate Subnet
                        </h3>
                        <button
                          onClick={() => setShowAssociate(false)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <Plus className="w-6 h-6 rotate-45" />
                        </button>
                      </div>
                      <form onSubmit={handleAssociate} className="space-y-4 max-w-md">
                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5 tracking-widest">
                            Select Subnet
                          </label>
                          <select
                            required
                            value={assocSubnetId}
                            onChange={(e) => setAssocSubnetId(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm outline-none bg-white"
                          >
                            <option value="">Choose Subnet...</option>
                            {subnets.map((s: any) => (
                              <option key={s.id} value={s.id}>
                                {s.name || s.id} ({s.cidr_block})
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="pt-2">
                          <ModernButton
                            type="submit"
                            variant="primary"
                            className="w-full"
                            disabled={associateMutation.isPending}
                          >
                            {associateMutation.isPending ? "Associating..." : "Save Association"}
                          </ModernButton>
                        </div>
                      </form>
                    </div>
                  )}
                </ModernCard>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200 p-12">
                <Route size={48} className="mb-4 opacity-10" />
                <div className="text-lg font-bold">Select a route table</div>
                <div className="text-sm">Choose a route table from the left to manage it</div>
              </div>
            )}
          </div>
        </div>
      </AdminPageShell>
    </>
  );
};

export default AdminRouteTables;
