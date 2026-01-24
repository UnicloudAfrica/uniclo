// @ts-nocheck
import React, { useState, useEffect } from "react";
import ModernModal from "../../ui/ModernModal";
import ModernSelect from "../../ui/ModernSelect";

interface AssociateSubnetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAssociate: (subnetId: string) => void;
  subnets: any[];
  isLoading?: boolean;
}

const AssociateSubnetModal: React.FC<AssociateSubnetModalProps> = ({
  isOpen,
  onClose,
  onAssociate,
  subnets = [],
  isLoading = false,
}) => {
  const [selectedSubnetId, setSelectedSubnetId] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setSelectedSubnetId("");
    }
  }, [isOpen]);

  const handleSubmit = () => {
    if (selectedSubnetId) {
      onAssociate(selectedSubnetId);
    }
  };

  const getSubnetOptions = () => {
    return subnets.map((s) => ({
      value: s.id,
      label: `${s.name || s.id} (${s.cidr_block || s.cidr})`,
    }));
  };

  const actions = [
    {
      label: "Cancel",
      variant: "ghost",
      onClick: onClose,
    },
    {
      label: isLoading ? "Associating..." : "Associate Subnet",
      variant: "primary",
      onClick: handleSubmit,
      disabled: !selectedSubnetId || isLoading,
    },
  ];

  return (
    <ModernModal
      isOpen={isOpen}
      onClose={onClose}
      title="Associate Subnet"
      subtitle="Associate a subnet with this route table to control its traffic routing."
      actions={actions}
      size="md"
    >
      <div className="space-y-4">
        <ModernSelect
          label="Subnet"
          placeholder="Select a subnet"
          value={selectedSubnetId}
          onChange={(e) => setSelectedSubnetId(e.target.value)}
          options={getSubnetOptions()}
          required
        />
      </div>
    </ModernModal>
  );
};

export default AssociateSubnetModal;
