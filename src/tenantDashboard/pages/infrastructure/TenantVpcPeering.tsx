import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { GitMerge, Plus, X, Check, Trash2 } from "lucide-react";
import TenantPageShell from "../../components/TenantPageShell";
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
  status?: string;
  requester_vpc_id?: string;
  accepter_vpc_id?: string;
}

const TenantVpcPeering: React.FC = () => {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("project") || "";

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    vpc_id: "",
    peer_vpc_id: "",
    peer_owner_id: "",
  });

  const { data: peeringConnections = [], isLoading } = useVpcPeering(projectId);
  const { data: vpcs = [] } = useVpcs(projectId);

  const createMutation = useCreateVpcPeering();
  const acceptMutation = useAcceptVpcPeering();
  const rejectMutation = useRejectVpcPeering();
  const deleteMutation = useDeleteVpcPeering();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await createMutation.mutateAsync({
      projectId,
      payload: formData,
    });
    setShowCreateForm(false);
    setFormData({ name: "", vpc_id: "", peer_vpc_id: "", peer_owner_id: "" });
  };

  const handleAccept = async (id: string) => {
    if (window.confirm("Accept this peering connection?")) {
      await acceptMutation.mutateAsync({ projectId, peeringId: id });
    }
  };

  const handleReject = async (id: string) => {
    if (window.confirm("Reject this peering connection?")) {
      await rejectMutation.mutateAsync({ projectId, peeringId: id });
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Delete this peering connection?")) {
      await deleteMutation.mutateAsync({ projectId, peeringId: id });
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case "active":
        return "bg-green-100 text-green-700 border border-green-200";
      case "pending-acceptance":
        return "bg-yellow-100 text-yellow-700 border border-yellow-200";
      case "rejected":
      case "failed":
        return "bg-red-100 text-red-700 border border-red-200";
      case "deleted":
      case "deleting":
        return "bg-gray-100 text-gray-500 border border-gray-200";
      default:
        return "bg-gray-100 text-gray-700 border border-gray-200";
    }
  };

  return (
    <TenantPageShell
      title={
        <span className="flex items-center gap-2">
          <GitMerge className="w-5 h-5 text-violet-600" />
          VPC Peering
        </span>
      }
      description="Connect VPCs for private network communication"
      headerAction={
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
        >
          {showCreateForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showCreateForm ? "Cancel" : "Request Peering"}
        </button>
      }
    >
      {showCreateForm && (
        <ModernCard className="p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900">
            Request New Peering Connection
          </h3>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Connection Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-violet-500 focus:border-violet-500"
                placeholder="my-peering-connection"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Requester VPC</label>
              <select
                required
                value={formData.vpc_id}
                onChange={(e) => setFormData({ ...formData, vpc_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-violet-500 focus:border-violet-500"
              >
                <option value="">Select VPC</option>
                {vpcs.map((vpc: any) => (
                  <option key={vpc.id} value={vpc.id}>
                    {vpc.name} ({vpc.cidr_block})
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Peer VPC ID</label>
              <input
                required
                type="text"
                value={formData.peer_vpc_id}
                onChange={(e) => setFormData({ ...formData, peer_vpc_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-violet-500 focus:border-violet-500"
                placeholder="vpc-xxxxxx"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Peer Owner ID (Optional)</label>
              <input
                type="text"
                value={formData.peer_owner_id}
                onChange={(e) => setFormData({ ...formData, peer_owner_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-violet-500 focus:border-violet-500"
                placeholder="Account ID"
              />
            </div>
            <div className="md:col-span-2 mt-2">
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="w-full md:w-auto px-6 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 transition-colors"
              >
                {createMutation.isPending ? "Creating..." : "Request Connection"}
              </button>
            </div>
          </form>
        </ModernCard>
      )}

      <ModernCard className="p-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center">
            <GitMerge className="w-5 h-5 text-violet-600" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{peeringConnections.length}</div>
            <div className="text-sm text-gray-500">Peering Connections</div>
          </div>
        </div>
      </ModernCard>

      {isLoading ? (
        <div className="py-12 text-center">
          <div className="w-6 h-6 border-2 border-violet-600 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : peeringConnections.length === 0 ? (
        <ModernCard className="p-12 text-center">
          <GitMerge className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <div className="text-gray-500 text-lg font-medium">No VPC peering connections found</div>
          <p className="text-gray-400 mt-1">Request a connection to another VPC to get started</p>
        </ModernCard>
      ) : (
        <ModernCard className="overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Name / ID
                </th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  VPCs (Requester/Peer)
                </th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="text-right py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {peeringConnections.map((pc: VpcPeeringConnection) => (
                <tr key={pc.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-6">
                    <div className="font-medium text-gray-900">{pc.name || "Unnamed"}</div>
                    <div className="text-xs text-gray-400 font-mono mt-0.5">{pc.id}</div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase font-bold text-gray-400 w-16">
                          Request:
                        </span>
                        <span className="text-xs font-mono text-gray-600">
                          {pc.requester_vpc_id}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase font-bold text-gray-400 w-16">
                          Peer:
                        </span>
                        <span className="text-xs font-mono text-gray-600">
                          {pc.accepter_vpc_id}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${getStatusColor(pc.status)}`}
                    >
                      {pc.status?.replace("-", " ") || "unknown"}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {pc.status === "pending-acceptance" && (
                        <>
                          <button
                            onClick={() => handleAccept(pc.id)}
                            disabled={acceptMutation.isPending}
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Accept"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleReject(pc.id)}
                            disabled={rejectMutation.isPending}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Reject"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleDelete(pc.id)}
                        disabled={deleteMutation.isPending}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
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
      )}
    </TenantPageShell>
  );
};

export default TenantVpcPeering;
