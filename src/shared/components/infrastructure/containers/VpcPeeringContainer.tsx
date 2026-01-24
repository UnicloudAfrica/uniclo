// @ts-nocheck
import React, { useState } from "react";
import { GitMerge, Plus, RefreshCw } from "lucide-react";
import ModernButton from "../../ui/ModernButton";
import { VpcPeeringOverview } from "..";

interface VpcPeeringHooks {
  useList: (
    projectId: string,
    region?: string
  ) => {
    data: any[];
    isLoading: boolean;
    refetch: () => void;
  };
  useVpcs?: (projectId: string, region?: string) => { data: any[] };
  useCreate?: () => { mutate: (input: any, options?: any) => void; isPending: boolean };
  useAccept?: () => { mutate: (input: any) => void; isPending: boolean };
  useReject?: () => { mutate: (input: any) => void; isPending: boolean };
  useDelete?: () => { mutate: (input: any) => void; isPending: boolean };
}

interface VpcPeeringContainerProps {
  hierarchy: "admin" | "tenant" | "client";
  projectId: string;
  region: string;
  hooks: VpcPeeringHooks;
  wrapper: (props: {
    headerActions: React.ReactNode;
    children: React.ReactNode;
  }) => React.ReactElement;
}

const VpcPeeringContainer: React.FC<VpcPeeringContainerProps> = ({
  projectId,
  region,
  hooks,
  wrapper: Wrapper,
}) => {
  const { data: peeringConnections = [], isLoading, refetch } = hooks.useList(projectId, region);
  const { data: vpcs = [] } = hooks.useVpcs ? hooks.useVpcs(projectId, region) : { data: [] };

  const createMutation = hooks.useCreate ? hooks.useCreate() : null;
  const acceptMutation = hooks.useAccept ? hooks.useAccept() : null;
  const rejectMutation = hooks.useReject ? hooks.useReject() : null;
  const deleteMutation = hooks.useDelete ? hooks.useDelete() : null;

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [vpcId, setVpcId] = useState("");
  const [peerVpcId, setPeerVpcId] = useState("");
  const [peeringName, setPeeringName] = useState("");

  const handleCreate = () => {
    if (!createMutation || !vpcId || !peerVpcId) return;
    createMutation.mutate(
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

  const handleAccept = (pc: any) => {
    acceptMutation?.mutate({ projectId, region, peeringId: pc.id });
  };

  const handleReject = (pc: any) => {
    if (!rejectMutation) return;
    if (confirm("Are you sure you want to reject this peering connection?")) {
      rejectMutation.mutate({ projectId, region, peeringId: pc.id });
    }
  };

  const handleDelete = (pc: any) => {
    if (!deleteMutation) return;
    if (confirm("Are you sure you want to delete this peering connection?")) {
      deleteMutation.mutate({ projectId, region, peeringId: pc.id });
    }
  };

  const headerActions = (
    <div className="flex items-center gap-3">
      <ModernButton variant="secondary" size="sm" onClick={() => refetch()} disabled={isLoading}>
        <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
        Refresh
      </ModernButton>
      {createMutation && (
        <ModernButton variant="primary" size="sm" onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4" />
          Create Peering
        </ModernButton>
      )}
    </div>
  );

  return (
    <>
      <Wrapper headerActions={headerActions}>
        <VpcPeeringOverview
          peeringConnections={peeringConnections}
          isLoading={isLoading}
          onAccept={acceptMutation ? handleAccept : undefined}
          onReject={rejectMutation ? handleReject : undefined}
          onDelete={deleteMutation ? handleDelete : undefined}
          showActions={Boolean(acceptMutation || rejectMutation || deleteMutation)}
        />
      </Wrapper>

      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 m-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-violet-50 rounded-lg text-violet-600">
                <GitMerge className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Create VPC Peering Connection</h2>
            </div>
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
                      {vpc.name || vpc.id} ({vpc.cidr_block || vpc.cidr})
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
                      {vpc.name || vpc.id} ({vpc.cidr_block || vpc.cidr})
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
                disabled={!vpcId || !peerVpcId || createMutation?.isPending}
              >
                {createMutation?.isPending ? (
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
    </>
  );
};

export default VpcPeeringContainer;
