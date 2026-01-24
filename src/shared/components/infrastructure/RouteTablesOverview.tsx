// @ts-nocheck
import React, { useState } from "react";
import {
  Route as RouteIcon,
  Plus,
  Trash2,
  RefreshCw,
  Network,
  Link as LinkIcon,
  Unlink,
  Globe,
  Zap,
} from "lucide-react";
import ModernButton from "../ui/ModernButton";
import ModernCard from "../ui/ModernCard";
import { RouteTablePermissions } from "../../config/permissionPresets";

interface RouteTable {
  id: string;
  name?: string;
  vpc_id?: string;
  is_main?: boolean;
  routes?: {
    destination_cidr_block: string;
    gateway_id?: string;
    nat_gateway_id?: string;
    state?: string;
  }[];
  associations?: {
    route_table_association_id: string;
    subnet_id?: string;
    is_main?: boolean;
    main?: boolean; // legacy API inconsistency handling
  }[];
}

interface RouteTablesOverviewProps {
  routeTables: RouteTable[];
  subnets: any[];
  internetGateways?: any[]; // For Modal
  natGateways?: any[]; // For Modal
  isLoading: boolean;
  permissions: RouteTablePermissions;
  // Actions
  onAddRoute?: (routeTableId: string, data: any) => void;
  onDeleteRoute?: (routeTableId: string, destination: string) => void;
  onAssociate?: (routeTableId: string, subnetId: string) => void;
  onDisassociate?: (associationId: string) => void;
  onRefresh?: () => void;
  // State for Modals (Controlled by Container usually, but Overview can emit "Request")
  // For simplicity, let's let Overview trigger the callbacks, and Container opens/handles Modals if needed?
  // OR Overview owns the "Show Modal" state and renders Modals?
  // Since we extracted Modals, Overview can import and render them if passed the props.
  // Or handle "UI State" internally (Selected ID, Show Add Route Modal).
}

// Importing Modals here to keep Overview self-contained for UI Logic
import AddRouteModal from "./modals/AddRouteModal";
import AssociateSubnetModal from "./modals/AssociateSubnetModal";

