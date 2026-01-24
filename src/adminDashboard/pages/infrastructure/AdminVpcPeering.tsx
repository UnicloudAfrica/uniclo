import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Plus, RefreshCw, GitMerge } from "lucide-react";
import AdminPageShell from "../../components/AdminPageShell";
import ModernButton from "../../../shared/components/ui/ModernButton";
import { VpcPeeringOverview } from "../../../shared/components/infrastructure";
import {
  useVpcPeering,
  useCreateVpcPeering,
  useAcceptVpcPeering,
  useRejectVpcPeering,
  useDeleteVpcPeering,
  useVpcs,
} from "../../../shared/hooks/vpcInfraHooks";

const AdminVpcPeering: React.FC = () => {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("project") || "";
  const region = searchParams.get("region") || "";

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [vpcId, setVpcId] = useState("");
  const [peerVpcId, setPeerVpcId] = useState("");
  const [peeringName, setPeeringName] = useState("");

  const { data: peeringConnections = [], isLoading, refetch } = useVpcPeering(projectId, region);
  const { data: vpcs = [] } = useVpcs(projectId, region);
  const { mutate: createPeering, isPending: isCreating } = useCreateVpcPeering();
  const { mutate: acceptPeering, isPending: isAccepting } = useAcceptVpcPeering();
  const { mutate: rejectPeering, isPending: isRejecting } = useRejectVpcPeering();
  const { mutate: deletePeering } = useDeleteVpcPeering();

  const handleCreate = () => {
    if (!vpcId || !peerVpcId) return;
    createPeering(
      {
        projectId,
        region,
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
    acceptPeering({ projectId, region, peeringId });
  };

  const handleReject = (peeringId: string) => {
    if (confirm("Are you sure you want to reject this peering connection?")) {
      rejectPeering({ projectId, region, peeringId });
    }
  };

  const handleDelete = (peeringId: string) => {
    if (confirm("Are you sure you want to delete this peering connection?")) {
      deletePeering({ projectId, region, peeringId });
    }
  };

  return (
    <>
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
        <VpcPeeringOverview
          peeringConnections={peeringConnections}
          isLoading={isLoading}
          onAccept={(pc) => handleAccept(pc.id)}
          onReject={(pc) => handleReject(pc.id)}
          onDelete={(pc) => handleDelete(pc.id)}
          showActions
        />

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
