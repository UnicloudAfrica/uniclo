// @ts-nocheck
import React, { useState } from "react";
import ModernModal from "../../ui/ModernModal";
import ModernInput from "../../ui/ModernInput";
import ModernSelect from "../../ui/ModernSelect";

interface CreateNetworkAclModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: { vpc_id: string; name?: string }) => void;
  vpcs: any[];
  isLoading?: boolean;
}

const CreateNetworkAclModal: React.FC<CreateNetworkAclModalProps> = ({
  isOpen,
  onClose,
  onCreate,
  vpcs = [],
  isLoading = false,
}) => {
  const [name, setName] = useState("");
  const [selectedVpcId, setSelectedVpcId] = useState("");

  const handleSubmit = () => {
    if (selectedVpcId) {
      onCreate({
        vpc_id: selectedVpcId,
        name: name || undefined,
      });
      // Reset is handled by parent closing modal or we can reset here
      if (!isLoading) {
        setName("");
        setSelectedVpcId("");
      }
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
      label: isLoading ? "Creating..." : "Create ACL",
      variant: "primary",
      onClick: handleSubmit,
      disabled: !selectedVpcId || isLoading,
    },
  ];

  return (
    <ModernModal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Network ACL"
      subtitle="Create a new Network ACL for your VPC."
      actions={actions}
      size="md"
    >
      <div className="space-y-4">
        <ModernInput
          label="Name (Optional)"
          placeholder="my-network-acl"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
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

export default CreateNetworkAclModal;
