// KeyPair Setup Step - Context Aware with Download
import React, { useState } from "react";
import { useApiContext } from "../../../../hooks/useApiContext";
import clientApi from "../../../../index/client/api";
import { Download, Check, Loader2, Key } from "lucide-react";
import ToastUtils from "../../../../utils/toastUtil";

interface KeyPairSetupStepProps {
  project: any;
  onComplete: (keypairName: string) => void;
  onBack: () => void;
}

const KeyPairSetupStep: React.FC<KeyPairSetupStepProps> = ({ project, onComplete, onBack }) => {
  const { context } = useApiContext();
  // Using clientApi for all contexts until tenant/admin APIs are created
  const api = clientApi;
  const [mode, setMode] = useState<"create" | "existing">("create");
  const [keypairName, setKeypairName] = useState("");
  const [existingKeypairs, setExistingKeypairs] = useState<any[]>([]);
  const [selectedKeypair, setSelectedKeypair] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isDownloaded, setIsDownloaded] = useState(false);
  const [privateKey, setPrivateKey] = useState<string | null>(null);

  // Fetch existing keypairs
  React.useEffect(() => {
    const fetchKeypairs = async () => {
      try {
        const endpoint =
          context === "client"
            ? `/business/key-pairs?project_id=${project.id}`
            : `/key-pairs?project_id=${project.id}`;

        const response = await api("GET", endpoint);
        setExistingKeypairs(response?.data || []);
      } catch (error: any) {
        console.error("Failed to fetch keypairs:", error);
      }
    };

    if (mode === "existing") {
      fetchKeypairs();
    }
  }, [api, context, project.id, mode]);

  const downloadPrivateKey = (key: string, name: string) => {
    const blob = new Blob([key], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${name}.pem`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setIsDownloaded(true);
    ToastUtils.success("Key pair downloaded! Keep it safe.");
  };

  const handleCreateKeypair = async () => {
    if (!keypairName.trim()) {
      ToastUtils.error("Please enter a keypair name");
      return;
    }

    setIsCreating(true);
    try {
      const endpoint = context === "client" ? "/business/key-pairs" : "/key-pairs";

      const response = await api("POST", endpoint, {
        name: keypairName,
        project_id: project.id,
        region: project.region,
      });

      const keypair = response?.data || response;

      if (keypair.private_key) {
        setPrivateKey(keypair.private_key);
        // Auto-download
        downloadPrivateKey(keypair.private_key, keypairName);
      }

      ToastUtils.success("Key pair created successfully!");
    } catch (error: any) {
      ToastUtils.error(error.message || "Failed to create keypair");
    } finally {
      setIsCreating(false);
    }
  };

  const handleContinue = () => {
    if (mode === "create" && !isDownloaded) {
      ToastUtils.error("Please download the key pair first");
      return;
    }

    const finalKeypairName = mode === "create" ? keypairName : selectedKeypair;
    if (!finalKeypairName) {
      ToastUtils.error("Please select or create a keypair");
      return;
    }

    onComplete(finalKeypairName);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-xl border border-slate-200 p-8">
        <h2 className="text-2xl font-semibold text-slate-900 mb-2">Step 2: SSH Key Pair</h2>
        <p className="text-slate-600 mb-6">
          Create or select an SSH key pair to securely access your instances
        </p>

        {/* Mode Toggle */}
        <div className="flex gap-4 mb-6">
          <label className="flex-1 cursor-pointer">
            <input
              type="radio"
              name="keypair-mode"
              value="create"
              checked={mode === "create"}
              onChange={() => setMode("create")}
              className="sr-only peer"
            />
            <div className="border-2 border-slate-200 peer-checked:border-primary-600 peer-checked:bg-primary-50 rounded-lg p-4 transition-all">
              <div className="font-semibold text-slate-900 mb-1">Create New Key Pair</div>
              <div className="text-sm text-slate-600">Generate a new SSH key pair</div>
            </div>
          </label>

          <label className="flex-1 cursor-pointer">
            <input
              type="radio"
              name="keypair-mode"
              value="existing"
              checked={mode === "existing"}
              onChange={() => setMode("existing")}
              className="sr-only peer"
            />
            <div className="border-2 border-slate-200 peer-checked:border-primary-600 peer-checked:bg-primary-50 rounded-lg p-4 transition-all">
              <div className="font-semibold text-slate-900 mb-1">Use Existing Key Pair</div>
              <div className="text-sm text-slate-600">Select from uploaded key pairs</div>
            </div>
          </label>
        </div>

        {/* Form Content */}
        {mode === "create" ? (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Key Pair Name *
              </label>
              <input
                type="text"
                value={keypairName}
                onChange={(e) => setKeypairName(e.target.value)}
                placeholder="e.g., my-production-key"
                disabled={!!privateKey}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-slate-100"
              />
            </div>

            {!privateKey && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <Key className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-yellow-800">
                    <strong>Important:</strong> The private key will be automatically downloaded
                    after creation. Keep it safe! You won't be able to download it again.
                  </div>
                </div>
              </div>
            )}

            {privateKey && (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Check className="w-5 h-5 text-green-600" />
                    <span className="text-green-900 font-medium">
                      Key pair created successfully!
                    </span>
                  </div>

                  {!isDownloaded ? (
                    <button
                      onClick={() => downloadPrivateKey(privateKey, keypairName)}
                      className="w-full inline-flex items-center justify-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download Private Key
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 text-green-700">
                      <Check className="w-4 h-4" />
                      <span className="text-sm font-medium">Private key downloaded</span>
                    </div>
                  )}
                </div>

                {isDownloaded && (
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input type="checkbox" className="mt-1" checked={isDownloaded} readOnly />
                    <span className="text-sm text-slate-700">
                      I have downloaded and securely stored the private key
                    </span>
                  </label>
                )}
              </div>
            )}
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Select Key Pair *
            </label>
            {existingKeypairs.length > 0 ? (
              <select
                value={selectedKeypair}
                onChange={(e) => setSelectedKeypair(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Select a key pair...</option>
                {existingKeypairs.map((kp) => (
                  <option key={kp.name || kp.id} value={kp.name || kp.id}>
                    {kp.name || kp.id}
                  </option>
                ))}
              </select>
            ) : (
              <div className="text-center py-8 text-slate-600">
                No existing key pairs found. Create a new one instead.
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 mt-8">
          <button
            onClick={onBack}
            className="px-6 py-3 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors"
          >
            ← Back
          </button>

          {mode === "create" && !privateKey ? (
            <button
              onClick={handleCreateKeypair}
              disabled={isCreating || !keypairName.trim()}
              className="flex-1 px-6 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-slate-300 text-white rounded-lg font-medium transition-colors inline-flex items-center justify-center"
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Key className="w-5 h-5 mr-2" />
                  Create Key Pair
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handleContinue}
              disabled={mode === "create" ? !isDownloaded : !selectedKeypair}
              className="flex-1 px-6 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-slate-300 text-white rounded-lg font-medium transition-colors"
            >
              Continue →
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default KeyPairSetupStep;
