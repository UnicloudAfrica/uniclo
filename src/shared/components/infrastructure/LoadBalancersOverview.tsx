import React from "react";
import { CheckCircle, Globe, Zap } from "lucide-react";
import ModernCard from "../ui/ModernCard";
import LoadBalancersTable from "./LoadBalancersTable";
import type { LoadBalancer } from "./types";

interface LoadBalancersOverviewProps {
  loadBalancers: LoadBalancer[];
  isLoading?: boolean;
  emptyMessage?: string;
  onDelete?: (lb: LoadBalancer) => void;
  onManage?: (lb: LoadBalancer) => void;
  showActions?: boolean;
}

const LoadBalancersOverview: React.FC<LoadBalancersOverviewProps> = ({
  loadBalancers,
  isLoading = false,
  emptyMessage,
  onDelete,
  onManage,
  showActions,
}) => {
  const activeCount = loadBalancers.filter(
    (lb) => (lb.status || lb.state || "").toLowerCase() === "active"
  ).length;
  const externalCount = loadBalancers.filter((lb) => lb.is_external).length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ModernCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{loadBalancers.length}</div>
              <div className="text-sm text-gray-500">Total Load Balancers</div>
            </div>
          </div>
        </ModernCard>
        <ModernCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{activeCount}</div>
              <div className="text-sm text-gray-500">Active</div>
            </div>
          </div>
        </ModernCard>
        <ModernCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Globe className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{externalCount}</div>
              <div className="text-sm text-gray-500">Internet-facing</div>
            </div>
          </div>
        </ModernCard>
      </div>

      <LoadBalancersTable
        loadBalancers={loadBalancers}
        isLoading={isLoading}
        emptyMessage={emptyMessage}
        onDelete={onDelete}
        onManage={onManage}
        showActions={showActions}
      />
    </div>
  );
};

export default LoadBalancersOverview;
