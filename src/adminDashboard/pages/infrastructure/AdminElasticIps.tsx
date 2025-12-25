import React, { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Plus, Trash2, RefreshCw, ArrowLeft, Unplug, Link2, Globe2, Server } from "lucide-react";
import AdminHeadbar from "../../components/adminHeadbar";
import AdminSidebar from "../../components/AdminSidebar";
import AdminPageShell from "../../components/AdminPageShell";
import ModernButton from "../../../shared/components/ui/ModernButton";
import ModernCard from "../../../shared/components/ui/ModernCard";
import {
  useElasticIps,
  useCreateElasticIp,
  useDeleteElasticIp,
  useAssociateElasticIp,
  useDisassociateElasticIp,
} from "../../../hooks/adminHooks/vpcInfraHooks";

interface ElasticIp {
  id: string;
  allocation_id?: string;
  public_ip?: string;
  instance_id?: string;
  network_interface_id?: string;
  association_id?: string;
  domain?: string;
  name?: string;
  state?: string;
  created_at?: string;
}

const AdminElasticIps: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const projectId = searchParams.get("project") || "";

  const [showAssociateModal, setShowAssociateModal] = useState(false);
  const [selectedEip, setSelectedEip] = useState<ElasticIp | null>(null);
  const [instanceId, setInstanceId] = useState("");

  const { data: elasticIps = [], isLoading, refetch } = useElasticIps(projectId);
  const { mutate: createElasticIp, isPending: isCreating } = useCreateElasticIp();
  const { mutate: deleteElasticIp, isPending: isDeleting } = useDeleteElasticIp();
  const { mutate: associateElasticIp, isPending: isAssociating } = useAssociateElasticIp();
  const { mutate: disassociateElasticIp, isPending: isDisassociating } = useDisassociateElasticIp();

  const handleAllocate = () => {
    createElasticIp({ projectId });
  };

  const handleRelease = (elasticIpId: string) => {
    if (confirm("Are you sure you want to release this Elastic IP?")) {
      deleteElasticIp({ projectId, elasticIpId });
    }
  };

  const handleAssociate = () => {
    if (!selectedEip || !instanceId) return;
    associateElasticIp(
      {
        projectId,
        elasticIpId: selectedEip.id,
        payload: { instance_id: instanceId },
      },
      {
        onSuccess: () => {
          setShowAssociateModal(false);
          setSelectedEip(null);
          setInstanceId("");
        },
      }
    );
  };

  const handleDisassociate = (eip: ElasticIp) => {
    if (confirm("Are you sure you want to disassociate this Elastic IP?")) {
      disassociateElasticIp({ projectId, elasticIpId: eip.id });
    }
  };

  const associatedCount = elasticIps.filter((eip: ElasticIp) => eip.association_id).length;
  const availableCount = elasticIps.length - associatedCount;

  const breadcrumbs = [
    { label: "Home", href: "/admin-dashboard" },
    { label: "Infrastructure", href: "/admin-dashboard/projects" },
    { label: "Elastic IPs" },
  ];

  return (
    <>
      <AdminHeadbar />
      <AdminSidebar />
      <AdminPageShell
        title="Elastic IPs"
        description="Static public IP addresses for your cloud instances"
        icon={<Globe2 className="w-6 h-6 text-orange-600" />}
        breadcrumbs={breadcrumbs}
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
            <ModernButton
              variant="primary"
              size="sm"
              onClick={handleAllocate}
              disabled={isCreating}
            >
              {isCreating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Allocating...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Allocate New IP
                </>
              )}
            </ModernButton>
          </div>
        }
      >
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ModernCard className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <Globe2 className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{elasticIps.length}</div>
                <div className="text-sm text-gray-500">Total Elastic IPs</div>
              </div>
            </div>
          </ModernCard>
          <ModernCard className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Link2 className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{associatedCount}</div>
                <div className="text-sm text-gray-500">Associated</div>
              </div>
            </div>
          </ModernCard>
          <ModernCard className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Unplug className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{availableCount}</div>
                <div className="text-sm text-gray-500">Available</div>
              </div>
            </div>
          </ModernCard>
        </div>

        {/* Table */}
        <ModernCard className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
                    Public IP
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
                    Allocation ID
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
                    Associated With
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
                    <td colSpan={5} className="py-12 text-center text-gray-500">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                      Loading Elastic IPs...
                    </td>
                  </tr>
                ) : elasticIps.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center">
                      <Globe2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <div className="text-gray-500 mb-1">No Elastic IPs</div>
                      <div className="text-sm text-gray-400">
                        Allocate an Elastic IP to get a static public address
                      </div>
                    </td>
                  </tr>
                ) : (
                  elasticIps.map((eip: ElasticIp) => (
                    <tr key={eip.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-mono text-gray-900 font-medium">
                          {eip.public_ip || "-"}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-xs text-gray-500 font-mono">
                          {eip.allocation_id || eip.id}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {eip.instance_id ? (
                          <div className="flex items-center gap-2">
                            <Server className="w-4 h-4 text-blue-500" />
                            <span className="text-sm font-mono">{eip.instance_id}</span>
                          </div>
                        ) : eip.network_interface_id ? (
                          <span className="text-sm text-gray-600 font-mono">
                            ENI: {eip.network_interface_id}
                          </span>
                        ) : (
                          <span className="text-gray-400">Not associated</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            eip.association_id
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {eip.association_id ? "In Use" : "Available"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {eip.association_id ? (
                            <button
                              onClick={() => handleDisassociate(eip)}
                              disabled={isDisassociating}
                              className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                              title="Disassociate"
                            >
                              <Unplug className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setSelectedEip(eip);
                                setShowAssociateModal(true);
                              }}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Associate"
                            >
                              <Link2 className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleRelease(eip.id)}
                            disabled={isDeleting || !!eip.association_id}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                            title={eip.association_id ? "Disassociate first" : "Release"}
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
          </div>
        </ModernCard>

        {/* Associate Modal */}
        {showAssociateModal && selectedEip && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 m-4">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Associate Elastic IP</h2>

              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-500">Elastic IP</div>
                <div className="text-lg font-mono font-medium">{selectedEip.public_ip}</div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Instance ID *
                  </label>
                  <input
                    type="text"
                    value={instanceId}
                    onChange={(e) => setInstanceId(e.target.value)}
                    placeholder="i-xxxxxxxxxxxxxxxxx"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <ModernButton
                  variant="secondary"
                  onClick={() => {
                    setShowAssociateModal(false);
                    setSelectedEip(null);
                    setInstanceId("");
                  }}
                >
                  Cancel
                </ModernButton>
                <ModernButton
                  variant="primary"
                  onClick={handleAssociate}
                  disabled={!instanceId || isAssociating}
                >
                  {isAssociating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Associating...
                    </>
                  ) : (
                    "Associate"
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

export default AdminElasticIps;
