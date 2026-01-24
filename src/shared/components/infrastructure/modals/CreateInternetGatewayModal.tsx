// @ts-nocheck
import React, { useState } from "react";
import ModernModal from "../../ui/ModernModal";
import ModernInput from "../../ui/ModernInput";

interface CreateInternetGatewayModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string) => void;
  isLoading?: boolean;
}

const CreateInternetGatewayModal: React.FC<CreateInternetGatewayModalProps> = ({
  isOpen,
  onClose,
  onCreate,
  isLoading = false,
}) => {
  const [name, setName] = useState("");

  const handleSubmit = () => {
    onCreate(name);
    setName(""); // Reset on submit? Or wait for success? Container handles close.
  };

  const actions = [
    {
      label: "Cancel",
      variant: "ghost",
      onClick: onClose,
    },
    {
      label: isLoading ? "Creating..." : "Create Gateway",
      variant: "primary",
      onClick: handleSubmit,
      disabled: isLoading,
    },
  ];

  return (
    <ModernModal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Internet Gateway"
      subtitle="Create a new Internet Gateway to enable internet connectivity."
      actions={actions}
      size="sm"
    >
      <div className="space-y-4">
        <ModernInput
          label="Name (Optional)"
          placeholder="my-internet-gateway"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
    </ModernModal>
  );
};

export default CreateInternetGatewayModal;
