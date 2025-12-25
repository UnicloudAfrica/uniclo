import React, { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Shield, Eye, Plus, Trash2, RefreshCw } from "lucide-react";
import AdminHeadbar from "../../components/adminHeadbar";
import AdminSidebar from "../../components/AdminSidebar";
import AdminPageShell from "../../components/AdminPageShell";
import ModernButton from "../../../shared/components/ui/ModernButton";
import ModernCard from "../../../shared/components/ui/ModernCard";
import {
  useSecurityGroups,
  useCreateSecurityGroup,
  useDeleteSecurityGroup,
  useVpcs,
} from "../../../hooks/adminHooks/vpcInfraHooks";

interface SecurityGroup {
  id: string;
  name?: string;
  description?: string;
  vpc_id?: string;
  inbound_rules_count?: number;
  outbound_rules_count?: number;
}

const AdminSecurityGroups: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const projectId = searchParams.get("project") || "";

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [sgName, setSgName] = useState("");
  const [sgDesc, setSgDesc] = useState("");
  const [vpcId, setVpcId] = useState("");

  const { data: securityGroups = [], isLoading, refetch } = useSecurityGroups(projectId);
  const { data: vpcs = [] } = useVpcs(projectId);
  const { mutate: createSg, isPending: isCreating } = useCreateSecurityGroup();
  const { mutate: deleteSg, isPending: isDeleting } = useDeleteSecurityGroup();

  const handleCreate = () => {
    if (!sgName || !vpcId) return;
    createSg(
      {
        projectId,
        payload: { name: sgName, description: sgDesc, vpc_id: vpcId },
      },
      {
        onSuccess: () => {
          setShowCreateModal(false);
          setSgName("");
          setSgDesc("");
          setVpcId("");
        },
      }
    );
  };

  const handleDelete = (sgId: string) => {
    if (confirm("Are you sure you want to delete this security group?")) {
      deleteSg({ projectId, securityGroupId: sgId });
    }
  };

  const handleViewRules = (sg: SecurityGroup) => {
    navigate(
      `/admin-dashboard/infrastructure/security-group-rules?project=${projectId}&sg=${sg.id}&name=${encodeURIComponent(sg.name || "SG")}`
    );
  };

  return (
    <>
      <AdminHeadbar />
      <AdminSidebar />
      <AdminPageShell
        title="Security Groups"
        description="Manage virtual firewalls for your project resources"
        icon={<Shield className="w-6 h-6 text-purple-600" />}
        breadcrumbs={[
          { label: "Home", href: "/admin-dashboard" },
          { label: "Infrastructure", href: "/admin-dashboard/projects" },
          { label: "Security Groups" },
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
              Create SG
            </ModernButton>
          </div>
        }
      >
        <ModernCard className="p-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{securityGroups.length}</div>
              <div className="text-sm text-gray-500 font-medium">Total Security Groups</div>
            </div>
          </div>
        </ModernCard>

        <ModernCard className="overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-4 px-6 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                  Name / ID
                </th>
                <th className="text-left py-4 px-6 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                  Description
                </th>
                <th className="text-left py-4 px-6 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                  VPC ID
                </th>
                <th className="text-left py-4 px-6 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                  Rules
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
                    <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto" />
                  </td>
                </tr>
              ) : securityGroups.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center text-gray-400">
                    <Shield className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p className="text-lg font-medium">No security groups found</p>
                  </td>
                </tr>
              ) : (
                securityGroups.map((sg: SecurityGroup) => (
                  <tr key={sg.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="py-4 px-6">
                      <div className="font-bold text-gray-900">{sg.name || "Unnamed"}</div>
                      <div className="text-[10px] text-gray-400 font-mono mt-0.5">{sg.id}</div>
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-600 max-w-xs truncate">
                      {sg.description || "-"}
                    </td>
                    <td className="py-4 px-6 text-xs text-gray-500 font-mono">{sg.vpc_id}</td>
                    <td className="py-4 px-6">
                      <div className="flex gap-2">
                        <span className="px-1.5 py-0.5 bg-green-50 text-green-700 text-[9px] font-bold rounded uppercase border border-green-100">
                          IN: {sg.inbound_rules_count ?? 0}
                        </span>
                        <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 text-[9px] font-bold rounded uppercase border border-blue-100">
                          OUT: {sg.outbound_rules_count ?? 0}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleViewRules(sg)}
                          className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Manage Rules"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(sg.id)}
                          disabled={isDeleting}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30"
                          title="Delete SG"
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

        {showCreateModal && (
          <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <h2 className="text-lg font-bold text-gray-900">Create Security Group</h2>
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
                    SG Name *
                  </label>
                  <input
                    type="text"
                    value={sgName}
                    onChange={(e) => setSgName(e.target.value)}
                    placeholder="e.g. web-server-sg"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all outline-none"
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
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all outline-none"
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
                    Description
                  </label>
                  <textarea
                    value={sgDesc}
                    onChange={(e) => setSgDesc(e.target.value)}
                    placeholder="Allow public web traffic"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all outline-none resize-none"
                  />
                </div>
              </div>
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                <ModernButton variant="secondary" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </ModernButton>
                <ModernButton
                  variant="primary"
                  onClick={handleCreate}
                  disabled={!sgName || !vpcId || isCreating}
                >
                  {isCreating ? "Creating..." : "Create Security Group"}
                </ModernButton>
              </div>
            </div>
          </div>
        )}
      </AdminPageShell>
    </>
  );
};

export default AdminSecurityGroups;
