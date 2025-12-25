import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Plus, Trash2, RefreshCw, Network } from "lucide-react";
import AdminHeadbar from "../../components/adminHeadbar";
import AdminSidebar from "../../components/AdminSidebar";
import AdminPageShell from "../../components/AdminPageShell";
import ModernButton from "../../../shared/components/ui/ModernButton";
import ModernCard from "../../../shared/components/ui/ModernCard";
import {
  useSubnets,
  useCreateSubnet,
  useDeleteSubnet,
  useVpcs,
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
}

const AdminSubnets: React.FC = () => {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("project") || "";

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [subnetName, setSubnetName] = useState("");
  const [cidrBlock, setCidrBlock] = useState("");
  const [vpcId, setVpcId] = useState("");

  const { data: subnets = [], isLoading, refetch } = useSubnets(projectId);
  const { data: vpcs = [] } = useVpcs(projectId);
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
        return "bg-green-100 text-green-700 border border-green-200";
      case "pending":
        return "bg-yellow-100 text-yellow-700 border border-yellow-200";
      default:
        return "bg-gray-100 text-gray-700 border border-gray-200";
    }
  };

  return (
    <>
      <AdminHeadbar />
      <AdminSidebar />
      <AdminPageShell
        title="Subnets"
        description="Manage network segments within your VPC"
        icon={<Network className="w-6 h-6 text-cyan-600" />}
        breadcrumbs={[
          { label: "Home", href: "/admin-dashboard" },
          { label: "Infrastructure", href: "/admin-dashboard/projects" },
          { label: "Subnets" },
        ]}
        actions={
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
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <ModernCard className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center">
                <Network className="w-5 h-5 text-cyan-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{subnets.length}</div>
                <div className="text-sm text-gray-500 font-medium">Total Subnets</div>
              </div>
            </div>
          </ModernCard>
          <ModernCard className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Network className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {subnets.filter((s: Subnet) => s.is_default).length}
                </div>
                <div className="text-sm text-gray-500 font-medium">Default Subnets</div>
              </div>
            </div>
          </ModernCard>
        </div>

        <ModernCard className="overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-4 px-6 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                  Name / ID
                </th>
                <th className="text-left py-4 px-6 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                  CIDR Block
                </th>
                <th className="text-left py-4 px-6 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                  VPC ID
                </th>
                <th className="text-left py-4 px-6 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                  State
                </th>
                <th className="text-right py-4 px-6 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center">
                    <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
                  </td>
                </tr>
              ) : subnets.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center text-gray-400">
                    <Network className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p className="text-lg font-medium">No subnets found</p>
                    <p className="text-sm mt-1">Create a subnet to get started</p>
                  </td>
                </tr>
              ) : (
                subnets.map((subnet: Subnet) => (
                  <tr key={subnet.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <div className="font-bold text-gray-900">{subnet.name || "Unnamed"}</div>
                        {subnet.is_default && (
                          <span className="px-1.5 py-0.5 bg-blue-100 text-blue-600 text-[9px] font-bold rounded uppercase border border-blue-200">
                            DEFAULT
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-gray-400 font-mono mt-0.5">{subnet.id}</div>
                    </td>
                    <td className="py-4 px-6 font-mono text-xs font-bold text-indigo-600">
                      {subnet.cidr || subnet.cidr_block}
                    </td>
                    <td className="py-4 px-6 text-xs text-gray-500 font-mono">{subnet.vpc_id}</td>
                    <td className="py-4 px-6">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${getStateColor(subnet.state)}`}
                      >
                        {subnet.state || "Unknown"}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => handleDelete(subnet.id, subnet.is_default)}
                        disabled={isDeleting || subnet.is_default}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30"
                        title="Delete Subnet"
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

        {showCreateModal && (
          <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <h2 className="text-lg font-bold text-gray-900">Create New Subnet</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <Plus className="w-5 h-5 rotate-45" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5">
                    Subnet Name
                  </label>
                  <input
                    type="text"
                    value={subnetName}
                    onChange={(e) => setSubnetName(e.target.value)}
                    placeholder="e.g. production-public-1"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5">
                    VPC *
                  </label>
                  <select
                    required
                    value={vpcId}
                    onChange={(e) => setVpcId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                  >
                    <option value="">Select a VPC</option>
                    {vpcs.map((vpc: any) => (
                      <option key={vpc.id} value={vpc.id}>
                        {vpc.name || vpc.id} ({vpc.cidr_block})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5">
                    CIDR Block *
                  </label>
                  <input
                    required
                    type="text"
                    value={cidrBlock}
                    onChange={(e) => setCidrBlock(e.target.value)}
                    placeholder="10.0.1.0/24"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none font-mono"
                  />
                  <p className="mt-1 text-[10px] text-gray-400">
                    Must be a subset of the VPC's CIDR range.
                  </p>
                </div>
              </div>
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                <ModernButton variant="secondary" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </ModernButton>
                <ModernButton
                  variant="primary"
                  onClick={handleCreate}
                  disabled={!subnetName || !cidrBlock || !vpcId || isCreating}
                >
                  {isCreating ? "Creating..." : "Create Subnet"}
                </ModernButton>
              </div>
            </div>
          </div>
        )}
      </AdminPageShell>
    </>
  );
};

export default AdminSubnets;
