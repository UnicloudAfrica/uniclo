// @ts-nocheck
import React from "react";
import { RefreshCw } from "lucide-react";
import ModernButton from "../../ui/ModernButton";
import LoadBalancersOverview from "../LoadBalancersOverview";

interface LoadBalancerHooks {
  useList: (
    projectId: string,
    region?: string
  ) => {
    data: any[];
    isLoading: boolean;
    refetch: () => void;
  };
  useDelete?: () => {
    mutate: (input: any, options?: any) => void;
    mutateAsync?: (input: any) => Promise<any>;
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
  onManage?: (lb: any) => void;
}

const LoadBalancersContainer: React.FC<LoadBalancersContainerProps> = ({
  projectId,
  region,
  hooks,
  wrapper: Wrapper,
  onManage,
}) => {
  const { data: loadBalancers = [], isLoading, refetch } = hooks.useList(projectId, region);
  const deleteMutation = hooks.useDelete ? hooks.useDelete() : null;

  const handleDelete = async (lb: any) => {
    if (!deleteMutation) return;
    if (
      !confirm("Are you sure you want to delete this Load Balancer? This action cannot be undone.")
    ) {
      return;
    }
    if (deleteMutation.mutateAsync) {
      await deleteMutation.mutateAsync({ projectId, lbId: lb.id });
      return;
    }
    deleteMutation.mutate({ projectId, lbId: lb.id });
  };

  const headerActions = (
    <div className="flex items-center gap-3">
      <ModernButton variant="secondary" size="sm" onClick={() => refetch()} disabled={isLoading}>
        <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
        Refresh
      </ModernButton>
    </div>
  );

  return (
    <Wrapper headerActions={headerActions}>
      <LoadBalancersOverview
        loadBalancers={loadBalancers}
        isLoading={isLoading}
        onDelete={deleteMutation ? handleDelete : undefined}
        onManage={onManage}
        showActions={Boolean(deleteMutation || onManage)}
      />
    </Wrapper>
  );
};

export default LoadBalancersContainer;
