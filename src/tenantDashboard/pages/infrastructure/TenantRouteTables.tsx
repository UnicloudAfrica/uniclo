// @ts-nocheck
import React from "react";
import { useSearchParams } from "react-router-dom";
import { Route as RouteIcon } from "lucide-react";
import TenantPageShell from "../../components/TenantPageShell";
import RouteTablesContainer from "../../../shared/components/infrastructure/containers/RouteTablesContainer";
import {
  useRouteTables,
  useSubnets,
  useInternetGateways,
  useNatGateways,
  useCreateRoute,
  useDeleteRoute,
  useAssociateRouteTable,
  useDisassociateRouteTable,
} from "../../../shared/hooks/vpcInfraHooks";

const TenantRouteTables: React.FC = () => {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("project") || "";
  const region = searchParams.get("region") || "";

  const hooks = {
    useList: useRouteTables,
    useSubnets: useSubnets,
    useInternetGateways: useInternetGateways,
    useNatGateways: useNatGateways,
    useCreateRoute: useCreateRoute,
    useDeleteRoute: useDeleteRoute,
    useAssociate: useAssociateRouteTable,
    useDisassociate: useDisassociateRouteTable,
  };

  return (
    <RouteTablesContainer
      hierarchy="tenant"
      projectId={projectId}
      region={region}
      hooks={hooks}
      wrapper={({ headerActions, children }) => (
        <TenantPageShell
          title={
            <span className="flex items-center gap-2">
              <RouteIcon className="w-5 h-5 text-indigo-600" />
              Route Tables
            </span>
          }
          description="Manage routing rules for your VPC subnets"
          actions={headerActions}
        >
          {children}
        </TenantPageShell>
      )}
    />
  );
};

export default TenantRouteTables;
