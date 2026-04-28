import React, { useState } from "react";
import { RefreshCw } from "lucide-react";
import ModernButton from "../../ui/ModernButton";
import ConfirmDialog from "@/shared/components/ui/ConfirmDialog";
import LoadBalancersOverview from "../LoadBalancersOverview";

import { LoadBalancer } from "../types";

interface LoadBalancerHooks {
  useList: (
    projectId: string,
    region?: string
  ) => {
    data: LoadBalancer[];
    isLoading: boolean;
    isFetching?: boolean;
    refetch: () => void;
  };
  useDelete?: () => {
    mutate: (input: { projectId: string; lbId: string }, options?: unknown) => void;
    mutateAsync?: (input: { projectId: string; lbId: string }) => Promise<unknown>;
  };
}

interface LoadBalancersContainerProps {
  hierarchy: "admin" | "tenant" | "client";
  projectId: string;
  region: string;
  hooks: LoadBalancerHooks;
  wrapper: (props: {
    headerActions: React.ReactNode;
    children: React.ReactNode;
  }) => React.ReactElement;
  onManage?: (lb: LoadBalancer) => void;
}

const LoadBalancersContainer: React.FC<LoadBalancersContainerProps> = ({
  projectId,
  region,
  hooks,
  wrapper: Wrapper,
  onManage,
}) => {
  const {
    data: loadBalancers = [],
    isLoading,
    isFetching,
    refetch,
  } = hooks.useList(projectId, region);
  const deleteMutation = hooks.useDelete ? hooks.useDelete() : null;

  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; data?: LoadBalancer }>({
    open: false,
  });

  const handleDelete = (lb: LoadBalancer) => {
    if (!deleteMutation) return;
    setDeleteConfirm({ open: true, data: lb });
  };

  const confirmDelete = async () => {
    if (!deleteMutation || !deleteConfirm.data) return;
    const lb = deleteConfirm.data;
    try {
      if (deleteMutation.mutateAsync) {
        await deleteMutation.mutateAsync({ projectId, lbId: lb.id });
        refetch();
        return;
      }
      deleteMutation.mutate({ projectId, lbId: lb.id }, { onSuccess: () => refetch() });
    } finally {
      setDeleteConfirm({ open: false });
    }
  };

  const headerActions = (
    <div className="flex items-center gap-3">
      <ModernButton variant="secondary" size="sm" onClick={() => refetch()} disabled={isFetching}>
        <RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} />
        {isFetching ? "Refreshing..." : "Refresh"}
      </ModernButton>
    </div>
  );

  return (
    <>
      <Wrapper headerActions={headerActions}>
        <LoadBalancersOverview
          loadBalancers={loadBalancers}
          isLoading={isLoading}
          onDelete={deleteMutation ? handleDelete : undefined}
          onManage={onManage}
          showActions={Boolean(deleteMutation || onManage)}
        />
      </Wrapper>

      <ConfirmDialog
        isOpen={deleteConfirm.open}
        title="Delete Load Balancer"
        message="Are you sure you want to delete this Load Balancer? This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirm({ open: false })}
      />
    </>
  );
};

export default LoadBalancersContainer;
