import React from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Zap, Plus, Trash2, RefreshCw, Layers, Shield, Globe } from "lucide-react";
import TenantPageShell from "../../components/TenantPageShell";
import ModernCard from "../../../shared/components/ui/ModernCard";
import ModernButton from "../../../shared/components/ui/ModernButton";
import {
  useLoadBalancers,
  useDeleteLoadBalancer,
} from "../../../hooks/adminHooks/loadBalancerHooks";

const TenantLoadBalancers: React.FC = () => {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("project") || "";
  const navigate = useNavigate();

  const { data: loadBalancers = [], isLoading, refetch } = useLoadBalancers(projectId);
  const deleteMutation = useDeleteLoadBalancer();

  const handleDelete = async (lbId: string) => {
    if (
      window.confirm(
        "Are you sure you want to delete this Load Balancer? This action cannot be undone."
      )
    ) {
      await deleteMutation.mutateAsync({ projectId, lbId });
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case "active":
        return "bg-green-100 text-green-700";
      case "pending":
      case "creating":
        return "bg-yellow-100 text-yellow-700";
      case "failed":
      case "error":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <TenantPageShell
      title={
        <span className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-yellow-600" />
          Load Balancers
        </span>
      }
      description="Distribute incoming application traffic across multiple targets"
      actions={
        <div className="flex gap-2">
          <ModernButton variant="secondary" onClick={() => refetch()}>
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </ModernButton>
          <ModernButton
            variant="primary"
            onClick={() => navigate("/dashboard/infrastructure/load-balancers/create")}
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Load Balancer
          </ModernButton>
        </div>
      }
    >
      {isLoading ? (
        <div className="py-20 text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading your Load Balancers...</p>
        </div>
      ) : loadBalancers.length === 0 ? (
        <ModernCard className="py-20 text-center">
          <div className="mx-auto w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
            <Zap className="h-8 w-8 text-gray-300" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Load Balancers found</h3>
          <p className="text-gray-500 mb-6">
            Create your first Load Balancer to handle high traffic and ensure availability.
          </p>
          <ModernButton
            variant="primary"
            onClick={() => navigate("/dashboard/infrastructure/load-balancers/create")}
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Load Balancer
          </ModernButton>
        </ModernCard>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          <ModernCard className="overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
                    Name & DNS
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
                    Type
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
                    Networking
                  </th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loadBalancers.map((lb: any) => (
                  <tr key={lb.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-900">{lb.name}</div>
                      <div
                        className="text-xs text-gray-500 font-mono truncate max-w-xs"
                        title={lb.dns_name || "Assigning..."}
                      >
                        {lb.dns_name || "Pending DNS assignment"}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {lb.lb_type === "network" ? (
                          <Layers className="w-4 h-4 text-purple-500" />
                        ) : (
                          <Globe className="w-4 h-4 text-blue-500" />
                        )}
                        <span className="text-sm capitalize font-medium">
                          {lb.lb_type || "Application"}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(lb.status || lb.state)}`}
                      >
                        {lb.status || lb.state || "Unknown"}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm text-gray-900 flex items-center gap-1">
                        <Shield className="w-3 h-3 text-gray-400" />
                        {lb.is_external ? "Internet-facing" : "Internal"}
                      </div>
                      <div className="text-xs text-gray-500 font-mono">
                        VPC: {lb.vpc_id?.substring(0, 8)}...
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex justify-end gap-2">
                        <ModernButton
                          variant="secondary"
                          size="sm"
                          onClick={() =>
                            navigate(`/dashboard/infrastructure/load-balancers/${lb.id}`)
                          }
                        >
                          Manage
                        </ModernButton>
                        <button
                          onClick={() => handleDelete(lb.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ModernCard>
        </div>
      )}
    </TenantPageShell>
  );
};

export default TenantLoadBalancers;
