// @ts-nocheck
import React, { useState } from "react";
import { RefreshCw } from "lucide-react";
import ModernButton from "../../ui/ModernButton";

interface ElasticIp {
  id: string;
  allocation_id?: string;
  public_ip?: string;
  instance_id?: string;
  network_interface_id?: string;
  association_id?: string;
}

interface AssociateElasticIpModalProps {
  elasticIp: ElasticIp;
  isOpen: boolean;
  onClose: () => void;
  onAssociate: (elasticIpId: string, instanceId: string) => void;
  isAssociating?: boolean;
}

/**
 * Modal for associating an Elastic IP with an instance.
 * Extracted from AdminElasticIps for reuse across dashboards.
 */
const AssociateElasticIpModal: React.FC<AssociateElasticIpModalProps> = ({
  elasticIp,
  isOpen,
  onClose,
  onAssociate,
  isAssociating = false,
}) => {
  const [instanceId, setInstanceId] = useState("");

  const handleSubmit = () => {
    if (!instanceId) return;
    onAssociate(elasticIp.id, instanceId);
  };

  const handleClose = () => {
    setInstanceId("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 m-4">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Associate Elastic IP</h2>

        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-500">Elastic IP</div>
          <div className="text-lg font-mono font-medium">{elasticIp.public_ip}</div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Instance ID *</label>
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
          <ModernButton variant="secondary" onClick={handleClose}>
            Cancel
          </ModernButton>
          <ModernButton
            variant="primary"
            onClick={handleSubmit}
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
  );
};

export default AssociateElasticIpModal;
