// @ts-nocheck
import ModernModal from "../../../shared/components/ui/ModernModal";
import { designTokens } from "../../../styles/designTokens";

const DeleteVpcModal = ({ isOpen, onClose, vpcName, onConfirm, isDeleting }) => {
  const actions = [
    {
      label: "Cancel",
      variant: "ghost",
      onClick: onClose,
      disabled: isDeleting,
    },
    {
      label: isDeleting ? "Deleting..." : "Delete VPC",
      variant: "danger",
      onClick: onConfirm,
      disabled: isDeleting,
    },
  ];

  return (
    <ModernModal
      isOpen={isOpen}
      onClose={onClose}
      title="Delete VPC"
      actions={actions}
      loading={isDeleting}
      contentClassName="space-y-4"
    >
      <p className="text-sm leading-relaxed" style={{ color: designTokens.colors.neutral[600] }}>
        Removing this VPC will detach all associated networking resources. This action cannot be
        undone.
      </p>
      <div
        className="rounded-xl border px-4 py-3 text-sm"
        style={{
          borderColor: designTokens.colors.warning[200],
          backgroundColor: designTokens.colors.warning[50],
          color: designTokens.colors.warning[700],
        }}
      >
        Confirm you want to remove <span className="font-semibold">&ldquo;{vpcName}&rdquo;</span>.
      </div>
    </ModernModal>
  );
};

export default DeleteVpcModal;
