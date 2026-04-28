import React, { useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Settings, ArrowLeft, ArrowRight, Check, Server, Key, Image } from "lucide-react";
import TenantPageShell from "../../components/TenantPageShell";
import ModernCard from "@/shared/components/ui/ModernCard";
import ModernButton from "@/shared/components/ui/ModernButton";
import { useSecurityGroups } from "@/shared/hooks/vpcInfraHooks";
import { useFetchTenantKeyPairs } from "@/shared/hooks/keyPairsHooks";
import {
  useCreateLaunchConfiguration,
  usePricedProvisioningOptions,
  type PricedFlavor,
  type PricedImage,
} from "@/hooks/autoScalingHooks";

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

  // Priced options from ProductPricing system
  const {
    flavors,
    images: pricedImages,
    isLoading: isLoadingPriced,
  } = usePricedProvisioningOptions(region);
  const { data: keyPairs = [] } = useFetchTenantKeyPairs(projectId, region);
  const { data: sgs = [] } = useSecurityGroups(projectId, region);
  const createMutation = useCreateLaunchConfiguration();

  const selectedFlavor = flavors.find((f: PricedFlavor) => String(f.id) === formData.instance_type);
  const selectedImage = pricedImages.find(
    (img: PricedImage) => String(img.id) === formData.image_id
  );

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

  const formatPrice = (price: number, currency: string) => {
    if (price === 0) return "Free";
    return `${currency} ${price.toFixed(2)}/mo`;
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Step 1: Basic Settings</h3>
      <div className="grid grid-cols-1 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Configuration Name *
          </label>
          <p className="text-xs text-gray-500 mb-2">
            A friendly name to identify this template when creating auto-scaling groups.
          </p>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., web-server-config"
            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description (Optional)
          </label>
          <p className="text-xs text-gray-500 mb-2">
            Notes to help you remember what this configuration is for.
          </p>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="e.g., Production web servers running nginx with 4 vCPUs"
            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
            rows={2}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Instance Type *</label>
          <p className="text-xs text-gray-500 mb-3">
            The size of each server — how many CPU cores and memory it has. Larger types handle more
            traffic but cost more.
          </p>
          {isLoadingPriced ? (
            <div className="p-8 text-center text-gray-400 text-sm">
              Loading available instance types...
            </div>
          ) : flavors.length === 0 ? (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                No instance types have been configured with pricing for this region. Contact your
                administrator.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {flavors.map((flavor: PricedFlavor) => (
                <button
                  key={flavor.id}
                  onClick={() => setFormData({ ...formData, instance_type: String(flavor.id) })}
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                    formData.instance_type === String(flavor.id)
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-100 hover:border-gray-200"
                  }`}
                >
                  <Server
                    className={`w-6 h-6 shrink-0 ${formData.instance_type === String(flavor.id) ? "text-blue-600" : "text-gray-400"}`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-gray-900">{flavor.name}</div>
                    <div className="text-xs text-gray-500">
                      {flavor.vcpus} vCPU{flavor.vcpus > 1 ? "s" : ""}, {flavor.memory_gib} GB RAM
                    </div>
                  </div>
                  <div className="text-xs font-medium text-blue-600 whitespace-nowrap">
                    {formatPrice(flavor.unit_local, flavor.currency)}
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
      <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Step 2: Image & Key Pair</h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Machine Image *</label>
          <p className="text-xs text-gray-500 mb-3">
            The operating system your servers will run. Only images with configured pricing are
            shown.
          </p>
          {isLoadingPriced ? (
            <div className="p-8 text-center text-gray-400 text-sm">Loading available images...</div>
          ) : pricedImages.length === 0 ? (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                No images have been configured with pricing for this region. Contact your
                administrator.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {pricedImages.map((img: PricedImage) => (
                <button
                  key={img.id}
                  onClick={() => setFormData({ ...formData, image_id: String(img.id) })}
                  className={`flex items-center gap-3 p-3 rounded-lg border-2 text-left transition-all ${
                    formData.image_id === String(img.id)
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-100 hover:border-gray-200"
                  }`}
                >
                  <Image
                    className={`w-5 h-5 shrink-0 ${formData.image_id === String(img.id) ? "text-blue-600" : "text-gray-400"}`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">{img.name}</div>
                  </div>
                  <div
                    className={`text-xs font-medium whitespace-nowrap ${img.unit_local === 0 ? "text-green-600" : "text-blue-600"}`}
                  >
                    {formatPrice(img.unit_local, img.currency)}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Key Pair</label>
          <p className="text-xs text-gray-500 mb-2">
            An SSH key for remote access to your servers. Without one, you won't be able to log in.
          </p>
          {keyPairs.length === 0 ? (
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-500">
              No key pairs found. You can create one in the Key Pairs section.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(keyPairs as Array<{ id?: string; name: string }>).map((kp) => (
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
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Security Groups</label>
          <p className="text-xs text-gray-500 mb-2">
            Firewall rules that control network traffic. Select multiple to combine rules (e.g., one
            for web, one for SSH).
          </p>
          {sgs.length === 0 ? (
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-500">
              No security groups found. You can create them in the Networking section.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(sgs as Array<{ id: string; name?: string; description?: string }>).map((sg) => (
                <button
                  key={sg.id}
                  onClick={() => {
                    const exists = formData.security_groups.includes(sg.id);
                    if (exists) {
                      setFormData({
                        ...formData,
                        security_groups: formData.security_groups.filter(
                          (id: string) => id !== sg.id
                        ),
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
                    className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 ${
                      formData.security_groups.includes(sg.id)
                        ? "bg-blue-500 border-blue-500 text-white"
                        : "bg-white border-gray-300"
                    }`}
                  >
                    {formData.security_groups.includes(sg.id) && <Check className="w-3 h-3" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900">{sg.name}</div>
                    <div className="text-xs text-gray-500 truncate">{sg.description}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
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
          <label className="block text-sm font-medium text-gray-700 mb-1">Startup Script</label>
          <p className="text-xs text-gray-500 mb-2">
            A script that runs automatically when each server first boots. Use it to install
            software, pull code, or configure services.
          </p>
          <textarea
            value={formData.user_data}
            onChange={(e) => setFormData({ ...formData, user_data: e.target.value })}
            placeholder={
              "#!/bin/bash\napt-get update -y\napt-get install -y nginx\nsystemctl start nginx"
            }
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
            <div className="font-medium">
              {selectedFlavor ? (
                <span>
                  {selectedFlavor.name}
                  <span className="text-xs text-gray-500 ml-1">
                    ({selectedFlavor.vcpus} vCPU, {selectedFlavor.memory_gib} GB)
                  </span>
                </span>
              ) : (
                <span className="font-mono text-sm">{formData.instance_type}</span>
              )}
            </div>
          </div>
          {selectedImage && (
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase">Image</div>
              <div className="font-medium">{selectedImage.name}</div>
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
              {formData.security_groups.map((id: string) => {
                const sg = (sgs as Array<{ id: string; name?: string }>).find((s) => s.id === id);
                return (
                  <span
                    key={id}
                    className="px-2 py-1 bg-white border border-gray-200 rounded text-xs"
                  >
                    {sg?.name || id}
                  </span>
                );
              })}
            </div>
          </div>
        )}
        {formData.user_data && (
          <div className="border-t pt-4">
            <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Startup Script</div>
            <pre className="bg-gray-800 text-green-400 p-3 rounded-lg text-xs overflow-auto max-h-32">
              {formData.user_data}
            </pre>
          </div>
        )}

        {/* Cost estimate */}
        {(selectedFlavor || selectedImage) && (
          <div className="border-t pt-4">
            <div className="text-xs font-semibold text-gray-500 uppercase mb-2">
              Estimated Cost Per Instance
            </div>
            <div className="bg-white p-3 rounded-lg border border-gray-200 space-y-1">
              {selectedFlavor && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Compute ({selectedFlavor.name})</span>
                  <span className="font-medium">
                    {formatPrice(selectedFlavor.unit_local, selectedFlavor.currency)}
                  </span>
                </div>
              )}
              {selectedImage && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">OS ({selectedImage.name})</span>
                  <span className="font-medium">
                    {formatPrice(selectedImage.unit_local, selectedImage.currency)}
                  </span>
                </div>
              )}
              <div className="border-t pt-1 flex justify-between text-sm font-bold">
                <span>Total</span>
                <span className="text-blue-600">
                  {formatPrice(
                    (selectedFlavor?.unit_local ?? 0) + (selectedImage?.unit_local ?? 0),
                    selectedFlavor?.currency ?? selectedImage?.currency ?? "USD"
                  )}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex gap-3">
        <Settings className="w-5 h-5 text-blue-600 shrink-0" />
        <div className="text-sm text-blue-800">
          This launch configuration will be used by auto-scaling groups to launch new instances.
          Each instance will be billed at the rates shown above.
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
