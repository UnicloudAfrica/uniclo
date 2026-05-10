import React, { useState } from "react";
import { Plus, RefreshCw } from "lucide-react";
import ModernButton from "../ui/ModernButton";
import DestinationConfigFields from "./DestinationConfigFields";
import {
  DESTINATION_TYPE_LABELS,
  type DestinationType,
} from "@/shared/hooks/resources/integrationHooks";

type AnyRecord = Record<string, unknown>;

interface CreateDestinationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: AnyRecord) => void;
  isCreating?: boolean;
}

const DESTINATION_TYPES = Object.entries(DESTINATION_TYPE_LABELS) as [DestinationType, string][];

const CreateDestinationModal: React.FC<CreateDestinationModalProps> = ({
  isOpen,
  onClose,
  onCreate,
  isCreating = false,
}) => {
  const [name, setName] = useState("");
  const [destinationType, setDestinationType] = useState<DestinationType | "">("");
  const [sourceRegion, setSourceRegion] = useState("");
  const [targetRegion, setTargetRegion] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [config, setConfig] = useState<AnyRecord>({});

  const handleSubmit = () => {
    if (!name || !destinationType || !sourceRegion || !targetRegion) return;
    onCreate({
      name,
      destination_type: destinationType,
      source_region: sourceRegion,
      target_region: targetRegion,
      is_default: isDefault,
      config,
    });
  };

  const handleClose = () => {
    setName("");
    setDestinationType("");
    setSourceRegion("");
    setTargetRegion("");
    setIsDefault(false);
    setConfig({});
    onClose();
  };

  const handleTypeChange = (value: string) => {
    setDestinationType(value as DestinationType);
    setConfig({});
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900">
            <span aria-hidden="true">📍</span>
            Where should backups land?
          </h2>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
            <Plus className="w-5 h-5 rotate-45" />
          </button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto">
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5">
              Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Lagos S3 Backup"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5">
              Destination Type *
            </label>
            <select
              value={destinationType}
              onChange={(e) => handleTypeChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none bg-white"
            >
              <option value="">Select a type...</option>
              {DESTINATION_TYPES.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5">
                Source Region *
              </label>
              <input
                type="text"
                value={sourceRegion}
                onChange={(e) => setSourceRegion(e.target.value)}
                placeholder="e.g. lagos-1"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5">
                Target Region *
              </label>
              <input
                type="text"
                value={targetRegion}
                onChange={(e) => setTargetRegion(e.target.value)}
                placeholder="e.g. nobus-region-1"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
              />
            </div>
          </div>

          {destinationType && (
            <DestinationConfigFields
              type={destinationType}
              config={config}
              onChange={setConfig}
            />
          )}

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Set as default for this region</span>
          </label>
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
          <ModernButton variant="secondary" onClick={handleClose}>
            Not now
          </ModernButton>
          <ModernButton
            variant="primary"
            onClick={handleSubmit}
            disabled={!name || !destinationType || !sourceRegion || !targetRegion || isCreating}
          >
            {isCreating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Saving destination…
              </>
            ) : (
              "Save destination"
            )}
          </ModernButton>
        </div>
      </div>
    </div>
  );
};

export default CreateDestinationModal;