const RouteTablesOverview: React.FC<RouteTablesOverviewProps> = ({
  routeTables = [],
  subnets = [],
  internetGateways = [],
  natGateways = [],
  isLoading,
  permissions,
  onAddRoute,
  onDeleteRoute,
  onAssociate,
  onDisassociate,
  onRefresh,
}) => {
  const [selectedRtId, setSelectedRtId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"routes" | "associations">("routes");

  // Modal States
  const [showAddRoute, setShowAddRoute] = useState(false);
  const [showAssociate, setShowAssociate] = useState(false);

  // Auto-select first if none selected
  React.useEffect(() => {
    if (!selectedRtId && routeTables.length > 0) {
      // Optional: don't auto-select to cleaner initial state?
      // Admin UI auto-select disabled initially, Client had simple list.
      // Let's keep explicit selection.
    }
  }, [routeTables, selectedRtId]);

  const selectedRt = routeTables.find((rt) => rt.id === selectedRtId);

  // Handlers wrapper
  const handleAddRoute = (data: any) => {
    if (selectedRtId && onAddRoute) {
      onAddRoute(selectedRtId, data);
      setShowAddRoute(false);
    }
  };

  const handleAssociateSubnet = (subnetId: string) => {
    if (selectedRtId && onAssociate) {
      onAssociate(selectedRtId, subnetId);
      setShowAssociate(false);
    }
  };

  return (
    <>
      <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-280px)] min-h-[500px]">
        {/* Left Panel: List */}
        <div className="w-full lg:w-1/3 flex flex-col gap-4 overflow-y-auto pr-2 border-r border-gray-100">
          <div className="flex items-center justify-between px-1">
            <div className="text-xs font-bold text-gray-500 uppercase tracking-widest">
              Route Tables
            </div>
            {onRefresh && (
              <button
                onClick={onRefresh}
                className="text-gray-400 hover:text-indigo-600 transition-colors"
              >
                <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
              </button>
            )}
          </div>

          {isLoading && routeTables.length === 0 ? (
            <div className="py-12 text-center text-gray-400">Loading route tables...</div>
          ) : routeTables.length === 0 ? (
            <div className="py-12 text-center text-gray-400">No route tables found</div>
          ) : (
            routeTables.map((rt) => (
              <button
                key={rt.id}
                onClick={() => setSelectedRtId(rt.id)}
                className={`w-full text-left p-4 rounded-xl border transition-all ${
                  selectedRtId === rt.id
                    ? "bg-indigo-50 border-indigo-200 shadow-sm"
                    : "bg-white border-transparent hover:border-gray-200 hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="font-bold text-gray-900 truncate pr-2">
                    {rt.name || "Unnamed"}
                  </div>
                  {rt.is_main && (
                    <span className="shrink-0 px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[9px] font-bold rounded uppercase">
                      Main
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-gray-400 font-mono mb-2">{rt.id}</div>
                <div className="flex items-center gap-4 text-[10px] text-gray-500 font-bold uppercase">
                  <span className="flex items-center gap-1">
                    <RouteIcon size={12} /> {rt.routes?.length || 0} Routes
                  </span>
                  <span className="flex items-center gap-1">
                    <Network size={12} /> {rt.associations?.filter((a) => a.subnet_id).length || 0}{" "}
                    Subnets
                  </span>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Right Panel: Details */}
        <div className="w-full lg:w-2/3 flex flex-col h-full bg-white rounded-xl">
          {selectedRt ? (
            <div className="flex flex-col h-full gap-4">
              {/* Header */}
              <div className="flex items-center justify-between p-1">
                <div className="flex bg-gray-100 p-1 rounded-lg">
                  <button
                    onClick={() => setActiveTab("routes")}
                    className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${
                      activeTab === "routes"
                        ? "bg-white text-indigo-600 shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    Routes
                  </button>
                  <button
                    onClick={() => setActiveTab("associations")}
                    className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${
                      activeTab === "associations"
                        ? "bg-white text-indigo-600 shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    Subnet Associations
                  </button>
                </div>

                {activeTab === "routes" && permissions.canManageRoutes && (
                  <ModernButton variant="primary" size="sm" onClick={() => setShowAddRoute(true)}>
                    <Plus size={14} /> Add Route
                  </ModernButton>
                )}

                {activeTab === "associations" && permissions.canManageAssociations && (
                  <ModernButton variant="primary" size="sm" onClick={() => setShowAssociate(true)}>
                    <LinkIcon size={14} /> Associate Subnet
                  </ModernButton>
                )}
              </div>

              {/* Content */}
              <ModernCard className="flex-1 overflow-hidden flex flex-col">
                {activeTab === "routes" ? (
                  <div className="h-full flex flex-col overflow-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b border-gray-100 sticky top-0 z-10">
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
                      <tbody className="divide-y divide-gray-50">
                        {selectedRt.routes?.map((route, i) => (
                          <tr key={i} className="hover:bg-gray-50">
                            <td className="py-3 px-6 font-mono font-medium text-gray-900">
                              {route.destination_cidr_block}
                            </td>
                            <td className="py-3 px-6">
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
                            <td className="py-3 px-6">
                              <span className="px-2 py-0.5 bg-green-50 text-green-700 text-[10px] font-bold rounded uppercase">
                                {route.state || "active"}
                              </span>
                            </td>
                            <td className="py-3 px-6 text-right">
                              {permissions.canManageRoutes &&
                                route.destination_cidr_block !== "local" && (
                                  <button
                                    onClick={() =>
                                      onDeleteRoute?.(selectedRt.id, route.destination_cidr_block)
                                    }
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
                  <div className="p-4 grid grid-cols-1 gap-4 overflow-y-auto">
                    {selectedRt.associations
                      ?.filter((a) => a.subnet_id)
                      .map(
                        (assoc) =>
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
                                    {subnets.find((s) => s.id === assoc.subnet_id)?.name ||
                                      "Subnet"}
                                    {(assoc.is_main || assoc.main) && (
                                      <span className="ml-2 text-[9px] bg-indigo-100 text-indigo-700 px-1 rounded uppercase">
                                        Main
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[10px] text-gray-400 font-mono">
                                    {assoc.subnet_id}
                                  </div>
                                </div>
                              </div>
                              {permissions.canManageAssociations &&
                                !assoc.is_main &&
                                !assoc.main && (
                                  <button
                                    onClick={() =>
                                      onDisassociate?.(assoc.route_table_association_id)
                                    }
                                    className="flex items-center gap-2 px-3 py-1.5 bg-white text-red-600 text-[10px] font-bold rounded-lg border border-red-100 hover:bg-red-50"
                                  >
                                    <Unlink size={12} /> Disassociate
                                  </button>
                                )}
                            </div>
                          )
                      )}
                    {!selectedRt.associations?.filter((a) => a.subnet_id).length && (
                      <div className="text-center py-12 text-gray-400 italic">
                        No subnet associations found.
                      </div>
                    )}
                  </div>
                )}
              </ModernCard>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 p-12">
              <RouteIcon size={48} className="mb-4 opacity-10" />
              <div className="text-lg font-bold">Select a route table</div>
              <div className="text-sm">Choose a route table from the left to manage it</div>
            </div>
          )}
        </div>
      </div>

      <AddRouteModal
        isOpen={showAddRoute}
        onClose={() => setShowAddRoute(false)}
        onAdd={handleAddRoute}
        internetGateways={internetGateways}
        natGateways={natGateways}
        isLoading={isLoading} // Ideally fine-grained loading state per action, but general loading works
      />

      <AssociateSubnetModal
        isOpen={showAssociate}
        onClose={() => setShowAssociate(false)}
        onAssociate={handleAssociateSubnet}
        subnets={subnets}
        isLoading={isLoading}
      />
    </>
  );
};

export default RouteTablesOverview;
