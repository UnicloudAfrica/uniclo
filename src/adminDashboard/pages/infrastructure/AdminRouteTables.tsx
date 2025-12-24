import React, { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Plus, Trash2, RefreshCw, ArrowLeft, Route, Link2 } from "lucide-react";
import ModernButton from "../../../shared/components/ui/ModernButton";
import ModernCard from "../../../shared/components/ui/ModernCard";
import {
  useRouteTables,
  useCreateRoute,
  useDeleteRoute,
} from "../../../hooks/adminHooks/vpcInfraHooks";

interface RouteTable {
  id: string;
  name?: string;
  vpc_id?: string;
  is_main?: boolean;
  routes?: Array<{
    destination_cidr_block?: string;
    gateway_id?: string;
    nat_gateway_id?: string;
    state?: string;
  }>;
  associations?: Array<{
    subnet_id?: string;
    is_main?: boolean;
  }>;
}

const AdminRouteTables: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const projectId = searchParams.get("project") || "";

  const [showAddRouteModal, setShowAddRouteModal] = useState(false);
  const [selectedTable, setSelectedTable] = useState<RouteTable | null>(null);
  const [destCidr, setDestCidr] = useState("");
  const [gatewayId, setGatewayId] = useState("");

  const { data: routeTables = [], isLoading, refetch } = useRouteTables(projectId);
  const { mutate: createRoute, isPending: isCreating } = useCreateRoute();
  const { mutate: deleteRoute, isPending: isDeleting } = useDeleteRoute();

  const handleAddRoute = () => {
    if (!selectedTable || !destCidr) return;
    createRoute(
      {
        projectId,
        payload: {
          route_table_id: selectedTable.id,
          destination_cidr_block: destCidr,
          gateway_id: gatewayId || undefined,
        },
      },
      {
        onSuccess: () => {
          setShowAddRouteModal(false);
          setSelectedTable(null);
          setDestCidr("");
          setGatewayId("");
        },
      }
    );
  };

  const handleDeleteRoute = (routeTableId: string, destCidr: string) => {
    if (confirm("Are you sure you want to delete this route?")) {
      deleteRoute({
        projectId,
        payload: { route_table_id: routeTableId, destination_cidr_block: destCidr },
      });
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <Route className="w-7 h-7 text-indigo-600" />
              Route Tables
            </h1>
            <p className="text-sm text-gray-500 mt-1">Manage routing rules for your VPC subnets</p>
          </div>
        </div>
        <ModernButton variant="secondary" size="sm" onClick={() => refetch()} disabled={isLoading}>
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </ModernButton>
      </div>

      {/* Stats */}
      <ModernCard className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
            <Route className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{routeTables.length}</div>
            <div className="text-sm text-gray-500">Total Route Tables</div>
          </div>
        </div>
      </ModernCard>

      {/* Route Tables List */}
      {isLoading ? (
        <div className="py-12 text-center">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto" />
        </div>
      ) : routeTables.length === 0 ? (
        <ModernCard className="p-12 text-center">
          <Route className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <div className="text-gray-500">No route tables found</div>
        </ModernCard>
      ) : (
        <div className="space-y-4">
          {routeTables.map((table: RouteTable) => (
            <ModernCard key={table.id} className="overflow-hidden">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900">{table.name || "Unnamed"}</span>
                    {table.is_main && (
                      <span className="px-1.5 py-0.5 bg-blue-100 text-blue-600 text-[10px] font-medium rounded">
                        MAIN
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 font-mono mt-1">{table.id}</div>
                </div>
                <ModernButton
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setSelectedTable(table);
                    setShowAddRouteModal(true);
                  }}
                >
                  <Plus className="w-4 h-4" />
                  Add Route
                </ModernButton>
              </div>
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-2 px-4 text-xs font-semibold text-gray-600 uppercase">
                      Destination
                    </th>
                    <th className="text-left py-2 px-4 text-xs font-semibold text-gray-600 uppercase">
                      Target
                    </th>
                    <th className="text-left py-2 px-4 text-xs font-semibold text-gray-600 uppercase">
                      Status
                    </th>
                    <th className="text-right py-2 px-4 text-xs font-semibold text-gray-600 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(table.routes || []).map((route, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="py-2 px-4 font-mono text-sm">
                        {route.destination_cidr_block}
                      </td>
                      <td className="py-2 px-4 text-sm">
                        {route.gateway_id ? (
                          <span className="px-2 py-0.5 bg-green-50 text-green-700 text-xs rounded">
                            IGW: {route.gateway_id}
                          </span>
                        ) : route.nat_gateway_id ? (
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded">
                            NAT: {route.nat_gateway_id}
                          </span>
                        ) : (
                          <span className="text-gray-400">Local</span>
                        )}
                      </td>
                      <td className="py-2 px-4">
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                          {route.state || "active"}
                        </span>
                      </td>
                      <td className="py-2 px-4 text-right">
                        {route.destination_cidr_block !== "local" && (
                          <button
                            onClick={() =>
                              handleDeleteRoute(table.id, route.destination_cidr_block || "")
                            }
                            disabled={isDeleting}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {(!table.routes || table.routes.length === 0) && (
                    <tr>
                      <td colSpan={4} className="py-4 text-center text-gray-400">
                        No routes
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </ModernCard>
          ))}
        </div>
      )}

      {/* Add Route Modal */}
      {showAddRouteModal && selectedTable && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 m-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Add Route</h2>
            <div className="mb-3 p-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-500">Route Table</div>
              <div className="font-medium">{selectedTable.name || selectedTable.id}</div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Destination CIDR *
                </label>
                <input
                  type="text"
                  value={destCidr}
                  onChange={(e) => setDestCidr(e.target.value)}
                  placeholder="0.0.0.0/0"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Target (Gateway ID)
                </label>
                <input
                  type="text"
                  value={gatewayId}
                  onChange={(e) => setGatewayId(e.target.value)}
                  placeholder="igw-xxxxxxxxx or nat-xxxxxxxxx"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <ModernButton variant="secondary" onClick={() => setShowAddRouteModal(false)}>
                Cancel
              </ModernButton>
              <ModernButton
                variant="primary"
                onClick={handleAddRoute}
                disabled={!destCidr || isCreating}
              >
                {isCreating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  "Add Route"
                )}
              </ModernButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminRouteTables;
