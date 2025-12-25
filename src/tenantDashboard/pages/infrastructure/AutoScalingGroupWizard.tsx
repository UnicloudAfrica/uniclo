import React, { useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  TrendingUp,
  ArrowLeft,
  ArrowRight,
  Check,
  Network,
  Zap,
  Settings,
  Target,
} from "lucide-react";
import TenantPageShell from "../../components/TenantPageShell";
import ModernCard from "../../../shared/components/ui/ModernCard";
import ModernButton from "../../../shared/components/ui/ModernButton";
import { useSubnets } from "../../../hooks/adminHooks/vpcInfraHooks";
import {
  useLaunchConfigurations,
  useCreateAutoScalingGroup,
  useCreateScalingPolicy,
} from "../../../hooks/autoScalingHooks";

const AutoScalingGroupWizard: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const rawProjectId = searchParams.get("id") || "";
  const region = searchParams.get("region") || "";

  const projectId = useMemo(() => {
    try {
      return atob(rawProjectId);
    } catch {
      return rawProjectId;
    }
  }, [rawProjectId]);

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    launch_configuration_id: "",
    min_size: 1,
    max_size: 4,
    desired_capacity: 2,
    subnets: [] as string[],
    health_check_type: "vm_monitor" as "vm_monitor" | "load_balancer",
    health_check_grace_period: 300,
    default_cooldown: 300,
    // Scaling policy
    enable_policy: false,
    policy_name: "",
    metric_type: "avg_cpu_utilization",
    target_value: "70",
  });

  const { data: launchConfigs = [] } = useLaunchConfigurations(projectId, region);
  const { data: subnets = [] } = useSubnets(projectId);
  const createGroupMutation = useCreateAutoScalingGroup();
  const createPolicyMutation = useCreateScalingPolicy();

  const handleNext = () => setStep(step + 1);
  const handleBack = () => setStep(step - 1);

  const handleCreate = async () => {
    // Create the ASG first
    const result = await createGroupMutation.mutateAsync({
      project_id: projectId,
      region,
      name: formData.name,
      min_size: formData.min_size,
      max_size: formData.max_size,
      launch_configuration_id: formData.launch_configuration_id,
      desired_capacity: formData.desired_capacity,
      subnets: formData.subnets.length > 0 ? formData.subnets : undefined,
      health_check_type: formData.health_check_type,
      health_check_grace_period: formData.health_check_grace_period,
      default_cooldown: formData.default_cooldown,
    });

    // If scaling policy is enabled, create it
    if (formData.enable_policy && formData.policy_name && result?.data?.id) {
      await createPolicyMutation.mutateAsync({
        project_id: projectId,
        region,
        name: formData.policy_name,
        group_id: result.data.id,
        metric_type: formData.metric_type,
        target_value: formData.target_value,
      });
    }

    navigate(`/dashboard/infrastructure/autoscaling?id=${rawProjectId}&region=${region}`);
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Step 1: Basic Settings</h3>
      <div className="grid grid-cols-1 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Group Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="my-asg"
            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Launch Configuration
          </label>
          {launchConfigs.length === 0 ? (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                No launch configurations found.
                <button
                  onClick={() =>
                    navigate(
                      `/dashboard/infrastructure/autoscaling/create-config?id=${rawProjectId}&region=${region}`
                    )
                  }
                  className="ml-1 text-yellow-900 underline font-medium"
                >
                  Create one first
                </button>
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {launchConfigs.map((lc: any) => (
                <button
                  key={lc.id}
                  onClick={() => setFormData({ ...formData, launch_configuration_id: lc.id })}
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                    formData.launch_configuration_id === lc.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-100 hover:border-gray-200"
                  }`}
                >
                  <Settings
                    className={`w-6 h-6 ${formData.launch_configuration_id === lc.id ? "text-blue-600" : "text-gray-400"}`}
                  />
                  <div>
                    <div className="font-bold text-gray-900">{lc.name}</div>
                    <div className="text-xs text-gray-500">Instance Type: {lc.instance_type}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Step 2: Capacity Settings</h3>
      <div className="grid grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Size</label>
          <input
            type="number"
            min={0}
            value={formData.min_size}
            onChange={(e) => setFormData({ ...formData, min_size: parseInt(e.target.value) || 0 })}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <p className="text-xs text-gray-500 mt-1">Minimum instances to maintain</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Desired Capacity</label>
          <input
            type="number"
            min={formData.min_size}
            max={formData.max_size}
            value={formData.desired_capacity}
            onChange={(e) =>
              setFormData({ ...formData, desired_capacity: parseInt(e.target.value) || 1 })
            }
            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <p className="text-xs text-gray-500 mt-1">Initial number of instances</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Maximum Size</label>
          <input
            type="number"
            min={formData.min_size}
            value={formData.max_size}
            onChange={(e) => setFormData({ ...formData, max_size: parseInt(e.target.value) || 1 })}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <p className="text-xs text-gray-500 mt-1">Maximum instances allowed</p>
        </div>
      </div>

      <div className="bg-gray-50 rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="font-medium text-gray-900">Capacity Visualization</div>
            <div className="text-xs text-gray-500">Min / Desired / Max</div>
          </div>
        </div>
        <div className="relative h-8 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="absolute h-full bg-blue-200"
            style={{ width: `${(formData.max_size / Math.max(formData.max_size, 10)) * 100}%` }}
          />
          <div
            className="absolute h-full bg-blue-500"
            style={{
              width: `${(formData.desired_capacity / Math.max(formData.max_size, 10)) * 100}%`,
            }}
          />
          <div
            className="absolute h-full bg-blue-700"
            style={{ width: `${(formData.min_size / Math.max(formData.max_size, 10)) * 100}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs font-medium">
          <span className="text-blue-700">Min: {formData.min_size}</span>
          <span className="text-blue-500">Desired: {formData.desired_capacity}</span>
          <span className="text-blue-300">Max: {formData.max_size}</span>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Subnets (Optional)</label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {subnets.map((sub: any) => (
            <button
              key={sub.id}
              onClick={() => {
                const exists = formData.subnets.includes(sub.id);
                if (exists) {
                  setFormData({
                    ...formData,
                    subnets: formData.subnets.filter((id) => id !== sub.id),
                  });
                } else {
                  setFormData({ ...formData, subnets: [...formData.subnets, sub.id] });
                }
              }}
              className={`flex items-center gap-3 p-3 rounded-lg border transition-all text-left ${
                formData.subnets.includes(sub.id)
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:bg-gray-50"
              }`}
            >
              <div
                className={`w-5 h-5 rounded border flex items-center justify-center ${
                  formData.subnets.includes(sub.id)
                    ? "bg-blue-500 border-blue-500 text-white"
                    : "bg-white border-gray-300"
                }`}
              >
                {formData.subnets.includes(sub.id) && <Check className="w-3 h-3" />}
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">{sub.name || "Unnamed"}</div>
                <div className="text-xs text-gray-500 font-mono">{sub.cidr}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900 border-b pb-2">
        Step 3: Scaling Policy (Optional)
      </h3>

      <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
        <div className="flex-1">
          <div className="font-medium text-gray-900">Enable Target Tracking Scaling</div>
          <div className="text-xs text-gray-500">
            Automatically scale based on a target metric value
          </div>
        </div>
        <button
          onClick={() => setFormData({ ...formData, enable_policy: !formData.enable_policy })}
          className={`w-12 h-6 rounded-full transition-all ${formData.enable_policy ? "bg-blue-600" : "bg-gray-300"}`}
        >
          <div
            className={`w-5 h-5 rounded-full bg-white shadow transition-all ${formData.enable_policy ? "ml-6" : "ml-0.5"}`}
          />
        </button>
      </div>

      {formData.enable_policy && (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Policy Name</label>
            <input
              type="text"
              value={formData.policy_name}
              onChange={(e) => setFormData({ ...formData, policy_name: e.target.value })}
              placeholder="cpu-tracking-policy"
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Metric Type</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                {
                  id: "avg_cpu_utilization",
                  name: "Average CPU Utilization",
                  desc: "Scale based on CPU usage",
                },
                {
                  id: "avg_network_in",
                  name: "Average Network In",
                  desc: "Scale based on incoming network bytes",
                },
                {
                  id: "avg_network_out",
                  name: "Average Network Out",
                  desc: "Scale based on outgoing network bytes",
                },
              ].map((metric) => (
                <button
                  key={metric.id}
                  onClick={() => setFormData({ ...formData, metric_type: metric.id })}
                  className={`p-3 rounded-lg border-2 text-left transition-all ${
                    formData.metric_type === metric.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-100 hover:border-gray-200"
                  }`}
                >
                  <div className="font-medium text-gray-900 text-sm">{metric.name}</div>
                  <div className="text-xs text-gray-500">{metric.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Target Value ({formData.metric_type === "avg_cpu_utilization" ? "%" : "bytes"})
            </label>
            <input
              type="number"
              value={formData.target_value}
              onChange={(e) => setFormData({ ...formData, target_value: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              The group will scale to maintain this target value
            </p>
          </div>
        </div>
      )}
    </div>
  );

  const renderSummary = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Step 4: Review & Create</h3>
      <div className="bg-gray-50 rounded-xl p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase">Group Name</div>
            <div className="font-medium">{formData.name}</div>
          </div>
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase">Launch Config</div>
            <div className="font-medium font-mono text-sm truncate">
              {formData.launch_configuration_id}
            </div>
          </div>
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase">Capacity</div>
            <div className="font-medium">
              Min: {formData.min_size} / Desired: {formData.desired_capacity} / Max:{" "}
              {formData.max_size}
            </div>
          </div>
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase">Health Check</div>
            <div className="font-medium capitalize">
              {formData.health_check_type.replace("_", " ")}
            </div>
          </div>
        </div>
        {formData.subnets.length > 0 && (
          <div className="border-t pt-4">
            <div className="text-xs font-semibold text-gray-500 uppercase mb-2">
              Subnets ({formData.subnets.length})
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.subnets.map((id) => (
                <span
                  key={id}
                  className="px-2 py-1 bg-white border border-gray-200 rounded text-xs font-mono"
                >
                  {id.substring(0, 12)}...
                </span>
              ))}
            </div>
          </div>
        )}
        {formData.enable_policy && (
          <div className="border-t pt-4">
            <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Scaling Policy</div>
            <div className="bg-white p-3 rounded-lg border border-gray-200">
              <div className="font-medium">{formData.policy_name}</div>
              <div className="text-sm text-gray-600">
                Target {formData.metric_type.replace(/_/g, " ")}: {formData.target_value}
                {formData.metric_type === "avg_cpu_utilization" ? "%" : " bytes"}
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex gap-3">
        <TrendingUp className="w-5 h-5 text-blue-600 shrink-0" />
        <div className="text-sm text-blue-800">
          The auto-scaling group will start provisioning instances immediately after creation.
        </div>
      </div>
    </div>
  );

  return (
    <TenantPageShell
      title="Create Auto-scaling Group"
      description="Configure automatic scaling for your compute capacity"
      actions={
        <ModernButton variant="secondary" onClick={() => navigate(-1)}>
          Cancel
        </ModernButton>
      }
    >
      <div className="max-w-3xl mx-auto py-8">
        {/* Stepper */}
        <div className="flex items-center justify-between mb-12 relative px-4">
          <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-100 -translate-y-1/2 z-0"></div>
          {[1, 2, 3, 4].map((num) => (
            <div
              key={num}
              className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                step >= num
                  ? "bg-blue-600 text-white shadow-lg"
                  : "bg-white border-2 border-gray-200 text-gray-400"
              }`}
            >
              {step > num ? <Check className="w-5 h-5" /> : num}
            </div>
          ))}
        </div>

        <ModernCard className="p-8 shadow-xl border-t-4 border-blue-600">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderSummary()}

          <div className="mt-8 flex justify-between pt-6 border-t border-gray-100">
            {step > 1 ? (
              <ModernButton variant="secondary" onClick={handleBack}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </ModernButton>
            ) : (
              <div></div>
            )}

            {step < 4 ? (
              <ModernButton
                variant="primary"
                onClick={handleNext}
                disabled={step === 1 ? !formData.name || !formData.launch_configuration_id : false}
              >
                Next Step
                <ArrowRight className="w-4 h-4 ml-2" />
              </ModernButton>
            ) : (
              <ModernButton
                variant="primary"
                onClick={handleCreate}
                disabled={createGroupMutation.isPending}
              >
                {createGroupMutation.isPending ? "Creating..." : "Create Auto-scaling Group"}
                <TrendingUp className="w-4 h-4 ml-2" />
              </ModernButton>
            )}
          </div>
        </ModernCard>
      </div>
    </TenantPageShell>
  );
};

export default AutoScalingGroupWizard;
