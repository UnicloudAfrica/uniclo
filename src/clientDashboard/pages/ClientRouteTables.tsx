import React from "react";
import { useSearchParams } from "react-router-dom";
import { Route as RouteIcon } from "lucide-react";
import ClientPageShell from "../components/ClientPageShell";
import ModernCard from "../../shared/components/ui/ModernCard";
import { useRouteTables } from "../../hooks/adminHooks/vpcInfraHooks";

interface RouteTable {
  id: string;
  name?: string;
  vpc_id?: string;
  routes?: Array<{
    destination_cidr_block?: string;
    gateway_id?: string;
    nat_gateway_id?: string;
  }>;
}

const ClientRouteTables: React.FC = () => {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("project") || "";

  const { data: routeTables = [], isLoading } = useRouteTables(projectId);

  return (
    <ClientPageShell
      title={
        <span className="flex items-center gap-2">
          <RouteIcon className="w-5 h-5 text-indigo-600" />
          Route Tables
        </span>
      }
      description="Routing rules for your VPC subnets"
    >
      <ModernCard className="p-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
            <RouteIcon className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{routeTables.length}</div>
            <div className="text-sm text-gray-500">Total Route Tables</div>
          </div>
        </div>
      </ModernCard>

      {isLoading ? (
        <div className="py-12 text-center">
          <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : routeTables.length === 0 ? (
        <ModernCard className="p-12 text-center">
          <RouteIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <div className="text-gray-500">No route tables found</div>
        </ModernCard>
      ) : (
        <div className="space-y-4">
          {routeTables.map((rt: RouteTable) => (
            <ModernCard key={rt.id} className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="font-medium text-gray-900">{rt.name || "Unnamed"}</div>
                  <div className="text-xs text-gray-500 font-mono">{rt.id}</div>
                </div>
              </div>
              {rt.routes && rt.routes.length > 0 && (
                <div className="mt-3">
                  <div className="text-xs font-semibold text-gray-600 uppercase mb-2">
                    Routes ({rt.routes.length})
                  </div>
                  <div className="bg-gray-50 rounded p-2 space-y-1">
                    {rt.routes.slice(0, 3).map((route, i) => (
                      <div key={i} className="flex items-center justify-between text-xs">
                        <span className="font-mono">{route.destination_cidr_block}</span>
                        <span className="text-gray-500">
                          {route.gateway_id || route.nat_gateway_id || "local"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </ModernCard>
          ))}
        </div>
      )}
    </ClientPageShell>
  );
};

export default ClientRouteTables;
