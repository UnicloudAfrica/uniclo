import React, { useState } from "react";
import { Layers, X, Loader2 } from "lucide-react";
import ModernButton from "../../ui/ModernButton";
import { useCreateInstanceImage } from "../../../../hooks/storageHooks";

interface CreateImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  instanceId: string;
  instanceName?: string;
  projectId: string;
  region: string;
}

const CreateImageModal: React.FC<CreateImageModalProps> = ({
  isOpen,
  onClose,
  instanceId,
  instanceName,
  projectId,
  region,
}) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [noReboot, setNoReboot] = useState(true);
  const createMutation = useCreateInstanceImage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createMutation.mutateAsync({
      instanceId,
      name: name || `image-${instanceId.substring(0, 8)}`,
      metadata: { description, no_reboot: noReboot },
    });
    onClose();
    setName("");
    setDescription("");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
        {/* Backdrop */}
        <div className="fixed inset-0 bg-gray-500/75 transition-opacity" onClick={onClose} />

        {/* Modal */}
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 text-left transform transition-all">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-xl">
                <Layers className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Create Image</h3>
                <p className="text-sm text-gray-500">{instanceName || instanceId}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Image Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={`image-${instanceId.substring(0, 8)}`}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description (Optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Custom machine image for deployment"
                rows={2}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none resize-none"
              />
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <input
                type="checkbox"
                id="no-reboot"
                checked={noReboot}
                onChange={(e) => setNoReboot(e.target.checked)}
                className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
              />
              <label htmlFor="no-reboot" className="flex-1">
                <span className="text-sm font-medium text-gray-900">No Reboot</span>
                <p className="text-xs text-gray-500">
                  Create the image without rebooting the instance (may affect image consistency)
                </p>
              </label>
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                A machine image captures the root volume and can be used as a template to launch new
                instances.
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <ModernButton
                type="button"
                variant="secondary"
                onClick={onClose}
                disabled={createMutation.isPending}
              >
                Cancel
              </ModernButton>
              <ModernButton type="submit" variant="primary" disabled={createMutation.isPending}>
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Layers className="w-4 h-4 mr-2" />
                    Create Image
                  </>
                )}
              </ModernButton>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateImageModal;
