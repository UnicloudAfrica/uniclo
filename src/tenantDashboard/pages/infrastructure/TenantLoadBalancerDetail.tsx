import React, { useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import {
  Zap,
  Plus,
  Trash2,
  RefreshCw,
  Layers,
  Shield,
  Globe,
  ArrowLeft,
  Activity,
  Server,
  Settings,
  PlusCircle,
  Check,
  X,
  ChevronRight,
  Info,
} from "lucide-react";
import TenantPageShell from "../../components/TenantPageShell";
import ModernCard from "../../../shared/components/ui/ModernCard";
import ModernButton from "../../../shared/components/ui/ModernButton";
import {
  useLoadBalancer,
  useListeners,
  useTargetGroups,
  useCreateListener,
  useDeleteListener,
  useCreateTargetGroup,
  useDeleteTargetGroup,
  useRegisterTargets,
} from "../../../hooks/adminHooks/loadBalancerHooks";
import { useFetchPurchasedInstances } from "../../../hooks/adminHooks/instancesHook";

const TenantLoadBalancerDetail: React.FC = () => {
  const { lbId } = useParams<{ lbId: string }>();
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("project") || "";
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<"listeners" | "target-groups">("listeners");

  // Listeners state
  const [showAddListener, setShowAddListener] = useState(false);
  const [newListener, setNewListener] = useState({
    name: "",
    port: 80,
    protocol: "HTTP",
    target_group_id: "",
  });

  // Target Groups state
  const [showAddTG, setShowAddTG] = useState(false);
  const [newTG, setNewTG] = useState({
    name: "",
    port: 80,
    protocol: "HTTP",
    target_type: "instance",
    health_check_protocol: "HTTP",
    health_check_path: "/",
    vpc_id: "",
  });

  // Target Registration state
  const [showRegisterTargets, setShowRegisterTargets] = useState<string | null>(null); // tgId
  const [selectedInstanceIds, setSelectedInstanceIds] = useState<string[]>([]);

  const { data: lb, isLoading: lbLoading } = useLoadBalancer(projectId, lbId || "");
  const {
    data: listeners = [],
    isLoading: listenersLoading,
    refetch: refetchListeners,
  } = useListeners(projectId, lbId);
  const {
    data: targetGroups = [],
    isLoading: tgLoading,
    refetch: refetchTGs,
  } = useTargetGroups(projectId);
  const { data: instancesResponse } = useFetchPurchasedInstances({ project_id: projectId });
  const instances = instancesResponse?.data || [];

  const createListenerMutation = useCreateListener();
  const deleteListenerMutation = useDeleteListener();
  const createTGMutation = useCreateTargetGroup();
  const deleteTGMutation = useDeleteTargetGroup();
  const registerTargetsMutation = useRegisterTargets();

  const handleAddListener = async () => {
    if (!lbId) return;
    await createListenerMutation.mutateAsync({
      projectId,
      payload: {
        ...newListener,
        load_balancer_id: lbId,
        default_action: JSON.stringify({
          type: "forward",
          config: newListener.target_group_id,
        }),
      },
    });
    setShowAddListener(false);
    setNewListener({ name: "", port: 80, protocol: "HTTP", target_group_id: "" });
    refetchListeners();
  };

  const handleAddTG = async () => {
    await createTGMutation.mutateAsync({
      projectId,
      payload: {
        ...newTG,
        vpc_id: lb?.vpc_id,
      },
    });
    setShowAddTG(false);
    setNewTG({
      name: "",
      port: 80,
      protocol: "HTTP",
      target_type: "instance",
      health_check_protocol: "HTTP",
      health_check_path: "/",
      vpc_id: "",
    });
    refetchTGs();
  };

  const handleRegisterTargets = async () => {
    if (!showRegisterTargets) return;
    const targets = selectedInstanceIds.map((id) => ({ vm_id: id, port: newTG.port || 80 }));
    await registerTargetsMutation.mutateAsync({
      projectId,
      tgId: showRegisterTargets,
      targets,
    });
    setShowRegisterTargets(null);
    setSelectedInstanceIds([]);
    refetchTGs();
  };

  if (lbLoading) {
    return (
      <TenantPageShell title="Load Balancer Detail" description="...">
        <div className="py-20 text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        </div>
      </TenantPageShell>
    );
  }

  return (
    <TenantPageShell
      title={
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </button>
          <div className="flex flex-col">
            <span className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-600" />
              {lb?.name || "Load Balancer"}
            </span>
            <span className="text-xs font-normal text-gray-500 font-mono">{lb?.id}</span>
          </div>
        </div>
      }
      description={lb?.dns_name || "Provisioning DNS..."}
    >
      <div className="space-y-6">
        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <ModernCard className="p-4 flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Layers className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="text-xs text-gray-500 uppercase font-bold">Type</div>
              <div className="text-sm font-semibold capitalize">{lb?.lb_type || "Application"}</div>
            </div>
          </ModernCard>
          <ModernCard className="p-4 flex items-center gap-3">
            <div className="p-2 bg-green-50 rounded-lg">
              <Activity className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <div className="text-xs text-gray-500 uppercase font-bold">Status</div>
              <div className="text-sm font-semibold capitalize">{lb?.status || "Active"}</div>
            </div>
          </ModernCard>
          <ModernCard className="p-4 flex items-center gap-3">
            <div className="p-2 bg-purple-50 rounded-lg">
              <Shield className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <div className="text-xs text-gray-500 uppercase font-bold">Scheme</div>
              <div className="text-sm font-semibold">
                {lb?.is_external ? "Internet-facing" : "Internal"}
              </div>
            </div>
          </ModernCard>
          <ModernCard className="p-4 flex items-center gap-3">
            <div className="p-2 bg-orange-50 rounded-lg">
              <Settings className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <div className="text-xs text-gray-500 uppercase font-bold">VPC</div>
              <div className="text-sm font-semibold font-mono">
                {lb?.vpc_id?.substring(0, 8)}...
              </div>
            </div>
          </ModernCard>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab("listeners")}
            className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === "listeners" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
          >
            Listeners ({listeners.length})
          </button>
          <button
            onClick={() => setActiveTab("target-groups")}
            className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === "target-groups" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
          >
            Target Groups ({targetGroups.length})
          </button>
        </div>

        {/* Listeners Content */}
        {activeTab === "listeners" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Listeners</h3>
              <ModernButton variant="primary" size="sm" onClick={() => setShowAddListener(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Listener
              </ModernButton>
            </div>

            {showAddListener && (
              <ModernCard className="p-6 border-dashed border-2 border-blue-100 bg-blue-50/30">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                      Name
                    </label>
                    <input
                      type="text"
                      placeholder="http-80"
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      value={newListener.name}
                      onChange={(e) => setNewListener({ ...newListener, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                      Protocol / Port
                    </label>
                    <div className="flex gap-2">
                      <select
                        className="w-24 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none"
                        value={newListener.protocol}
                        onChange={(e) =>
                          setNewListener({ ...newListener, protocol: e.target.value })
                        }
                      >
                        <option>HTTP</option>
                        <option>HTTPS</option>
                        <option>TCP</option>
                        <option>UDP</option>
                      </select>
                      <input
                        type="number"
                        placeholder="80"
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        value={newListener.port}
                        onChange={(e) =>
                          setNewListener({ ...newListener, port: parseInt(e.target.value) })
                        }
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                      Forward to Target Group
                    </label>
                    <select
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none"
                      value={newListener.target_group_id}
                      onChange={(e) =>
                        setNewListener({ ...newListener, target_group_id: e.target.value })
                      }
                    >
                      <option value="">Select Target Group</option>
                      {targetGroups.map((tg: any) => (
                        <option key={tg.id} value={tg.id}>
                          {tg.name} ({tg.protocol}:{tg.port})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <ModernButton
                      variant="primary"
                      size="sm"
                      onClick={handleAddListener}
                      disabled={!newListener.target_group_id}
                    >
                      Save
                    </ModernButton>
                    <ModernButton
                      variant="secondary"
                      size="sm"
                      onClick={() => setShowAddListener(false)}
                    >
                      Cancel
                    </ModernButton>
                  </div>
                </div>
              </ModernCard>
            )}

            <ModernCard className="overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
                      Listener
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
                      Protocol:Port
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
                      Default Action
                    </th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {listeners.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-10 text-center text-gray-500">
                        No listeners configured.
                      </td>
                    </tr>
                  ) : (
                    listeners.map((l: any) => (
                      <tr key={l.id} className="hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="font-medium text-gray-900">{l.name}</div>
                          <div className="text-[10px] text-gray-400 font-mono">{l.id}</div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 bg-gray-100 rounded text-xs font-medium text-gray-700">
                            {l.protocol}:{l.port}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <ChevronRight className="w-3 h-3 text-gray-400" />
                            <span>Forward to</span>
                            <span className="font-medium text-blue-600">
                              {l.default_action_target_group_name || l.target_group_id || "Unknown"}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() =>
                              deleteListenerMutation.mutate({ projectId, listenerId: l.id })
                            }
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </ModernCard>
          </div>
        )}

        {/* Target Groups Content */}
        {activeTab === "target-groups" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Target Groups</h3>
              <ModernButton variant="primary" size="sm" onClick={() => setShowAddTG(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Target Group
              </ModernButton>
            </div>

            {showAddTG && (
              <ModernCard className="p-6 border-dashed border-2 border-green-100 bg-green-50/30">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                        Name
                      </label>
                      <input
                        type="text"
                        placeholder="tg-production"
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none"
                        value={newTG.name}
                        onChange={(e) => setNewTG({ ...newTG, name: e.target.value })}
                      />
                    </div>
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                          Protocol
                        </label>
                        <select
                          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none"
                          value={newTG.protocol}
                          onChange={(e) => setNewTG({ ...newTG, protocol: e.target.value })}
                        >
                          <option>HTTP</option>
                          <option>HTTPS</option>
                          <option>TCP</option>
                        </select>
                      </div>
                      <div className="w-24">
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                          Port
                        </label>
                        <input
                          type="number"
                          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none"
                          value={newTG.port}
                          onChange={(e) => setNewTG({ ...newTG, port: parseInt(e.target.value) })}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                        Health Check Path
                      </label>
                      <input
                        type="text"
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none"
                        value={newTG.health_check_path}
                        onChange={(e) => setNewTG({ ...newTG, health_check_path: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                        Target Type
                      </label>
                      <select
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none"
                        value={newTG.target_type}
                        onChange={(e) => setNewTG({ ...newTG, target_type: e.target.value })}
                      >
                        <option value="instance">Instances</option>
                        <option value="ip">IP Addresses</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex flex-col justify-end gap-2">
                    <ModernButton variant="primary" onClick={handleAddTG}>
                      Save Target Group
                    </ModernButton>
                    <ModernButton variant="secondary" onClick={() => setShowAddTG(false)}>
                      Cancel
                    </ModernButton>
                  </div>
                </div>
              </ModernCard>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {targetGroups.length === 0 ? (
                <div className="lg:col-span-2 py-10 text-center text-gray-500 bg-white rounded-xl border border-gray-100">
                  No target groups created yet.
                </div>
              ) : (
                targetGroups.map((tg: any) => (
                  <ModernCard
                    key={tg.id}
                    className="p-5 flex flex-col justify-between hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-gray-900">{tg.name}</h4>
                          <span className="text-[10px] bg-gray-100 px-2 py-0.5 rounded uppercase font-bold text-gray-500">
                            {tg.protocol}:{tg.port}
                          </span>
                        </div>
                        <div className="text-[10px] text-gray-400 font-mono mt-1">{tg.id}</div>
                      </div>
                      <button
                        onClick={() => deleteTGMutation.mutate({ projectId, tgId: tg.id })}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="bg-gray-50/50 rounded-lg p-3 space-y-2 mb-4">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Targets:</span>
                        <span className="font-semibold text-gray-900">
                          {tg.targets?.length || 0} registered
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Health Check:</span>
                        <span className="font-semibold text-gray-900">
                          {tg.health_check_protocol} {tg.health_check_path}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <ModernButton
                        variant="secondary"
                        size="sm"
                        className="flex-1 text-xs"
                        onClick={() => {
                          setShowRegisterTargets(tg.id);
                          setSelectedInstanceIds([]);
                        }}
                      >
                        <PlusCircle className="w-3.5 h-3.5 mr-1.5" />
                        Register Targets
                      </ModernButton>
                      <ModernButton
                        variant="secondary"
                        size="sm"
                        className="px-2"
                        title="View Health"
                      >
                        <Activity className="w-3.5 h-3.5" />
                      </ModernButton>
                    </div>
                  </ModernCard>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Register Targets Modal-ish Overlay */}
      {showRegisterTargets && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
          <ModernCard className="w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div>
                <h3 className="font-bold text-gray-900">Register Instances</h3>
                <p className="text-xs text-gray-500">Select instances to add to targeted group</p>
              </div>
              <button
                onClick={() => setShowRegisterTargets(null)}
                className="p-2 hover:bg-white rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {instances.length === 0 ? (
                <div className="py-20 text-center">
                  <Server className="w-12 h-12 text-gray-100 mx-auto mb-4" />
                  <p className="text-gray-400">No instances available to register.</p>
                </div>
              ) : (
                instances.map((instance: any) => {
                  const isSelected = selectedInstanceIds.includes(instance.id);
                  return (
                    <button
                      key={instance.id}
                      onClick={() => {
                        if (isSelected) {
                          setSelectedInstanceIds(
                            selectedInstanceIds.filter((id) => id !== instance.id)
                          );
                        } else {
                          setSelectedInstanceIds([...selectedInstanceIds, instance.id]);
                        }
                      }}
                      className={`w-full flex items-center gap-4 p-3 rounded-xl border transition-all text-left ${isSelected ? "border-blue-500 bg-blue-50" : "border-gray-100 hover:border-gray-200"}`}
                    >
                      <div
                        className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 ${isSelected ? "bg-blue-600 border-blue-600 text-white" : "bg-white border-gray-300"}`}
                      >
                        {isSelected && <Check className="w-3 h-3" />}
                      </div>
                      <div className="flex-1">
                        <div className="font-bold text-sm text-gray-900">
                          {instance.name || instance.instance_id}
                        </div>
                        <div className="text-[10px] text-gray-500 font-mono">
                          {instance.private_ip_address} | {instance.instance_type}
                        </div>
                      </div>
                      <div
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${instance.state === "running" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}
                      >
                        {instance.state}
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">
                {selectedInstanceIds.length} instance(s) selected
              </span>
              <div className="flex gap-2">
                <ModernButton variant="secondary" onClick={() => setShowRegisterTargets(null)}>
                  Cancel
                </ModernButton>
                <ModernButton
                  variant="primary"
                  onClick={handleRegisterTargets}
                  disabled={selectedInstanceIds.length === 0 || registerTargetsMutation.isPending}
                >
                  {registerTargetsMutation.isPending ? "Registering..." : "Register Selected"}
                </ModernButton>
              </div>
            </div>
          </ModernCard>
        </div>
      )}
    </TenantPageShell>
  );
};

export default TenantLoadBalancerDetail;
