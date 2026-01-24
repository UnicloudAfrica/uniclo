// @ts-nocheck
import React, { useState, useEffect } from "react";
import ModernModal from "../../ui/ModernModal";
import ModernSelect from "../../ui/ModernSelect";

interface AttachInternetGatewayModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAttach: (vpcId: string) => void;
  vpcs: any[];
  gatewayId: string;
  isLoading?: boolean;
}

const AttachInternetGatewayModal: React.FC<AttachInternetGatewayModalProps> = ({
  isOpen,
  onClose,
  onAttach,
  vpcs = [],
  gatewayId,
  isLoading = false,
}) => {
  const [selectedVpcId, setSelectedVpcId] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setSelectedVpcId("");
    }
  }, [isOpen]);

  const handleSubmit = () => {
    if (selectedVpcId) {
      onAttach(selectedVpcId);
    }
  };

  const getVpcOptions = () => {
    return vpcs.map((vpc) => ({
      value: vpc.id,
      label: `${vpc.name || vpc.id} (${vpc.cidr_block})`,
    }));
  };

  const actions = [
    {
      label: "Cancel",
      variant: "ghost",
      onClick: onClose,
    },
    {
      label: isLoading ? "Attaching..." : "Attach to VPC",
      variant: "primary",
      onClick: handleSubmit,
      disabled: !selectedVpcId || isLoading,
    },
  ];

  return (
    <ModernModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Attach Gateway: ${gatewayId}`}
      subtitle="Select a VPC to attach this Internet Gateway to."
      actions={actions}
      size="md"
    >
      <div className="space-y-4">
        <ModernSelect
          label="VPC"
          placeholder="Select VPC..."
          value={selectedVpcId}
          onChange={(e) => setSelectedVpcId(e.target.value)}
          options={getVpcOptions()}
          required
        />
      </div>
    </ModernModal>
  );
};

export default AttachInternetGatewayModal;
