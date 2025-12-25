import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Network, Plus, Trash2 } from "lucide-react";
import AdminPageShell from "../../components/AdminPageShell";
import AdminHeadbar from "../../components/adminHeadbar";
import AdminSidebar from "../../components/AdminSidebar";
import ModernCard from "../../../shared/components/ui/ModernCard";
import ModernButton from "../../../shared/components/ui/ModernButton";
import { useVpcs, useCreateVpc, useDeleteVpc } from "../../../hooks/adminHooks/vpcInfraHooks";

const AdminVpcs: React.FC = () => {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("project") || "";

  const { data: vpcs, isLoading } = useVpcs(projectId);
  const createVpcMutation = useCreateVpc();
  const deleteVpcMutation = useDeleteVpc();

  const [showAddForm, setShowAddForm] = useState(false);
  const [newVpc, setNewVpc] = useState({
    name: "",
    cidr: "10.0.0.0/16",
    is_default: false,
  });

  const handleCreateVpc = async () => {
    if (!newVpc.name || !newVpc.cidr) return;
    await createVpcMutation.mutateAsync({
      projectId,
      payload: newVpc,
    });
    setShowAddForm(false);
    setNewVpc({ name: "", cidr: "10.0.0.0/16", is_default: false });
  };

  const handleDeleteVpc = async (vpcId: string) => {
    if (window.confirm("Are you sure you want to delete this VPC? This action cannot be undone.")) {
      await deleteVpcMutation.mutateAsync({ projectId, vpcId });
    }
  };

  return (
    <>
      <AdminHeadbar />
      <AdminSidebar />
      <AdminPageShell
        title="VPCs"
        description="Manage Virtual Private Clouds for this project"
        actions={
          <ModernButton variant="primary" onClick={() => setShowAddForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create VPC
          </ModernButton>
        }
      >
        {showAddForm && (
          <ModernCard className="p-4 mb-6 bg-blue-50 border-blue-200">
            <h4 className="font-medium text-gray-900 mb-3">Create New VPC</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                  Name
                </label>
                <input
                  type="text"
                  placeholder="Production VPC"
                  value={newVpc.name}
                  onChange={(e) => setNewVpc({ ...newVpc, name: e.target.value })}
                  className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                  CIDR Block
                </label>
                <input
                  type="text"
                  placeholder="10.0.0.0/16"
                  value={newVpc.cidr}
                  onChange={(e) => setNewVpc({ ...newVpc, cidr: e.target.value })}
                  className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div className="flex items-end pb-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newVpc.is_default}
                    onChange={(e) => setNewVpc({ ...newVpc, is_default: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Set as default VPC</span>
                </label>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <ModernButton
                variant="primary"
                size="sm"
                onClick={handleCreateVpc}
                disabled={createVpcMutation.isPending}
              >
                {createVpcMutation.isPending ? "Creating..." : "Create VPC"}
              </ModernButton>
              <ModernButton variant="secondary" size="sm" onClick={() => setShowAddForm(false)}>
                Cancel
              </ModernButton>
            </div>
          </ModernCard>
        )}

        {isLoading ? (
          <div className="py-12 text-center">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {vpcs?.length === 0 ? (
              <ModernCard className="p-12 text-center">
                <Network className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <div className="text-gray-500">No VPCs found for this project</div>
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
                        Status
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
                        Default
                      </th>
                      <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {vpcs.map((vpc: any) => (
                      <tr key={vpc.id} className="hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="font-medium text-gray-900">{vpc.name || "Unnamed"}</div>
                          <div className="text-xs text-gray-500 font-mono">{vpc.id}</div>
                        </td>
                        <td className="py-3 px-4 font-mono text-sm">
                          {vpc.cidr_block || vpc.cidr}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              vpc.state === "available"
                                ? "bg-green-100 text-green-700"
                                : "bg-yellow-100 text-yellow-700"
                            }`}
                          >
                            {vpc.state || "unknown"}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {vpc.is_default ? (
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                              Default
                            </span>
                          ) : (
                            <span className="text-gray-400 text-xs">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleDeleteVpc(vpc.id)}
                            className="text-red-600 hover:text-red-800 transition-colors"
                            title="Delete VPC"
                            disabled={deleteVpcMutation.isPending}
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
          </div>
        )}
      </AdminPageShell>
    </>
  );
};

export default AdminVpcs;
