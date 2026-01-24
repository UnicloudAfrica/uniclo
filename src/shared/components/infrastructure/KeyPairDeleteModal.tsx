import React from "react";
import ModernModal from "../ui/ModernModal";
import { designTokens } from "../../../styles/designTokens";

interface KeyPairDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  keyPairName: string;
  onConfirm: () => void;
  isDeleting?: boolean;
}

const KeyPairDeleteModal: React.FC<KeyPairDeleteModalProps> = ({
  isOpen,
  onClose,
  keyPairName,
  onConfirm,
  isDeleting = false,
}) => {
  const actions = [
    {
      label: "Cancel",
      variant: "ghost",
      onClick: onClose,
      disabled: isDeleting,
    },
    {
      label: isDeleting ? "Deleting..." : "Delete Key Pair",
      variant: "danger",
      onClick: onConfirm,
      disabled: isDeleting,
    },
  ];

  return (
    <ModernModal
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Key Pair"
      actions={actions}
      loading={isDeleting}
      contentClassName="space-y-4"
    >
      <p className="text-sm leading-relaxed" style={{ color: designTokens.colors.neutral[600] }}>
        Deleting a key pair revokes your ability to re-download the private key. Confirm this action
        if the material is no longer needed.
      </p>
      <div
        className="rounded-xl border px-4 py-3 text-sm"
        style={{
          borderColor: designTokens.colors.warning[200],
          backgroundColor: designTokens.colors.warning[50],
          color: designTokens.colors.warning[700],
        }}
      >
        This will remove <span className="font-semibold">&ldquo;{keyPairName}&rdquo;</span>.
      </div>
    </ModernModal>
  );
};

export default KeyPairDeleteModal;
