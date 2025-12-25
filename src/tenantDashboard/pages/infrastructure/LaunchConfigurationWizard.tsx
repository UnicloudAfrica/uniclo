import React, { useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Settings, ArrowLeft, ArrowRight, Check, Server, Key, Shield } from "lucide-react";
import TenantPageShell from "../../components/TenantPageShell";
import ModernCard from "../../../shared/components/ui/ModernCard";
import ModernButton from "../../../shared/components/ui/ModernButton";
import { useSecurityGroups } from "../../../hooks/adminHooks/vpcInfraHooks";
import { useFetchTenantKeyPairs } from "../../../hooks/keyPairsHook";
import { useImages } from "../../../hooks/storageHooks";
import { useCreateLaunchConfiguration } from "../../../hooks/autoScalingHooks";

interface InstanceType {
  id: string;
  name: string;
  vcpus: number;
  ram: number;
  description: string;
}

const INSTANCE_TYPES: InstanceType[] = [
  {
    id: "t2.micro",
    name: "t2.micro",
    vcpus: 1,
    ram: 1,
    description: "1 vCPU, 1 GB RAM - Free tier eligible",
  },
  { id: "t2.small", name: "t2.small", vcpus: 1, ram: 2, description: "1 vCPU, 2 GB RAM" },
  { id: "t2.medium", name: "t2.medium", vcpus: 2, ram: 4, description: "2 vCPUs, 4 GB RAM" },
  { id: "t2.large", name: "t2.large", vcpus: 2, ram: 8, description: "2 vCPUs, 8 GB RAM" },
  {
    id: "m4.large",
    name: "m4.large",
    vcpus: 2,
    ram: 8,
    description: "2 vCPUs, 8 GB RAM - General purpose",
  },
  { id: "m4.xlarge", name: "m4.xlarge", vcpus: 4, ram: 16, description: "4 vCPUs, 16 GB RAM" },
  {
    id: "c4.large",
    name: "c4.large",
    vcpus: 2,
    ram: 3.75,
    description: "2 vCPUs, 3.75 GB RAM - Compute optimized",
  },
  { id: "c4.xlarge", name: "c4.xlarge", vcpus: 4, ram: 7.5, description: "4 vCPUs, 7.5 GB RAM" },
];

