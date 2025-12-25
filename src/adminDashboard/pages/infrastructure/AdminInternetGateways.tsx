import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Globe, Plus, Trash2, Link, Link2Off } from "lucide-react";
import AdminPageShell from "../../components/AdminPageShell";
import AdminHeadbar from "../../components/adminHeadbar";
import AdminSidebar from "../../components/AdminSidebar";
import ModernCard from "../../../shared/components/ui/ModernCard";
import ModernButton from "../../../shared/components/ui/ModernButton";
import {
  useInternetGateways,
  useCreateInternetGateway,
  useDeleteInternetGateway,
  useAttachInternetGateway,
  useDetachInternetGateway,
  useVpcs,
} from "../../../hooks/adminHooks/vpcInfraHooks";

const AdminInternetGateways: React.FC = () => {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("project") || "";

  const { data: gateways, isLoading } = useInternetGateways(projectId);
  const { data: vpcs } = useVpcs(projectId);

  const createMutation = useCreateInternetGateway();
  const deleteMutation = useDeleteInternetGateway();
  const attachMutation = useAttachInternetGateway();
  const detachMutation = useDetachInternetGateway();

  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [attachModal, setAttachModal] = useState<{ open: boolean; igwId: string; vpcId: string }>({
    open: false,
    igwId: "",
    vpcId: "",
  });

  const handleCreate = async () => {
    await createMutation.mutateAsync({ projectId, payload: { name: newName } });
    setShowAddForm(false);
    setNewName("");
  };

  const handleDelete = async (igwId: string) => {
    if (window.confirm("Delete this Internet Gateway?")) {
      await deleteMutation.mutateAsync({ projectId, igwId });
    }
  };

  const handleAttach = async () => {
    if (!attachModal.vpcId) return;
    await attachMutation.mutateAsync({
      projectId,
      igwId: attachModal.igwId,
      vpcId: attachModal.vpcId,
    });
    setAttachModal({ open: false, igwId: "", vpcId: "" });
  };

  const handleDetach = async (igwId: string, vpcId?: string) => {
    if (!vpcId) return;
    if (window.confirm("Detach this Gateway from VPC?")) {
      await detachMutation.mutateAsync({ projectId, igwId, vpcId });
    }
  };

  return (
    <>
      <AdminHeadbar />
      <AdminSidebar />
      <AdminPageShell
        title="Internet Gateways"
        description="Manage Internet Gateways for project connectivity"
        actions={
          <ModernButton variant="primary" onClick={() => setShowAddForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Gateway
          </ModernButton>
        }
      >
        {showAddForm && (
          <ModernCard className="p-4 mb-6 bg-blue-50 border-blue-200">
            <h4 className="font-medium text-gray-900 mb-3">Create New Internet Gateway</h4>
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="Primary IGW"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="flex-1 rounded border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <ModernButton
                variant="primary"
                size="sm"
                onClick={handleCreate}
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? "Creating..." : "Create"}
              </ModernButton>
              <ModernButton variant="secondary" size="sm" onClick={() => setShowAddForm(false)}>
                Cancel
              </ModernButton>
            </div>
          </ModernCard>
        )}

        {/* Attach Modal Placeholder (Simplified inline for now) */}
        {attachModal.open && (
          <ModernCard className="p-4 mb-6 bg-purple-50 border-purple-200">
            <h4 className="font-medium text-gray-900 mb-3 text-purple-800 flex items-center gap-2">
              <Link className="w-4 h-4" />
              Attach Gateway: {attachModal.igwId}
            </h4>
            <div className="flex gap-3">
              <select
                value={attachModal.vpcId}
                onChange={(e) => setAttachModal({ ...attachModal, vpcId: e.target.value })}
                className="flex-1 rounded border border-gray-300 px-3 py-2 text-sm outline-none"
              >
                <option value="">Select VPC...</option>
                {vpcs?.map((vpc: any) => (
                  <option key={vpc.id} value={vpc.id}>
                    {vpc.name || vpc.id} ({vpc.cidr_block})
                  </option>
                ))}
              </select>
              <ModernButton
                variant="primary"
                size="sm"
                color="purple"
                onClick={handleAttach}
                disabled={attachMutation.isPending}
              >
                {attachMutation.isPending ? "Attaching..." : "Attach to VPC"}
              </ModernButton>
              <ModernButton
                variant="secondary"
                size="sm"
                onClick={() => setAttachModal({ open: false, igwId: "", vpcId: "" })}
              >
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
            {gateways?.length === 0 ? (
              <ModernCard className="p-12 text-center">
                <Globe className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <div className="text-gray-500">No Internet Gateways found</div>
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
                        State
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
                        Attached VPC
                      </th>
                      <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {gateways.map((igw: any) => {
                      const attachment = igw.attachments?.[0];
                      return (
                        <tr key={igw.id} className="hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <div className="font-medium text-gray-900">{igw.name || "Unnamed"}</div>
                            <div className="text-xs text-gray-500 font-mono">{igw.id}</div>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                igw.state === "available"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {igw.state || "unknown"}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono text-xs text-gray-500">
                            {attachment ? (
                              <span className="flex items-center gap-2 text-blue-700 font-medium">
                                <Link className="w-3 h-3 text-green-600" />
                                {attachment.vpc_id} ({attachment.state})
                              </span>
                            ) : (
                              <span className="text-gray-400">Not attached</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right space-x-2">
                            {!attachment ? (
                              <button
                                onClick={() =>
                                  setAttachModal({ open: true, igwId: igw.id, vpcId: "" })
                                }
                                className="text-purple-600 hover:text-purple-800 transition-colors"
                                title="Attach to VPC"
                              >
                                <Link className="w-4 h-4 inline" />
                              </button>
                            ) : (
                              <button
                                onClick={() => handleDetach(igw.id, attachment.vpc_id)}
                                className="text-orange-600 hover:text-orange-800 transition-colors"
                                title="Detach from VPC"
                                disabled={detachMutation.isPending}
                              >
                                <Link2Off className="w-4 h-4 inline" />
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(igw.id)}
                              className="text-red-600 hover:text-red-800 transition-colors"
                              title="Delete Gateway"
                              disabled={deleteMutation.isPending}
                            >
                              <Trash2 className="w-4 h-4 inline" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
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

export default AdminInternetGateways;
