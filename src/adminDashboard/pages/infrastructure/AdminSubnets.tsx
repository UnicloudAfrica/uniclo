import React, { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Plus, Trash2, RefreshCw, ArrowLeft, Network, Edit2 } from "lucide-react";
import ModernButton from "../../../shared/components/ui/ModernButton";
import ModernCard from "../../../shared/components/ui/ModernCard";
import {
  useSubnets,
  useCreateSubnet,
  useDeleteSubnet,
} from "../../../hooks/adminHooks/vpcInfraHooks";

interface Subnet {
  id: string;
  name?: string;
  cidr?: string;
  cidr_block?: string;
  vpc_id?: string;
  state?: string;
  available_ips?: number;
  is_default?: boolean;
  created_at?: string;
}

const AdminSubnets: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const projectId = searchParams.get("project") || "";

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [subnetName, setSubnetName] = useState("");
  const [cidrBlock, setCidrBlock] = useState("");
  const [vpcId, setVpcId] = useState("");

  const { data: subnets = [], isLoading, refetch } = useSubnets(projectId);
  const { mutate: createSubnet, isPending: isCreating } = useCreateSubnet();
  const { mutate: deleteSubnet, isPending: isDeleting } = useDeleteSubnet();

  const handleCreate = () => {
    if (!subnetName || !cidrBlock || !vpcId) return;
    createSubnet(
      {
        projectId,
        payload: { name: subnetName, cidr_block: cidrBlock, vpc_id: vpcId },
      },
      {
        onSuccess: () => {
          setShowCreateModal(false);
          setSubnetName("");
          setCidrBlock("");
          setVpcId("");
        },
      }
    );
  };

  const handleDelete = (subnetId: string, isDefault?: boolean) => {
    if (isDefault) {
      alert("Cannot delete the default subnet");
      return;
    }
    if (confirm("Are you sure you want to delete this subnet?")) {
      deleteSubnet({ projectId, subnetId });
    }
  };

  const getStateColor = (state?: string) => {
    switch (state?.toLowerCase()) {
      case "available":
        return "bg-green-100 text-green-700";
      case "pending":
        return "bg-yellow-100 text-yellow-700";
      default:
        return "bg-gray-100 text-gray-700";
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
              <Network className="w-7 h-7 text-cyan-600" />
              Subnets
            </h1>
            <p className="text-sm text-gray-500 mt-1">Manage network segments within your VPC</p>
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
            Create Subnet
          </ModernButton>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ModernCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center">
              <Network className="w-5 h-5 text-cyan-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{subnets.length}</div>
              <div className="text-sm text-gray-500">Total Subnets</div>
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
                {subnets.filter((s: Subnet) => s.is_default).length}
              </div>
              <div className="text-sm text-gray-500">Default Subnets</div>
            </div>
          </div>
        </ModernCard>
      </div>

      {/* Table */}
      <ModernCard className="overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
                Name/ID
              </th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
                CIDR Block
              </th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
                VPC
              </th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
                State
              </th>
              <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="py-12 text-center">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto" />
                </td>
              </tr>
            ) : subnets.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-gray-400">
                  No subnets found
                </td>
              </tr>
            ) : (
              subnets.map((subnet: Subnet) => (
                <tr key={subnet.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="font-medium text-gray-900">{subnet.name || "Unnamed"}</div>
                      {subnet.is_default && (
                        <span className="px-1.5 py-0.5 bg-blue-100 text-blue-600 text-[10px] font-medium rounded">
                          DEFAULT
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 font-mono">{subnet.id}</div>
                  </td>
                  <td className="py-3 px-4 font-mono text-sm">
                    {subnet.cidr || subnet.cidr_block}
                  </td>
                  <td className="py-3 px-4 text-xs text-gray-500 font-mono">{subnet.vpc_id}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getStateColor(subnet.state)}`}
                    >
                      {subnet.state || "Unknown"}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleDelete(subnet.id, subnet.is_default)}
                      disabled={isDeleting || subnet.is_default}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </ModernCard>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 m-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Create Subnet</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  value={subnetName}
                  onChange={(e) => setSubnetName(e.target.value)}
                  placeholder="my-subnet"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CIDR Block *</label>
                <input
                  type="text"
                  value={cidrBlock}
                  onChange={(e) => setCidrBlock(e.target.value)}
                  placeholder="10.0.1.0/24"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">VPC ID *</label>
                <input
                  type="text"
                  value={vpcId}
                  onChange={(e) => setVpcId(e.target.value)}
                  placeholder="vpc-xxxxxxxxx"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <ModernButton variant="secondary" onClick={() => setShowCreateModal(false)}>
                Cancel
              </ModernButton>
              <ModernButton
                variant="primary"
                onClick={handleCreate}
                disabled={!subnetName || !cidrBlock || !vpcId || isCreating}
              >
                {isCreating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Subnet"
                )}
              </ModernButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSubnets;
