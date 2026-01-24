// @ts-nocheck
import React from "react";
import { useSearchParams } from "react-router-dom";
import { Route as RouteIcon } from "lucide-react";
import AdminPageShell from "../../components/AdminPageShell";
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

const AdminRouteTables: React.FC = () => {
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
    <>
      <RouteTablesContainer
        hierarchy="admin"
        projectId={projectId}
        region={region}
        hooks={hooks}
        wrapper={({ headerActions, children }) => (
          <AdminPageShell
            title="Route Tables"
            description="Manage network traffic routing across subnets and gateways"
            icon={<RouteIcon className="w-6 h-6 text-indigo-600" />}
            breadcrumbs={[
              { label: "Home", href: "/admin-dashboard" },
              { label: "Infrastructure", href: "/admin-dashboard/projects" },
              { label: "Route Tables" },
            ]}
            actions={headerActions}
          >
            {children}
          </AdminPageShell>
        )}
      />
    </>
  );
};

export default AdminRouteTables;