const LaunchConfigurationWizard: React.FC = () => {
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
    description: "",
    instance_type: "",
    image_id: "",
    key_pair: "",
    security_groups: [] as string[],
    user_data: "",
  });

  const { data: images = [] } = useImages(projectId, region);
  const { data: keyPairs = [] } = useFetchTenantKeyPairs(projectId, region);
  const { data: sgs = [] } = useSecurityGroups(projectId);
  const createMutation = useCreateLaunchConfiguration();

  const handleNext = () => setStep(step + 1);
  const handleBack = () => setStep(step - 1);

  const handleCreate = async () => {
    await createMutation.mutateAsync({
      project_id: projectId,
      region,
      name: formData.name,
      instance_type: formData.instance_type,
      image_id: formData.image_id || undefined,
      key_pair: formData.key_pair || undefined,
      security_groups: formData.security_groups.length > 0 ? formData.security_groups : undefined,
      user_data: formData.user_data || undefined,
      description: formData.description || undefined,
    });
    navigate(`/dashboard/infrastructure/autoscaling?id=${rawProjectId}&region=${region}`);
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Step 1: Basic Settings</h3>
      <div className="grid grid-cols-1 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Configuration Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="my-app-lc"
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
            placeholder="Launch configuration for web servers"
            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
            rows={2}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Instance Type</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {INSTANCE_TYPES.map((type) => (
              <button
                key={type.id}
                onClick={() => setFormData({ ...formData, instance_type: type.id })}
                className={`flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                  formData.instance_type === type.id
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-100 hover:border-gray-200"
                }`}
              >
                <Server
                  className={`w-6 h-6 ${formData.instance_type === type.id ? "text-blue-600" : "text-gray-400"}`}
                />
                <div>
                  <div className="font-bold text-gray-900">{type.name}</div>
                  <div className="text-xs text-gray-500">{type.description}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Step 2: Image & Key Pair</h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Machine Image</label>
          <select
            value={formData.image_id}
            onChange={(e) => setFormData({ ...formData, image_id: e.target.value })}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="">Select Image (Optional)</option>
            {images.map((img: any) => (
              <option key={img.id} value={img.id}>
                {img.name || img.id}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Key Pair</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {keyPairs.map((kp: any) => (
              <button
                key={kp.id || kp.name}
                onClick={() => setFormData({ ...formData, key_pair: kp.name })}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-all text-left ${
                  formData.key_pair === kp.name
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:bg-gray-50"
                }`}
              >
                <Key
                  className={`w-5 h-5 ${formData.key_pair === kp.name ? "text-blue-600" : "text-gray-400"}`}
                />
                <div className="text-sm font-medium text-gray-900">{kp.name}</div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Security Groups</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {sgs.map((sg: any) => (
              <button
                key={sg.id}
                onClick={() => {
                  const exists = formData.security_groups.includes(sg.id);
                  if (exists) {
                    setFormData({
                      ...formData,
                      security_groups: formData.security_groups.filter((id) => id !== sg.id),
                    });
                  } else {
                    setFormData({
                      ...formData,
                      security_groups: [...formData.security_groups, sg.id],
                    });
                  }
                }}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-all text-left ${
                  formData.security_groups.includes(sg.id)
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:bg-gray-50"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded border flex items-center justify-center ${
                    formData.security_groups.includes(sg.id)
                      ? "bg-blue-500 border-blue-500 text-white"
                      : "bg-white border-gray-300"
                  }`}
                >
                  {formData.security_groups.includes(sg.id) && <Check className="w-3 h-3" />}
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

  const renderStep3 = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900 border-b pb-2">
        Step 3: User Data (Optional)
      </h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">User Data Script</label>
          <p className="text-xs text-gray-500 mb-2">
            Enter cloud-init or shell script to run when instances launch.
          </p>
          <textarea
            value={formData.user_data}
            onChange={(e) => setFormData({ ...formData, user_data: e.target.value })}
            placeholder="#!/bin/bash&#10;echo 'Hello World'"
            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm"
            rows={8}
          />
        </div>
      </div>
    </div>
  );

  const renderSummary = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Step 4: Review & Create</h3>
      <div className="bg-gray-50 rounded-xl p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase">Name</div>
            <div className="font-medium">{formData.name}</div>
          </div>
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase">Instance Type</div>
            <div className="font-medium font-mono">{formData.instance_type}</div>
          </div>
          {formData.image_id && (
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase">Image</div>
              <div className="font-medium font-mono text-sm truncate">{formData.image_id}</div>
            </div>
          )}
          {formData.key_pair && (
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase">Key Pair</div>
              <div className="font-medium">{formData.key_pair}</div>
            </div>
          )}
        </div>
        {formData.security_groups.length > 0 && (
          <div className="border-t pt-4">
            <div className="text-xs font-semibold text-gray-500 uppercase mb-2">
              Security Groups ({formData.security_groups.length})
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.security_groups.map((id) => (
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
        {formData.user_data && (
          <div className="border-t pt-4">
            <div className="text-xs font-semibold text-gray-500 uppercase mb-2">User Data</div>
            <pre className="bg-gray-800 text-green-400 p-3 rounded-lg text-xs overflow-auto max-h-32">
              {formData.user_data}
            </pre>
          </div>
        )}
      </div>
      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex gap-3">
        <Settings className="w-5 h-5 text-blue-600 shrink-0" />
        <div className="text-sm text-blue-800">
          This launch configuration will be used by auto-scaling groups to launch new instances.
        </div>
      </div>
    </div>
  );

  return (
    <TenantPageShell
      title="Create Launch Configuration"
      description="Define how instances should be launched in an auto-scaling group"
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
                disabled={step === 1 ? !formData.name || !formData.instance_type : false}
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
                {createMutation.isPending ? "Creating..." : "Create Configuration"}
                <Settings className="w-4 h-4 ml-2" />
              </ModernButton>
            )}
          </div>
        </ModernCard>
      </div>
    </TenantPageShell>
  );
};

export default LaunchConfigurationWizard;
