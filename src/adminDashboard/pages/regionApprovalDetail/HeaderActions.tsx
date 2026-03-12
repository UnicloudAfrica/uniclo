import React from "react";
import {
  CheckCircle,
  Ban,
  DollarSign,
  PauseCircle,
  PlayCircle,
  KeyRound,
  RefreshCw,
} from "lucide-react";
import { ModernButton } from "@/shared/components/ui";
import type { RegionApproval } from "./types";

interface HeaderActionsProps {
  region: RegionApproval | null;
  onBack: () => void;
  onApprove: () => void;
  onReject: () => void;
  onSuspend: () => void;
  onReactivate: () => void;
  onUpdateFee: () => void;
  onVerifyCredentials: () => void;
  onRefresh: () => void;
}

const HeaderActions: React.FC<HeaderActionsProps> = ({
  region,
  onBack,
  onApprove,
  onReject,
  onSuspend,
  onReactivate,
  onUpdateFee,
  onVerifyCredentials,
  onRefresh,
}) => {
  const actions = [
    <ModernButton key="back" variant="outline" size="sm" onClick={onBack}>
      Back to approvals
    </ModernButton>,
  ];

  if (!region) {
    return <div className="flex flex-wrap gap-2">{actions}</div>;
  }

  if (region.approval_status === "pending") {
    actions.push(
      <ModernButton
        key="approve"
        variant="primary"
        size="sm"
        onClick={onApprove}
        className="flex items-center gap-2"
      >
        <CheckCircle size={16} />
        Approve
      </ModernButton>,
      <ModernButton
        key="reject"
        variant="danger"
        size="sm"
        onClick={onReject}
        className="flex items-center gap-2"
      >
        <Ban size={16} />
        Reject
      </ModernButton>
    );
  }

  if (region.approval_status === "approved") {
    actions.push(
      <ModernButton
        key="update-fee"
        variant="outline"
        size="sm"
        onClick={onUpdateFee}
        className="flex items-center gap-2"
      >
        <DollarSign size={16} />
        Update Fee
      </ModernButton>,
      <ModernButton
        key="suspend"
        variant="danger"
        size="sm"
        onClick={onSuspend}
        className="flex items-center gap-2"
      >
        <PauseCircle size={16} />
        Suspend
      </ModernButton>
    );
  }

  if (region.approval_status === "suspended") {
    actions.push(
      <ModernButton
        key="reactivate"
        variant="primary"
        size="sm"
        onClick={onReactivate}
        className="flex items-center gap-2"
      >
        <PlayCircle size={16} />
        Reactivate
      </ModernButton>
    );
  }

  if (region.fulfillment_mode === "automated") {
    actions.push(
      <ModernButton
        key="verify"
        variant="ghost"
        size="sm"
        onClick={onVerifyCredentials}
        className="flex items-center gap-2"
      >
        <KeyRound size={16} />
        Verify Credentials
      </ModernButton>
    );
  }

  actions.push(
    <ModernButton
      key="refresh"
      variant="ghost"
      size="sm"
      onClick={onRefresh}
      className="flex items-center gap-2"
    >
      <RefreshCw size={16} />
      Refresh
    </ModernButton>
  );

  return <div className="flex flex-wrap gap-2">{actions}</div>;
};

export default HeaderActions;
