import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { GitMerge, Plus, X } from "lucide-react";
import TenantPageShell from "../../components/TenantPageShell";
import ModernCard from "../../../shared/components/ui/ModernCard";
import { VpcPeeringOverview } from "../../../shared/components/infrastructure";
import {
  useVpcPeering,
  useCreateVpcPeering,
  useAcceptVpcPeering,
  useRejectVpcPeering,
  useDeleteVpcPeering,
  useVpcs,
} from "../../../shared/hooks/vpcInfraHooks";

const TenantVpcPeering: React.FC = () => {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("project") || "";
  const region = searchParams.get("region") || "";

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    vpc_id: "",
    peer_vpc_id: "",
    peer_owner_id: "",
  });

  const { data: peeringConnections = [], isLoading } = useVpcPeering(projectId, region);
  const { data: vpcs = [] } = useVpcs(projectId, region);

  const createMutation = useCreateVpcPeering();
  const acceptMutation = useAcceptVpcPeering();
  const rejectMutation = useRejectVpcPeering();
  const deleteMutation = useDeleteVpcPeering();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await createMutation.mutateAsync({
      projectId,
      region,
      payload: formData,
    });
    setShowCreateForm(false);
    setFormData({ name: "", vpc_id: "", peer_vpc_id: "", peer_owner_id: "" });
  };

  const handleAccept = async (id: string) => {
    if (window.confirm("Accept this peering connection?")) {
      await acceptMutation.mutateAsync({ projectId, region, peeringId: id });
    }
  };

  const handleReject = async (id: string) => {
    if (window.confirm("Reject this peering connection?")) {
      await rejectMutation.mutateAsync({ projectId, region, peeringId: id });
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Delete this peering connection?")) {
      await deleteMutation.mutateAsync({ projectId, region, peeringId: id });
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
      <VpcPeeringOverview
        peeringConnections={peeringConnections}
        isLoading={isLoading}
        onAccept={(conn) => handleAccept(conn.id)}
        onReject={(conn) => handleReject(conn.id)}
        onDelete={(conn) => handleDelete(conn.id)}
        showActions
      />
    </TenantPageShell>
  );
};

export default TenantVpcPeering;
