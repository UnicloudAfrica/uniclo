import React, { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Plus, RefreshCw, ArrowLeft, GitMerge, Check, X, Trash2 } from "lucide-react";
import AdminHeadbar from "../../components/adminHeadbar";
import AdminSidebar from "../../components/AdminSidebar";
import AdminPageShell from "../../components/AdminPageShell";
import ModernButton from "../../../shared/components/ui/ModernButton";
import ModernCard from "../../../shared/components/ui/ModernCard";
import {
  useVpcPeering,
  useCreateVpcPeering,
  useAcceptVpcPeering,
  useRejectVpcPeering,
  useDeleteVpcPeering,
  useVpcs,
} from "../../../hooks/adminHooks/vpcInfraHooks";

interface VpcPeeringConnection {
  id: string;
  name?: string;
  requester_vpc_id?: string;
  accepter_vpc_id?: string;
  status?: { code?: string; message?: string };
  created_at?: string;
}

const AdminVpcPeering: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const projectId = searchParams.get("project") || "";

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [vpcId, setVpcId] = useState("");
  const [peerVpcId, setPeerVpcId] = useState("");
  const [peeringName, setPeeringName] = useState("");

  const { data: peeringConnections = [], isLoading, refetch } = useVpcPeering(projectId);
  const { data: vpcs = [] } = useVpcs(projectId);
  const { mutate: createPeering, isPending: isCreating } = useCreateVpcPeering();
  const { mutate: acceptPeering, isPending: isAccepting } = useAcceptVpcPeering();
  const { mutate: rejectPeering, isPending: isRejecting } = useRejectVpcPeering();
  const { mutate: deletePeering, isPending: isDeleting } = useDeleteVpcPeering();

  const handleCreate = () => {
    if (!vpcId || !peerVpcId) return;
    createPeering(
      {
        projectId,
        payload: { vpc_id: vpcId, peer_vpc_id: peerVpcId, name: peeringName || undefined },
      },
      {
        onSuccess: () => {
          setShowCreateModal(false);
          setVpcId("");
          setPeerVpcId("");
          setPeeringName("");
        },
      }
    );
  };

  const handleAccept = (peeringId: string) => {
    acceptPeering({ projectId, peeringId });
  };

  const handleReject = (peeringId: string) => {
    if (confirm("Are you sure you want to reject this peering connection?")) {
      rejectPeering({ projectId, peeringId });
    }
  };

  const handleDelete = (peeringId: string) => {
    if (confirm("Are you sure you want to delete this peering connection?")) {
      deletePeering({ projectId, peeringId });
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case "active":
        return "bg-green-100 text-green-700";
      case "pending-acceptance":
        return "bg-yellow-100 text-yellow-700";
      case "rejected":
      case "deleted":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <>
      <AdminHeadbar />
      <AdminSidebar />
      <AdminPageShell
        title="VPC Peering"
        description="Connect VPCs for private network communication"
        icon={<GitMerge className="w-6 h-6 text-violet-600" />}
        breadcrumbs={[
          { label: "Home", href: "/admin-dashboard" },
          { label: "Infrastructure", href: "/admin-dashboard/projects" },
          { label: "VPC Peering" },
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
              Create Peering
            </ModernButton>
          </div>
        }
      >
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ModernCard className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center">
                <GitMerge className="w-5 h-5 text-violet-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{peeringConnections.length}</div>
                <div className="text-sm text-gray-500">Total Connections</div>
              </div>
            </div>
          </ModernCard>
          <ModernCard className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Check className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {
                    peeringConnections.filter(
                      (p: VpcPeeringConnection) => p.status?.code?.toLowerCase() === "active"
                    ).length
                  }
                </div>
                <div className="text-sm text-gray-500">Active</div>
              </div>
            </div>
          </ModernCard>
          <ModernCard className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <RefreshCw className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {
                    peeringConnections.filter(
                      (p: VpcPeeringConnection) =>
                        p.status?.code?.toLowerCase() === "pending-acceptance"
                    ).length
                  }
                </div>
                <div className="text-sm text-gray-500">Pending</div>
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
                  Requester VPC
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
                  Accepter VPC
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
                  Status
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
              ) : peeringConnections.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-400">
                    No peering connections
                  </td>
                </tr>
              ) : (
                peeringConnections.map((conn: VpcPeeringConnection) => (
                  <tr key={conn.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-900">{conn.name || "Unnamed"}</div>
                      <div className="text-xs text-gray-500 font-mono">{conn.id}</div>
                    </td>
                    <td className="py-3 px-4 font-mono text-sm text-gray-600">
                      {conn.requester_vpc_id}
                    </td>
                    <td className="py-3 px-4 font-mono text-sm text-gray-600">
                      {conn.accepter_vpc_id}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(conn.status?.code)}`}
                      >
                        {conn.status?.code || "Unknown"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {conn.status?.code?.toLowerCase() === "pending-acceptance" && (
                          <>
                            <button
                              onClick={() => handleAccept(conn.id)}
                              disabled={isAccepting}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Accept"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleReject(conn.id)}
                              disabled={isRejecting}
                              className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              title="Reject"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleDelete(conn.id)}
                          disabled={isDeleting}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
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
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Create VPC Peering Connection
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name (optional)
                  </label>
                  <input
                    type="text"
                    value={peeringName}
                    onChange={(e) => setPeeringName(e.target.value)}
                    placeholder="my-peering-connection"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Requester VPC *
                  </label>
                  <select
                    required
                    value={vpcId}
                    onChange={(e) => setVpcId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  >
                    <option value="">Select Requester VPC</option>
                    {vpcs.map((vpc: any) => (
                      <option key={vpc.id} value={vpc.id}>
                        {vpc.name || vpc.id} ({vpc.cidr_block})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Peer (Accepter) VPC *
                  </label>
                  <select
                    required
                    value={peerVpcId}
                    onChange={(e) => setPeerVpcId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  >
                    <option value="">Select Peer VPC</option>
                    {vpcs.map((vpc: any) => (
                      <option key={vpc.id} value={vpc.id}>
                        {vpc.name || vpc.id} ({vpc.cidr_block})
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
                  disabled={!vpcId || !peerVpcId || isCreating}
                >
                  {isCreating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create"
                  )}
                </ModernButton>
              </div>
            </div>
          </div>
        )}
      </AdminPageShell>
    </>
  );
};

export default AdminVpcPeering;
