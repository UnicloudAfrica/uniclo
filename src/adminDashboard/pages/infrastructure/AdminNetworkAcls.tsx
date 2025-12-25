import React, { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Plus, Trash2, RefreshCw, ArrowLeft, ShieldCheck } from "lucide-react";
import AdminHeadbar from "../../components/adminHeadbar";
import AdminSidebar from "../../components/AdminSidebar";
import AdminPageShell from "../../components/AdminPageShell";
import ModernButton from "../../../shared/components/ui/ModernButton";
import ModernCard from "../../../shared/components/ui/ModernCard";
import {
  useNetworkAcls,
  useCreateNetworkAcl,
  useDeleteNetworkAcl,
  useVpcs,
} from "../../../hooks/adminHooks/vpcInfraHooks";

interface NetworkAcl {
  id: string;
  name?: string;
  vpc_id?: string;
  is_default?: boolean;
  entries?: Array<{
    rule_number?: number;
    protocol?: string;
    rule_action?: string;
    cidr_block?: string;
    egress?: boolean;
  }>;
  associations?: Array<{ subnet_id?: string }>;
}

const AdminNetworkAcls: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const projectId = searchParams.get("project") || "";

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [vpcId, setVpcId] = useState("");
  const [aclName, setAclName] = useState("");

  const { data: networkAcls = [], isLoading, refetch } = useNetworkAcls(projectId);
  const { data: vpcs = [] } = useVpcs(projectId);
  const { mutate: createAcl, isPending: isCreating } = useCreateNetworkAcl();
  const { mutate: deleteAcl, isPending: isDeleting } = useDeleteNetworkAcl();

  const handleCreate = () => {
    if (!vpcId) return;
    createAcl(
      {
        projectId,
        payload: { vpc_id: vpcId, name: aclName || undefined },
      },
      {
        onSuccess: () => {
          setShowCreateModal(false);
          setVpcId("");
          setAclName("");
        },
      }
    );
  };

  const handleDelete = (networkAclId: string, isDefault?: boolean) => {
    if (isDefault) {
      alert("Cannot delete the default Network ACL");
      return;
    }
    if (confirm("Are you sure you want to delete this Network ACL?")) {
      deleteAcl({ projectId, networkAclId });
    }
  };

  return (
    <>
      <AdminHeadbar />
      <AdminSidebar />
      <AdminPageShell
        title="Network ACLs"
        description="Stateless firewall rules for subnet traffic"
        icon={<ShieldCheck className="w-6 h-6 text-teal-600" />}
        breadcrumbs={[
          { label: "Home", href: "/admin-dashboard" },
          { label: "Infrastructure", href: "/admin-dashboard/projects" },
          { label: "Network ACLs" },
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
              Create ACL
            </ModernButton>
          </div>
        }
      >
        {/* Stats */}
        <ModernCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{networkAcls.length}</div>
              <div className="text-sm text-gray-500">Total Network ACLs</div>
            </div>
          </div>
        </ModernCard>

        {/* ACLs List */}
        {isLoading ? (
          <div className="py-12 text-center">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto" />
          </div>
        ) : networkAcls.length === 0 ? (
          <ModernCard className="p-12 text-center">
            <ShieldCheck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <div className="text-gray-500">No Network ACLs found</div>
          </ModernCard>
        ) : (
          <div className="space-y-4">
            {networkAcls.map((acl: NetworkAcl) => (
              <ModernCard key={acl.id} className="overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900">{acl.name || "Unnamed"}</span>
                      {acl.is_default && (
                        <span className="px-1.5 py-0.5 bg-blue-100 text-blue-600 text-[10px] font-medium rounded">
                          DEFAULT
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 font-mono mt-1">{acl.id}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <ModernButton
                      variant="secondary"
                      size="sm"
                      onClick={() =>
                        navigate(
                          `/admin-dashboard/infrastructure/network-acl-rules?project=${projectId}&acl=${acl.id}&name=${encodeURIComponent(acl.name || "ACL")}`
                        )
                      }
                    >
                      <ShieldCheck className="w-4 h-4" />
                      Manage Rules
                    </ModernButton>
                    <button
                      onClick={() => handleDelete(acl.id, acl.is_default)}
                      disabled={isDeleting || acl.is_default}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg disabled:opacity-50"
                      title="Delete ACL"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="p-4 bg-gray-50 text-sm">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-gray-500">VPC:</span>
                      <span className="ml-2 font-mono text-gray-700">{acl.vpc_id}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Entries:</span>
                      <span className="ml-2 font-medium">{acl.entries?.length || 0}</span>
                    </div>
                  </div>
                </div>
              </ModernCard>
            ))}
          </div>
        )}

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 m-4">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Create Network ACL</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name (optional)
                  </label>
                  <input
                    type="text"
                    value={aclName}
                    onChange={(e) => setAclName(e.target.value)}
                    placeholder="my-network-acl"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">VPC *</label>
                  <select
                    required
                    value={vpcId}
                    onChange={(e) => setVpcId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="">Select a VPC</option>
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
                  disabled={!vpcId || isCreating}
                >
                  {isCreating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create ACL"
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

export default AdminNetworkAcls;
