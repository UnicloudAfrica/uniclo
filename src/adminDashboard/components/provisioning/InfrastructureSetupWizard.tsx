import React, { useState } from "react";
import { Box, ArrowRight, AlertTriangle, Loader2 } from "lucide-react";
import { useSetupInfrastructure } from "../../../hooks/adminHooks/projectHooks";
import { ModernButton } from "../../../shared/components/ui";
import NetworkPresetSelector, {
  DEFAULT_PRESETS,
} from "../../../shared/components/network/NetworkPresetSelector";

interface InfrastructureSetupWizardProps {
  project: any;
  setupMutation?: any;
}

const InfrastructureSetupWizard: React.FC<InfrastructureSetupWizardProps> = ({
  project,
  setupMutation: customSetupMutation,
}) => {
  // Initialize with preset selected during project creation (if any), otherwise default to standard
  const initialPreset = project.metadata?.network_preset || "standard";
  const [selectedBlueprint, setSelectedBlueprint] = useState(initialPreset);
  const [showConfirm, setShowConfirm] = useState(false);

  const adminSetupMutation = useSetupInfrastructure();
  const setupMutation = customSetupMutation || adminSetupMutation;

  const handleSetup = () => {
    setupMutation.mutate(
      {
        id: project.identifier || project.id,
        blueprint: selectedBlueprint,
      },
      {
        onSuccess: () => {
          setShowConfirm(false);
        },
      }
    );
  };

  const selectedBpDetails = DEFAULT_PRESETS.find((b) => b.id === selectedBlueprint);

  return (
    <div className="max-w-5xl mx-auto mt-8 px-4">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-3">Infrastructure Studio</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Choose a blueprint to initialize the infrastructure for{" "}
          <span className="font-semibold text-gray-900">{project.name}</span>.
        </p>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-10">
        <NetworkPresetSelector
          value={selectedBlueprint}
          onChange={setSelectedBlueprint}
          presets={DEFAULT_PRESETS}
          showAdvancedOption={false}
        />
      </div>

      <div className="flex justify-end">
        <ModernButton
          variant="primary"
          size="lg"
          className="flex items-center gap-2 px-8"
          onClick={() => setShowConfirm(true)}
          disabled={setupMutation.isPending}
        >
          {setupMutation.isPending ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              Next Step
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </ModernButton>
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Confirm Infrastructure Setup</h3>

              <div className="py-4">
                <p className="text-gray-600 mb-4">
                  You are about to apply the{" "}
                  <span className="font-bold text-blue-600">{selectedBpDetails?.name}</span>{" "}
                  blueprint to project <span className="font-bold">{project.name}</span>.
                </p>

                {selectedBlueprint === "empty" && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="text-sm text-amber-800">
                      The <strong>Empty</strong> blueprint means NO network connectivity initially.
                      You must manually create subnets and gateways.
                    </div>
                  </div>
                )}
              </div>

              <p className="text-sm text-gray-500">This process usually takes 20-30 seconds.</p>
            </div>

            <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                disabled={setupMutation.isPending}
              >
                Cancel
              </button>
              <ModernButton
                variant="primary"
                onClick={handleSetup}
                disabled={setupMutation.isPending}
                className="flex items-center gap-2"
              >
                {setupMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Provisioning...
                  </>
                ) : (
                  "Confirm & Provision"
                )}
              </ModernButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InfrastructureSetupWizard;
