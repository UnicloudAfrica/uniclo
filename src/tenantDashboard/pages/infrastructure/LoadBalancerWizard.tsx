import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Zap, ArrowLeft, ArrowRight, Check, Globe, Layers, Shield, Network } from "lucide-react";
import TenantPageShell from "../../components/TenantPageShell";
import ModernCard from "../../../shared/components/ui/ModernCard";
import ModernButton from "../../../shared/components/ui/ModernButton";
import { useVpcs, useSubnets, useSecurityGroups } from "../../../shared/hooks/vpcInfraHooks";
import { useCreateLoadBalancer } from "../../../hooks/adminHooks/loadBalancerHooks";

const LoadBalancerWizard: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("project") || "";
  const region = searchParams.get("region") || "";

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    lb_type: "application", // application | network
    is_external: true,
    vpc_id: "",
    subnet_ids: [] as string[],
    security_groups_ids: [] as string[],
  });

  const { data: vpcs = [] } = useVpcs(projectId, region);
  const { data: subnets = [] } = useSubnets(projectId, region);
  const { data: sgs = [] } = useSecurityGroups(projectId, region);
  const createMutation = useCreateLoadBalancer();

  const filteredSubnets = subnets.filter(
    (s: any) => s.vpc_id === formData.vpc_id || s.network_id === formData.vpc_id
  );

  const handleNext = () => setStep(step + 1);
  const handleBack = () => setStep(step - 1);

  const handleCreate = async () => {
    await createMutation.mutateAsync({
      projectId,
      payload: {
        ...formData,
        subnet_ids: formData.subnet_ids.join(","), // API expects comma separated string usually or array? Swagger said string.
        security_groups_ids: formData.security_groups_ids.join(","),
      },
    });
    navigate(`/dashboard/infrastructure/load-balancers?project=${projectId}`);
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Step 1: Basic Settings</h3>
      <div className="grid grid-cols-1 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Load Balancer Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="my-app-lb"
            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description (Optional)
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Production app load balancer"
            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
            rows={2}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => setFormData({ ...formData, lb_type: "application" })}
            className={`p-4 rounded-xl border-2 text-left transition-all ${
              formData.lb_type === "application"
                ? "border-blue-500 bg-blue-50"
                : "border-gray-100 hover:border-gray-200"
            }`}
          >
            <Globe
              className={`w-8 h-8 mb-2 ${formData.lb_type === "application" ? "text-blue-600" : "text-gray-400"}`}
            />
            <div className="font-bold text-gray-900">Application Load Balancer</div>
            <div className="text-xs text-gray-500">Best for HTTP/HTTPS traffic. Layer 7.</div>
          </button>
          <button
            onClick={() => setFormData({ ...formData, lb_type: "network" })}
            className={`p-4 rounded-xl border-2 text-left transition-all ${
              formData.lb_type === "network"
                ? "border-purple-500 bg-purple-50"
                : "border-gray-100 hover:border-gray-200"
            }`}
          >
            <Layers
              className={`w-8 h-8 mb-2 ${formData.lb_type === "network" ? "text-purple-600" : "text-gray-400"}`}
            />
            <div className="font-bold text-gray-900">Network Load Balancer</div>
            <div className="text-xs text-gray-500">Best for TCP/UDP traffic. Layer 4.</div>
          </button>
        </div>
        <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="flex-1">
            <div className="font-medium text-gray-900">Scheme</div>
            <div className="text-xs text-gray-500">
              Choose whether the LB is accessible from the internet.
            </div>
          </div>
          <div className="flex bg-white rounded-lg p-1 border border-gray-200">
            <button
              onClick={() => setFormData({ ...formData, is_external: true })}
              className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${formData.is_external ? "bg-blue-600 text-white shadow-sm" : "text-gray-600 hover:bg-gray-50"}`}
            >
              Internet-facing
            </button>
            <button
              onClick={() => setFormData({ ...formData, is_external: false })}
              className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${!formData.is_external ? "bg-blue-600 text-white shadow-sm" : "text-gray-600 hover:bg-gray-50"}`}
            >
              Internal
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900 border-b pb-2">
        Step 2: Network Configuration
      </h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">VPC</label>
          <select
            value={formData.vpc_id}
            onChange={(e) => setFormData({ ...formData, vpc_id: e.target.value, subnet_ids: [] })}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="">Select VPC</option>
            {vpcs.map((vpc: any) => (
              <option key={vpc.id} value={vpc.id}>
                {vpc.name || vpc.id} ({vpc.cidr_block || vpc.cidr})
              </option>
            ))}
          </select>
        </div>

        {formData.vpc_id && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subnets (Select at least 2 for High Availability)
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredSubnets.map((sub: any) => (
                <button
                  key={sub.id}
                  onClick={() => {
                    const exists = formData.subnet_ids.includes(sub.id);
                    if (exists) {
                      setFormData({
                        ...formData,
                        subnet_ids: formData.subnet_ids.filter((id) => id !== sub.id),
                      });
                    } else {
                      setFormData({ ...formData, subnet_ids: [...formData.subnet_ids, sub.id] });
                    }
                  }}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-all text-left ${
                    formData.subnet_ids.includes(sub.id)
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded border flex items-center justify-center ${formData.subnet_ids.includes(sub.id) ? "bg-blue-500 border-blue-500 text-white" : "bg-white border-gray-300"}`}
                  >
                    {formData.subnet_ids.includes(sub.id) && <Check className="w-3 h-3" />}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">{sub.name || "Unnamed"}</div>
                    <div className="text-xs text-gray-500 font-mono">{sub.cidr}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Security Groups</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {sgs.map((sg: any) => (
              <button
                key={sg.id}
                onClick={() => {
                  const exists = formData.security_groups_ids.includes(sg.id);
                  if (exists) {
                    setFormData({
                      ...formData,
                      security_groups_ids: formData.security_groups_ids.filter(
                        (id) => id !== sg.id
                      ),
                    });
                  } else {
                    setFormData({
                      ...formData,
                      security_groups_ids: [...formData.security_groups_ids, sg.id],
                    });
                  }
                }}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-all text-left ${
                  formData.security_groups_ids.includes(sg.id)
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:bg-gray-50"
                }`}
              >
                <div
                  className={`w-x h-5 w-5 rounded border flex items-center justify-center ${formData.security_groups_ids.includes(sg.id) ? "bg-blue-500 border-blue-500 text-white" : "bg-white border-gray-300"}`}
                >
                  {formData.security_groups_ids.includes(sg.id) && <Check className="w-3 h-3" />}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">{sg.name}</div>
                  <div className="text-xs text-gray-500 truncate">{sg.description}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderSummary = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Step 3: Review & Create</h3>
      <div className="bg-gray-50 rounded-xl p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase">LB Name</div>
            <div className="font-medium">{formData.name}</div>
          </div>
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase">Type</div>
            <div className="font-medium capitalize">{formData.lb_type}</div>
          </div>
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase">Scheme</div>
            <div className="font-medium">
              {formData.is_external ? "Internet-facing" : "Internal"}
            </div>
          </div>
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase">VPC</div>
            <div className="font-medium font-mono text-sm">{formData.vpc_id}</div>
          </div>
        </div>
        <div className="border-t pt-4">
          <div className="text-xs font-semibold text-gray-500 uppercase mb-2">
            Selected Subnets ({formData.subnet_ids.length})
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.subnet_ids.map((id) => (
              <span
                key={id}
                className="px-2 py-1 bg-white border border-gray-200 rounded text-xs font-mono"
              >
                {id.substring(0, 12)}...
              </span>
            ))}
          </div>
        </div>
        <div className="border-t pt-4">
          <div className="text-xs font-semibold text-gray-500 uppercase mb-2">
            Security Groups ({formData.security_groups_ids.length})
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.security_groups_ids.map((id) => (
              <span
                key={id}
                className="px-2 py-1 bg-white border border-gray-200 rounded text-xs font-mono"
              >
                {id.substring(0, 12)}...
              </span>
            ))}
          </div>
        </div>
      </div>
      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex gap-3">
        <Shield className="w-5 h-5 text-blue-600 shrink-0" />
        <div className="text-sm text-blue-800">
          Once created, the Load Balancer will begin provisioning. You will need to add Listeners
          and Target Groups to start routing traffic.
        </div>
      </div>
    </div>
  );

  return (
    <TenantPageShell
      title="Create Load Balancer"
      description="Configure your new application or network load balancer"
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
          {[1, 2, 3].map((num) => (
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
          {step === 3 && renderSummary()}

          <div className="mt-8 flex justify-between pt-6 border-t border-gray-100">
            {step > 1 ? (
              <ModernButton variant="secondary" onClick={handleBack}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </ModernButton>
            ) : (
              <div></div>
            )}

            {step < 3 ? (
              <ModernButton
                variant="primary"
                onClick={handleNext}
                disabled={
                  step === 1
                    ? !formData.name
                    : step === 2
                      ? !formData.vpc_id || formData.subnet_ids.length < 1
                      : false
                }
              >
                Next Step
                <ArrowRight className="w-4 h-4 ml-2" />
              </ModernButton>
            ) : (
              <ModernButton
                variant="primary"
                onClick={handleCreate}
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? "Provisioning..." : "Create Load Balancer"}
                <Zap className="w-4 h-4 ml-2" />
              </ModernButton>
            )}
          </div>
        </ModernCard>
      </div>
    </TenantPageShell>
  );
};

export default LoadBalancerWizard;
