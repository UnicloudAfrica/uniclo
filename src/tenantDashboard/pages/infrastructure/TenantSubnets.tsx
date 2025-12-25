import React from "react";
import { useSearchParams } from "react-router-dom";
import { Network, Plus, Trash2, X } from "lucide-react";
import TenantPageShell from "../../components/TenantPageShell";
import ModernCard from "../../../shared/components/ui/ModernCard";
import {
  useSubnets,
  useVpcs,
  useCreateSubnet,
  useDeleteSubnet,
} from "../../../hooks/adminHooks/vpcInfraHooks";
import ModernButton from "../../../shared/components/ui/ModernButton";

interface Subnet {
  id: string;
  name?: string;
  cidr?: string;
  cidr_block?: string;
  vpc_id?: string;
  state?: string;
  available_ips?: number;
}

const TenantSubnets: React.FC = () => {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("project") || "";

  const { data: subnets = [], isLoading } = useSubnets(projectId);
  const { data: vpcs = [] } = useVpcs(projectId);

  const createMutation = useCreateSubnet();
  const deleteMutation = useDeleteSubnet();

  const [showAddForm, setShowAddForm] = React.useState(false);
  const [formData, setFormData] = React.useState({
    name: "",
    cidr_block: "10.0.1.0/24",
    vpc_id: "",
  });

  const handleCreate = async () => {
    if (!formData.name || !formData.cidr_block || !formData.vpc_id) return;
    await createMutation.mutateAsync({
      projectId,
      payload: formData,
    });
    setShowAddForm(false);
    setFormData({ name: "", cidr_block: "10.0.1.0/24", vpc_id: "" });
  };

  const handleDelete = async (subnetId: string) => {
    if (window.confirm("Are you sure you want to delete this subnet?")) {
      await deleteMutation.mutateAsync({ projectId, subnetId });
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
    <TenantPageShell
      title={
        <span className="flex items-center gap-2">
          <Network className="w-5 h-5 text-cyan-600" />
          Subnets
        </span>
      }
      description="Network segments within your VPC"
      actions={
        <ModernButton variant="primary" onClick={() => setShowAddForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Subnet
        </ModernButton>
      }
    >
      {showAddForm && (
        <ModernCard className="p-4 mb-6 border-cyan-200 bg-cyan-50">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-medium text-gray-900">Create New Subnet</h4>
            <button
              onClick={() => setShowAddForm(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Public Subnet"
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                CIDR Block
              </label>
              <input
                type="text"
                value={formData.cidr_block}
                onChange={(e) => setFormData({ ...formData, cidr_block: e.target.value })}
                placeholder="10.0.1.0/24"
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                VPC
              </label>
              <select
                value={formData.vpc_id}
                onChange={(e) => setFormData({ ...formData, vpc_id: e.target.value })}
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-500 outline-none"
              >
                <option value="">Select VPC...</option>
                {vpcs.map((vpc: any) => (
                  <option key={vpc.id} value={vpc.id}>
                    {vpc.name || vpc.id} ({vpc.cidr_block || vpc.cidr})
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <ModernButton size="sm" onClick={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending ? "Creating..." : "Create Subnet"}
            </ModernButton>
            <ModernButton variant="secondary" size="sm" onClick={() => setShowAddForm(false)}>
              Cancel
            </ModernButton>
          </div>
        </ModernCard>
      )}

      {/* Stats */}
      <ModernCard className="p-4 mb-6">
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

      {/* Subnets List */}
      {isLoading ? (
        <div className="py-12 text-center">
          <div className="w-6 h-6 border-2 border-cyan-600 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : subnets.length === 0 ? (
        <ModernCard className="p-12 text-center">
          <Network className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <div className="text-gray-500">No subnets found</div>
        </ModernCard>
      ) : (
        <ModernCard className="overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
                  Name
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
                  CIDR Block
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
                  VPC ID
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
                  State
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
                  Available IPs
                </th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {subnets.map((subnet: Subnet) => (
                <tr key={subnet.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="font-medium text-gray-900">{subnet.name || "Unnamed"}</div>
                    <div className="text-xs text-gray-500 font-mono">{subnet.id}</div>
                  </td>
                  <td className="py-3 px-4 font-mono text-sm">
                    {subnet.cidr_block || subnet.cidr}
                  </td>
                  <td className="py-3 px-4 font-mono text-xs text-gray-500">{subnet.vpc_id}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getStateColor(subnet.state)}`}
                    >
                      {subnet.state || "unknown"}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm">{subnet.available_ips ?? "-"}</td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleDelete(subnet.id)}
                      className="text-red-600 hover:text-red-800 transition-colors"
                      title="Delete Subnet"
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </ModernCard>
      )}
    </TenantPageShell>
  );
};

export default TenantSubnets;
