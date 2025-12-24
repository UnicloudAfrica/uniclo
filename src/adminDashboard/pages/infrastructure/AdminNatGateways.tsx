import React, { useState, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  Plus,
  Trash2,
  RefreshCw,
  Globe,
  ArrowLeft,
  Network,
  Server,
  ExternalLink,
} from "lucide-react";
import ModernButton from "../../../shared/components/ui/ModernButton";
import ModernCard from "../../../shared/components/ui/ModernCard";
import {
  useNatGateways,
  useCreateNatGateway,
  useDeleteNatGateway,
} from "../../../hooks/adminHooks/vpcInfraHooks";
import { useSubnets, useElasticIps } from "../../../hooks/adminHooks/vpcInfraHooks";

interface NatGateway {
  id: string;
  name?: string;
  subnet_id?: string;
  elastic_ip?: string;
  public_ip?: string;
  state?: string;
  created_at?: string;
}

const AdminNatGateways: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const projectId = searchParams.get("project") || "";

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedSubnet, setSelectedSubnet] = useState("");
  const [selectedEip, setSelectedEip] = useState("");
  const [gatewayName, setGatewayName] = useState("");

  const { data: natGateways = [], isLoading, refetch } = useNatGateways(projectId);
  const { data: subnets = [] } = useSubnets(projectId);
  const { data: elasticIps = [] } = useElasticIps(projectId);
  const { mutate: createNatGateway, isPending: isCreating } = useCreateNatGateway();
  const { mutate: deleteNatGateway, isPending: isDeleting } = useDeleteNatGateway();

  const handleCreate = () => {
    if (!selectedSubnet) return;
    createNatGateway(
      {
        projectId,
        payload: {
          subnet_id: selectedSubnet,
          elastic_ip_id: selectedEip || undefined,
          name: gatewayName || undefined,
        },
      },
      {
        onSuccess: () => {
          setShowCreateModal(false);
          setSelectedSubnet("");
          setSelectedEip("");
          setGatewayName("");
        },
      }
    );
  };

  const handleDelete = (natGatewayId: string) => {
    if (confirm("Are you sure you want to delete this NAT Gateway?")) {
      deleteNatGateway({ projectId, natGatewayId });
    }
  };

  const getStateColor = (state?: string) => {
    switch (state?.toLowerCase()) {
      case "available":
        return "bg-green-100 text-green-700";
      case "pending":
        return "bg-yellow-100 text-yellow-700";
      case "deleting":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <Globe className="w-7 h-7 text-blue-600" />
              NAT Gateways
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Enable outbound internet access for private subnets
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <ModernButton
            variant="secondary"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </ModernButton>
          <ModernButton variant="primary" size="sm" onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4" />
            Create NAT Gateway
          </ModernButton>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ModernCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Globe className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{natGateways.length}</div>
              <div className="text-sm text-gray-500">Total NAT Gateways</div>
            </div>
          </div>
        </ModernCard>
        <ModernCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Network className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {natGateways.filter((g: NatGateway) => g.state === "available").length}
              </div>
              <div className="text-sm text-gray-500">Available</div>
            </div>
          </div>
        </ModernCard>
        <ModernCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Server className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{subnets.length}</div>
              <div className="text-sm text-gray-500">Available Subnets</div>
            </div>
          </div>
        </ModernCard>
      </div>

      {/* Table */}
      <ModernCard className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
                  Name/ID
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
                  State
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
                  Subnet
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
                  Public IP
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
                  Created
                </th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Loading NAT Gateways...
                  </td>
                </tr>
              ) : natGateways.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center">
                    <Globe className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <div className="text-gray-500 mb-1">No NAT Gateways</div>
                    <div className="text-sm text-gray-400">
                      Create a NAT Gateway to enable outbound internet access
                    </div>
                  </td>
                </tr>
              ) : (
                natGateways.map((gateway: NatGateway) => (
                  <tr key={gateway.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-900">{gateway.name || "Unnamed"}</div>
                      <div className="text-xs text-gray-500 font-mono">{gateway.id}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getStateColor(gateway.state)}`}
                      >
                        {gateway.state || "Unknown"}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-gray-600 font-mono">
                        {gateway.subnet_id || "-"}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {gateway.public_ip ? (
                        <span className="text-sm text-gray-600 font-mono flex items-center gap-1">
                          {gateway.public_ip}
                          <ExternalLink className="w-3 h-3 text-gray-400" />
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-500">
                      {gateway.created_at ? new Date(gateway.created_at).toLocaleDateString() : "-"}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleDelete(gateway.id)}
                        disabled={isDeleting}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete NAT Gateway"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </ModernCard>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 m-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Create NAT Gateway</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name (optional)
                </label>
                <input
                  type="text"
                  value={gatewayName}
                  onChange={(e) => setGatewayName(e.target.value)}
                  placeholder="my-nat-gateway"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subnet *</label>
                <select
                  value={selectedSubnet}
                  onChange={(e) => setSelectedSubnet(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select a subnet</option>
                  {subnets.map((subnet: any) => (
                    <option key={subnet.id} value={subnet.id}>
                      {subnet.name || subnet.id} ({subnet.cidr || subnet.cidr_block})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Elastic IP (optional)
                </label>
                <select
                  value={selectedEip}
                  onChange={(e) => setSelectedEip(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Allocate new Elastic IP</option>
                  {elasticIps
                    .filter((eip: any) => !eip.association_id)
                    .map((eip: any) => (
                      <option key={eip.id} value={eip.id}>
                        {eip.public_ip || eip.id}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <ModernButton variant="secondary" onClick={() => setShowCreateModal(false)}>
                Cancel
              </ModernButton>
              <ModernButton
                variant="primary"
                onClick={handleCreate}
                disabled={!selectedSubnet || isCreating}
              >
                {isCreating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create NAT Gateway"
                )}
              </ModernButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminNatGateways;
